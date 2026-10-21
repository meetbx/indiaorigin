"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserNotifications() {
  const session = await getServerSession(authOptions);
  const userSession = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !userSession?.id) return { notifications: [], unreadCount: 0 };

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: userSession.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: userSession.id, isRead: false },
    });

    return { notifications, unreadCount };
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  const userSession = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !userSession?.id) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: userSession.id },
      data: { isRead: true },
    });

    revalidatePath("/account/notifications");
    return { success: true };
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead() {
  const session = await getServerSession(authOptions);
  const userSession = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !userSession?.id) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { userId: userSession.id, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/account/notifications");
    return { success: true };
  } catch (err) {
    console.error("Failed to mark all notifications read:", err);
    return { success: false };
  }
}