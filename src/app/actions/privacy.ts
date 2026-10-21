"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function exportUserData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: true,
        wishlists: { include: { product: true } },
        searchHistory: true,
      },
    });

    if (!user) return { success: false, error: "User not found." };

    // Strip sensitive hashes
    const sanitizeUser = { ...user, passwordHash: undefined };

    return {
      success: true,
      data: JSON.stringify(sanitizeUser, null, 2),
    };
  } catch (err) {
    console.error("Export failed:", err);
    return { success: false, error: "Failed to compile user data export." };
  }
}

export async function deleteUserAccount() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const userId = session.user.id;

  try {
    // Cascade delete user data securely
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (err) {
    console.error("Account deletion failed:", err);
    return { success: false, error: "Could not delete account. Active inquiries or manufacturer listings prevent immediate deletion." };
  }
}