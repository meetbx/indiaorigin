import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Ably from "ably";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;
    const userPhone = (session?.user as any)?.phone;

    if (!userId && !userEmail && !userPhone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(userPhone ? [{ phone: userPhone }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const ablyKey = process.env.ABLY_CLIENT_API_KEY || process.env.ABLY_API_KEY;
    if (!ablyKey) {
      return NextResponse.json({ error: "Ably API key not configured" }, { status: 500 });
    }

    const rest = new Ably.Rest(ablyKey);

    // FIX: Wrap createTokenRequest in a Promise to handle Node.js callback style safely
    const tokenRequestData = await new Promise((resolve, reject) => {
      rest.auth.createTokenRequest({ clientId: user.id }, (err, tokenRequest) => {
        if (err) reject(err);
        else resolve(tokenRequest);
      });
    });

    return NextResponse.json(tokenRequestData);
  } catch (error) {
    console.error("Error generating Ably token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}