import { prisma } from "@/lib/prisma";

export interface SearchOptions {
  q?: string;
  categorySlug?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  material?: string;
  state?: string;
  verifiedOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "popular" | "newest";
  page: number;
  limit: number;
}

// Helper to escape % and _ for safe ILIKE substring search
function escapeLikePattern(input: string): string {
  return input.replace(/[%_]/g, '\\$&');
}

export async function executeProductSearch(options: SearchOptions) {
  const startTime = performance.now();
  const {
    q,
    categorySlug,
    categoryId,
    minPrice,
    maxPrice,
    minMoq,
    maxMoq,
    material,
    state,
    verifiedOnly,
    sort = "relevance",
    page,
    limit,
  } = options;

  let targetCategoryId: string | undefined = categoryId;
  if (!targetCategoryId && categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (cat) targetCategoryId = cat.id;
  }

  const rawPage = Number(page);
  const rawLimit = Number(limit);
  const safePage = Math.min(1000, Math.max(1, Number.isInteger(rawPage) ? rawPage : 1));
  const safeLimit = Math.min(50, Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 20));
  const skip = (safePage - 1) * safeLimit;
  const searchTerm = q ? q.trim() : "";

  let whereSql = `p."isPublished" = true`;
  const params: any[] = [];
  let paramIdx = 1;

  if (targetCategoryId) {
    whereSql += ` AND p."categoryId" = $${paramIdx++}`;
    params.push(targetCategoryId);
  }

  if (minPrice !== undefined) {
    whereSql += ` AND p."maxPrice" >= $${paramIdx++}`;
    params.push(minPrice);
  }

  if (maxPrice !== undefined) {
    whereSql += ` AND p."minPrice" <= $${paramIdx++}`;
    params.push(maxPrice);
  }

  if (minMoq !== undefined) {
    whereSql += ` AND p."moq" >= $${paramIdx++}`;
    params.push(minMoq);
  }

  if (maxMoq !== undefined) {
    whereSql += ` AND p."moq" <= $${paramIdx++}`;
    params.push(maxMoq);
  }

  if (material) {
    whereSql += ` AND p."specifications"->>'material' = $${paramIdx++}`;
    params.push(material);
  }

  if (state) {
    whereSql += ` AND LOWER(l."state") = LOWER($${paramIdx++})`;
    params.push(state);
  }

  if (verifiedOnly) {
    whereSql += ` AND m."badge" <> 'NONE'`;
  }

  let relevanceScoreSql = `0.0 AS search_score`;
  let exactParamIdx = -1;
  let prefixParamIdx = -1;
  let substringParamIdx = -1;
  let fuzzyParamIdx = -1;

  if (searchTerm.length > 0) {
    const escapedTerm = escapeLikePattern(searchTerm);
    const substringPattern = `%${escapedTerm}%`;
    const prefixPattern = `${escapedTerm}%`;

    substringParamIdx = paramIdx++;
    prefixParamIdx = paramIdx++;
    exactParamIdx = paramIdx++;
    fuzzyParamIdx = paramIdx++;

    params.push(substringPattern); // Substring ILIKE (escaped)
    params.push(prefixPattern);    // Prefix ILIKE (escaped)
    params.push(searchTerm);       // Exact match
    params.push(searchTerm);       // Fuzzy trigram similarity & % operator

    whereSql += ` AND (
      p."name" ILIKE $${substringParamIdx} ESCAPE '\\' OR 
      p."description" ILIKE $${substringParamIdx} ESCAPE '\\' OR
      p."name" % $${fuzzyParamIdx} OR
      similarity(p."name", $${fuzzyParamIdx}) > 0.2
    )`;

    // Tiered ranking policy: product title matches prioritized over description-only matches
    relevanceScoreSql = `
      CASE 
        WHEN LOWER(p."name") = LOWER($${exactParamIdx}) THEN 3.0
        WHEN p."name" ILIKE $${prefixParamIdx} ESCAPE '\\' THEN 2.5
        WHEN word_similarity($${fuzzyParamIdx}, p."name") > 0.5 THEN 2.0
        WHEN p."name" ILIKE $${substringParamIdx} ESCAPE '\\' THEN 1.5
        WHEN similarity(p."name", $${fuzzyParamIdx}) > 0.2 THEN similarity(p."name", $${fuzzyParamIdx})
        WHEN p."description" ILIKE $${substringParamIdx} ESCAPE '\\' THEN 0.5
        ELSE 0.1
      END AS search_score
    `;
  }

  let orderBySql = `p."total_sold" DESC, p."createdAt" DESC`;
  if (sort === "price_asc") orderBySql = `p."minPrice" ASC`;
  else if (sort === "price_desc") orderBySql = `p."minPrice" DESC`;
  else if (sort === "popular") orderBySql = `p."total_sold" DESC`;
  else if (sort === "newest") orderBySql = `p."createdAt" DESC`;
  else if (sort === "relevance" && searchTerm.length > 0) {
    orderBySql = `search_score DESC, p."total_sold" DESC`;
  }

  const countQuery = `
    SELECT COUNT(p."id") as total
    FROM "Product" p
    LEFT JOIN "Manufacturer" m ON p."manufacturerId" = m."id"
    LEFT JOIN "Location" l ON m."locationId" = l."id"
    WHERE ${whereSql}
  `;

  const dataQuery = `
    SELECT 
      p.*,
      json_build_object(
        'id', c."id",
        'name', c."name",
        'slug', c."slug"
      ) as category,
      json_build_object(
        'id', m."id",
        'name', m."name",
        'slug', m."slug",
        'logo', m."logo",
        'isVerified', m."isVerified",
        'badge', m."badge",
        'location', json_build_object(
          'state', l."state",
          'slug', l."slug"
        )
      ) as manufacturer,
      ${relevanceScoreSql}
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c."id"
    LEFT JOIN "Manufacturer" m ON p."manufacturerId" = m."id"
    LEFT JOIN "Location" l ON m."locationId" = l."id"
    WHERE ${whereSql}
    ORDER BY ${orderBySql}
    LIMIT ${safeLimit} OFFSET ${skip}
  `;

 const [countResult, rawProducts] = await Promise.all([
    prisma.$queryRawUnsafe(countQuery, ...params),
    prisma.$queryRawUnsafe(dataQuery, ...params),
  ])as [any[], any[]];

  const total = Number(countResult[0]?.total || 0);
  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    success: true,
    meta: {
      query: q || null,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
      executionTimeMs,
    },
    filtersApplied: {
      category: categorySlug || categoryId || null,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      minMoq: minMoq ?? null,
      maxMoq: maxMoq ?? null,
      material: material || null,
      state: state || null,
      verifiedOnly: verifiedOnly ?? false,
    },
    products: rawProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      moq: p.moq,
      unit: p.unit,
      images: p.images,
      inStock: p.inStock,
      isPublished: p.isPublished,
      specifications: p.specifications,
      supplier: {
        id: p.manufacturer?.id,
        name: p.manufacturer?.name,
        slug: p.manufacturer?.slug,
        logo: p.manufacturer?.logo,
        isVerified: p.manufacturer?.isVerified,
        badge: p.manufacturer?.badge,
        location: {
          state: p.manufacturer?.location?.state || "India",
          slug: p.manufacturer?.location?.slug || "india",
        },
      },
    })),
  };
}

