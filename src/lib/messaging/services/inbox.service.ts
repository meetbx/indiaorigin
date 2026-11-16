import { conversationRepository } from "../repositories/conversation.repository";

export const inboxService = {
  /**
   * Get paginated conversations for a user (Buyer or Manufacturer)
   */
  async getInbox(userId: string, role: "BUYER" | "MANUFACTURER", limit: number = 20, cursor?: string) {
    let items;
    if (role === "BUYER") {
      items = await conversationRepository.findForBuyer(userId, limit, cursor);
    } else {
      // For manufacturers, you can pass the manufacturerId associated with the user member
      items = await conversationRepository.findForManufacturer(userId, limit, cursor);
    }

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items,
      nextCursor,
      hasMore: !!nextCursor,
    };
  },
};