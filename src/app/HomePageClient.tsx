
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

  // Store the server-rendered first page in the client cache.
  useEffect(() => {
    if (initialProducts.length > 0) {
      writeHomeCache(homeCacheKey("", "all"), {
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
      const cacheKey = homeCacheKey(searchQuery, selectedCategory);
      const cached =
        isFirstPage && pageNum === 1
          ? readHomeCache(cacheKey)
          : null;

      if (cached) {
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
          { signal }
        );

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const result: ProductApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load products");
        }

        if (signal?.aborted) return;

        if (isFirstPage) {
          setProducts(result.data);

          writeHomeCache(cacheKey, {
            data: result.data,
            hasMore: result.pagination.hasMore,
            page: result.pagination.page,
            savedAt: Date.now(),
          });
        } else {
          setProducts((previous) => [
            ...previous,
            ...result.data,
          ]);
        }

        setHasMore(result.pagination.hasMore);
        setPage(result.pagination.page);
      } catch (err) {
        if (signal?.aborted) return;

        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.";

        // Keep cached products visible if a background refresh fails.
        if (!cached) {
          setError(message);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [searchQuery, selectedCategory]
  );

  // Fetch only when the search or category actually changes.
  // Comparing the previous key also makes this safe under Strict Mode.
  const previousFilterKey = useRef(
    homeCacheKey("", "all")
  );

  useEffect(() => {
    const currentKey = homeCacheKey(
      searchQuery,
      selectedCategory
    );

    if (previousFilterKey.current === currentKey) {
      return;
    }

    previousFilterKey.current = currentKey;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      void fetchProducts(true, 1, controller.signal);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery, selectedCategory, fetchProducts]);

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
    if (!isLoading && hasMore) {
      void fetchProducts(false, page + 1);
    }
  };

  const handleRetry = () => {
    void fetchProducts(true, 1);
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
