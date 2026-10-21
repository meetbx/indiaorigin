"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Check if the current logged in user has liked a product
 */
export async function checkIsLiked(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const entry = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
  });

  return !!entry;
}

/**
 * Toggle like/unlike for a product
 */
export async function toggleWishlist(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { id: existing.id },
    });
    revalidatePath(`/products`);
    revalidatePath(`/account/liked`);
    return { liked: false };
  } else {
    await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });
    revalidatePath(`/products`);
    revalidatePath(`/account/liked`);
    return { liked: true };
  }
}

/**
 * Fetch all liked products for the logged in user
 */
export async function getLikedProducts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const wishlists = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          manufacturer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return wishlists.map((w) => w.product);
}