// src/app/manufacturers/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ManufacturerProfileClient from "./ManufacturerProfileClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    select: {
      name: true,
      city: true,
    },
  });

  if (!manufacturer) {
    return {
      title: "Manufacturer Not Found | The India Origin",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const location = manufacturer.city?.trim();
  const title = location
    ? `${manufacturer.name} Manufacturer in ${location}`
    : `${manufacturer.name} Manufacturer in India`;

  const description = location
    ? `Explore ${manufacturer.name}, a manufacturer based in ${location}, India. Discover its products and manufacturing capabilities on The India Origin.`
    : `Explore ${manufacturer.name}, its products and manufacturing capabilities on The India Origin.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.theindiaorigin.com/manufacturers/${slug}`,
    },
    openGraph: {
      type: "website",
      url: `https://www.theindiaorigin.com/manufacturers/${slug}`,
      title,
      description,
      siteName: "The India Origin",
    },
  };
}

export default async function ManufacturerPage({ params }: PageProps) {
  const { slug } = await params;

  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    include: {
      location: true,
      products: {
        where: { isPublished: true },
        include: {
          category: true,
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

  if (!manufacturer) notFound();

  // Remap reviews so 'user' maps to 'buyer' for frontend component compatibility
  const reviews = (manufacturer.reviews || []).map((r) => ({
    ...r,
    buyer: r.user,
  }));

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      : 0;

  // Aggregate media URLs from logo, bannerImage, and machineImages
  const mediaPhotos: string[] = [];
  if (manufacturer.bannerImage) mediaPhotos.push(manufacturer.bannerImage);
  if (manufacturer.logo) mediaPhotos.push(manufacturer.logo);
  if (manufacturer.machineImages && manufacturer.machineImages.length > 0) {
    mediaPhotos.push(...manufacturer.machineImages);
  }

  // Helper to format market entries safely from Json field
  const formatMarketItem = (item: any): string => {
    if (typeof item === "object" && item !== null) {
      const region = item.region || item.country || item.name || "";
      const pct = item.percentage != null ? ` (${item.percentage}%)` : "";
      return `${region}${pct}`.trim();
    }
    return String(item || "").trim();
  };

  // Safe parsing for mainMarkets JSON
  let mainMarketsList: string[] = [];
  if (Array.isArray(manufacturer.mainMarkets)) {
    mainMarketsList = manufacturer.mainMarkets.map(formatMarketItem).filter(Boolean);
  } else if (typeof manufacturer.mainMarkets === "string") {
    try {
      const parsed = JSON.parse(manufacturer.mainMarkets);
      if (Array.isArray(parsed)) {
        mainMarketsList = parsed.map(formatMarketItem).filter(Boolean);
      } else if (typeof parsed === "object" && parsed !== null) {
        mainMarketsList = [formatMarketItem(parsed)];
      }
    } catch {
      if (manufacturer.mainMarkets) mainMarketsList = [manufacturer.mainMarkets];
    }
  }

  return (
    <ManufacturerProfileClient
      manufacturer={{
        ...manufacturer,
        reviews,
        mainMarketsList,
        mediaPhotos,
        reviewStats: {
          reviewCount,
          avgRating,
          avgService: avgRating,
          avgShipping: avgRating,
          avgQuality: avgRating,
        },
      }}
    />
  );
}