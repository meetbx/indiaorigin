
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Generate the sitemap at runtime rather than requiring database
// queries during the production build.
export const dynamic = "force-dynamic";

const BASE_URL = "https://www.theindiaorigin.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, manufacturers, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),

    prisma.manufacturer.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    }),

    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        parentId: true,
        updatedAt: true,
      },
    }),
  ]);

  // Build hierarchical category paths using parentId.
  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  );

  function getCategoryPath(categoryId: string): string {
    const parts: string[] = [];
    const visited = new Set<string>();
    let current = categoryById.get(categoryId);

    while (current) {
      // Prevent an accidental hierarchy cycle from causing an infinite loop.
      if (visited.has(current.id)) {
        break;
      }

      visited.add(current.id);
      parts.unshift(current.slug);

      current = current.parentId
        ? categoryById.get(current.parentId)
        : undefined;
    }

    return parts.join("/");
  }

  const homepage: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const manufacturerUrls: MetadataRoute.Sitemap = manufacturers.map(
    (manufacturer) => ({
      url: `${BASE_URL}/manufacturers/${manufacturer.slug}`,
      lastModified: manufacturer.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    })
  );

  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/category/${getCategoryPath(category.id)}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...homepage,
    ...categoryUrls,
    ...productUrls,
    ...manufacturerUrls,
  ];
}
