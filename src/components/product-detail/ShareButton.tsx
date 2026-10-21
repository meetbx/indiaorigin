"use client";

import React, { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, Mail, MessageCircle } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close fallback popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowFallback(false);
      }
    }
    if (showFallback) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFallback]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Determine current canonical URL safely on the client
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = {
      title: title || "IndiaOrigin.in Product",
      text: text || `Check out ${title} on IndiaOrigin.in`,
      url: shareUrl,
    };

    // 1. Mobile Native Web Share API Check
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData) !== false) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        // AbortError is triggered when user cancels native sheet - handle silently
        if (err.name !== "AbortError") {
          console.error("Error sharing via native sheet:", err);
          setShowFallback(true);
        }
      }
      return;
    }

    // 2. Fallback for Desktop/Unsupported Browsers
    setShowFallback((prev) => !prev);
  };

  const handleCopyLink = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`Check out ${title} on IndiaOrigin: ${shareUrl}`);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share product"
        className={className || "text-slate-400 hover:text-slate-700 p-1 flex-shrink-0 transition-colors cursor-pointer"}
      >
        <Share2 className="w-5 h-5 stroke-[1.75]" />
      </button>

      {/* Desktop / Unsupported Browser Fallback Popover */}
      {showFallback && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 mb-1">
            Share via
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full text-left px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-slate-500" />
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </div>
            {copied && <Check className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowFallback(false)}
            className="w-full text-left px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>WhatsApp</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`}
            onClick={() => setShowFallback(false)}
            className="w-full text-left px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Mail className="w-4 h-4 text-blue-500" />
            <span>Email</span>
          </a>
        </div>
      )}
    </div>
  );
}