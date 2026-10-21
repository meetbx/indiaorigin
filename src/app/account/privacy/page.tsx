export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Download, Trash2, FileText } from "lucide-react";
import PrivacyActionsClient from "../PrivacyActionsClient";

export default async function PrivacySecurityPage() {
//  const session = await getServerSession(authOptions);
//  if (!session || !session.user?.id) redirect("/account");


const session = await getServerSession(authOptions);
const user = session?.user as { id?: string; email?: string; name?: string };

if (!session || !user?.id) redirect("/account");

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-slate-200 sticky top-0 z-10">
        <Link href="/account" className="mr-4 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Privacy & Security</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Information Notice */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Data Protection & Privacy</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              IndiaOrigin protects your commercial identity. Your purchasing preferences and inquiry details are encrypted and never shared without consent.
            </p>
          </div>
        </div>

        {/* Data & Rights */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Account Rights</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Download Data */}
            <PrivacyActionsClient />

            {/* Privacy Policy Link */}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Privacy Policy</p>
                  <p className="text-xs text-slate-500">Read our terms on data handling & security</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}