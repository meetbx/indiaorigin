// src/components/product-detail/ChatButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthAction } from "@/hooks/useAuthAction";
import { getOrCreateConversation, getProductForChat } from "@/app/actions/chat";
import { MessageSquareMore } from "lucide-react";

interface ChatButtonProps {
  productSlug: string;
  manufacturerId?: string;
  productId?: string;
}

export default function ChatButton({ productSlug, manufacturerId, productId }: ChatButtonProps) {
  const { executeProtectedAction, isAuthenticated } = useAuthAction();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChatClick = async () => {
    executeProtectedAction(
      { action: "open_chat", slug: productSlug },
      async () => {
        try {
          setLoading(true);

          let targetManufacturerId = manufacturerId;
          let targetProductId = productId;

          if (!targetManufacturerId) {
            const product = await getProductForChat(productSlug);
            targetManufacturerId = product?.manufacturerId;
            targetProductId = product?.id;
          }

          if (!targetManufacturerId) {
            console.error("Manufacturer ID could not be found for product slug:", productSlug);
            router.push("/messages");
            return;
          }

          const conversation = await getOrCreateConversation(targetManufacturerId, targetProductId);

          if (conversation?.id) {
            router.push(`/messages?conversationId=${conversation.id}`);
          } else {
            router.push("/messages");
          }
        } catch (err) {
          console.error("Failed to initiate chat session:", err);
          router.push("/messages");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <button 
      type="button"
      onClick={handleChatClick}
      disabled={loading}
      className="btn-chat-target w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all cursor-pointer disabled:opacity-70"
    >
      <MessageSquareMore className="w-4.5 h-4.5 stroke-[1.8] text-slate-800" />
      <span>{loading ? "Opening..." : isAuthenticated ? "Chat" : "Chat now"}</span>
    </button>
  );
}