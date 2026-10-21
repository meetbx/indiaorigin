'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Ably from 'ably';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  url?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications and unread count
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // Realtime subscription via Ably
  useEffect(() => {
    if (!userId) return;

    const ablyClient = new Ably.Realtime({ authUrl: '/api/ably/auth' }); // Or standard client init
    const channel = ablyClient.channels.get(`user:${userId}`);

    const handleNewNotification = (message: any) => {
      const newNotif = message.data;
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play subtle chime if not muted
      if (!muted) {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.4;
          audio.play().catch(() => {}); // Catch autoplay restrictions
        } catch (e) {}
      }
    };

    channel.subscribe('new-notification', handleNewNotification);

    return () => {
      channel.unsubscribe('new-notification', handleNewNotification);
      ablyClient.close();
    };
  }, [userId, muted]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 text-slate-700 hover:text-[#FF5500] transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell className="w-5 h-5 stroke-[1.8]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF5500] rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-orange-100 text-[#FF5500] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#FF5500] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {loading ? (
              <div className="py-12 text-center flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5500]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center px-4">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-1" />
                <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">We'll notify you when something important arrives.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const content = (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                      setIsOpen(false);
                    }}
                    className={`p-3.5 transition-colors flex gap-3 cursor-pointer ${
                      notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/40 hover:bg-orange-50/70'
                    }`}
                  >
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#FF5500] mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );

                return notif.url ? (
                  <Link key={notif.id} href={notif.url}>
                    {content}
                  </Link>
                ) : (
                  content
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}