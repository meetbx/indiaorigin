import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoggedInView from "./LoggedInView";
import AuthForm from "./AuthForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  

const session = await getServerSession(authOptions);
const sessionUser = session?.user as { id?: string; email?: string; name?: string };

if (!sessionUser?.id) {
  return <AuthForm />;
}

// STATE 2: Authenticated -> Fetch fresh user details by immutable ID (supports phone-only accounts)
const user = await prisma.user.findUnique({
  where: { id: sessionUser.id },
  include: { accounts: true },
});

  if (!user) {
    return <AuthForm />;
  }

  // Determine Google connection status from database Account records
  const isGoogleConnected = user.accounts.some(
    (acc) => acc.provider === "google"
  );

  return <LoggedInView user={user} isGoogleConnected={isGoogleConnected} />;
}