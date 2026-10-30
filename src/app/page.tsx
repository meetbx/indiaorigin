
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/marketplace";
import HomePageClient from "./HomePageClient";

export const revalidate = 60;

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
    <HomePageClient
      initialProducts={initialProducts}
      initialHasMore={initialHasMore}
      initialError={initialError}
    />
  );
}
