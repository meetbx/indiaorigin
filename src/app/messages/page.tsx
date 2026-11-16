import React, { Suspense } from "react";
import { getBuyerConversations, getConversationMessages } from "@/app/actions/chat";
import MessagesClient from "@/components/MessagesClient";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function BuyerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string; manufacturerId?: string; slug?: string }>;
}) {
  const resolvedParams = await searchParams;
  const targetConvId = resolvedParams.conversationId;
  const targetManufacturerId = resolvedParams.manufacturerId;
  const targetSlug = resolvedParams.slug;

  let initialConversations: any[] = [];
  let initialActiveConv: any = null;
  let initialMessages: any[] = [];
  let initialCurrentUserId: string | null = null;
  let initialHasMoreMessages = false;
  let initialOldestSequence: number | undefined = undefined;

  try {
    const convRes = await getBuyerConversations(20);
    initialConversations = convRes?.items || [];

    let matched: any = null;

    if (targetConvId) {
      matched = initialConversations.find((c: any) => c.id === targetConvId) || null;
    }

    // If a specific conversation or message payload exists, fetch messages to grab currentUserId securely
    if (matched) {
      const msgRes = await getConversationMessages(matched.id, 20);
      initialMessages = msgRes?.items || [];
      initialHasMoreMessages = msgRes?.hasMore || false;
      initialOldestSequence = msgRes?.nextCursor;
      initialCurrentUserId = msgRes?.currentUserId || null;
    }

    // If clicking "Chat now" with a manufacturerId or slug, we need the buyer's ID to upsert the conversation
    if ((targetManufacturerId || targetSlug) && !matched) {
      // Fetch the first conversation's messages or find the buyer from any existing conversation/participant
      if (initialConversations.length > 0) {
        const sampleMsgRes = await getConversationMessages(initialConversations[0].id, 1);
        initialCurrentUserId = sampleMsgRes?.currentUserId || null;
      }
    }

    if (targetManufacturerId && initialCurrentUserId) {
      matched = await prisma.conversation.upsert({
        where: {
          buyerId_manufacturerId: {
            buyerId: initialCurrentUserId,
            manufacturerId: targetManufacturerId,
          },
        },
        update: {},
        create: {
          buyerId: initialCurrentUserId,
          manufacturerId: targetManufacturerId,
        },
        include: {
          manufacturer: { select: { id: true, name: true, logo: true, city: true } },
          product: { select: { name: true } },
        },
      });

      if (matched && !initialConversations.some((c: any) => c.id === matched.id)) {
        initialConversations = [matched, ...initialConversations];
      }
    } else if (targetSlug && initialCurrentUserId) {
      const product = await prisma.product.findUnique({
        where: { slug: targetSlug },
        select: { manufacturerId: true },
      });

      if (product) {
        matched = await prisma.conversation.upsert({
          where: {
            buyerId_manufacturerId: {
              buyerId: initialCurrentUserId,
              manufacturerId: product.manufacturerId,
            },
          },
          update: {},
          create: {
            buyerId: initialCurrentUserId,
            manufacturerId: product.manufacturerId,
          },
          include: {
            manufacturer: { select: { id: true, name: true, logo: true, city: true } },
            product: { select: { name: true } },
          },
        });

        if (matched && !initialConversations.some((c: any) => c.id === matched.id)) {
          initialConversations = [matched, ...initialConversations];
        }
      }
    }

    initialActiveConv = matched;

    // If matched was just set via upsert and messages aren't loaded yet, load them
    if (matched && initialMessages.length === 0 && !targetConvId) {
      const msgRes = await getConversationMessages(matched.id, 20);
      initialMessages = msgRes?.items || [];
      initialHasMoreMessages = msgRes?.hasMore || false;
      initialOldestSequence = msgRes?.nextCursor;
      if (!initialCurrentUserId) {
        initialCurrentUserId = msgRes?.currentUserId || null;
      }
    }
  } catch (err) {
    console.error("Failed to server-load messages data:", err);
  }

  return (
    <div className="flex h-[100dvh] bg-gray-50 text-gray-900 max-w-6xl mx-auto border-x border-gray-200 overflow-hidden fixed inset-0">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading chat...</div>}>
        <MessagesClient
          initialConversations={initialConversations}
          initialActiveConv={initialActiveConv}
          initialMessages={initialMessages}
          initialCurrentUserId={initialCurrentUserId}
          initialHasMoreMessages={initialHasMoreMessages}
          initialOldestSequence={initialOldestSequence}
        />
      </Suspense>
    </div>
  );
}