
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryClient from "./CategoryClient";

const SITE_URL = "https://www.theindiaorigin.com";
const PAGE_SIZE = 12;

// Keep category pages eligible for ISR. Newly published products may take
// up to five minutes to appear in an already generated category page.
export const revalidate = 300;

type RouteParams = {
  slug: string[];
};

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

async function getCategoryHierarchy(slugSegments: string[]) {
  if (!slugSegments.length || slugSegments.some((slug) => !slug.trim())) {
    return null;
  }

  const finalSlug = slugSegments[slugSegments.length - 1];

  const finalCategory = await prisma.category.findUnique({
    where: { slug: finalSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!finalCategory) return null;

  const ancestors: CategoryNode[] = [
    {
      id: finalCategory.id,
      name: finalCategory.name,
      slug: finalCategory.slug,
      parentId: finalCategory.parentId,
    },
  ];

  let parentId = finalCategory.parentId;
  let depth = 0;

  // Walk upward through the actual parent relations.
  // The depth guard protects against malformed cyclic category data.
  while (parentId && depth < 20) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    if (!parent) return null;

    ancestors.push(parent);
    parentId = parent.parentId;
    depth += 1;
  }

  if (parentId) return null;

  ancestors.reverse();

  // A URL must match the real hierarchy, not merely the final category slug.
  const actualPath = ancestors.map((item) => item.slug);

  if (
    actualPath.length !== slugSegments.length ||
    actualPath.some((slug, index) => slug !== slugSegments[index])
  ) {
    return null;
  }

  return {
    category: finalCategory,
    breadcrumbs: ancestors.map(({ id, name, slug }) => ({
      id,
      name,
      slug,
    })),
  };
}

function getCategoryDescription(categoryName: string) {
  return `Explore ${categoryName} from verified manufacturers and suppliers in India. Compare products, minimum order quantities and pricing, and connect directly with manufacturers.`;
}

async function getCategoryPageData(slugSegments: string[]) {
  const hierarchy = await getCategoryHierarchy(slugSegments);

  if (!hierarchy) return null;

  const { category, breadcrumbs } = hierarchy;

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: category.id,
        isPublished: true,
      },
      include: {
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
    location: {
      select: {
        state: true,
      },
    },
  },
},
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: 0,
      take: PAGE_SIZE,
    }),

    prisma.product.count({
      where: {
        categoryId: category.id,
        isPublished: true,
      },
    }),
  ]);

  // Convert Prisma Date objects and JSON fields into serializable client props.
  const serializedProducts = products.map((product) => ({
  ...product,

  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString(),

  description: product.description ?? undefined,

  specifications:
    (product.specifications as Record<string, string> | null) ?? undefined,

  category: {
    id: product.category.id,
    name: product.category.name,
    slug: product.category.slug,
  },

  manufacturer: {
    ...product.manufacturer,
    city: product.manufacturer.city ?? "",
    location: product.manufacturer.location
      ? {
          state: product.manufacturer.location.state ?? undefined,
        }
      : null,
  },
}));

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: getCategoryDescription(category.name),
    },
    breadcrumbs,
    subcategories: category.children,
    products: serializedProducts,
    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      total: totalProducts,
      totalPages: Math.ceil(totalProducts / PAGE_SIZE),
      hasMore: totalProducts > PAGE_SIZE,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) {
    return {
      title: "Category Not Found | The India Origin",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const categoryName = data.category.name;
  const title = `${categoryName} Manufacturers, Suppliers & Products in India`;
  const description = data.category.description;
  const canonicalPath = `/category/${slug.map(encodeURIComponent).join("/")}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "The India Origin",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryBrowsingPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug = [] } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <CategoryClient
      slugSegments={slug}
      category={data.category}
      breadcrumbs={data.breadcrumbs}
      subcategories={data.subcategories}
      initialProducts={data.products}
      initialPage={data.pagination.page}
      hasMoreInitially={data.pagination.hasMore}
      totalProducts={data.pagination.total}
    />
  );
}
