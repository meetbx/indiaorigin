import React, { Suspense } from "react";
import { Metadata } from "next"; //
import { getBuyerConversations, getConversationMessages } from "@/app/actions/chat";
import MessagesClient from "@/components/MessagesClient";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Messages | The India Origin",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

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
    
    // Grab currentUserId from the first conversation or a quick sample
    if (initialConversations.length > 0) {
      const sampleMsgRes = await getConversationMessages(initialConversations[0].id, 1);
      initialCurrentUserId = sampleMsgRes?.currentUserId || null;
    }

    let matched: any = null;

    if (targetConvId) {
      matched = initialConversations.find((c: any) => c.id === targetConvId) || null;
    } else if (targetManufacturerId) {
      // 1. Check if an existing conversation already exists in the fetched list
      matched = initialConversations.find((c: any) => c.manufacturerId === targetManufacturerId);

      if (!matched && initialCurrentUserId) {
        // 2. Check if it exists in the database without creating a new row yet
        const existingDbConv = await prisma.conversation.findUnique({
          where: {
            buyerId_manufacturerId: {
              buyerId: initialCurrentUserId,
              manufacturerId: targetManufacturerId,
            },
          },
          include: {
            manufacturer: { select: { id: true, name: true, logo: true, city: true } },
            product: { select: { name: true } },
          },
        });

        if (existingDbConv) {
          matched = existingDbConv;
        } else {
          // 3. If no conversation exists in the DB yet, create a temporary UI-only object 
          const mfr = await prisma.manufacturer.findUnique({
            where: { id: targetManufacturerId },
            select: { id: true, name: true, logo: true, city: true },
          });

          if (mfr) {
            matched = {
              id: `temp-${targetManufacturerId}`,
              manufacturerId: targetManufacturerId,
              manufacturer: mfr,
              product: null,
              isTemporary: true,
            };
          }
        }
      }
    } else if (targetSlug) {
      const product = await prisma.product.findUnique({
        where: { slug: targetSlug },
        select: { manufacturerId: true, name: true },
      });

      if (product) {
        matched = initialConversations.find((c: any) => c.manufacturerId === product.manufacturerId);

        if (!matched && initialCurrentUserId) {
          const existingDbConv = await prisma.conversation.findUnique({
            where: {
              buyerId_manufacturerId: {
                buyerId: initialCurrentUserId,
                manufacturerId: product.manufacturerId,
              },
            },
            include: {
              manufacturer: { select: { id: true, name: true, logo: true, city: true } },
              product: { select: { name: true } },
            },
          });

          if (existingDbConv) {
            matched = existingDbConv;
          } else {
            const mfr = await prisma.manufacturer.findUnique({
              where: { id: product.manufacturerId },
              select: { id: true, name: true, logo: true, city: true },
            });

            if (mfr) {
              matched = {
                id: `temp-${product.manufacturerId}`,
                manufacturerId: product.manufacturerId,
                manufacturer: mfr,
                product: { name: product.name },
                isTemporary: true,
              };
            }
          }
        }
      }
    }

    initialActiveConv = matched;

    // Ensure matched is at the top of initialConversations if it's present and not already listed
    if (matched) {
      const existsInList = initialConversations.some(
        (c: any) => c.id === matched.id || c.manufacturerId === matched.manufacturerId
      );
      if (!existsInList) {
        initialConversations = [matched, ...initialConversations];
      }
    }

    // Clean de-duplication: Ensure each manufacturer ID appears only ONCE in the inbox sidebar
    initialConversations = Array.from(
      new Map(initialConversations.map((c) => [c.manufacturerId, c])).values()
    );

    // Load messages only if it's a real existing conversation (not temporary)
    if (matched && !matched.isTemporary) {
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