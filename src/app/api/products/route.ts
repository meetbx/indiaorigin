import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


const createProductSchema = z.object({
  title: z.string().min(3).max(200),
  categoryId: z.string().cuid(),
  subcategoryId: z.string().cuid().optional(),
  description: z.string().min(10),
  minOrderQuantity: z.number().int().positive(),
  unit: z.string().default("Piece"),
  basePrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sampleAvailable: z.boolean().default(false),
  samplePrice: z.number().positive().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  specifications: z.record(z.string()).optional(),
  customizationDetails: z.string().optional(),
  priceTiers: z.array(z.object({
    minQuantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive().nullable(),
    unitPrice: z.number().positive(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const categorySlug = searchParams.get("category") || "";
    const filter = searchParams.get("filter") || "all";

    const skip = (page - 1) * limit;

    // Construct Prisma dynamic condition
    const where: Prisma.ProductWhereInput = {};

    // Text Search matching Name, Description, Category, Manufacturer name & City
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
        { manufacturer: { name: { contains: search, mode: "insensitive" } } },
        { manufacturer: { city: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Category filter
    if (categorySlug && categorySlug !== "all") {
      where.category = {
        slug: categorySlug,
      };
    }

    // Filter Chips logic
    if (filter === "verified") {
      where.manufacturer = {
        isVerified: true,
      };
    } else if (filter === "deals") {
      where.minPrice = {
        gt: 0,
      };
    }
// Insert in Buyer App GET handler conditions in src/app/api/products/route.ts
const conditions: Prisma.ProductWhereInput[] = [
  { isPublished: true } // Guarantees draft items remain hidden on buyer marketplace
];
    // Execute queries in parallel against Neon PostgreSQL
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          filter === "new"
            ? { createdAt: "desc" }
            : { updatedAt: "desc" },
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
              logo: true,
              certifications: true,
              location: {
                select: {
                  state: true,
                },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("[API_PRODUCTS_GET_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products from Neon database.",
      },
      { status: 500 }
    );
  }
}