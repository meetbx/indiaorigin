import { scoreAndRankProducts, DEFAULT_WEIGHTS } from "../ranking.service";
import { ProductWithRelations } from "../types";
import { describe, it, expect } from "vitest";

describe("Recommendation Ranking Service - Comprehensive Tests", () => {
  const targetProduct: ProductWithRelations = {
    id: "prod-1",
    name: "Industrial Stainless Steel Pipe",
    slug: "industrial-stainless-steel-pipe",
    description: "High quality stainless steel pipe",
    images: [],
    minPrice: 100,
    maxPrice: 150,
    moq: 50,
    unit: "Piece",
    priceTiers: null,
    specifications: { material: "Stainless Steel", size: "10 mm" },
    hsCode: null,
    leadTimeDays: 7,
    inStock: true,
    categoryId: "cat-1",
    manufacturerId: "mfg-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    sample_price: null,
    is_sample_available: false,
    total_sold: 0,
    customization_options: [],
    service_guarantees: [],
    videoUrl: null,
    protectionEligible: true,
    shippingOrigin: null,
    shippingPorts: [],
    isPublished: true,
    productDetails: [],
  };

  it("should normalize units correctly (e.g. 10mm vs 10 mm)", () => {
    const candidate: ProductWithRelations = {
      ...targetProduct,
      id: "prod-2",
      name: "Stainless Steel Pipe Variant",
      slug: "stainless-steel-pipe-variant",
      specifications: { material: "Stainless Steel", size: "10mm" },
    };

    const results = scoreAndRankProducts(targetProduct, [candidate], DEFAULT_WEIGHTS);
    expect(results.length).toBe(1);
    expect(results[0].reasons).toContain("Matching technical specifications");
  });

  it("should penalize incompatible materials", () => {
    const candidate: ProductWithRelations = {
      ...targetProduct,
      id: "prod-3",
      name: "Plastic PVC Pipe",
      slug: "plastic-pvc-pipe",
      specifications: { material: "PVC", size: "10mm" },
    };

    const results = scoreAndRankProducts(targetProduct, [candidate], DEFAULT_WEIGHTS);
    expect(results.length).toBe(1);
    expect(results[0].score).toBeLessThan(70);
  });

  it("should enforce manufacturer diversity post-sorting", () => {
    const candidates: ProductWithRelations[] = [
      { ...targetProduct, id: "p-2", name: "Steel Pipe A", slug: "p-2", manufacturerId: "mfg-heavy" },
      { ...targetProduct, id: "p-3", name: "Steel Pipe B", slug: "p-3", manufacturerId: "mfg-heavy" },
      { ...targetProduct, id: "p-4", name: "Steel Pipe C", slug: "p-4", manufacturerId: "mfg-heavy" },
      { ...targetProduct, id: "p-5", name: "Steel Pipe D", slug: "p-5", manufacturerId: "mfg-other" },
    ];

    const results = scoreAndRankProducts(targetProduct, candidates, DEFAULT_WEIGHTS, { limit: 4 });
    const heavyCount = results.filter(r => r.product.manufacturerId === "mfg-heavy").length;
    expect(heavyCount).toBeLessThanOrEqual(2);
  });
});