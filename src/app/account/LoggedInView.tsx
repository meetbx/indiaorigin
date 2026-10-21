"use client";

import { signOut } from "next-auth/react";
import { ChevronRight, ArrowLeft, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { changePassword } from "@/app/actions/security";
import { signIn } from "next-auth/react";
import { unlinkGoogleAccount } from "@/app/actions/connected-accounts";

type UserProps = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  phone?: string | null;
  country?: string | null;
};

export default function LoggedInView({
  user,
  isGoogleConnected,
}: {
  user: UserProps;
  isGoogleConnected: boolean;
}) {
  const router = useRouter();

  // Edit Profile Modal State
  const [editField, setEditField] = useState<"name" | "email" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/account" });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.substring(0, 1).toUpperCase();
  };

  const openEditModal = (field: "name" | "email") => {
    setEditField(field);
    setInputValue(field === "name" ? user.name || "" : user.email || "");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = editField === "name" ? { name: inputValue } : { email: inputValue };
    const res = await updateProfile(payload);

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to update profile.");
    } else {
      setSuccessMsg("Updated successfully!");
      setTimeout(() => {
        setEditField(null);
        router.refresh();
      }, 1000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError(null);
    setPassSuccess(null);

    const res = await changePassword({ currentPassword, newPassword, confirmPassword });
    setPassLoading(false);

    if (!res.success) {
      setPassError(res.error || "Failed to update password.");
    } else {
      setPassSuccess("Password updated successfully!");
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPassSuccess(null);
      }, 1500);
    }
  };

  const handleGoogleAction = async () => {
    if (isGoogleConnected) {
      if (confirm("Are you sure you want to disconnect your Google account?")) {
        const res = await unlinkGoogleAccount();
        if (!res.success) {
          alert(res.error);
        } else {
          router.refresh();
        }
      }
    } else {
      signIn("google", { callbackUrl: "/account" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200 sticky top-0 z-10 md:hidden">
        <button onClick={() => router.back()} className="mr-4 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Account</h1>
      </div>

      <div className="max-w-2xl mx-auto md:mt-8">
        {/* Profile Card */}
        <div className="bg-white p-6 md:rounded-xl md:shadow-sm border-b md:border border-gray-200 flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-2xl font-bold overflow-hidden relative">
            {user.image ? (
              <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user.name || "Add your name"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium bg-orange-100 text-[#FF6B00] px-2 py-0.5 rounded">
                {user.role === "MANUFACTURER" ? "Manufacturer" : "Buyer"}
              </span>
              <span className="text-sm text-gray-500">
                {user.country || "🇮🇳 India"}
              </span>
            </div>
          </div>
        </div>

        {/* Liked Products */}
        <div className="bg-white md:rounded-xl md:shadow-sm border-y md:border border-gray-200 mb-4">
          <Link
            href="/account/liked"
            className="px-4 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-red-500" />
              </div>
              <span className="font-semibold">Liked Products</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* User Details */}
        <div className="bg-white md:rounded-xl md:shadow-sm border-y md:border border-gray-200 mb-4">
          <div 
            onClick={() => openEditModal("name")}
            className="px-4 py-3.5 flex justify-between items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Full name</span>
            <div className="flex items-center text-gray-500">
              <span className="mr-2 truncate max-w-[150px] font-medium text-gray-900">{user.name || "Add name"}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div 
            onClick={() => openEditModal("email")}
            className="px-4 py-3.5 flex justify-between items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Email</span>
            <div className="flex items-center text-gray-500">
              <span className="mr-2 truncate max-w-[180px] font-medium text-gray-900">{user.email || "Add email"}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="px-4 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50">
            <span className="text-gray-700">Phone number</span>
            <div className="flex items-center text-[#FF6B00] font-medium">
              <span className="mr-2">{user.phone || "Add phone number"}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Security */}
        <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Security
        </h3>
        <div className="bg-white md:rounded-xl md:shadow-sm border-y md:border border-gray-200 mb-4">
          <div 
            onClick={() => { setShowPasswordModal(true); setPassError(null); setPassSuccess(null); }}
            className="px-4 py-3.5 flex justify-between items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Password</span>
            <div className="flex items-center text-gray-400">
              <span className="text-xs text-gray-500 mr-2">Change password</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div 
            onClick={() => router.push("/account/security")}
            className="px-4 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Account security</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Connected Accounts */}
        <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Connected accounts
        </h3>
        <div className="bg-white md:rounded-xl md:shadow-sm border-y md:border border-gray-200 mb-4">
          <div 
            onClick={handleGoogleAction}
            className="px-4 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </span>
            <div className="flex items-center">
              <span className={`mr-2 text-sm font-medium ${isGoogleConnected ? 'text-emerald-600' : 'text-[#FF6B00]'}`}>
                {isGoogleConnected ? "Connected" : "Connect Account"}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white md:rounded-xl md:shadow-sm border-y md:border border-gray-200 mb-6">
          <div 
            onClick={() => router.push("/account/preferences")}
            className="px-4 py-3.5 flex justify-between items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Personalize your product recommendations</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          {/* Notifications */}
          <div 
            onClick={() => router.push("/account/notifications")}
            className="px-4 py-3.5 flex justify-between items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Notifications</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          {/* Privacy & security */}
          <div 
            onClick={() => router.push("/account/privacy")}
            className="px-4 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">Privacy & security</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Sign Out */}
        <div className="px-4 mb-8">
          <button
            onClick={handleSignOut}
            className="w-full bg-white border border-gray-200 text-gray-900 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editField && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditField(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">
              Edit {editField === "name" ? "Full Name" : "Email Address"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Update your account information securely.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  {editField === "name" ? "Full Name" : "Email Address"}
                </label>
                <input
                  type={editField === "email" ? "email" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  placeholder={editField === "name" ? "Enter your full name" : "Enter your email address"}
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  {successMsg}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditField(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Change Password</h3>
            <p className="text-xs text-gray-500 mb-4">
              Ensure your account is secure by using a strong password.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  placeholder="••••••••"
                />
              </div>

              {passError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                  {passError}
                </p>
              )}

              {passSuccess && (
                <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  {passSuccess}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {passLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}