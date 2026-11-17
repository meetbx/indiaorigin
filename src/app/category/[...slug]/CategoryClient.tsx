
"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { FeaturedSection } from "@/components/marketplace/FeaturedSection";
import type { Product } from "@/types/marketplace";

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryClientProps {
  slugSegments: string[];
  category: CategoryInfo;
  breadcrumbs: Breadcrumb[];
  subcategories: Subcategory[];
  initialProducts: Product[];
  initialPage: number;
  hasMoreInitially: boolean;
  totalProducts: number;
}

export default function CategoryClient({
  slugSegments,
  category,
  breadcrumbs,
  subcategories,
  initialProducts,
  initialPage,
  hasMoreInitially,
  totalProducts,
}: CategoryClientProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("products");

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(hasMoreInitially);

  const categoryTitle = category.name;

  const fetchCategoryData = useCallback(
    async (pageNum = 1, isInitial = false) => {
      if (!slugSegments.length || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const encodedPath = slugSegments
          .map((segment) => encodeURIComponent(segment))
          .join("/");

        const endpoint = `/api/category/${encodedPath}?page=${pageNum}&limit=12`;

        const response = await fetch(endpoint, {
          method: "GET",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load category products."
          );
        }

        const nextProducts: Product[] = result.products || [];

        if (isInitial) {
          setProducts(nextProducts);
        } else {
          setProducts((previous) => {
            const existingIds = new Set(previous.map((item) => item.id));
            const uniqueNextProducts = nextProducts.filter(
              (item) => !existingIds.has(item.id)
            );

            return [...previous, ...uniqueNextProducts];
          });
        }

        setPage(result.pagination?.page ?? pageNum);
        setHasMore(Boolean(result.pagination?.hasMore));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [slugSegments, isLoading]
  );

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/search");
    }
  };

  const handleSearchClick = () => {
    const query = searchQuery.trim();

    router.push(
      query ? `/search?q=${encodeURIComponent(query)}` : "/search"
    );
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchCategoryData(page + 1, false);
    }
  };

  const handleRetry = () => {
    fetchCategoryData(1, true);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    fetchCategoryData(1, true);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-sm text-slate-500 mb-6 overflow-x-auto whitespace-nowrap pb-2"
        >
          <Link
            href="/"
            className="hover:text-orange-600 transition-colors"
          >
            Home
          </Link>

          {breadcrumbs.map((crumb, index) => {
            const crumbPath = breadcrumbs
              .slice(0, index + 1)
              .map((item) => item.slug)
              .join("/");

            const isLast = index === breadcrumbs.length - 1;

            return (
              <React.Fragment key={crumb.id}>
                <span aria-hidden="true">→</span>

                {isLast ? (
                  <span
                    className="text-slate-800 font-medium"
                    aria-current="page"
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={`/category/${crumbPath}`}
                    className="hover:text-orange-600 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Category Header */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {categoryTitle}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
            {category.description}
          </p>
        </section>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <section className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              Subcategories
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {subcategories.map((sub) => {
                const subPath = [...slugSegments, sub.slug]
                  .map((segment) => encodeURIComponent(segment))
                  .join("/");

                return (
                  <Link
                    key={sub.id}
                    href={`/category/${subPath}`}
                    className="bg-slate-50 border border-slate-200 hover:border-orange-500 rounded-xl p-3 text-center transition-all shadow-sm hover:shadow group"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-orange-600 line-clamp-2">
                      {sub.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900">
              Products in {categoryTitle}
            </h2>

            <span className="text-xs text-slate-500 font-medium">
              {products.length} of {totalProducts} items loaded
            </span>
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onRetry={handleRetry}
            onClearFilters={handleClearFilters}
          />
        </section>

        <FeaturedSection />
      </main>
    </div>
  );
}
