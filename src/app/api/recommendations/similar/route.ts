import { NextRequest, NextResponse } from "next/server";
import { getSimilarProductsForIdentifier } from "@/lib/services/recommendation/recommendation.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const slug = searchParams.get("slug");
    const limitParam = searchParams.get("limit");

    // Precedence rule: productId takes precedence over slug if both are supplied
    const identifier = productId || slug;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'productId' or 'slug' query parameter." },
        { status: 400 }
      );
    }

    // Strict limit validation: default 8, valid range 1-20, returns 400 for out-of-bounds or non-integers
    let limit = 8;
    if (limitParam !== null) {
      const parsed = Number(limitParam);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 20) {
        return NextResponse.json(
          { success: false, error: "Invalid 'limit' parameter. Must be an integer between 1 and 20." },
          { status: 400 }
        );
      }
      limit = parsed;
    }

    const result = await getSimilarProductsForIdentifier(identifier.trim(), limit);

    if (!result.success) {
      const status = result.error?.includes("not found") ? 404 : 500;
      return NextResponse.json(
        { success: false, error: result.error || "Failed to fetch recommendations." },
        { status }
      );
    }

    // Sanitize response to expose only required public fields
    const sanitizedRecommendations = result.recommendations.map((rec) => ({
      id: rec.product.id,
      name: rec.product.name,
      slug: rec.product.slug,
      images: rec.product.images || [],
      minPrice: rec.product.minPrice,
      maxPrice: rec.product.maxPrice,
      moq: rec.product.moq,
      unit: rec.product.unit,
      isPublished: rec.product.isPublished,
      manufacturer: rec.product.manufacturer ? {
        id: rec.product.manufacturer.id,
        name: rec.product.manufacturer.name,
        slug: rec.product.manufacturer.slug,
        isVerified: rec.product.manufacturer.isVerified,
        badge: rec.product.manufacturer.badge,
        city: rec.product.manufacturer.city,
      } : null,
      score: rec.score,
      reasons: rec.reasons,
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedRecommendations.length,
      recommendations: sanitizedRecommendations,
    });
  } catch (error) {
    console.error("[API_ERROR] /api/recommendations/similar:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}