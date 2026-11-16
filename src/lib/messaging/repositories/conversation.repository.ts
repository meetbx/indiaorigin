import { prisma } from "@/lib/prisma";

export const conversationRepository = {
  /**
   * Fetch paginated conversations for a buyer with lightweight preview fields
   */
  async findForBuyer(buyerId: string, limit: number = 20, cursor?: string) {
    return prisma.conversation.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { buyerId },
      orderBy: { lastMessageAt: "desc" },
      select: {
        id: true,
        lastMessageAt: true,
        lastMessageSeq: true,
        manufacturer: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
            city: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        messages: {
          orderBy: { sequence: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        conversationParticipants: {
          where: { userId: buyerId },
          select: {
            lastReadMessageSeq: true,
            archivedAt: true,
            mutedAt: true,
          },
        },
      },
    });
  },

  /**
   * Fetch paginated conversations for a manufacturer member
   */
  async findForManufacturer(manufacturerId: string, limit: number = 20, cursor?: string) {
    return prisma.conversation.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { manufacturerId },
      orderBy: { lastMessageAt: "desc" },
      select: {
        id: true,
        lastMessageAt: true,
        lastMessageSeq: true,
        buyer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        messages: {
          orderBy: { sequence: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        conversationParticipants: {
          select: {
            userId: true,
            lastReadMessageSeq: true,
            archivedAt: true,
            mutedAt: true,
          },
        },
      },
    });
  },

  /**
   * Verify if a user is an authorized participant in a conversation
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const count = await prisma.conversationParticipant.count({
      where: { conversationId, userId },
    });
    return count > 0;
  },
};