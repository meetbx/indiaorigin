

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { 
  ChevronLeft, Search, ShoppingCart, MoreHorizontal, 
  ChevronRight, Star, ShieldCheck, CheckCircle, Package, Store, Share2, SlidersHorizontal, Phone ,Send
} from "lucide-react";
import Image from "next/image";
import ShareButton from "@/components/product-detail/ShareButton";

import ChatButton from "@/components/product-detail/ChatButton";
import BadgeDisplay from "@/components/marketplace/BadgeDisplay"; 
import { normalizeProductData } from "@/lib/product-normalizer";
import ProductMediaGallery from "@/components/product-detail/ProductMediaGallery";
import ProductPricingSection from "@/components/product-detail/ProductPricingSection";
import SupplierOverviewSection from "@/components/product-detail/SupplierOverviewSection";
import SupplierMarketsSection from "@/components/product-detail/SupplierMarketsSection";
import KeyAttributesSection from "@/components/product-detail/KeyAttributesSection";
import { ProductDetailsRenderer } from "@/components/product-detail/ProductDetailsRenderer";
import ProductHeaderMenu from "@/components/product-detail/ProductHeaderMenu";

import RecommendationsSection from "@/components/product-detail/RecommendationsSection";


interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} - BharatTrade`,
    description: product.description ?? `Buy ${product.name} on BharatTrade.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Database Query
  const rawProduct = await prisma.product.findUnique({
    where: { slug },
    include: {
      manufacturer: { include: { location: true } },
      category: true,
    },
  });

  if (!rawProduct) notFound();

  // Fetch similar products dynamically
  const rawSimilar = await prisma.product.findMany({
    where: {
      categoryId: rawProduct.categoryId,
      NOT: { id: rawProduct.id },
    },
    take: 6,
  });

  // 2. Data Normalization
  const data = normalizeProductData(rawProduct, rawSimilar);
  const productBlocks = Array.isArray(data.details) ? data.details : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 max-w-md mx-auto shadow-2xl border-x border-slate-200/60 font-sans">
      
      {/* HEADER */}

      <header className="bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 gap-3 w-full shadow-2xs">
        {/* Left: Back Button & Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-800 hover:text-[#FF5500] transition-colors">
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </Link>

          <Link href="/" className="text-base font-bold tracking-tight text-slate-800 flex items-center">
            <span>India</span>
            <span className="text-[#FF5500]">Origin.in</span>
          </Link>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-4 text-slate-700">
          {/* Search Icon */}
          <Link href="/search" aria-label="Search" className="hover:text-slate-900 transition-colors">
            <Search className="w-5 h-5 stroke-[1.8]" />
          </Link>

          {/* Cart Icon with Notification Badge */}

          {/* More Options */}
<ProductHeaderMenu 
  productId={rawProduct.id} 
  productTitle={data.name} 
  productSlug={data.slug} 
/>
        </div>
      </header>

      {/* SECTION 1: MEDIA GALLERY */}
<ProductMediaGallery 
  productId={rawProduct.id}
  images={data.images} 
  videoUrl={data.videoUrl} 
  productName={data.name} 
  badge={rawProduct.manufacturer?.badge} 
/>
      <main className="space-y-3 pt-2">
        
        {/* SECTION 2: BASIC INFO & TITLE */}
        <div className="bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-sm font-semibold text-slate-900 leading-snug tracking-tight">
              {data.name}
            </h1>
<ShareButton title={data.name} />
          </div>
          
          {/* Rating, Sold Row & Manufacturer Badge */}
          <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500 font-medium flex-wrap">
            <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
              <span className="font-bold text-slate-800">{data.stats.rating || "1.0"}</span>
              <span className="text-slate-400 ml-0.5">({data.stats.reviewCount || "1"})</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-medium">{data.stats.totalSold || "200+"} sold</span>
            
          
          </div>
        </div>

        {/* SECTION 3: PRICING & TIERS */}
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <ProductPricingSection pricing={data.pricing}  productSlug={data.slug}/>
        </div>

        {/* SECTION 4: CUSTOMIZATION BADGE */}
        {data.customizationOptions?.length > 0 && (
          <div className="bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all">
              <div className="flex items-center gap-2.5 text-xs text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-50 text-600 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Customization:</span>{" "}
                  <span className="font-normal text-slate-600">{data.customizationOptions.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: ORDER PROTECTION */}
        {data.protectionEligible && (
          <div className="bg-white p-4 cursor-pointer hover:bg-slate-50/50 transition shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="text-orange-600 font-extrabold">IndiaOrigin.com</span> order protection
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Protected payments and guaranteed dispatch terms
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">Refund policy</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: KEY SPECIFICATIONS */}
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <KeyAttributesSection specifications={data.specifications} />
        </div>

        {/* SECTION 8: SUPPLIER OVERVIEW */}
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <SupplierOverviewSection supplier={data.supplier} />
        </div>

        {/* SECTION 9: MAIN MARKETS */}
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <SupplierMarketsSection markets={data.supplier.mainMarkets} />
        </div>

        {/* SECTION 10: RECOMMENDATIONS (SIMILAR PRODUCTS & ALTERNATIVE MANUFACTURERS) */}
        <RecommendationsSection productId={rawProduct.id} slug={data.slug} />

        {/* SECTION 11: DETAILED A+ PRODUCT BLOCKS */}
        {productBlocks.length > 0 && (
          <div className="bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider">Product details</h3>
            <ProductDetailsRenderer blocks={productBlocks} />
          </div>
        )}

      </main>


{/* FLOATING ACTION BAR */}
{/* FLOATING ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto action-bar-glass px-4 py-3.5 flex items-center gap-3 z-50">
        {/* Chat Button */}
        <div className="flex-1">
          <ChatButton productSlug={data.slug} />
        </div>
        
        {/* Call Now Button (Direct Mobile Dialer) */}
        {rawProduct.manufacturer?.phone ? (
          <a
            href={`tel:${rawProduct.manufacturer.phone}`}
            className="btn-inquiry-target flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <Phone className="w-4 h-4 stroke-[2]" />
            <span>Call Now</span>
          </a>
        ) : (
          <div className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-xs font-medium bg-gray-200 text-gray-400 cursor-not-allowed">
            <span>No Phone Available</span>
          </div>
        )}
      </div>

    </div>
  );
}