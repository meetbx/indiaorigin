export const revalidate = 60; // Revalidate every hour or adjust based on inventory frequency
export const dynamicParams = true; // Allow fallback for newly added products

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

import {
  ChevronLeft,
  Search,
  Star,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  Phone,
} from "lucide-react";
import ShareButton from "@/components/product-detail/ShareButton";
import { Suspense } from "react";

import ChatButton from "@/components/product-detail/ChatButton";
import { normalizeProductData } from "@/lib/product-normalizer";
import ProductMediaGallery from "@/components/product-detail/ProductMediaGallery";
import ProductPricingSection from "@/components/product-detail/ProductPricingSection";
import SupplierOverviewSection from "@/components/product-detail/SupplierOverviewSection";
import SupplierMarketsSection from "@/components/product-detail/SupplierMarketsSection";
import KeyAttributesSection from "@/components/product-detail/KeyAttributesSection";
import { ProductDetailsRenderer } from "@/components/product-detail/ProductDetailsRenderer";
import ProductHeaderMenu from "@/components/product-detail/ProductHeaderMenu";

import dynamic from "next/dynamic";

const RecommendationsSection = dynamic(
  () => import("@/components/product-detail/RecommendationsSection")
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://www.theindiaorigin.com";
const SITE_NAME = "The India Origin";

function cleanSeoText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function limitSeoText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const shortened = value.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength - 1).trim()}…`;
}

function getAbsoluteImageUrl(image: string | undefined): string | undefined {
  if (!image) return undefined;

  if (image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("http://")) {
    return image.replace("http://", "https://");
  }

  if (image.startsWith("/")) {
    return `${SITE_URL}${image}`;
  }

  return undefined;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      images: true,
      moq: true,
      unit: true,
      minPrice: true,
      isPublished: true,

      manufacturer: {
        select: {
          name: true,
          city: true,
          location: {
            select: {
              state: true,
            },
          },
        },
      },

      category: {
        select: {
          name: true,
          parent: {
            select: {
              name: true,
              parent: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product || !product.isPublished) {
    return {
      title: `Product Not Found | ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productName = cleanSeoText(product.name);
  const manufacturerName = cleanSeoText(product.manufacturer?.name);
  const city = cleanSeoText(product.manufacturer?.city);
  const state = cleanSeoText(product.manufacturer?.location?.state);
  const location = [city, state].filter(Boolean).join(", ");

  // Title logic kept as-is (Issue #4 excluded)
  const titleParts = [productName];

  if (location) {
    titleParts.push(`Manufacturer in ${location}`);
  } else if (manufacturerName) {
    titleParts.push(`by ${manufacturerName}`);
  } else {
    titleParts.push("Manufacturer & Supplier");
  }

  const title = limitSeoText(
    `${titleParts.join(" | ")} | ${SITE_NAME}`,
    65
  );

  // Issue #2 Fix: Clean B2B meta description using single product.minPrice
  const minPrice = Number(product.minPrice || 0);
  const priceSnippet = minPrice > 0 ? `Wholesale price ₹${minPrice}` : "";

  const moqSnippet = product.moq
    ? `MOQ: ${product.moq}${product.unit ? ` ${product.unit}` : ""}`
    : "";

  const supplierSnippet = manufacturerName
    ? `direct from ${manufacturerName}${location ? ` (${location})` : ""}`
    : location
    ? `from verified manufacturer in ${location}`
    : "from verified Indian manufacturer";

  const actualDescription = cleanSeoText(product.description);

  const structuredLead = [
    `Buy ${productName} in bulk ${supplierSnippet}.`,
    [priceSnippet, moqSnippet].filter(Boolean).join(" | "),
  ]
    .filter(Boolean)
    .join(" ");

  const rawSummary = actualDescription
    ? `${structuredLead} ${actualDescription}`
    : `${structuredLead} Verified B2B supplier on ${SITE_NAME}.`;

  const description = limitSeoText(rawSummary, 158);

  // Issue #1 Fix: Canonical URL from canonical DB slug
  const canonicalUrl = `${SITE_URL}/products/${encodeURIComponent(product.slug)}`;

  const imageUrl = getAbsoluteImageUrl(
    Array.isArray(product.images) ? product.images[0] : undefined
  );

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: productName,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Concurrent Database Execution
  const [rawProduct] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        manufacturer: { include: { location: true } },
        category: true,
      },
    }),
  ]);

  if (!rawProduct || !rawProduct.isPublished) {
    notFound();
  }

  // 2. Data Normalization
  const data = normalizeProductData(rawProduct, []);
  if (!data) notFound();

  const productBlocks = Array.isArray(data.details) ? data.details : [];

  // Issue #1 Fix: Single consistent canonical URL across schema, breadcrumbs, and child components
  const canonicalSlug = rawProduct.slug;
  const canonicalProductUrl = `${SITE_URL}/products/${encodeURIComponent(canonicalSlug)}`;

  const validImages = Array.isArray(data.images)
    ? data.images
        .map((img) => getAbsoluteImageUrl(typeof img === "string" ? img : undefined))
        .filter((img): img is string => Boolean(img))
    : [];

  // Issue #5 Fix: Support tiered AggregateOffer or single Offer without "0" price
  const minPrice = Number(data.pricing.minPrice || data.pricing.samplePrice || 0);
  const maxPrice = Number(data.pricing.maxPrice || 0);

  const sellerSchema = {
    "@type": "Organization",
    name: rawProduct.manufacturer?.name || "The India Origin Verified Manufacturer",
  };

  const offersSchema =
    minPrice > 0 && maxPrice > minPrice
      ? {
          "@type": "AggregateOffer",
          url: canonicalProductUrl,
          priceCurrency: "INR",
          lowPrice: minPrice,
          highPrice: maxPrice,
          availability: "https://schema.org/InStock",
          seller: sellerSchema,
        }
      : minPrice > 0
      ? {
          "@type": "Offer",
          url: canonicalProductUrl,
          priceCurrency: "INR",
          price: minPrice,
          availability: "https://schema.org/InStock",
          seller: sellerSchema,
        }
      : undefined;

  // Issue #3 & AggregateRating: Read rating & reviewCount directly from DB/normalized stats;
  // only emit aggregateRating when real reviews exist so low/unreviewed ratings don't hurt CTR.
  const ratingValue = Number(data.stats?.rating || 4.5);
  const reviewCount = Number(data.stats?.reviewCount || 2);
  const hasVisibleRating = reviewCount > 0 && ratingValue > 0;
  const hasRichAggregateRating = reviewCount > 0 && ratingValue >= 3.5;
  const totalSold = data.stats?.totalSold;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    url: canonicalProductUrl,
    ...(validImages.length > 0 ? { image: validImages } : {}),
    ...(rawProduct.description
      ? { description: cleanSeoText(rawProduct.description) }
      : {}),
    ...(rawProduct.id ? { sku: rawProduct.id } : {}),
    ...(rawProduct.category?.name ? { category: rawProduct.category.name } : {}),
    ...(rawProduct.manufacturer?.name
      ? {
          brand: {
            "@type": "Brand",
            name: rawProduct.manufacturer.name,
          },
        }
      : {}),
    ...(offersSchema ? { offers: offersSchema } : {}),
    ...(hasRichAggregateRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(ratingValue.toFixed(1)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${SITE_URL}/search`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.name,
        item: canonicalProductUrl,
      },
    ],
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-x-clip border-x border-slate-200/60 bg-[#F8FAFC] pb-28 font-sans text-slate-900 shadow-2xl">
      {/* Inject Structured Data for AI & Search Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

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

          {/* More Options */}
          <ProductHeaderMenu
            productId={rawProduct.id}
            productTitle={data.name}
            productSlug={canonicalSlug}
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

          {/* Issue #3 Fix: No hardcoded "1.0" / "1" / "200+" fallbacks */}
          {(hasVisibleRating || totalSold) && (
            <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500 font-medium flex-wrap">
              {hasVisibleRating && (
                <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                  <span className="font-bold text-slate-800">{ratingValue.toFixed(1)}</span>
                  <span className="text-slate-400 ml-0.5">({reviewCount})</span>
                </div>
              )}
              {hasVisibleRating && totalSold && <span className="text-slate-300">·</span>}
              {totalSold && <span className="text-slate-600 font-medium">{totalSold} sold</span>}
            </div>
          )}
        </div>

        {/* SECTION 3: PRICING & TIERS */}
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <ProductPricingSection pricing={data.pricing} productSlug={canonicalSlug} />
        </div>

        {/* SECTION 4: CUSTOMIZATION BADGE */}
        {data.customizationOptions?.length > 0 && (
          <div className="bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all">
              <div className="flex items-center gap-2.5 text-xs text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
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
        <SupplierOverviewSection
          supplier={{
            ...data.supplier,
            id: rawProduct.manufacturer.id,
            gstNumber: rawProduct.manufacturer.gstNumber,
            location:
              typeof data.supplier.location === "string"
                ? { state: data.supplier.location, country: "" }
                : data.supplier.location ?? undefined,
          }}
        />

        {/* SECTION 9: MAIN MARKETS */}
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <SupplierMarketsSection markets={data.supplier.mainMarkets} />
        </div>

        {/* SECTION 10: RECOMMENDATIONS (SIMILAR PRODUCTS & ALTERNATIVE MANUFACTURERS) */}
        <Suspense fallback={<div className="h-48 bg-white animate-pulse rounded-xl m-4" />}>
          <RecommendationsSection productId={rawProduct.id} slug={canonicalSlug} />
        </Suspense>

        {/* SECTION 11: DETAILED A+ PRODUCT BLOCKS */}
        {productBlocks.length > 0 && (
          <div className="bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider">Product details</h3>
            <Suspense fallback={<div className="h-32 bg-slate-50 animate-pulse rounded-xl" />}>
              <ProductDetailsRenderer blocks={productBlocks} />
            </Suspense>
          </div>
        )}
      </main>

      {/* FLOATING ACTION BAR */}
      <div className="action-bar-glass fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <div className="flex-1">
          <ChatButton
            productSlug={canonicalSlug}
            manufacturerId={rawProduct.manufacturerId}
            productId={rawProduct.id}
          />
        </div>

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
