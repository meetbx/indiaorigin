import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> | { slug?: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const slugSegments = resolvedParams?.slug || [];
    
    if (slugSegments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Category slug is required" },
        { status: 400 }
      );
    }

    const currentSlug = slugSegments[slugSegments.length - 1];

    // Find the category by slug using the Prisma Category model
    const category = await prisma.category.findUnique({
      where: { slug: currentSlug },
      include: {
        parent: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Build hierarchical breadcrumbs
    const breadcrumbs = [];
    for (let i = 0; i < slugSegments.length; i++) {
      const seg = slugSegments[i];
      const matchedCat = await prisma.category.findUnique({
        where: { slug: seg },
        select: { name: true, slug: true },
      });
      breadcrumbs.push({
        name: matchedCat ? matchedCat.name : seg.replace(/-/g, " "),
        slug: slugSegments.slice(0, i + 1).join("/"),
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    // Fetch published products belonging to this category ID
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: category.id,
          isPublished: true,
        },
        include: {
          manufacturer: {
            select: {
              name: true,
              city: true,
              badge: true,
              isVerified: true,
              location: { select: { state: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({
        where: {
          categoryId: category.id,
          isPublished: true,
        },
      }),
    ]);

    // Format products to match the exact Marketplace Product type expected by ProductGrid
    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      images: p.images || [],
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      moq: p.moq,
      unit: p.unit,
      manufacturer: p.manufacturer ? {
        name: p.manufacturer.name,
        city: p.manufacturer.city,
        badge: p.manufacturer.badge,
        isVerified: p.manufacturer.isVerified,
        location: p.manufacturer.location,
      } : undefined,
    }));

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: `Explore verified manufacturers, suppliers, and industrial products under ${category.name}.`,
        parentId: category.parentId,
        children: category.children,
      },
      breadcrumbs,
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: skip + products.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Category API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}