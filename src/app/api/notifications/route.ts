import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path based on your NextAuth configuration
import { prisma } from '@/lib/prisma';

// GET: Fetch notifications & unread count
export async function GET(request: Request) {
const session = await getServerSession(authOptions);
const userSession = session?.user as { id?: string; email?: string; name?: string };

if (!userSession?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = userSession.id;
  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get('countOnly') === 'true';

  try {
    if (countOnly) {
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });
      return NextResponse.json({ success: true, unreadCount });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Mark notification(s) as read
export async function PATCH(request: Request) {
const session = await getServerSession(authOptions);
const userSession = session?.user as { id?: string; email?: string; name?: string };

if (!userSession?.id){
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = userSession.id;

  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationId) {
      // Ensure ownership verification before updating
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}