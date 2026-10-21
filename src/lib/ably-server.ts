import Ably from 'ably';

// Initialize Ably REST client using server-side environment variables
let ablyRest: Ably.Rest | null = null;

function getAblyRest() {
  if (!ablyRest && process.env.ABLY_SERVER_API_KEY) {
    ablyRest = new Ably.Rest(process.env.ABLY_SERVER_API_KEY);
  }
  return ablyRest;
}

export async function sendRealtimeNotification(userId: string, notification: {
  id: string;
  title: string;
  message: string;
  type: string;
  url?: string | null;
  createdAt: Date;
}) {
  const client = getAblyRest();
  if (!client) return;

  try {
    const channel = client.channels.get(`user:${userId}`);
    await channel.publish('new-notification', notification);
  } catch (error) {
    console.error('Failed to publish real-time notification via Ably:', error);
  }
}