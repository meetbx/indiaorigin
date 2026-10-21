"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserPreferences() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) return null;

  try {
    const prefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    });
    return prefs;
  } catch (err) {
    console.error("Failed to fetch user preferences:", err);
    return null;
  }
}

export async function updateUserPreferences(formData: {
  preferredCategories: string[];
  preferredMaterials: string[];
  preferredLocation: string;
  buyingInterests: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const userId = session.user.id;

  try {
    await prisma.userPreference.upsert({
      where: { userId },
      update: {
        preferredCategories: formData.preferredCategories,
        preferredMaterials: formData.preferredMaterials,
        preferredLocation: formData.preferredLocation,
        buyingInterests: formData.buyingInterests,
      },
      create: {
        userId,
        preferredCategories: formData.preferredCategories,
        preferredMaterials: formData.preferredMaterials,
        preferredLocation: formData.preferredLocation,
        buyingInterests: formData.buyingInterests,
      },
    });

    revalidatePath("/account/preferences");
    return { success: true };
  } catch (err) {
    console.error("Failed to save preferences:", err);
    return { success: false, error: "Database error while saving preferences." };
  }
}