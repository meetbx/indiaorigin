// /*

// // src/components/product-detail/ProductPricingSection.tsx
// import { PriceTier } from "@/lib/product-normalizer";
// import {  ArrowRight ,Package} from "lucide-react";
// import Link from "next/link";

// interface PricingSectionProps {
//   pricing: {
//     priceTiers: PriceTier[];
//     minPrice: number | null;
//     maxPrice: number | null;
//     samplePrice: number | null;
//     isSampleAvailable: boolean;
//     moq: number;
//     unit: string;
//   };
//   productSlug?: string;
// }

// export default function ProductPricingSection({ pricing, productSlug }: PricingSectionProps) {
//   const { priceTiers, minPrice, maxPrice, samplePrice, isSampleAvailable, moq, unit } = pricing;

//   if (priceTiers.length === 0 && minPrice == null) {
//     return null;
//   }

//   return (
//     <div className="bg-white px-4 py-2 space-y-3">
//       {/* 1. TIERED PRICING CARD */}
//       <div className="bg-[#F1F3F5] rounded-2xl p-3.5 flex items-baseline gap-6 overflow-x-auto no-scrollbar">
//         {priceTiers.length > 0 ? (
//           priceTiers.map((tier, idx) => (
//             <div key={idx} className="flex-shrink-0 min-w-[90px]">
//               <div className="flex items-baseline text-slate-900 font-black tracking-tight">
//                 <span className="text-base font-extrabold mr-0.5">₹</span>
//                 <span className="text-2xl">{tier.price.toLocaleString("en-IN")}</span>
//               </div>
//               <p className="text-[11px] text-slate-500 font-normal mt-0.5">
//                 {tier.maxQty 
//                   ? `${tier.minQty}-${tier.maxQty} ${unit.toLowerCase()}${tier.maxQty > 1 ? "s" : ""}` 
//                   : `≥${tier.minQty} ${unit.toLowerCase()}${tier.minQty > 1 ? "s" : ""}`}
//               </p>
//             </div>
//           ))
//         ) : (
//           /* Single Price or Price Range */
//           <div className="flex-shrink-0">
//             <div className="flex items-baseline text-slate-900 font-black tracking-tight">
//               <span className="text-base font-extrabold mr-0.5">₹</span>
//               <span className="text-2xl">
//                 {minPrice !== null && maxPrice !== null && minPrice !== maxPrice
//                   ? `${minPrice.toLocaleString("en-IN")} - ₹${maxPrice.toLocaleString("en-IN")}`
//                   : (minPrice ?? maxPrice ?? 0).toLocaleString("en-IN")}
//               </span>
//             </div>
//             {moq > 0 && (
//               <p className="text-[11px] text-slate-500 font-normal mt-0.5">
//                 ≥{moq} {unit.toLowerCase()}{moq > 1 ? "s" : ""}
//               </p>
//             )}
//           </div>
//         )}
//       </div>

//       {/* 2. MATCHING SAMPLE AVAILABLE SECTION */}
//       {isSampleAvailable && samplePrice !== null && (
//         <div className="bg-[#FFF9F2] border border-[#FFE8D1] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
//           <div className="flex items-center gap-3 min-w-0">
//             {/* Flask Sample Icon Badge */}
//             <div className="w-10 h-10 rounded-full bg-[#FFF0E0] border border-[#FFE2C7] flex items-center justify-center shrink-0">
//               <Package className="w-5 h-5 text-[#FF5500] stroke-[2]" />
//             </div>

//             {/* Price Details */}
//             <div className="min-w-0">
//               <span className="text-[10px] font-extrabold text-[#FF5500] uppercase tracking-wider block leading-tight">
//                 SAMPLE AVAILABLE
//               </span>
//               <p className="text-sm font-semibold text-[#334155] mt-0.5 truncate">
//                 ₹{samplePrice.toLocaleString("en-IN")}{" "}
//                 <span className="text-xs font-normal text-slate-500">/ sample unit</span>
//               </p>
//             </div>
//           </div>

//           {/* Request Sample Action Button */}
//           <Link
//             href={productSlug ? `/rfq?product=${productSlug}&type=sample` : "#"}
//             className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5500] hover:bg-[#E04B00] active:scale-[0.98] rounded-full transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
//           >
//             <span>Request sample</span>
//             <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
//           </Link>
//         </div>
//       )}
//     </div>
//   );
// }

