"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  MoreHorizontal, Home, MessageCircle, Heart, Share2, Flag, X, Send, AlertCircle, CheckCircle2 
} from "lucide-react";
import { submitProductReport } from "@/app/actions/report";

interface ProductHeaderMenuProps {
  productId: string;
  productTitle: string;
  productSlug: string;
}

const REPORT_REASONS = [
  "Incorrect product information",
  "Duplicate listing",
  "Misleading images or description",
  "Suspicious or fraudulent listing",
  "Other",
];

export default function ProductHeaderMenu({ productId, productTitle, productSlug }: ProductHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsReportOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleShare = async () => {
    setIsOpen(false);
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: productTitle || "theindiaorigin.com Product",
      text: `Check out ${productTitle} on theindiaorigin.com`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData) !== false) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Native share failed:", err);
        }
      }
    } else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setReportError("Please select a reason.");
      return;
    }

    setReportError("");
    setIsSubmitting(true);

    try {
      await submitProductReport(productId, selectedReason, description);
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setSelectedReason("");
        setDescription("");
      }, 1800);
    } catch (err: any) {
      if (err.message === "UNAUTHENTICATED") {
        setReportError("Please log in to submit a product report.");
      } else {
        setReportError(err.message || "Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Header Three Dot Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Product options"
        className="p-1 text-slate-700 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
      >
        <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col py-1">
            {/* 1. Home */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#FF5500] rounded-xl transition-colors"
            >
              <Home className="w-4 h-4 stroke-[2] text-slate-500" />
              <span>Home</span>
            </Link>

            {/* 2. Messages */}
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#FF5500] rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4 stroke-[2] text-slate-500" />
              <span>Messages</span>
            </Link>

            {/* 3. Liked Products */}
            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#FF5500] rounded-xl transition-colors"
            >
              <Heart className="w-4 h-4 stroke-[2] text-slate-500" />
              <span>Liked Products</span>
            </Link>

            {/* 4. Share Product */}
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#FF5500] rounded-xl transition-colors text-left cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2] text-slate-500" />
              <span>Share Product</span>
            </button>

            {/* 5. Report Product */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsReportOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
            >
              <Flag className="w-4 h-4 stroke-[2] text-rose-500" />
              <span>Report Product</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Modal / Bottom Sheet */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 border border-slate-100 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Report Product</h3>
                <p className="text-[11px] text-slate-500">Help us keep IndiaOrigin safe and reliable</p>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Report Submitted</h4>
                <p className="text-xs text-slate-500">Thank you. Our moderation team will review this listing shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                {reportError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Reason for report *</label>
                  <div className="space-y-1">
                    {REPORT_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedReason === reason
                            ? "border-[#FF5500] bg-orange-50/50 text-slate-900 font-semibold"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{reason}</span>
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="accent-[#FF5500]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional details (optional)</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details regarding this listing..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}