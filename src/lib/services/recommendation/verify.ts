import { scoreAndRankProducts, DEFAULT_WEIGHTS } from "./ranking.service";
import { ProductWithRelations } from "./types";
import { scoreAndRankProducts } from "./ranking.service"

function runVerification() {
  console.log("Running Recommendation Engine Verification...");

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

  const candidates: ProductWithRelations[] = [
    {
      ...targetProduct,
      id: "prod-2",
      name: "Stainless Steel Industrial Pipe 10mm",
      slug: "stainless-steel-industrial-pipe-10mm",
      manufacturerId: "mfg-2",
      specifications: { material: "Stainless Steel", size: "10mm" },
      manufacturer: {
        id: "mfg-2",
        name: "Verified Steel Works",
        slug: "verified-steel-works",
        description: null,
        phone: null,
        gstNumber: null,
        isVerified: true,
        certifications: [],
        logo: null,
        bannerImage: null,
        machineImages: [],
        addressLine: "Test",
        city: "Mumbai",
        pincode: "400001",
        locationId: "loc-1",
        yearEstablished: 2010,
        factoryAreaSqFt: 5000,
        annualTurnover: "10M",
        createdAt: new Date(),
        updatedAt: new Date(),
        onTimeDispatchRate: 98.5,
        responseTimeHours: 2,
        rndEngineers: 5,
        mainMarkets: [],
        badge: "GOLD",
      },
    },
    {
      ...targetProduct,
      id: "prod-3",
      name: "Plastic PVC Pipe",
      slug: "plastic-pvc-pipe",
      manufacturerId: "mfg-3",
      minPrice: 20,
      maxPrice: 30,
      moq: 500,
      specifications: { material: "PVC", size: "10mm" },
      manufacturer: {
        id: "mfg-3",
        name: "Cheap Plastics",
        slug: "cheap-plastics",
        description: null,
        phone: null,
        gstNumber: null,
        isVerified: false,
        certifications: [],
        logo: null,
        bannerImage: null,
        machineImages: [],
        addressLine: "Test",
        city: "Delhi",
        pincode: "110001",
        locationId: "loc-2",
        yearEstablished: 2015,
        factoryAreaSqFt: 1000,
        annualTurnover: "1M",
        createdAt: new Date(),
        updatedAt: new Date(),
        onTimeDispatchRate: 80.0,
        responseTimeHours: 24,
        rndEngineers: 1,
        mainMarkets: [],
        badge: "NONE",
      },
    },
  ];

  const results = scoreAndRankProducts(targetProduct, candidates, DEFAULT_WEIGHTS, { limit: 5 });

  console.log("\n--- Verification Results ---");
  results.forEach((res, idx) => {
    console.log(`${idx + 1}. [Score: ${res.score}] ${res.product.name}`);
    console.log(`   Reasons: ${res.reasons.join(", ")}`);
  });

  if (results.length > 0 && results[0].product.id === "prod-2") {
    console.log("\n✅ Verification PASSED: Top recommendation correctly matched the stainless steel pipe with high score.");
  } else {
    console.log("\n❌ Verification FAILED: Unexpected ranking order.");
  }
}

runVerification();