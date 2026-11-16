"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { inboxService } from "@/lib/messaging/services/inbox.service";
import { messageService } from "@/lib/messaging/services/message.service";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Robust central helper to resolve the logged-in user safely 
 * supporting ID, phone, or email across all auth providers.
 */
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  const sessionUser = session?.user as {
    id?: string;
    email?: string | null;
    phone?: string | null;
  } | undefined;

  if (!sessionUser) return null;

  if (sessionUser.id) {
    return prisma.user.findUnique({
      where: { id: sessionUser.id },
    });
  }

  if (sessionUser.email) {
    const user = await prisma.user.findUnique({
      where: { email: sessionUser.email },
    });
    if (user) return user;
  }

  if (sessionUser.phone) {
    return prisma.user.findUnique({
      where: { phone: sessionUser.phone },
    });
  }

  return null;
}

async function canAccessConversation(
  userId: string,
  buyerId: string,
  manufacturerId: string
) {
  if (buyerId === userId) return true;

  const membership = await prisma.manufacturerMember.findUnique({
    where: {
      userId_manufacturerId: {
        userId,
        manufacturerId,
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

/**
 * Paginated buyer conversations inbox (default limit: 20)
 */
export async function getBuyerConversations(limit: number = 20, cursor?: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { items: [], nextCursor: undefined, hasMore: false };

  return await inboxService.getInbox(user.id, "BUYER", limit, cursor);
}

/**
 * Paginated manufacturer conversations inbox (default limit: 20)
 */
export async function getManufacturerConversations(limit: number = 20, cursor?: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { items: [], nextCursor: undefined, hasMore: false };

  // Find the primary manufacturer membership ID for the logged-in user
  const membership = await prisma.manufacturerMember.findFirst({
    where: { userId: user.id },
    select: { manufacturerId: true },
  });

  if (!membership) return { items: [], nextCursor: undefined, hasMore: false };

  return await inboxService.getInbox(membership.manufacturerId, "MANUFACTURER", limit, cursor);
}

/**
 * Paginated conversation message history using sequence cursor
 */
export async function getConversationMessages(conversationId: string, limit: number = 20, beforeSequence?: number) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      buyerId: true,
      manufacturerId: true,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const authorized = await canAccessConversation(
    user.id,
    conversation.buyerId,
    conversation.manufacturerId
  );

  if (!authorized) {
    throw new Error("Forbidden");
  }

  const result = await messageService.getMessages(conversationId, limit, beforeSequence);

  return {
    ...result,
    currentUserId: user.id,
  };
}

/**
 * Save text message transactionally using outbox pattern & atomic sequence allocation
 */
export async function saveServerMessage(
  conversationId: string,
  content: string,
  clientMessageId?: string
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const trimmedContent = content?.trim();
  if (!trimmedContent) {
    throw new Error("Empty message");
  }

  if (trimmedContent.length > 10000) {
    throw new Error("Message is too long");
  }

  if (
    clientMessageId !== undefined &&
    (clientMessageId.length === 0 || clientMessageId.length > 128)
  ) {
    throw new Error("Invalid client message ID");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      buyerId: true,
      manufacturerId: true,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const authorized = await canAccessConversation(
    user.id,
    conversation.buyerId,
    conversation.manufacturerId
  );

  if (!authorized) {
    throw new Error("Forbidden");
  }

  // Idempotency check
  if (clientMessageId) {
    const existing = await prisma.message.findUnique({
      where: {
        conversationId_senderId_clientMessageId: {
          conversationId,
          senderId: user.id,
          clientMessageId,
        },
      },
      include: {
        attachments: true,
      },
    });

    if (existing) return existing;
  }

  try {
    return await messageService.sendMessage({
      conversationId,
      senderId: user.id,
      content: trimmedContent,
      clientMessageId,
    });
  } catch (error) {
    if (clientMessageId) {
      const existing = await prisma.message.findUnique({
        where: {
          conversationId_senderId_clientMessageId: {
            conversationId,
            senderId: user.id,
            clientMessageId,
          },
        },
        include: {
          attachments: true,
        },
      });

      if (existing) return existing;
    }

    throw error;
  }
}

export async function getProductForChat(productSlug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      select: {
        id: true,
        manufacturerId: true,
      },
    });
    return product;
  } catch (error) {
    console.error("Failed to fetch product for chat:", error);
    return null;
  }
}

export async function getOrCreateConversation(manufacturerId: string, productId?: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId: user.id,
        manufacturerId: manufacturerId,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId: user.id,
          manufacturerId: manufacturerId,
          productId: productId || null,
        },
      });
    }

    return { id: conversation.id };
  } catch (error) {
    console.error("Failed to get or create conversation:", error);
    return null;
  }
}

export async function sendMediaMessage(conversationId: string, formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      buyerId: true,
      manufacturerId: true,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const authorized = await canAccessConversation(
    user.id,
    conversation.buyerId,
    conversation.manufacturerId
  );

  if (!authorized) {
    throw new Error("Forbidden");
  }

  const content = formData.get("content")?.toString() || "";
  const files = formData.getAll("files") as File[];

  if (!content.trim() && files.length === 0) {
    throw new Error("Message cannot be empty");
  }

  const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const validatedFiles = files.map((file) => {
    const isPdf = file.type === "application/pdf";
    const isImage = validImageTypes.includes(file.type);
    if (!isImage && !isPdf) throw new Error(`Unsupported file type: ${file.type}`);
    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) throw new Error(`File ${file.name} exceeds size limit.`);
    return { file, isPdf };
  });

  const attachmentData = await Promise.all(validatedFiles.map(async ({ file, isPdf }) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "indiaorigin_chat_attachments", resource_type: isPdf ? "raw" : "image" },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      uploadStream.end(buffer);
    });
    return {
      fileUrl: uploadResult.secure_url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      type: isPdf ? ("PDF" as const) : ("IMAGE" as const),
    };
  }));

  return await prisma.$transaction(async (tx) => {
    const updatedConversation = await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageSeq: { increment: 1 },
        lastMessageAt: new Date(),
      },
      select: { lastMessageSeq: true },
    });

    const savedMessage = await tx.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        sequence: updatedConversation.lastMessageSeq,
        attachments: {
          create: attachmentData,
        },
      },
      include: {
        attachments: true,
      },
    });

    await tx.messageOutbox.create({
      data: {
        dedupeKey: `message.created:${savedMessage.id}`,
        eventType: "message.created",
        aggregateId: conversationId,
        payload: {
          messageId: savedMessage.id,
          conversationId,
          senderId: user.id,
          sequence: savedMessage.sequence,
        },
      },
    });

    return savedMessage;
  });
}