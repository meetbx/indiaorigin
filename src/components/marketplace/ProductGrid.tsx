"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MapPin, PackageX, RefreshCw, Gem, Sparkles } from "lucide-react";
import { Product } from "@/types/marketplace";
import { useRouter } from "next/navigation";

/** Add stable Cloudinary delivery transforms for marketplace thumbnails.
 * Original URLs remain unchanged for non-Cloudinary images and URLs that are not
 * standard Cloudinary image-upload URLs. Next/Image still handles responsive delivery.
 */
function getMarketplaceImageUrl(url: string, width: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  const marker = "/image/upload/";
  const markerIndex = url.indexOf(marker);
  const afterUpload = url.slice(markerIndex + marker.length);
  // Avoid duplicating transformations if this URL already contains a Cloudinary transform.
  if (/^(?:[^/]*,)*(?:f_auto|q_auto|w_\d+|c_limit)(?:,|\/)/.test(afterUpload)) return url;
  return `${url.slice(0, markerIndex + marker.length)}f_auto,q_auto,w_${width},c_limit/${afterUpload}`;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onClearFilters: () => void;
}

export const ProductCard: React.FC<{
  product: Product;
  preload?: boolean;
}> = ({ product, preload = false }) => {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  const productHref = `/products/${product.slug || product.id}`;
  const originalImage = product.images?.[0] || "/placeholder-product.png";
  const primaryImage = getMarketplaceImageUrl(originalImage, 640);
  const prefetchProduct = () => router.prefetch(productHref);

  const formattedMinPrice = product.minPrice > 0 ? `₹${product.minPrice.toLocaleString("en-IN")}` : null;
  const formattedMaxPrice = product.maxPrice > 0 ? `₹${product.maxPrice.toLocaleString("en-IN")}` : null;

  const badge = product.manufacturer?.badge;

  // Render exact glassmorphism tier badge with matching icon & color
 
  // Premium glassmorphism manufacturer badge

const renderBadge = () => {

if (badge === "DIAMOND") {
  return (
    <div className="absolute top-3 left-3 badge-diamond backdrop-blur-xl text-white text-[9px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/30 tracking-widest uppercase shadow-[0_2px_10px_rgba(34,211,238,0.25)]">
      <Gem className="w-3 h-3 stroke-[2.5]" />
      <span>DIAMOND</span>
    </div>
  );
}
if (badge === "GOLD") {
      return (
        <div className="absolute top-3 left-3 badge-gold backdrop-blur-md text-white text-[9px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/40 tracking-widest uppercase">
          <Sparkles className="w-3 h-3 stroke-[2.5]" />
          <span>GOLD</span>
        </div>
      );
    }
    if (badge === "SILVER") {
      return (
        <div className="absolute top-3 left-3 badge-silver backdrop-blur-md text-white text-[9px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/40 tracking-widest uppercase">
          <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
          <span>SILVER</span>
        </div>
      );
    }
    if (product.manufacturer?.isVerified) {
      return (
        <div className="absolute top-3 left-3 badge-verified backdrop-blur-md text-white text-[9px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/40 tracking-widest uppercase">
          <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
          <span>Verified</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
      <Link
        href={productHref}
        prefetch={true}
        onMouseEnter={prefetchProduct}
        onFocus={prefetchProduct}
        className="block flex-1"
      >
        {/* Product Image Container */}
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
          {!imgError ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              preload={preload}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
              <PackageX className="w-8 h-8 mb-1 stroke-1" />
              <span className="text-[11px]">No Image available</span>
            </div>
          )}

          {/* Dynamic Manufacturer Badge Overlay */}
          {renderBadge()}
        </div>

        {/* Product Meta */}
        <div className="p-3.5 space-y-2">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors leading-tight">
            {product.name}
          </h3>

          <div>
            <div className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {formattedMinPrice && formattedMaxPrice && formattedMinPrice !== formattedMaxPrice ? (
                `${formattedMinPrice} - ${formattedMaxPrice}`
              ) : formattedMinPrice ? (
                formattedMinPrice
              ) : (
                <span className="text-xs text-orange-600 font-medium">Contact for Price</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              MOQ: {product.moq} {product.unit || "Piece"}
            </div>
          </div>
        </div>
      </Link>

      {/* Location-Only Footer (Manufacturer Name Removed) */}
      {(product.manufacturer?.city || product.manufacturer?.location?.state) && (
        <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 mt-auto bg-slate-50/50">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="line-clamp-1">
              {product.manufacturer?.city}
              {product.manufacturer?.location?.state ? `, ${product.manufacturer.location.state}` : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden animate-pulse shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
    <div className="aspect-square bg-slate-200 w-full" />
    <div className="p-3.5 space-y-2">
      <div className="h-3.5 bg-slate-200 rounded w-5/6" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-2/3 pt-2" />
    </div>
    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100">
      <div className="h-2.5 bg-slate-200 rounded w-1/2" />
    </div>
  </div>
);

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onClearFilters,
}) => {
  if (error) {
    return (
      <div className="py-16 text-center max-w-md mx-auto px-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <PackageX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Unable to load products</h3>
        <p className="text-xs text-slate-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* 2-Column Mobile | 3-Column Tablet | 4-Column Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
{products.map((product, index) => (
  <ProductCard
    key={product.id}
    product={product}
    preload={index === 0}
  />
))}

        {isLoading &&
          Array.from({ length: 8 }).map((_, idx) => (
            <ProductSkeleton key={`skeleton-${idx}`} />
          ))}
      </div>

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="py-16 text-center max-w-sm mx-auto">
          <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No products found</h3>
          <p className="text-xs text-slate-500 mb-4">
            Try adjusting your search query or clearing selected categories.
          </p>
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Clear Search & Filters
          </button>
        </div>
      )}

      {/* Pagination Load More */}
      {!isLoading && hasMore && products.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
};