// src/components/product-detail/ChatButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthAction } from "@/hooks/useAuthAction";
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
      () => {
        // INSTANT NAVIGATION: Go to messages right away using available props or product slug
        setLoading(true);
        if (manufacturerId) {
          router.push(`/messages?manufacturerId=${manufacturerId}&productId=${productId || ""}`);
        } else {
          // Fallback if IDs aren't pre-loaded on the button
          router.push(`/messages?slug=${productSlug}`);
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