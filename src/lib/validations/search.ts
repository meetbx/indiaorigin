import { z } from "zod";

const MAX_QUERY_LENGTH = 50;

export const searchParamsSchema = z.object({
  q: z
    .string()
    .max(MAX_QUERY_LENGTH, { message: `Query must not exceed ${MAX_QUERY_LENGTH} characters` })
    .optional()
    .transform((val) => val?.trim()),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minMoq: z.coerce.number().int().min(0).optional(),
  maxMoq: z.coerce.number().int().min(0).optional(),
  material: z.string().optional(),
  state: z.string().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "popular", "newest"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).refine(
  (data) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: "minPrice cannot be greater than maxPrice", path: ["minPrice"] }
);

export const autocompleteParamsSchema = z.object({
  q: z
    .string()
    .min(2, { message: "Query must be at least 2 characters" })
    .max(MAX_QUERY_LENGTH, { message: `Query must not exceed ${MAX_QUERY_LENGTH} characters` })
    .transform((val) => val.trim()),
  limit: z.coerce.number().int().min(1).max(10).default(6),
});