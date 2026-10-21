export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Inbox } from "lucide-react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";

export default async function NotificationsPage() {
const session = await getServerSession(authOptions);
const user = session?.user as { id?: string; email?: string; name?: string };

if (!session || !user?.id) {
  redirect("/account");
}
  const { notifications, unreadCount } = await getUserNotifications();

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans max-w-2xl mx-auto">
      {/* Top Bar */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/account" className="mr-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
        </div>

        {unreadCount > 0 && (
          <form action={async () => { await markAllNotificationsAsRead(); }}>
            <button type="submit" className="text-xs font-semibold text-[#FF5500] hover:underline flex items-center gap-1">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          </form>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Unread Counter Badge */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5500] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">In-App Alerts</p>
              <p className="text-xs text-slate-500">Inquiries, message alerts & account activity</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-orange-50 text-[#FF5500] border border-orange-200 px-3 py-1 rounded-full">
            {unreadCount} Unread
          </span>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <Inbox className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs">When you receive inquiries or order updates, they will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 flex items-start justify-between gap-3 transition ${n.isRead ? "bg-white" : "bg-orange-50/40"}`}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{n.title || "Alert"}</p>
                    <p className="text-xs text-slate-600">{n.message}</p>
                    <p className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>

                  {!n.isRead && (
                    <form action={async () => {
                      "use server";
                      await markNotificationAsRead(n.id);
                    }}>
                      <button type="submit" className="text-[11px] font-semibold text-[#FF5500] hover:underline shrink-0">
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}