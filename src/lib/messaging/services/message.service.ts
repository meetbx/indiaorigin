import { prisma } from "@/lib/prisma";
import { messageRepository } from "../repositories/message.repository";

export const messageService = {
  /**
   * Get paginated message history using sequence cursor
   */
  async getMessages(conversationId: string, limit: number = 20, beforeSequence?: number) {
    const messages = await messageRepository.findManyByConversation(conversationId, limit + 1, beforeSequence);

    let hasMore = false;
    if (messages.length > limit) {
      messages.pop();
      hasMore = true;
    }

    // Return in chronological order (oldest to newest)
    return {
      items: messages.reverse(),
      hasMore,
      nextCursor: messages.length > 0 ? messages[0].sequence : undefined,
    };
  },

  /**
   * Create a message transactionally with atomic sequence allocation and outbox event
   */
  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    clientMessageId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock and fetch current conversation sequence atomically
      const conversation = await tx.conversation.findUnique({
        where: { id: data.conversationId },
        select: { lastMessageSeq: true },
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const nextSeq = conversation.lastMessageSeq + 1;

      // 2. Create the message
      const message = await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          sequence: nextSeq,
          clientMessageId: data.clientMessageId,
        },
        include: {
          attachments: true,
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      // 3. Update conversation preview and latest sequence
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageSeq: nextSeq,
        },
      });

      // 4. Create outbox event for reliable Ably publishing
      await tx.messageOutbox.create({
        data: {
          dedupeKey: `${data.conversationId}-${nextSeq}`,
          eventType: "message.created",
          aggregateId: data.conversationId,
          payload: message as any,
        },
      });

      return message;
    });
  },
};