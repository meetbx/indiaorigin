"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: { name?: string; email?: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const userId = session.user.id;
  const updateData: { name?: string; email?: string } = {};

  // 1. Validate & sanitize Name if provided
  if (formData.name !== undefined) {
    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return { success: false, error: "Name must be between 2 and 50 characters." };
    }
    updateData.name = trimmedName;
  }

  // 2. Validate & sanitize Email if provided
  if (formData.email !== undefined) {
    const trimmedEmail = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: trimmedEmail,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return { success: false, error: "This email address is already in use by another account." };
    }

    updateData.email = trimmedEmail;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/account");
    return { success: true };
  } catch (err) {
    console.error("Failed to update profile:", err);
    return { success: false, error: "Database error while updating profile. Please try again." };
  }
}