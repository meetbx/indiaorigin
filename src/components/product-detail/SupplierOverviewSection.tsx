// src/components/product-detail/SupplierOverviewSection.tsx
'use client';

import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, CheckCircle2, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface SupplierOverviewProps {
  supplier: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    yearsOnPlatform?: number;
    location?: {
      state?: string;
      country?: string;
    };
    responseRate?: string;
    onTimeDelivery?: string;
  };
}

export default function SupplierOverviewSection({ supplier }: SupplierOverviewProps) {
  const router = useRouter();
  const profileUrl = `/manufacturers/${supplier.slug || supplier.id}`;

  return (
    <div className="bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* SECTION TITLE */}
      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3.5">
        Supplier Overview
      </h3>
      
      {/* SUPPLIER CARD CONTAINER AS A DIV WITH CLICK HANDLER */}
      <div
        onClick={() => router.push(profileUrl)}
        className="block bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all hover:border-slate-300 group cursor-pointer"
      >
        {/* HEADER ROW: LOGO & NAME */}
        <div className="flex items-center gap-3">
          {/* Company Logo or Fallback Icon */}
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
            {supplier.logo ? (
              <Image 
                src={supplier.logo} 
                alt={supplier.name || "Supplier Logo"} 
                fill 
                className="object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-indigo-600 stroke-[1.75]" />
            )}
          </div>

          {/* Details Column */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm truncate transition-colors">
                {supplier.name || "k d avk dakv ka"}
              </h4>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20 shrink-0" />
            </div>

            {/* Meta badges: Longevity & Location */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-normal flex-wrap">
              <span>{supplier.yearsOnPlatform || 6} yrs on IndiaOrigin</span>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{supplier.location?.state || "Gujarat"}, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS GRID (TRUST SIGNALS) */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-200/60">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Response</p>
              <p className="text-xs font-bold text-slate-800">{supplier.responseRate || "98%"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Dispatch</p>
              <p className="text-xs font-bold text-slate-800">{supplier.onTimeDelivery || "99.2%"}</p>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div className="grid grid-cols-2 gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
          {/* More Products Button */}
          <Link
            href={`/search?supplier=${supplier.slug || supplier.id}`}
            className="w-full h-10 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center transition-all shadow-2xs"
          >
            More products
          </Link>

          {/* Company Profile Button */}
          <Link
            href={profileUrl}
            className="w-full h-10 rounded-full bg-slate-900 group-hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
          >
            <span>Company profile</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
          </Link>
        </div>
      </div>
    </div>
  );
}