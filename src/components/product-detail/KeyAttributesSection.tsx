"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";

interface KeyAttributesSectionProps {
  specifications: Record<string, string>;
}

export default function KeyAttributesSection({ specifications }: KeyAttributesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const entries = Object.entries(specifications);
  if (entries.length === 0) return null;

  // Show only first 6 on the main product page
  const previewEntries = entries.slice(0, 6);

  return (
    <>
      {/* PREVIEW CARD */}
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50/80 transition"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-900 text-sm">Key attributes</h3>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          {previewEntries.map(([key, val], index) => (
            <div 
              key={key} 
              className={`pr-2 ${index % 2 === 0 ? "border-r border-gray-100" : ""}`}
            >
              <p className="text-sm font-semibold text-gray-900 truncate">{val}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL / BOTTOM SHEET */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex flex-col justify-end max-w-md mx-auto">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />

          {/* Bottom Sheet Modal */}
          <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            
            {/* Handlebar & Header (flex-shrink-0 ensures header stays fixed at top) */}
            <div className="p-4 border-b border-gray-100 relative text-center flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <h2 className="text-base font-bold text-gray-900">Key attributes</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (pb-24 provides extra bottom scroll space above bottom bar) */}
            <div className="p-4 pb-24 overflow-y-auto space-y-4">
              <div>
                <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">
                  All Attributes
                </h4>
                
                {/* Table Layout */}
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  {entries.map(([key, val], index) => (
                    <div
                      key={key}
                      className={`grid grid-cols-2 p-3 ${
                        index % 2 === 0 ? "bg-gray-50/60" : "bg-white"
                      } ${index !== entries.length - 1 ? "border-b border-gray-200" : ""}`}
                    >
                      <span className="text-gray-600 font-medium capitalize">{key}</span>
                      <span className="text-gray-900 font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}