export async function executeAutocomplete(q: string, limit: number = 6) {
  if (!q || q.trim().length < 2) {
    return { success: true, query: q || "", suggestions: [], categories: [], manufacturers: [] };
  }

  const searchTerm = q.trim();
  const safeLimit = Math.min(10, Math.max(1, Number(limit) || 6));
  const escapedTerm = escapeLikePattern(searchTerm);

  try {
    const [products, categories, manufacturers] = await Promise.all([
      prisma.$queryRaw`
        SELECT name, slug 
        FROM "Product" 
        WHERE "isPublished" = true 
          AND ("name" ILIKE ${`%${escapedTerm}%`} ESCAPE '\\' OR "name" % ${searchTerm})
        ORDER BY 
          CASE WHEN LOWER("name") = LOWER(${searchTerm}) THEN 0 
               WHEN "name" ILIKE ${`${escapedTerm}%`} ESCAPE '\\' THEN 1 
               ELSE 2 END,
          word_similarity(${searchTerm}, "name") DESC
        LIMIT ${safeLimit}
      `,
      prisma.$queryRaw`
        SELECT name, slug 
        FROM "Category" 
        WHERE "name" ILIKE ${`%${escapedTerm}%`} ESCAPE '\\'
        LIMIT 4
      `,
      prisma.$queryRaw`
        SELECT name, slug 
        FROM "Manufacturer" 
        WHERE "name" ILIKE ${`%${escapedTerm}%`} ESCAPE '\\'
        LIMIT 3
      `,
    ])as [any[], any[], any[]];

    return {
      success: true,
      query: q,
      suggestions: products.map((p: any) => ({ type: "product", text: p.name, slug: p.slug })),
      categories: categories.map((c: any) => ({ name: c.name, slug: c.slug })),
      manufacturers: manufacturers.map((m: any) => ({ name: m.name, slug: m.slug })),
    };
  } catch (err) {
    console.error("[AUTOCOMPLETE_ERROR]", err);
    return { success: true, query: q, suggestions: [], categories: [], manufacturers: [] };
  }
}