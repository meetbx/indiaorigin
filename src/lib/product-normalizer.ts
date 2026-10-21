/*

export interface PriceTier {
  minQty: number;
  maxQty?: number | null;
  price: number;
}

export interface SupplierMetric {
  label: string;
  value: string;
}

export function normalizeProductData(rawProduct: any, rawSimilar: any[] = []) {
  if (!rawProduct) return null;

  // 1. Extract Manufacturer / Location
  const manufacturer = rawProduct.manufacturer || {};
  const locationObj = manufacturer.location || {};
  
  let locationStr = "India";
  if (typeof locationObj === "string") {
    locationStr = locationObj;
  } else if (locationObj.city || locationObj.state || locationObj.country) {
    locationStr = [locationObj.city, locationObj.state, locationObj.country].filter(Boolean).join(", ");
  }

  // 2. Build Supplier Metrics
  const supplierMetrics: SupplierMetric[] = [];
  const onTime = manufacturer.onTimeDispatchRate ?? manufacturer.on_time_dispatch_rate;
  if (onTime != null) {
    supplierMetrics.push({ label: "On-time dispatch", value: `${onTime}%` });
  }

  const responseTime = manufacturer.responseTimeHours ?? manufacturer.response_time_hours;
  if (responseTime != null) {
    supplierMetrics.push({ label: "Avg response", value: `≤ ${responseTime}h` });
  }

  const responseRate = manufacturer.responseRate ?? manufacturer.response_rate;
  if (responseRate != null) {
    supplierMetrics.push({ label: "Response rate", value: `${responseRate}%` });
  }

  // 3. Safe Sample Price & Availability Extraction
  const rawSamplePrice = rawProduct.samplePrice ?? rawProduct.sample_price;
  const samplePrice = rawSamplePrice != null ? Number(rawSamplePrice) : null;

  const isSampleAvailable = 
    (samplePrice !== null && samplePrice > 0) || 
    rawProduct.isSampleAvailable === true || 
    rawProduct.is_sample_available === true;

  // 4. Safe Price Tier & Customization Extraction
  const minPrice = rawProduct.minPrice ?? rawProduct.min_price;
  const maxPrice = rawProduct.maxPrice ?? rawProduct.max_price;

  const rawCustomization = rawProduct.customizationOptions ?? rawProduct.customization_options ?? [];
  const customizationOptions = Array.isArray(rawCustomization)
    ? rawCustomization
    : typeof rawCustomization === "string"
    ? JSON.parse(rawCustomization || "[]")
    : [];

  // 5. Extract & Parse A+ Product Details JSON Blocks
  const rawDetails = rawProduct.productDetails ?? rawProduct.product_details;
  let details: any[] = [];

  if (rawDetails) {
    if (typeof rawDetails === "string") {
      try {
        details = JSON.parse(rawDetails);
      } catch (err) {
        console.error("[NORMALIZER] Failed to parse productDetails string:", err);
      }
    } else if (Array.isArray(rawDetails)) {
      details = rawDetails;
    } else if (typeof rawDetails === "object" && Array.isArray(rawDetails.blocks)) {
      details = rawDetails.blocks;
    }
  }

  return {
    id: rawProduct.id,
    name: rawProduct.name || "Untitled Product",
    slug: rawProduct.slug || "",
    videoUrl: rawProduct.videoUrl ?? rawProduct.video_url ?? null,
    protectionEligible: rawProduct.protectionEligible ?? rawProduct.protection_eligible ?? true,

    stats: {
      totalSold: rawProduct.totalSold ?? rawProduct.total_sold ?? null,
      rating: rawProduct.rating ?? rawProduct.avgRating ?? rawProduct.avg_rating ?? null,
      reviewCount: rawProduct.reviewCount ?? rawProduct.numReviews ?? rawProduct.review_count ?? 0,
    },

    pricing: {
      priceTiers: Array.isArray(rawProduct.priceTiers) ? rawProduct.priceTiers : [],
      minPrice: minPrice != null ? Number(minPrice) : null,
      maxPrice: maxPrice != null ? Number(maxPrice) : null,
      samplePrice,
      isSampleAvailable,
      moq: rawProduct.moq ?? 1,
      unit: rawProduct.unit || "Piece",
    },

    customizationOptions,

    specifications: typeof rawProduct.specifications === "object" && rawProduct.specifications !== null
      ? rawProduct.specifications
      : {},

    images: Array.isArray(rawProduct.images) ? rawProduct.images : [],

    // Added productDetails mapping here
    details,

    supplier: {
      name: manufacturer.name || "Verified Supplier",
      slug: manufacturer.slug || "",
      isVerified: manufacturer.isVerified ?? true,
      yearsOnPlatform: manufacturer.yearEstablished ? (new Date().getFullYear() - manufacturer.yearEstablished) : 1,
      location: locationStr,
      metrics: supplierMetrics,
      mainMarkets: Array.isArray(manufacturer.mainMarkets) ? manufacturer.mainMarkets : [],
    },

    similarProducts: (rawSimilar || []).map((p: any) => ({
      id: p.id,
      name: p.name || "",
      slug: p.slug || "",
      image: Array.isArray(p.images) ? p.images[0] : null,
      minPrice: p.minPrice ?? p.min_price ? Number(p.minPrice ?? p.min_price) : 0,
      moq: p.moq ?? 1,
      unit: p.unit || "Piece",
    })),
  };
}
*/
export interface PriceTier {
  minQty: number;
  maxQty?: number | null;
  price: number;
}

