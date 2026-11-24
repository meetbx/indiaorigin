import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Optional: uncomment if you want to attach logged-in NextAuth user
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please select a valid star rating between 1 and 5." },
        { status: 400 }
      );
    }

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!manufacturer) {
      return NextResponse.json(
        { error: "Manufacturer not found." },
        { status: 404 }
      );
    }

    // Optional: attach userId from NextAuth session if available
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id || null;

    const newReview = await prisma.manufacturerReview.create({
      data: {
        manufacturerId: manufacturer.id,
        rating,
        comment: comment || null,
        // userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        review: {
          ...newReview,
          buyer: newReview.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create manufacturer review:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}