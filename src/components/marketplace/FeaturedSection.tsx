"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowRight, ShieldCheck, Factory, Truck } from "lucide-react";

export const FeaturedSection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* RFQ Prompt Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-100">
            <FileText className="w-4 h-4" /> Need Custom Manufacturing?
          </div>
          <h3 className="text-lg font-bold">Post a Requirement (RFQ)</h3>
          <p className="text-xs text-orange-100 max-w-xl">
            Get verified factory quotes directly from Indian manufacturers within 24 hours.
          </p>
        </div>
        <Link
          href="/rfq"
          className="shrink-0 px-5 py-2.5 bg-white text-orange-600 font-bold text-xs rounded-xl shadow-xs hover:bg-orange-50 transition-colors flex items-center gap-1.5"
        >
          Post RFQ Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Trust Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 p-2">
          <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Verified Manufacturers</h4>
            <p className="text-[11px] text-slate-500">GST and factory audit verified Indian suppliers.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 border-t sm:border-t-0 sm:border-l border-slate-100">
          <Factory className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Direct Factory Pricing</h4>
            <p className="text-[11px] text-slate-500">Source directly with transparent MOQs and pricing.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 border-t sm:border-t-0 sm:border-l border-slate-100">
          <Truck className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Pan-India Sourcing</h4>
            <p className="text-[11px] text-slate-500">Connecting buyers directly to major industrial hubs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};