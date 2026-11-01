
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { FeaturedSection } from "@/components/marketplace/FeaturedSection";
import {
  Product,
  ProductApiResponse,
} from "@/types/marketplace";

type HomeProductsCacheEntry = {
  data: Product[];
  hasMore: boolean;
  page: number;
  savedAt: number;
};

type HomePageClientProps = {
  initialProducts: Product[];
  initialHasMore: boolean;
  initialError: string | null;
};

const homeProductsCache = new Map<string, HomeProductsCacheEntry>();
const HOME_CACHE_TTL_MS = 2 * 60 * 1000;

const homeCacheKey = (search: string, category: string) =>
  `indiaorigin:home-products:v1:${encodeURIComponent(
    search.trim()
  )}:${encodeURIComponent(category || "all")}`;

function readHomeCache(key: string): HomeProductsCacheEntry | null {
  const inMemory = homeProductsCache.get(key);

  if (inMemory && Date.now() - inMemory.savedAt < HOME_CACHE_TTL_MS) {
    return inMemory;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as HomeProductsCacheEntry;

    if (
      !parsed ||
      !Array.isArray(parsed.data) ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt >= HOME_CACHE_TTL_MS
    ) {
      window.sessionStorage.removeItem(key);
      homeProductsCache.delete(key);
      return null;
    }

    homeProductsCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeHomeCache(
  key: string,
  entry: HomeProductsCacheEntry
) {
  homeProductsCache.set(key, entry);

  try {
    window.sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sessionStorage is optional.
  }
}

function mergeUniqueProducts(
  existing: Product[],
  incoming: Product[]
): Product[] {
  const seen = new Set(existing.map((product) => product.id));

  const merged = [...existing];

  for (const product of incoming) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      merged.push(product);
    }
  }

  return merged;
}

export default function HomePageClient({
  initialProducts,
  initialHasMore,
  initialError,
}: HomePageClientProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("products");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  // Keep the latest product list accessible to async operations.
  const productsRef = useRef<Product[]>(initialProducts);

  // Prevent outdated requests from overwriting newer results.
  const requestIdRef = useRef(0);
  const requestInFlightRef = useRef(false);

  // Seed server-rendered products only if there is no valid cache.
  // Never overwrite an existing valid cache with potentially stale props.
  useEffect(() => {
    const key = homeCacheKey("", "all");
    const existing = readHomeCache(key);

    if (!existing && initialProducts.length > 0) {
      writeHomeCache(key, {
        data: initialProducts,
        hasMore: initialHasMore,
        page: 1,
        savedAt: Date.now(),
      });
    }
  }, [initialProducts, initialHasMore]);

  const fetchProducts = useCallback(
    async (
      isFirstPage: boolean,
      pageNum: number,
      signal?: AbortSignal
    ) => {
      const requestId = ++requestIdRef.current;

      requestInFlightRef.current = true;

      const cacheKey = homeCacheKey(searchQuery, selectedCategory);

      const cached =
        isFirstPage && pageNum === 1
          ? readHomeCache(cacheKey)
          : null;

      // Display cached products immediately.
      if (cached) {
        productsRef.current = cached.data;
        setProducts(cached.data);
        setHasMore(cached.hasMore);
        setPage(cached.page);
      }

      setIsLoading(!cached);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "12",
          search: searchQuery,
          category: selectedCategory,
        });

        const response = await fetch(
          `/api/products?${params.toString()}`,
          {
            signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const result: ProductApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load products");
        }

        // Ignore aborted or outdated responses.
        if (
          signal?.aborted ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        let updatedProducts: Product[];

        if (isFirstPage) {
          updatedProducts = mergeUniqueProducts([], result.data);
        } else {
          updatedProducts = mergeUniqueProducts(
            productsRef.current,
            result.data
          );
        }

        // Update the ref and React state together.
        productsRef.current = updatedProducts;
        setProducts(updatedProducts);

        setHasMore(result.pagination.hasMore);
        setPage(result.pagination.page);

        // Save both first-page refreshes and Load More results.
        writeHomeCache(cacheKey, {
          data: updatedProducts,
          hasMore: result.pagination.hasMore,
          page: result.pagination.page,
          savedAt: Date.now(),
        });
      } catch (err) {
        if (
          signal?.aborted ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.";

        // Keep cached products visible if refresh fails.
        if (!cached) {
          setError(message);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          requestInFlightRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [searchQuery, selectedCategory]
  );

  // Always fetch page 1 on initial mount and when filters change.
  // Cache is displayed first when available.
  useEffect(() => {
    const controller = new AbortController();

    void fetchProducts(true, 1, controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProducts]);

  // Refresh page 1 when the user returns using browser Back/Forward.
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === "/") {
        void fetchProducts(true, 1);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [fetchProducts]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const query = searchQuery.trim();

    router.push(
      query
        ? `/search?q=${encodeURIComponent(query)}`
        : "/search"
    );
  };

  const handleSearchClick = () => {
    const query = searchQuery.trim();

    router.push(
      query
        ? `/search?q=${encodeURIComponent(query)}`
        : "/search"
    );
  };

  const handleLoadMore = () => {
    if (
      !requestInFlightRef.current &&
      !isLoading &&
      hasMore
    ) {
      void fetchProducts(false, page + 1);
    }
  };

  const handleRetry = () => {
    if (!requestInFlightRef.current) {
      void fetchProducts(true, 1);
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
          onRetry={handleRetry}
          onClearFilters={handleClearFilters}
        />

        <FeaturedSection />
      </main>
    </div>
  );
}
