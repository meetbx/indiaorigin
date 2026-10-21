import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserPreferences() {
  const session = await getServerSession(authOptions);
  const userSession = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !userSession?.id) return null;

  try {
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: userSession.id },
    });

    return preferences;
  } catch (err) {
    console.error("Failed to fetch preferences:", err);
    return null;
  }
}

export async function updateUserPreferences(data: any) {
  const session = await getServerSession(authOptions);
  const userSession = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !userSession?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userId = userSession.id;

    const updated = await prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    revalidatePath("/account/preferences");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update preferences:", err);
    return { success: false, error: "Database error" };
  }
}