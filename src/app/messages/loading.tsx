import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MessagesLoading() {
  return (
    <div className="flex h-[100dvh] bg-gray-50 text-gray-900 max-w-6xl mx-auto border-x border-gray-200 overflow-hidden fixed inset-0">
      <div className="w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Link href="/" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-extrabold text-lg">Messages</h1>
        </div>
        <div className="flex-1 divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:flex flex-1 bg-[#F8FAFC]" />
    </div>
  );
}