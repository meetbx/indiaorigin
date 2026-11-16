import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the authenticated account using only the immutable database user ID
 * placed in the NextAuth JWT/session by the auth callbacks.
 *
 * Never fall back to email or phone: those are mutable identifiers and must not
 * be used to decide which account owns a conversation.
 */
export async function getAuthenticatedChatUser() {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: unknown } | undefined)?.id;

  if (typeof sessionUserId !== "string" || sessionUserId.trim().length === 0) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { manufacturerMemberships: true },
  });
}
