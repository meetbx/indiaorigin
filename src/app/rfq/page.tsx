import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Send, CheckCircle2, Clock, FileText, PlusCircle } from "lucide-react";

export default async function RFQPage() {
  const categories = await prisma.category.findMany();

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-900 pb-20 max-w-md mx-auto shadow-2xl border-x border-gray-200">
      {/* Header */}
      <header className="bg-white p-3 border-b flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="text-gray-700 hover:text-[#FF5500]">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">B2B RFQ Marketplace</span>
        <div className="w-6" />
      </header>

      <main className="p-4 space-y-4">
        {/* Post RFQ Form Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <PlusCircle className="w-5 h-5 text-[#FF5500]" />
            <h1 className="text-base font-extrabold text-gray-900">Post Custom Requirement</h1>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Get instant factory-direct quotations from verified Indian manufacturers within 24 hours.
          </p>

          <form action="/rfq" method="POST" className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Product Requirement Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. 5000 units Corrugated Packaging Boxes"
                className="w-full bg-[#F3F4F6] text-xs p-2.5 rounded-xl border border-transparent focus:border-[#FF5500] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Category</label>
                <select className="w-full bg-[#F3F4F6] text-xs p-2.5 rounded-xl border border-transparent focus:border-[#FF5500] focus:bg-white focus:outline-none">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Quantity Needed</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  className="w-full bg-[#F3F4F6] text-xs p-2.5 rounded-xl border border-transparent focus:border-[#FF5500] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Detailed Specifications</label>
              <textarea
                rows={3}
                placeholder="Specify material grade, dimensions, packaging preferences..."
                className="w-full bg-[#F3F4F6] text-xs p-2.5 rounded-xl border border-transparent focus:border-[#FF5500] focus:bg-white focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Submit Requirement for Quotes
            </button>
          </form>
        </div>

    

      </main>
    </div>
  );
}