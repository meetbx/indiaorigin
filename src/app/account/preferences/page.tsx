export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sliders, CheckCircle2 } from "lucide-react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { revalidatePath } from "next/cache";

export default async function RecommendationsPreferencesPage() {
const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string; name?: string };

  if (!session || !user?.id) {
    redirect("/account");
  }

  // Use 'user.id' instead of 'session.user.id'
  const userId = user.id;
  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
  });

  const categories = await prisma.category.findMany({ select: { name: true, slug: true } });
  const locations = await prisma.location.findMany({ select: { state: true } });

  const currentCategories = preferences?.preferredCategories || [];
  const currentMaterials = preferences?.preferredMaterials || [];
  const currentLocation = preferences?.preferredLocation || "";
  const currentInterests = preferences?.buyingInterests || "";

  async function handleSave(formData: FormData) {
    "use server";
    const selectedCats = formData.getAll("categories") as string[];
    const materials = (formData.get("materials") as string || "").split(",").map(m => m.trim()).filter(Boolean);
    const location = formData.get("location") as string || "";
    const interests = formData.get("interests") as string || "";

    await updateUserPreferences({
      preferredCategories: selectedCats,
      preferredMaterials: materials,
      preferredLocation: location,
      buyingInterests: interests,
    });
    // Automatically redirect to home page after successful save
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-slate-200 sticky top-0 z-10">
        <Link href="/account" className="mr-4 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Recommendation Preferences</h1>
      </div>

      <form action={handleSave} className="p-4 space-y-6">
        {/* Intro Banner */}
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5500] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tailor your marketplace feed</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Select your industrial interests, materials, and regional sourcing preferences to customize your B2B recommendations.
            </p>
          </div>
        </div>

        {/* Categories Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferred Categories</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const isChecked = currentCategories.includes(cat.slug);
              return (
                <label key={cat.slug} className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${isChecked ? "bg-orange-50/60 border-[#FF5500] text-[#FF5500]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <input type="checkbox" name="categories" value={cat.slug} defaultChecked={isChecked} className="rounded text-[#FF5500] focus:ring-[#FF5500]" />
                  <span className="truncate">{cat.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Materials Input */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Preferred Materials (Comma separated)</label>
          <input type="text" name="materials" defaultValue={currentMaterials.join(", ")} placeholder="e.g. Stainless Steel, Aluminum, Brass" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]" />
        </div>

        {/* Preferred Location */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Preferred Manufacturing Location / State</label>
          <select name="location" defaultValue={currentLocation} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]">
            <option value="">All India</option>
            {locations.map((loc) => (
              <option key={loc.state} value={loc.state}>{loc.state}</option>
            ))}
          </select>
        </div>

        {/* Buying Interests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Business Purchasing Focus</label>
          <textarea name="interests" defaultValue={currentInterests} rows={3} placeholder="Describe what machinery or bulk items your business frequently sources..." className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]" />
        </div>

        <button type="submit" className="w-full bg-[#FF5500] hover:bg-[#E04B00] text-white font-semibold py-3.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Save Preferences
        </button>
      </form>
    </div>
  );
}