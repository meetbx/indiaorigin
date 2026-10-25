'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, LayoutGrid, MessageSquare, ShoppingCart, User,FileText ,Search} from 'lucide-react';

function BottomNavContent(){
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
  /*  { label: 'Categories', href: '/categories', icon: LayoutGrid },*/
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Rfq', href: '/rfq', icon: FileText },
    { label: 'Account', href: '/account', icon: User },
  ];

  // Hide BottomNav on product pages and when viewing an active chat message screen on mobile
if (pathname?.startsWith("/products/")) {
    return null;
  }

  if (pathname?.startsWith("/messages")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center relative ${
                isActive ? 'text-[#FF6B00]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}