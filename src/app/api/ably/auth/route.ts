
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Ably from "ably";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const sessionUser = session?.user as
      | {
          id?: string;
          email?: string | null;
          phone?: string | null;
        }
      | undefined;

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Resolve identity consistently: ID first, then email/phone.
    let user = null;

    if (sessionUser.id) {
      user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });
    } else if (sessionUser.email) {
      user = await prisma.user.findUnique({
        where: { email: sessionUser.email },
      });
    } else if (sessionUser.phone) {
      user = await prisma.user.findUnique({
        where: { phone: sessionUser.phone },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const ablyKey =
      process.env.ABLY_CLIENT_API_KEY ||
      process.env.ABLY_API_KEY;

    if (!ablyKey) {
      return NextResponse.json(
        { error: "Ably API key not configured" },
        { status: 500 }
      );
    }

    // Find manufacturers this user belongs to.
    const memberships = await prisma.manufacturerMember.findMany({
      where: { userId: user.id },
      select: { manufacturerId: true },
    });

    const manufacturerIds = memberships.map(
      (membership) => membership.manufacturerId
    );

    // Find only conversations this user is authorized to access.
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: user.id },
          ...(manufacturerIds.length > 0
            ? [{ manufacturerId: { in: manufacturerIds } }]
            : []),
        ],
      },
      select: { id: true },
    });

    // Explicit channel permissions. No wildcard permissions.
    const capability = Object.fromEntries(
      conversations.map((conversation) => [
        `conv_${conversation.id}`,
        ["subscribe"],
      ])
    );

    const rest = new Ably.Rest(ablyKey);

    const tokenRequest = await new Promise((resolve, reject) => {
      rest.auth.createTokenRequest(
        {
          clientId: user.id,
          capability: JSON.stringify(capability),
        },
        (error, tokenRequestData) => {
          if (error) {
            reject(error);
          } else {
            resolve(tokenRequestData);
          }
        }
      );
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Ably authentication error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
