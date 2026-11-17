
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

type RouteParams = {
  slug: string[];
};

async function validateCategoryPath(slugSegments: string[]) {
  if (!slugSegments.length || slugSegments.some((slug) => !slug.trim())) {
    return null;
  }

  const finalSlug = slugSegments[slugSegments.length - 1];

  const category = await prisma.category.findUnique({
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

  if (!category) return null;

  const ancestors = [
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    },
  ];

  let parentId = category.parentId;
  let depth = 0;

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

  const actualPath = ancestors.map((item) => item.slug);

  if (
    actualPath.length !== slugSegments.length ||
    actualPath.some((slug, index) => slug !== slugSegments[index])
  ) {
    return null;
  }

  return {
    category,
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

function serializeProduct(product: any) {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    specifications: product.specifications ?? undefined,
    manufacturer: {
      ...product.manufacturer,
      city: product.manufacturer.city ?? "",
      location: product.manufacturer.location
        ? {
            state: product.manufacturer.location.state ?? undefined,
            country: product.manufacturer.location.country ?? undefined,
          }
        : null,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { slug = [] } = await params;

    const hierarchy = await validateCategoryPath(slug);

    if (!hierarchy) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found.",
        },
        { status: 404 }
      );
    }

    const { category, breadcrumbs } = hierarchy;

    const searchParams = request.nextUrl.searchParams;

    const requestedPage = Number(searchParams.get("page") ?? 1);
    const requestedLimit = Number(
      searchParams.get("limit") ?? DEFAULT_LIMIT
    );

    if (
      !Number.isInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters.",
        },
        { status: 400 }
      );
    }

    const page = requestedPage;
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const productWhere = {
      categoryId: category.id,
      isPublished: true,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
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
        skip,
        take: limit,
      }),

      prisma.product.count({
        where: productWhere,
      }),
    ]);

    const serializedProducts = products.map(serializeProduct);

    return NextResponse.json(
      {
        success: true,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: getCategoryDescription(category.name),
          children: category.children,
        },
        breadcrumbs,
        products: serializedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + products.length < total,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Category API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load category products.",
      },
      { status: 500 }
    );
  }
}