export interface SupplierMetric {
  label: string;
  value: string;
}

export function normalizeProductData(rawProduct: any, rawSimilar: any[] = []) {
  if (!rawProduct) return null;

  // 1. Extract Manufacturer / Location
  const manufacturer = rawProduct.manufacturer || {};
  const locationObj = manufacturer.location || {};
  
  let locationStr = "India";
  if (typeof locationObj === "string") {
    locationStr = locationObj;
  } else if (locationObj.city || locationObj.state || locationObj.country) {
    locationStr = [locationObj.city, locationObj.state, locationObj.country].filter(Boolean).join(", ");
  }

  // 2. Build Supplier Metrics
  const supplierMetrics: SupplierMetric[] = [];
  const onTime = manufacturer.onTimeDispatchRate ?? manufacturer.on_time_dispatch_rate;
  if (onTime != null) {
    supplierMetrics.push({ label: "On-time dispatch", value: `${onTime}%` });
  }

  const responseTime = manufacturer.responseTimeHours ?? manufacturer.response_time_hours;
  if (responseTime != null) {
    supplierMetrics.push({ label: "Avg response", value: `≤ ${responseTime}h` });
  }

  const responseRate = manufacturer.responseRate ?? manufacturer.response_rate;
  if (responseRate != null) {
    supplierMetrics.push({ label: "Response rate", value: `${responseRate}%` });
  }

  // 3. Safe Sample Price & Availability Extraction
  const rawSamplePrice = rawProduct.samplePrice ?? rawProduct.sample_price;
  const samplePrice = rawSamplePrice != null ? Number(rawSamplePrice) : null;

  const isSampleAvailable = 
    (samplePrice !== null && samplePrice > 0) || 
    rawProduct.isSampleAvailable === true || 
    rawProduct.is_sample_available === true;

  // 4. Safe Price Tier & Customization Extraction
  const minPrice = rawProduct.minPrice ?? rawProduct.min_price;
  const maxPrice = rawProduct.maxPrice ?? rawProduct.max_price;

  const rawCustomization = rawProduct.customizationOptions ?? rawProduct.customization_options ?? [];
  const customizationOptions = Array.isArray(rawCustomization)
    ? rawCustomization
    : typeof rawCustomization === "string"
    ? JSON.parse(rawCustomization || "[]")
    : [];

  // 5. Extract & Parse A+ Product Details JSON Blocks
  const rawDetails = rawProduct.productDetails ?? rawProduct.product_details;
  let details: any[] = [];

  if (rawDetails) {
    if (typeof rawDetails === "string") {
      try {
        details = JSON.parse(rawDetails);
      } catch (err) {
        console.error("[NORMALIZER] Failed to parse productDetails string:", err);
      }
    } else if (Array.isArray(rawDetails)) {
      details = rawDetails;
    } else if (typeof rawDetails === "object" && Array.isArray(rawDetails.blocks)) {
      details = rawDetails.blocks;
    }
  }

  return {
    id: rawProduct.id,
    name: rawProduct.name || "Untitled Product",
    slug: rawProduct.slug || "",
    videoUrl: rawProduct.videoUrl ?? rawProduct.video_url ?? null,
    protectionEligible: rawProduct.protectionEligible ?? rawProduct.protection_eligible ?? true,

    stats: {
      totalSold: rawProduct.totalSold ?? rawProduct.total_sold ?? null,
      rating: rawProduct.rating ?? rawProduct.avgRating ?? rawProduct.avg_rating ?? null,
      reviewCount: rawProduct.reviewCount ?? rawProduct.numReviews ?? rawProduct.review_count ?? 0,
    },

    pricing: {
      priceTiers: Array.isArray(rawProduct.priceTiers) ? rawProduct.priceTiers : [],
      minPrice: minPrice != null ? Number(minPrice) : null,
      maxPrice: maxPrice != null ? Number(maxPrice) : null,
      samplePrice,
      isSampleAvailable,
      moq: rawProduct.moq ?? 1,
      unit: rawProduct.unit || "Piece",
    },

    customizationOptions,

    specifications: typeof rawProduct.specifications === "object" && rawProduct.specifications !== null
      ? rawProduct.specifications
      : {},

    images: Array.isArray(rawProduct.images) ? rawProduct.images : [],

    // Added productDetails mapping here
    details,

    supplier: {
      name: manufacturer.name || "Verified Supplier",
      slug: manufacturer.slug || "",
      logo: manufacturer.logo || null, // <--- Mapped Cloudinary logo URL from database here
      isVerified: manufacturer.isVerified ?? true,
      yearsOnPlatform: manufacturer.yearEstablished ? (new Date().getFullYear() - manufacturer.yearEstablished) : 1,
      location: locationStr,
      metrics: supplierMetrics,
      mainMarkets: Array.isArray(manufacturer.mainMarkets) ? manufacturer.mainMarkets : [],
    },

    similarProducts: (rawSimilar || []).map((p: any) => ({
      id: p.id,
      name: p.name || "",
      slug: p.slug || "",
      image: Array.isArray(p.images) ? p.images[0] : null,
      minPrice: p.minPrice ?? p.min_price ? Number(p.minPrice ?? p.min_price) : 0,
      moq: p.moq ?? 1,
      unit: p.unit || "Piece",
    })),
  };
}