// */




// src/components/product-detail/ProductPricingSection.tsx
import { PriceTier } from "@/lib/product-normalizer";
import { ArrowRight, Package } from "lucide-react";
import Link from "next/link";

interface PricingSectionProps {
  pricing: {
    priceTiers: PriceTier[];
    minPrice: number | null;
    maxPrice: number | null;
    samplePrice: number | null;
    isSampleAvailable: boolean;
    moq: number;
    unit: string;
  };
  productSlug?: string;
}

/**
 * Only scales down text size if the price has 7+ digits (e.g. 10,00,000+).
 * Keeps smaller prices large and bold.
 */
function getPriceFontSize(formattedPrice: string): string {
  const length = formattedPrice.length;

  if (length > 10) {
    return "text-base sm:text-lg"; // Extremely large numbers (Crores)
  } else if (length > 7) {
    return "text-lg sm:text-xl"; // 7-8 digits (Lakhs like 13,45,000)
  }
  return "text-xl sm:text-2xl"; // Small and standard prices (e.g., 400, 15,000, 1,80,000)
}

export default function ProductPricingSection({ pricing, productSlug }: PricingSectionProps) {
  const { priceTiers, minPrice, maxPrice, samplePrice, isSampleAvailable, moq, unit } = pricing;

  if (priceTiers.length === 0 && minPrice == null) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-2 space-y-3">
      {/* 1. TIERED PRICING CARD */}
      <div className="bg-[#F1F3F5] rounded-2xl p-3.5 flex items-baseline gap-5 overflow-x-auto no-scrollbar">
        {priceTiers.length > 0 ? (
          priceTiers.map((tier, idx) => {
            const formattedPrice = tier.price.toLocaleString("en-IN");
            const fontSizeClass = getPriceFontSize(formattedPrice);

            return (
              <div key={idx} className="flex-shrink-0 min-w-[90px]">
                <div className="flex items-baseline text-slate-900 font-black tracking-tight">
                  <span className="text-xs sm:text-sm font-extrabold mr-0.5">₹</span>
                  <span className={`${fontSizeClass} leading-tight font-extrabold transition-all`}>
                    {formattedPrice}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  {tier.maxQty 
                    ? `${tier.minQty}-${tier.maxQty} ${unit.toLowerCase()}${tier.maxQty > 1 ? "s" : ""}` 
                    : `≥${tier.minQty} ${unit.toLowerCase()}${tier.minQty > 1 ? "s" : ""}`}
                </p>
              </div>
            );
          })
        ) : (
          /* Single Price or Price Range */
          (() => {
            const priceString =
              minPrice !== null && maxPrice !== null && minPrice !== maxPrice
                ? `${minPrice.toLocaleString("en-IN")} - ₹${maxPrice.toLocaleString("en-IN")}`
                : (minPrice ?? maxPrice ?? 0).toLocaleString("en-IN");

            const fontSizeClass = getPriceFontSize(priceString);

            return (
              <div className="flex-shrink-0">
                <div className="flex items-baseline text-slate-900 font-black tracking-tight">
                  <span className="text-xs sm:text-sm font-extrabold mr-0.5">₹</span>
                  <span className={`${fontSizeClass} leading-tight font-extrabold transition-all`}>
                    {priceString}
                  </span>
                </div>
                {moq > 0 && (
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    ≥{moq} {unit.toLowerCase()}{moq > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* 2. MATCHING SAMPLE AVAILABLE SECTION */}
      {isSampleAvailable && samplePrice !== null && (
        <div className="bg-[#FFF9F2] border border-[#FFE8D1] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#FFF0E0] border border-[#FFE2C7] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-[#FF5500] stroke-[2]" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-[#FF5500] uppercase tracking-wider block leading-tight">
                SAMPLE AVAILABLE
              </span>
              <p className="text-sm font-semibold text-[#334155] mt-0.5 truncate">
                ₹{samplePrice.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-slate-500">/ sample unit</span>
              </p>
            </div>
          </div>

          <Link
            href={productSlug ? `/rfq?product=${productSlug}&type=sample` : "#"}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5500] hover:bg-[#E04B00] active:scale-[0.98] rounded-full transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>Request sample</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      )}
    </div>
  );
}

