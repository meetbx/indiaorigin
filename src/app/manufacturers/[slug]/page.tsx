
// src/app/manufacturers/[slug]/page.tsx

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ManufacturerProfileClient from "./ManufacturerProfileClient";

const SITE_URL = "https://www.theindiaorigin.com";
const SITE_NAME = "The India Origin";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Deduplicate the manufacturer query within the same request.
const getManufacturer = cache(async (slug: string) => {
  return prisma.manufacturer.findUnique({
    where: { slug },
    include: {
      location: true,
      products: {
        where: { isPublished: true },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      certificationsList: {
        where: { isVerified: true },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
});

function cleanText(value: string | null | undefined, maxLength = 160) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ======================================================
// 1. DYNAMIC SEO METADATA
// ======================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const manufacturer = await getManufacturer(slug);

  if (!manufacturer) {
    return {
      title: "Manufacturer Not Found | The India Origin",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const name = cleanText(manufacturer.name, 100);
  const city = cleanText(manufacturer.city, 60);
  const state = cleanText(manufacturer.location?.state, 60);

  const location = [city, state].filter(Boolean).join(", ");
const descriptionText = cleanText(
  manufacturer.description,
  160
);

const title = location
  ? `${name} - Manufacturer in ${location} | The India Origin`
  : `${name} - Manufacturer in India | The India Origin`;

const description = descriptionText
  ? descriptionText
  : `Explore ${name}, its products, manufacturing capabilities and company information${location ? ` in ${location}` : " in India"}. Connect directly with the manufacturer on The India Origin.`.slice(0, 160);

const canonicalUrl = `${SITE_URL}/manufacturers/${slug}`;

  const image =
    manufacturer.bannerImage ||
    manufacturer.logo ||
    undefined;

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      ...(image ? {
        images: [
          {
            url: image,
            alt: `${name} manufacturer profile`,
          },
        ],
      } : {}),
    },

    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
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
  };
}

// ======================================================
// 2. MANUFACTURER PROFILE PAGE
// ======================================================

export default async function ManufacturerPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const manufacturer = await getManufacturer(slug);

  if (!manufacturer) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/manufacturers/${manufacturer.slug}`;

  // Map database review user to frontend buyer property.
  const reviews = (manufacturer.reviews || []).map((review) => ({
    ...review,
    buyer: review.user,
  }));

  const reviewCount = reviews.length;

  const avgRating =
    reviewCount > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviewCount
      : 0;

  // Factory and company images.
  const mediaPhotos = [
    manufacturer.bannerImage,
    manufacturer.logo,
    ...(manufacturer.machineImages || []),
  ].filter((url): url is string => Boolean(url));

  // Safely format mainMarkets JSON.
  const formatMarketItem = (item: unknown): string => {
    if (typeof item === "object" && item !== null) {
      const value = item as Record<string, unknown>;

      const region =
        value.region ||
        value.country ||
        value.name ||
        "";

      const percentage =
        value.percentage != null
          ? ` (${value.percentage}%)`
          : "";

      return `${String(region)}${percentage}`.trim();
    }

    return String(item || "").trim();
  };

  let mainMarketsList: string[] = [];

  if (Array.isArray(manufacturer.mainMarkets)) {
    mainMarketsList = manufacturer.mainMarkets
      .map(formatMarketItem)
      .filter(Boolean);
  } else if (typeof manufacturer.mainMarkets === "string") {
    try {
      const parsed = JSON.parse(manufacturer.mainMarkets);

      if (Array.isArray(parsed)) {
        mainMarketsList = parsed
          .map(formatMarketItem)
          .filter(Boolean);
      } else if (parsed && typeof parsed === "object") {
        mainMarketsList = [formatMarketItem(parsed)];
      }
    } catch {
      mainMarketsList = manufacturer.mainMarkets
        ? [manufacturer.mainMarkets]
        : [];
    }
  }

// ======================================================
  // 3. ORGANIZATION STRUCTURED DATA
  // ======================================================

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",

    "@id": `${canonicalUrl}#organization`,

    name: manufacturer.name,
    url: canonicalUrl,

    ...(manufacturer.description
      ? { description: cleanText(manufacturer.description, 500) }
      : {}),

    ...(manufacturer.logo
      ? { logo: manufacturer.logo }
      : {}),

    ...(manufacturer.bannerImage
      ? { image: manufacturer.bannerImage }
      : {}),

    ...(manufacturer.yearEstablished
      ? {
          foundingDate: `${manufacturer.yearEstablished}`,
        }
      : {}),

    ...(manufacturer.phone
      ? { telephone: manufacturer.phone }
      : {}),

    address: {
      "@type": "PostalAddress",
      streetAddress: manufacturer.addressLine,
      addressLocality: manufacturer.city,
      addressRegion: manufacturer.location?.state || "",
      postalCode: manufacturer.pincode,
      addressCountry: "IN",
    },

    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount: reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 5).map((rev) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: rev.buyer?.name || "Verified Buyer",
            },
            datePublished: new Date(rev.createdAt).toISOString().split("T")[0],
            reviewRating: {
              "@type": "Rating",
              ratingValue: rev.rating,
              bestRating: 5,
              worstRating: 1,
            },
            ...(rev.comment
              ? { reviewBody: cleanText(rev.comment, 300) }
              : {}),
          })),
        }
      : {}),

    ...(manufacturer.certificationsList.length > 0
      ? {
          hasCredential: manufacturer.certificationsList.map(
            (cert) => ({
              "@type": "EducationalOccupationalCredential",
              name: cert.name,
              credentialCategory: "Certification",
              ...(cert.issuedBy
                ? {
                    recognizedBy: {
                      "@type": "Organization",
                      name: cert.issuedBy,
                    },
                  }
                : {}),
            })
          ),
        }
      : {}),
  };

  // ======================================================
  // 4. BREADCRUMB STRUCTURED DATA
  // ======================================================

  const breadcrumbSchema = {
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
        name: "Manufacturers",
        item: `${SITE_URL}/manufacturers`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: manufacturer.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(organizationSchema),
        }}
      />

      {/* JSON-LD: Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbSchema),
        }}
      />

      {/* Visible breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-6xl mx-auto px-4 py-3 text-xs text-gray-500"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-orange-600">
              Home
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li>
            <Link
              href="/manufacturers"
              className="hover:text-orange-600"
            >
              Manufacturers
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li
            aria-current="page"
            className="font-semibold text-gray-900"
          >
            {manufacturer.name}
          </li>
        </ol>
      </nav>

      {/* Manufacturer profile */}
      <ManufacturerProfileClient
        manufacturer={{
          ...manufacturer,
          reviews,
          mainMarketsList,
          mediaPhotos,

          reviewStats: {
            reviewCount,
            avgRating,

            // Do not invent separate service/shipping/quality
            // ratings from the overall rating.
            avgService: 0,
            avgShipping: 0,
            avgQuality: 0,
          },
        }}
      />
    </>
  );
}
