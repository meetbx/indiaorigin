export interface Location {
  state?: string;
  country?: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
  city: string;
  badge?: "DIAMOND" | "GOLD" | "SILVER" | "NONE";
  logo?: string | null;
  certifications?: string[];
  gstNumber?: string | null; // Add this
  location?: Location | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  moq: number;
  unit: string;
  specifications?: Record<string, string>;
  inStock?: boolean;
  categoryId: string;
  manufacturerId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  manufacturer: Manufacturer;
}

export interface ProductApiResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}