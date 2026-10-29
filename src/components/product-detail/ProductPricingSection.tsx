
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

function getPriceFontSize(formattedPrice: string): string {
  const length = formattedPrice.length;

  if (length > 10) return "text-xs sm:text-base";
  if (length > 7) return "text-sm sm:text-lg";
  if (length > 5) return "text-base sm:text-xl";
  return "text-lg sm:text-2xl";
}

function formatQuantity(
  minQty: number,
  maxQty: number | null | undefined,
  unit: string
): string {
  const normalizedUnit = unit.trim() || "piece";
  const pluralUnit = normalizedUnit.toLowerCase() === "set"
    ? "sets"
    : `${normalizedUnit}${normalizedUnit.toLowerCase().endsWith("s") ? "" : "s"}`;

  const quantity = maxQty
    ? `${minQty}–${maxQty}`
    : `≥${minQty}`;

  return `${quantity} ${minQty > 1 || (maxQty ?? 0) > 1 ? pluralUnit : normalizedUnit}`;
}

export default function ProductPricingSection({
  pricing,
  productSlug,
}: PricingSectionProps) {
  const {
    priceTiers,
    minPrice,
    maxPrice,
    samplePrice,
    isSampleAvailable,
    moq,
    unit,
  } = pricing;

  if (priceTiers.length === 0 && minPrice == null && maxPrice == null) {
    return null;
  }

  const hasTiers = priceTiers.length > 0;

  const singlePrice =
    minPrice !== null && maxPrice !== null && minPrice !== maxPrice
      ? null
      : minPrice ?? maxPrice;

  const priceRange =
    minPrice !== null && maxPrice !== null && minPrice !== maxPrice;

  return (
    <div className="space-y-3 bg-white px-3 py-2 sm:px-4">
      {/* Equal-width wholesale pricing */}
      <div
        className="grid w-full gap-2 rounded-2xl bg-[#F1F3F5] p-3 sm:gap-3 sm:p-4"
        style={{
          gridTemplateColumns: `repeat(${hasTiers ? priceTiers.length : 1}, minmax(0, 1fr))`,
        }}
      >
        {hasTiers ? (
          priceTiers.map((tier, index) => {
            const formattedPrice = tier.price.toLocaleString("en-IN");
            const fontSizeClass = getPriceFontSize(formattedPrice);

            return (
              <div
                key={`${tier.minQty}-${tier.maxQty ?? "plus"}-${index}`}
                className={`min-w-0 ${
                  index > 0 ? "border-l border-slate-300/80 pl-2 sm:pl-3" : ""
                }`}
              >
                <div className="flex min-w-0 items-baseline gap-0.5 whitespace-nowrap text-slate-900">
                  <span className="shrink-0 text-[11px] font-bold sm:text-sm">
                    ₹
                  </span>
                  <span
                    className={`${fontSizeClass} min-w-0 font-extrabold leading-tight tracking-tight`}
                  >
                    {formattedPrice}
                  </span>
                </div>

                <p className="mt-1 break-words text-[10px] leading-snug text-slate-500 sm:text-xs">
                  {formatQuantity(tier.minQty, tier.maxQty, unit)}
                </p>
              </div>
            );
          })
        ) : (
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-1 text-slate-900">
              <span className="text-xs font-bold sm:text-sm">₹</span>
              <span
                className={`${getPriceFontSize(
                  priceRange
                    ? `${minPrice!.toLocaleString("en-IN")}-${maxPrice!.toLocaleString("en-IN")}`
                    : (singlePrice ?? 0).toLocaleString("en-IN")
                )} font-extrabold leading-tight tracking-tight`}
              >
                {priceRange
                  ? `${minPrice!.toLocaleString("en-IN")}–₹${maxPrice!.toLocaleString("en-IN")}`
                  : (singlePrice ?? 0).toLocaleString("en-IN")}
              </span>
            </div>

            {moq > 0 && (
              <p className="mt-1 text-[10px] leading-snug text-slate-500 sm:text-xs">
                {formatQuantity(moq, null, unit)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sample availability */}
      {isSampleAvailable && samplePrice !== null && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#FFE8D1] bg-[#FFF9F2] p-3 shadow-2xs sm:p-3.5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FFE2C7] bg-[#FFF0E0] sm:h-10 sm:w-10">
              <Package className="h-5 w-5 text-[#FF5500]" />
            </div>

            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase leading-tight tracking-wider text-[#FF5500]">
                Sample available
              </span>
              <p className="mt-0.5 text-sm font-semibold text-[#334155]">
                ₹{samplePrice.toLocaleString("en-IN")}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  / sample
                </span>
              </p>
            </div>
          </div>

          <Link
            href={productSlug ? `/rfq?product=${encodeURIComponent(productSlug)}&type=sample` : "#"}
            aria-disabled={!productSlug}
            className="flex shrink-0 items-center gap-1 rounded-full bg-[#FF5500] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E04B00] active:scale-[0.98] sm:px-4"
          >
            <span>Request sample</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
