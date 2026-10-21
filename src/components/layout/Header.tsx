"use client";

import React from "react";
import Link from "next/link";
import { Bell, Heart, Search, Mic } from "lucide-react";
import { useSession } from "next-auth/react";
import NotificationBell from "@/components/common/NotificationBell";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSearchClick?: () => void;
  activeTopTab: string;
  setActiveTopTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onSearchClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Branding Section */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="/images/indiaorigin-logo.png" 
            alt="IndiaOrigin B2B"
            className="h-7 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
{/* Interactive Realtime Notification Bell */}
          <SessionNotificationBell />

          <Link
            href="/account/liked"
            aria-label="Heart"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-full transition-colors relative cursor-pointer"
          >
            <Heart className="w-5 h-5 stroke-[1.75]" />
          </Link>
        </div>
      </div>

      {/* Interactive Search Bar */}
      <div className="max-w-7xl mx-auto px-4 pb-3 pt-1">
        <form onSubmit={onSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 cursor-pointer" onClick={onSearchClick}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={onSearchClick}
              onClick={onSearchClick}
              placeholder="Search products, suppliers or factories..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-300/80 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
              readOnly={!!onSearchClick}
            />
            <button
              type="button"
              aria-label="Voice search"
              onClick={(e) => {
                e.stopPropagation();
                if (onSearchClick) onSearchClick();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 p-1 cursor-pointer"
            >
              <Mic className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
};

function SessionNotificationBell() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) {
    // Fallback static bell or hidden if not logged in
    return (
      <button
        aria-label="Notifications"
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-full transition-colors relative cursor-pointer"
      >
        <Bell className="w-5 h-5 stroke-[1.75]" />
      </button>
    );
  }

  return <NotificationBell userId={userId} />;
}