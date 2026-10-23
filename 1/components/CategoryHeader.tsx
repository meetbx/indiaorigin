'use client';

import { HelpCircle } from 'lucide-react';

export default function CategoryHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">Categories</h1>
      <button 
        aria-label="Help & Information"
        className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </header>
  );
}