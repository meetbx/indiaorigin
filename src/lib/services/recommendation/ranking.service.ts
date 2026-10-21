import { ProductWithRelations, ScoredRecommendation, RankingWeights } from "./types";

export const DEFAULT_WEIGHTS: RankingWeights = {
  categoryAndType: 0.30,
  nameAndKeyword: 0.20,
  specsAndMaterial: 0.25,
  priceCompatibility: 0.10,
  moqCompatibility: 0.05,
  supplierQuality: 0.10,
};

function normalizeSpecValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/(mm|cm|m|kg|g|pcs|piece|pieces)$/i, "");
}

export function scoreAndRankProducts(
  targetProduct: ProductWithRelations,
  candidates: ProductWithRelations[],
  weights: RankingWeights = DEFAULT_WEIGHTS,
  options: { excludeManufacturerId?: string; limit?: number } = {}
): ScoredRecommendation[] {
  const scored: ScoredRecommendation[] = [];

  for (const candidate of candidates) {
    if (options.excludeManufacturerId && candidate.manufacturerId === options.excludeManufacturerId) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // 1. Category / Type Score (30%)
    if (candidate.categoryId === targetProduct.categoryId) {
      score += weights.categoryAndType * 100;
      reasons.push("Exact category match");
    } else {
      score += weights.categoryAndType * 40;
      reasons.push("Related category match");
    }

    // 2. Name & Keyword Similarity (20%)
    const targetWords = new Set(targetProduct.name.toLowerCase().split(/\s+/));
    const candidateWords = candidate.name.toLowerCase().split(/\s+/);
    let commonWords = 0;
    for (const w of candidateWords) {
      if (targetWords.has(w)) commonWords++;
    }
    const nameSimRatio = targetWords.size > 0 ? commonWords / targetWords.size : 0;
    score += weights.nameAndKeyword * (nameSimRatio * 100);
    if (nameSimRatio > 0.3) reasons.push("High keyword similarity");

    // 3. Technical Specifications & Material (25%)
    let specScore = 50; // Neutral baseline if specs are missing
    if (targetProduct.specifications && candidate.specifications) {
      const targetSpecs = targetProduct.specifications as Record<string, unknown>;
      const candidateSpecs = candidate.specifications as Record<string, unknown>;
      let matchingKeys = 0;
      let totalKeys = Object.keys(targetSpecs).length;

      if (totalKeys > 0) {
        for (const [key, val] of Object.entries(targetSpecs)) {
          if (candidateSpecs[key] !== undefined) {
            const normTarget = normalizeSpecValue(val);
            const normCandidate = normalizeSpecValue(candidateSpecs[key]);
            if (normTarget === normCandidate && normTarget !== "") {
              matchingKeys++;
            } else if (key.toLowerCase() === "material" && normTarget !== normCandidate) {
              // Heavy penalty for material mismatch
              specScore -= 20;
            }
          }
        }
        specScore = Math.max(0, Math.min(100, (matchingKeys / totalKeys) * 100));
        if (matchingKeys > 0) reasons.push("Matching technical specifications");
      }
    }
    score += weights.specsAndMaterial * specScore;

    // 4. Price Compatibility (10%)
    const targetAvgPrice = (targetProduct.minPrice + targetProduct.maxPrice) / 2;
    const candidateAvgPrice = (candidate.minPrice + candidate.maxPrice) / 2;
    const priceDiffRatio = Math.abs(targetAvgPrice - candidateAvgPrice) / (targetAvgPrice || 1);
    const priceScore = Math.max(0, 100 - priceDiffRatio * 100);
    score += weights.priceCompatibility * priceScore;
    if (priceDiffRatio < 0.2) reasons.push("Compatible price range");

    // 5. MOQ Compatibility (5%)
    const moqDiff = Math.abs(targetProduct.moq - candidate.moq);
    const moqScore = Math.max(0, 100 - (moqDiff / (targetProduct.moq || 1)) * 50);
    score += weights.moqCompatibility * moqScore;

    // 6. Supplier Quality & Verification (10%)
    let supplierScore = 50;
    if (candidate.manufacturer) {
      if (candidate.manufacturer.isVerified) {
        supplierScore += 30;
        reasons.push("Verified manufacturer");
      }
      if (candidate.manufacturer.badge && candidate.manufacturer.badge !== "NONE") {
        supplierScore += 20;
      }
    }
    score += weights.supplierQuality * supplierScore;

    scored.push({
      product: candidate,
      score: Math.round(score * 100) / 100,
      reasons,
    });
  }

  // Sort descending by relevance score FIRST
  scored.sort((a, b) => b.score - a.score);

  // Apply deterministic manufacturer diversity constraint AFTER sorting
  const finalResults: ScoredRecommendation[] = [];
  const manufacturerCounts: Record<string, number> = {};
  const maxPerManufacturer = 2;

  for (const item of scored) {
    const mId = item.product.manufacturerId;
    const count = manufacturerCounts[mId] || 0;
    if (count < maxPerManufacturer) {
      manufacturerCounts[mId] = count + 1;
      finalResults.push(item);
    }
    if (options.limit && finalResults.length >= options.limit) {
      break;
    }
  }

  return finalResults;
}