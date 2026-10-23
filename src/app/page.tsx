"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { FeaturedSection } from "@/components/marketplace/FeaturedSection";
import { Product, ProductApiResponse } from "@/types/marketplace";

// In-memory cache survives client-side navigation away from and back to the home page.
// sessionStorage provides a lightweight fallback after a full reload in the same tab.
type HomeProductsCacheEntry = {
  data: Product[];
  hasMore: boolean;
  page: number;
  savedAt: number;
};
const homeProductsCache = new Map<string, HomeProductsCacheEntry>();
const HOME_CACHE_TTL_MS = 2 * 60 * 1000;
const homeCacheKey = (search: string, category: string) =>
  `indiaorigin:home-products:v1:${encodeURIComponent(search.trim())}:${encodeURIComponent(category || "all")}`;

function readHomeCache(key: string): HomeProductsCacheEntry | null {
  const inMemory = homeProductsCache.get(key);
  if (inMemory && Date.now() - inMemory.savedAt < HOME_CACHE_TTL_MS) return inMemory;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeProductsCacheEntry;
    if (!parsed || !Array.isArray(parsed.data) || Date.now() - parsed.savedAt >= HOME_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    homeProductsCache.set(key, parsed);
    return parsed;
  } catch {
    // Storage may be disabled or full; the in-memory cache still works.
    return null;
  }
}

function writeHomeCache(key: string, entry: HomeProductsCacheEntry) {
  homeProductsCache.set(key, entry);
  try { window.sessionStorage.setItem(key, JSON.stringify(entry)); } catch { /* optional cache */ }
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("products");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (isInitial = false, pageNum = 1) => {
      const cacheKey = homeCacheKey(searchQuery, selectedCategory);
      const cached = isInitial && pageNum === 1 ? readHomeCache(cacheKey) : null;

      // If cached products exist, keep them visible and refresh quietly in the background.
      setIsLoading(!cached);
      setError(null);
      if (cached) {
        setProducts(cached.data);
        setHasMore(cached.hasMore);
        setPage(cached.page);
      }

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "12",
          search: searchQuery,
          category: selectedCategory,
        });

        const res = await fetch(`/api/products?${params.toString()}`);
        const result: ProductApiResponse = await res.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load products");
        }

        if (isInitial) {
          setProducts(result.data);
          writeHomeCache(cacheKey, {
            data: result.data,
            hasMore: result.pagination.hasMore,
            page: result.pagination.page,
            savedAt: Date.now(),
          });
        } else {
          setProducts((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.pagination.hasMore);
        setPage(result.pagination.page);
      } catch (err: any) {
        // Don't replace a usable cached page with an error when only the refresh failed.
        if (!cached) setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedCategory]
  );

  useEffect(() => {
    fetchProducts(true, 1);
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const handleSearchClick = () => {
    router.push(searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : "/search");
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchProducts(false, page + 1);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 md:pb-10 font-sans">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSearchClick={handleSearchClick}
        activeTopTab={activeTopTab}
        setActiveTopTab={setActiveTopTab}
      />

      <FilterBar
        activeFilter=""
        setActiveFilter={() => {}}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <main>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onRetry={() => fetchProducts(true, 1)}
          onClearFilters={handleClearFilters}
        />

        <FeaturedSection />
      </main>
    </div>
  );
}