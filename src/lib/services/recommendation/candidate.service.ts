import { prisma } from "@/lib/prisma";
import { ProductWithRelations } from "./types";

export async function getCandidateProducts(
  currentProduct: {
    id: string;
    categoryId: string;
    manufacturerId: string;
    minPrice: number;
    maxPrice: number;
  },
  options: {
    limit?: number;
    excludeSameManufacturer?: boolean;
  } = {}
): Promise<ProductWithRelations[]> {
  const limit = options.limit || 20;

  // Retrieve strictly from the same category to ensure relevance
  const whereClause: any = {
    id: { not: currentProduct.id },
    isPublished: true,
    categoryId: currentProduct.categoryId,
  };

  if (options.excludeSameManufacturer) {
    whereClause.manufacturerId = { not: currentProduct.manufacturerId };
  }

  const candidates = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: true,
      manufacturer: true,
    },
    take: limit * 2,
  });

  return candidates;
}