"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function unlinkGoogleAccount() {
const session = await getServerSession(authOptions);
  const userSession = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !userSession?.id) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const userId = userSession.id;

    // Check how many login methods the user has (prevent unlinking if they have no password and no other accounts)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user) return { success: false, error: "User not found." };

    const hasPassword = !!user.passwordHash;
    const googleAccount = user.accounts.find((acc) => acc.provider === "google");

    if (!googleAccount) {
      return { success: false, error: "Google account is not connected." };
    }

    if (!hasPassword && user.accounts.length <= 1) {
      return { 
        success: false, 
        error: "Cannot disconnect Google. Please set a password first so you don't lose access to your account." 
      };
    }

    // Delete the Google account link record safely
    await prisma.account.delete({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleAccount.providerAccountId,
        },
      },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (err) {
    console.error("Failed to unlink Google account:", err);
    return { success: false, error: "Internal server error." };
  }
}