'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Building2, PackageX, Gem, Sparkles } from 'lucide-react';

interface ManufacturerSummary {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
  badge: 'DIAMOND' | 'GOLD' | 'SILVER' | 'NONE';
  city: string;
}

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  moq: number;
  unit: string;
  isPublished: boolean;
  manufacturer: ManufacturerSummary | null;
  score: number;
  reasons: string[];
}

interface RecommendationsProps {
  productId?: string;
  slug: string;
}

export default function RecommendationsSection({ productId, slug }: RecommendationsProps) {
  const [similarProducts, setSimilarProducts] = useState<RecommendedProduct[]>([]);
  const [altManufacturers, setAltManufacturers] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const identifierParam = productId ? `productId=${productId}` : `slug=${slug}`;

    async function fetchRecommendations() {
      try {
        setLoading(true);

        const [similarRes, mfgRes] = await Promise.allSettled([
          fetch(`/api/recommendations/similar?${identifierParam}&limit=4`, { signal: controller.signal }),
          fetch(`/api/recommendations/manufacturers?${identifierParam}&limit=4`, { signal: controller.signal }),
        ]);

        let fetchedSimilar: RecommendedProduct[] = [];
        let fetchedAlt: RecommendedProduct[] = [];

        if (similarRes.status === 'fulfilled' && similarRes.value.ok) {
          const data = await similarRes.value.json();
          if (data.success && Array.isArray(data.recommendations)) {
            fetchedSimilar = data.recommendations;
          }
        }

        if (mfgRes.status === 'fulfilled' && mfgRes.value.ok) {
          const data = await mfgRes.value.json();
          if (data.success && Array.isArray(data.recommendations)) {
            fetchedAlt = data.recommendations;
          }
        }

        if (isMounted) {
          setSimilarProducts(fetchedSimilar);
          
          // Deduplication: Filter out any product from alternative manufacturers 
          // that is already present in the similar products list to prevent repetition.
          const similarIds = new Set(fetchedSimilar.map((p) => p.id));
          const uniqueAlt = fetchedAlt.filter((p) => !similarIds.has(p.id));
          setAltManufacturers(uniqueAlt);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching recommendations:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug || productId) {
      fetchRecommendations();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [productId, slug]);

  if (!loading && similarProducts.length === 0 && altManufacturers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 bg-white">
      {/* 1. Similar Products Section */}
      {(loading || similarProducts.length > 0) && (
        <div className="p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Similar products</h3>
          </div>

          {loading ? (
            <RecommendationSkeletonGrid />
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {similarProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Alternative Manufacturers Section */}
      {(loading || altManufacturers.length > 0) && (
        <div className="p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-slate-100 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Explore Alternative Manufacturers</h3>
          </div>

          {loading ? (
            <RecommendationSkeletonGrid />
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {altManufacturers.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: RecommendedProduct }) {
  const [imgError, setImgError] = useState(false);
  const primaryImage = product.images?.[0] || '/placeholder-product.png';

  const validMin = typeof product.minPrice === 'number' && Number.isFinite(product.minPrice) && product.minPrice > 0;
  const validMax = typeof product.maxPrice === 'number' && Number.isFinite(product.maxPrice) && product.maxPrice > product.minPrice;

  const formattedMinPrice = validMin ? `₹${product.minPrice.toLocaleString('en-IN')}` : null;
  const formattedMaxPrice = validMax ? `₹${product.maxPrice.toLocaleString('en-IN')}` : null;
  const badge = product.manufacturer?.badge;

  const renderBadge = () => {
    if (badge === 'DIAMOND') {
      return (
        <div className="absolute top-2 left-2 badge-diamond backdrop-blur-xl text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/30 uppercase shadow-xs">
          <Gem className="w-2.5 h-2.5" />
          <span>DIAMOND</span>
        </div>
      );
    }
    if (badge === 'GOLD') {
      return (
        <div className="absolute top-2 left-2 badge-gold backdrop-blur-md text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/40 uppercase">
          <Sparkles className="w-2.5 h-2.5" />
          <span>GOLD</span>
        </div>
      );
    }
    if (badge === 'SILVER') {
      return (
        <div className="absolute top-2 left-2 badge-silver backdrop-blur-md text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/40 uppercase">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>SILVER</span>
        </div>
      );
    }
    if (product.manufacturer?.isVerified) {
      return (
        <div className="absolute top-2 left-2 badge-verified backdrop-blur-md text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/40 uppercase">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Verified</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Link href={`/products/${product.slug}`} className="flex-shrink-0 w-32 group flex flex-col justify-between">
      <div>
        <div className="w-32 h-32 bg-slate-100 rounded-xl mb-2 relative overflow-hidden flex items-center justify-center border border-slate-200/60">
          {!imgError ? (
            <Image
              src={primaryImage}
              alt={product.name || 'Product'}
              fill
              sizes="128px"
              className="object-cover group-hover:scale-105 transition duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
              <PackageX className="w-6 h-6 mb-1 stroke-1" />
              <span className="text-[10px]">No Image</span>
            </div>
          )}
          {renderBadge()}
        </div>
        
        {/* Product Title / Small Description */}
        <h4 className="text-[11px] font-medium text-slate-800 line-clamp-2 leading-tight mb-1 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h4>
      </div>

      <div>
        <p className="text-sm font-extrabold text-slate-900">
          {formattedMinPrice && formattedMaxPrice
            ? `${formattedMinPrice} - ${formattedMaxPrice}`
            : formattedMinPrice || 'Contact for Price'}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
          {product.moq} {product.unit || 'Piece'} (MOQ)
        </p>
        {product.manufacturer?.name && (
          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{product.manufacturer.name}</p>
        )}
      </div>
    </Link>
  );
}

function RecommendationSkeletonGrid() {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex-shrink-0 w-32 animate-pulse">
          <div className="w-32 h-32 bg-slate-200 rounded-xl mb-2" />
          <div className="h-3 bg-slate-200 rounded w-full mb-1" />
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-1" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}