
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/marketplace";
import HomePageClient from "./HomePageClient";

export const revalidate = 60;



const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.theindiaorigin.com/#organization",
    "name": "The India Origin",
    "alternateName": [
      "The India Origin Marketplace",
      "theindiaorigin.com"
    ],
    "url": "https://www.theindiaorigin.com/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.theindiaorigin.com/_next/image?url=%2Fimages%2Findiaorigin-logo.png&w=640&q=75"
    },
    "description":
      "The India Origin is an Indian B2B manufacturing marketplace connecting manufacturers, suppliers and buyers across India and international markets.",
    "knowsAbout": [
      "Indian Manufacturing",
      "B2B Marketplace",
      "Indian Manufacturers",
      "Industrial Products",
      "Product Sourcing",
      "Manufacturing Suppliers"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.theindiaorigin.com/#website",
    "name": "The India Origin",
    "alternateName": "The India Origin Marketplace",
    "url": "https://www.theindiaorigin.com/",
    "publisher": {
      "@id": "https://www.theindiaorigin.com/#organization"
    }
  }
];



export default async function HomePage() {
  let initialProducts: Product[] = [];
  let initialHasMore = false;
  let initialError: string | null = null;

  try {
    const rows = await prisma.product.findMany({
      where: {
        isPublished: true,
      },
      take: 13,
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        images: true,
        minPrice: true,
        maxPrice: true,
        moq: true,
        unit: true,
        specifications: true,
        inStock: true,
        categoryId: true,
        manufacturerId: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        manufacturer: {
          select: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
            city: true,
            badge: true,
            logo: true,
            gstNumber: true,
            location: {
              select: {
                state: true,
              },
            },
            certificationsList: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    initialHasMore = rows.length > 12;

    initialProducts = rows.slice(0, 12).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      images: product.images,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      moq: product.moq,
      unit: product.unit,
      specifications:
        product.specifications &&
        typeof product.specifications === "object" &&
        !Array.isArray(product.specifications)
          ? (product.specifications as Record<string, string>)
          : undefined,
      inStock: product.inStock,
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),

      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },

      manufacturer: {
        id: product.manufacturer.id,
        name: product.manufacturer.name,
        slug: product.manufacturer.slug,
        isVerified: product.manufacturer.isVerified,
        city: product.manufacturer.city,
        badge: product.manufacturer.badge,
        logo: product.manufacturer.logo,
        gstNumber: product.manufacturer.gstNumber,
        certifications: product.manufacturer.certificationsList.map(
          (certification) => certification.name
        ),
        location: {
          state: product.manufacturer.location.state,
        },
      },
    }));
  } catch (error) {
    console.error("Homepage product query failed:", error);
    initialError = "Unable to load products. Please try again.";
  }


  return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />

    <HomePageClient
      initialProducts={initialProducts}
      initialHasMore={initialHasMore}
      initialError={initialError}
    />
  </>
);

  
}

