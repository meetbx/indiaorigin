import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
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
  specifications: z.record(z.string(), z.string()).optional(),
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

    // Parse pagination safely. Invalid values fall back to defaults.
    const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "12", 10);

    const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(50, Math.max(1, rawLimit))
      : 12;

    const skip = (page - 1) * limit;

    const search = (searchParams.get("search") ?? "").trim();
    const categorySlug = searchParams.get("category") ?? "";
    const filter = searchParams.get("filter") ?? "all";

    // Every condition is combined with AND, so filters cannot
    // accidentally overwrite one another.
    const conditions: Prisma.ProductWhereInput[] = [
      { isPublished: true },
    ];

    // Search product name, description, category, manufacturer and city.
    if (search) {
      conditions.push({
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            category: {
              is: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            manufacturer: {
              is: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            manufacturer: {
              is: {
                city: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    // Category filter.
    if (categorySlug && categorySlug !== "all") {
      conditions.push({
        category: {
          is: {
            slug: categorySlug,
          },
        },
      });
    }

    // Filter chips.
    if (filter === "verified") {
      conditions.push({
        manufacturer: {
          is: {
            isVerified: true,
          },
        },
      });
    } else if (filter === "deals") {
      conditions.push({
        minPrice: {
          gt: 0,
        },
      });
    }

    const where: Prisma.ProductWhereInput = {
      AND: conditions,
    };

    // Keep the exact total count because the existing API response
    // exposes total and totalPages.
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          filter === "new"
            ? [
                { createdAt: "desc" },
                { id: "desc" },
              ]
            : [
                { updatedAt: "desc" },
                { id: "desc" },
              ],
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

      prisma.product.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[API_PRODUCTS_GET_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products.",
      },
      { status: 500 }
    );
  }
}