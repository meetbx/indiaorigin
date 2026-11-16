import { prisma } from "@/lib/prisma";

export const messageRepository = {
  /**
   * Fetch paginated older messages using the message sequence cursor
   */
  async findManyByConversation(conversationId: string, limit: number = 20, beforeSequence?: number) {
    return prisma.message.findMany({
      take: limit,
      where: {
        conversationId,
        ...(beforeSequence !== undefined ? { sequence: { lt: beforeSequence } } : {}),
      },
      orderBy: { sequence: "desc" },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },
};