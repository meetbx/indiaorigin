import { Product, Category, Manufacturer } from "@prisma/client";

export type ProductWithRelations = Product & {
  category?: Category | null;
  manufacturer?: Manufacturer | null;
};

export interface RecommendationOptions {
  limit?: number;
  excludeManufacturerId?: string;
}

export interface ScoredRecommendation {
  product: ProductWithRelations;
  score: number;
  reasons: string[];
}

export interface RankingWeights {
  categoryAndType: number;
  nameAndKeyword: number;
  specsAndMaterial: number;
  priceCompatibility: number;
  moqCompatibility: number;
  supplierQuality: number;
}