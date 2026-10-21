import { prisma } from "@/lib/prisma";
import { getCandidateProducts } from "./candidate.service";
import { scoreAndRankProducts, DEFAULT_WEIGHTS } from "./ranking.service";
import { ScoredRecommendation, ProductWithRelations } from "./types";

export interface RecommendationResult {
  success: boolean;
  error?: string;
  recommendations: ScoredRecommendation[];
}

/**
 * Robustly resolve a product by ID or slug without fragile string heuristics.
 */
export async function findProductByIdOrSlug(identifier: string): Promise<ProductWithRelations | null> {
  const trimmed = identifier.trim();
  
  // Try lookup by ID first
  let product = await prisma.product.findUnique({
    where: { id: trimmed },
    include: { category: true, manufacturer: true },
  });

  // Fallback to slug lookup if not found by ID
  if (!product) {
    product = await prisma.product.findUnique({
      where: { slug: trimmed },
      include: { category: true, manufacturer: true },
    });
  }

  return product;
}

/**
 * Fetches similar product recommendations for a given identifier (ID or slug).
 */
export async function getSimilarProductsForIdentifier(
  identifier: string,
  limit: number = 8
): Promise<RecommendationResult> {
  try {
    const targetProduct = await findProductByIdOrSlug(identifier);

    if (!targetProduct || !targetProduct.isPublished) {
      return {
        success: false,
        error: "Product not found or not published",
        recommendations: [],
      };
    }

    const candidates = await getCandidateProducts({
      id: targetProduct.id,
      categoryId: targetProduct.categoryId,
      manufacturerId: targetProduct.manufacturerId,
      minPrice: targetProduct.minPrice,
      maxPrice: targetProduct.maxPrice,
    });

    if (candidates.length === 0) {
      return {
        success: true,
        recommendations: [],
      };
    }

    const ranked = scoreAndRankProducts(targetProduct, candidates, DEFAULT_WEIGHTS, {
      limit,
    });

    return {
      success: true,
      recommendations: ranked,
    };
  } catch (error) {
    console.error("Error fetching similar products recommendations:", error);
    return {
      success: false,
      error: "Internal server error while fetching recommendations",
      recommendations: [],
    };
  }
}

/**
 * Fetches alternative manufacturer recommendations for a given identifier (ID or slug).
 */
export async function getAlternativeManufacturersForIdentifier(
  identifier: string,
  limit: number = 8
): Promise<RecommendationResult> {
  try {
    const targetProduct = await findProductByIdOrSlug(identifier);

    if (!targetProduct || !targetProduct.isPublished) {
      return {
        success: false,
        error: "Product not found or not published",
        recommendations: [],
      };
    }

    const candidates = await getCandidateProducts(
      {
        id: targetProduct.id,
        categoryId: targetProduct.categoryId,
        manufacturerId: targetProduct.manufacturerId,
        minPrice: targetProduct.minPrice,
        maxPrice: targetProduct.maxPrice,
      },
      {
        excludeSameManufacturer: true,
      }
    );

    if (candidates.length === 0) {
      return {
        success: true,
        recommendations: [],
      };
    }

    const ranked = scoreAndRankProducts(
      targetProduct,
      candidates,
      DEFAULT_WEIGHTS,
      {
        excludeManufacturerId: targetProduct.manufacturerId,
        limit,
      }
    );

    return {
      success: true,
      recommendations: ranked,
    };
  } catch (error) {
    console.error("Error fetching alternative manufacturer recommendations:", error);
    return {
      success: false,
      error: "Internal server error while fetching alternative manufacturers",
      recommendations: [],
    };
  }
}