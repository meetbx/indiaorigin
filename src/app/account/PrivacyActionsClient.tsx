"use client";

import { useState } from "react";
import { Download, Trash2, Loader2 } from "lucide-react";
import { exportUserData, deleteUserAccount } from "@/app/actions/privacy";
import { signOut } from "next-auth/react";

export default function PrivacyActionsClient() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const res = await exportUserData();
    setExporting(false);

    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "indiaorigin-account-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(res.error || "Failed to download account data.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your account? This action is permanent.")) {
      return;
    }

    setDeleting(true);
    const res = await deleteUserAccount();
    setDeleting(false);

    if (res.success) {
      alert("Your account has been deleted.");
      signOut({ callbackUrl: "/" });
    } else {
      alert(res.error);
    }
  };

  return (
    <>
      <div onClick={handleExport} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Download Account Data</p>
            <p className="text-xs text-slate-500">Export a JSON copy of your profile and saved items</p>
          </div>
        </div>
        {exporting && <Loader2 className="w-4 h-4 animate-spin text-[#FF5500]" />}
      </div>

      <div onClick={handleDelete} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-red-50/50 transition">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600">Delete Account</p>
            <p className="text-xs text-slate-500">Permanently erase your account and profile data</p>
          </div>
        </div>
        {deleting && <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
      </div>
    </>
  );
}