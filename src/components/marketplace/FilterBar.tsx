"use client";

import React from "react";
import { Sparkles, CheckCircle2, Flame, Tag, Layers } from "lucide-react";

interface FilterBarProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}



const QUICK_CATEGORIES = [
  { slug: "all", name: "All Categories" },
  { slug: "machined-cnc-components", name: "Machined Components" },
  { slug: "hydraulics-pneumatics", name: "Hydraulics" },
  { slug: "industrial-fasteners", name: "Fasteners" },
  { slug: "electrical-power-equipment", name: "Electrical" },
  { slug: "castings-forgings", name: "Castings & Forgings" },
  { slug: "automation-robotics", name: "Automation" },
  { slug: "pipes-fittings-polymers", name: "Pipes & Polymers" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  setActiveFilter,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 py-3 space-y-2.5">


      {/* Category Links */}

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none whitespace-nowrap">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
         &nbsp;&nbsp;&nbsp;    Categories:
        </span>
        {QUICK_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap border transition-colors ${
                isSelected
                  ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};