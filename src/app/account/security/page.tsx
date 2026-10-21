export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Key, Lock, CheckCircle2 } from "lucide-react";
import SignOutButton from "@/components/account/SignOutButton";

export default async function AccountSecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true, sessions: true },
  });

  if (!user) redirect("/account");

  const hasPassword = !!user.passwordHash;
  const connectedProviders = user.accounts.map((acc) => acc.provider);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200 sticky top-0 z-10">
        <Link href="/account" className="mr-4 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Account Security</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Account Protection Active</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your account identity is secured via NextAuth and encrypted sessions.
            </p>
          </div>
        </div>

        {/* Identity & Login Methods */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Login Credentials</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Password Authentication</p>
                  <p className="text-xs text-gray-500">
                    {hasPassword ? "Password is set and securely hashed" : "No password set (Google account)"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${hasPassword ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                {hasPassword ? "Configured" : "Not Used"}
              </span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Connected Providers</p>
                  <p className="text-xs text-gray-500">
                    {connectedProviders.length > 0 ? connectedProviders.join(", ").toUpperCase() : "None linked"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Secure
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Sessions</h3>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Current Browser Session</p>
              <p className="text-xs text-gray-500">Expires: {new Date(session.expires).toLocaleDateString()}</p>
            </div>
            <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">
              Active Now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}