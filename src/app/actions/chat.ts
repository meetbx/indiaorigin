"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
// import { getSessionUserId } from "@/lib/auth"; // Adjust to your actual session utility
import { v2 as cloudinary } from "cloudinary";

/**
 * Robust central helper to resolve the logged-in user safely 
 * supporting ID, phone, or email across all auth providers.
 */
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;
  const userPhone = (session?.user as any)?.phone;

  if (!userId && !userEmail && !userPhone) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(userPhone ? [{ phone: userPhone }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    },
    include: { manufacturerMemberships: true },
  });

  return user;
}

export async function getBuyerConversations() {
  const user = await getAuthenticatedUser();
  if (!user) return [];

  return await prisma.conversation.findMany({
    where: { buyerId: user.id },
    include: {
      manufacturer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getManufacturerConversations() {
  const user = await getAuthenticatedUser();
  if (!user || user.manufacturerMemberships.length === 0) return [];

  const manufacturerIds = user.manufacturerMemberships.map((m) => m.manufacturerId);

  return await prisma.conversation.findMany({
    where: { manufacturerId: { in: manufacturerIds } },
    include: {
      buyer: true,
      manufacturer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getConversationMessages(conversationId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const isBuyer = conversation.buyerId === user.id;
  const isManufacturerMember = user.manufacturerMemberships.some(
    (m) => m.manufacturerId === conversation.manufacturerId
  );

  if (!isBuyer && !isManufacturerMember) {
    throw new Error("Forbidden");
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { attachments: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    messages,
    currentUserId: user.id,
  };
}

export async function saveServerMessage(conversationId: string, content: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const isBuyer = conversation.buyerId === user.id;
  const isManufacturerMember = user.manufacturerMemberships.some(
    (m) => m.manufacturerId === conversation.manufacturerId
  );

  if (!isBuyer && !isManufacturerMember) throw new Error("Forbidden");
  if (!content || content.trim().length === 0) throw new Error("Empty message");

  const savedMessage = await prisma.message.create({
    data: {
      conversationId,
      content: content.trim(),
      senderId: user.id,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return savedMessage;
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
    include: { manufacturer: { include: { members: true } } },
  });
  if (!conversation) throw new Error("Conversation not found");

  const isBuyer = conversation.buyerId === user.id;
  const isManufacturerMember = user.manufacturerMemberships.some(
    (m) => m.manufacturerId === conversation.manufacturerId
  );
  if (!isBuyer && !isManufacturerMember) throw new Error("Forbidden");

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

  // Independent attachments upload concurrently instead of serially.
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

const savedMessage = await prisma.message.create({
    data: {
      conversation: {
        connect: { id: conversationId },
      },
      sender: {
        connect: { id: user.id },
      },
      content: content.trim() || "", // <-- Changed from null to empty string
      attachments: {
        create: attachmentData,
      },
    },
    include: {
      attachments: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return savedMessage;
}