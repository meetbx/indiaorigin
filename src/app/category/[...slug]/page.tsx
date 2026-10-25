"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { FeaturedSection } from "@/components/marketplace/FeaturedSection";
import { Product } from "@/types/marketplace";

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  children?: { id: string; name: string; slug: string }[];
}

export default function CategoryBrowsingPage({
  params,
}: {
  params: Promise<{ slug?: string[] }> | { slug?: string[] };
}) {
  const router = useRouter();
  const resolvedParams = use(params as Promise<{ slug?: string[] }>);
  
  const slugSegments = Array.isArray(resolvedParams?.slug)
    ? resolvedParams.slug
    : resolvedParams?.slug
    ? [resolvedParams.slug]
    : [];

  const currentSlug = slugSegments[slugSegments.length - 1] || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("products");

  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; slug: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchCategoryData = useCallback(async (pageNum = 1, isInitial = true) => {
    if (!currentSlug || slugSegments.length === 0) return;
    setIsLoading(isInitial);
    setError(null);

    try {
      const endpoint = `/api/category/${slugSegments.join("/")}?page=${pageNum}&limit=12`;
      const res = await fetch(endpoint);
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load category data.");
      }

      setCategory(result.category);
      setSubcategories(result.category?.children || []);
      setBreadcrumbs(result.breadcrumbs || []);

      if (isInitial) {
        setProducts(result.products || []);
      } else {
        setProducts((prev) => [...prev, ...(result.products || [])]);
      }

      setHasMore(result.pagination?.hasMore || false);
      setPage(result.pagination?.page || pageNum);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [currentSlug, slugSegments]);

  useEffect(() => {
    if (currentSlug) {
      fetchCategoryData(1, true);
    }
  }, [currentSlug, fetchCategoryData]);

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
      fetchCategoryData(page + 1, false);
    }
  };

  const categoryTitle = category?.name || currentSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

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
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.slug}>
              <span>→</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-slate-800 font-medium">{crumb.name}</span>
              ) : (
                <Link href={`/category/${crumb.slug}`} className="hover:text-orange-600 transition-colors">
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {categoryTitle}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
            {category?.description || `Explore verified manufacturers, suppliers, and industrial products under ${categoryTitle}.`}
          </p>
        </div>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Subcategories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {subcategories.map((sub) => {
                const subPath = [...slugSegments, sub.slug].join("/");
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
          </div>
        )}

        {/* Reused Marketplace ProductGrid Component */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900">Products in {categoryTitle}</h2>
            <span className="text-xs text-slate-500 font-medium">{products.length} items loaded</span>
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onRetry={() => fetchCategoryData(1, true)}
            onClearFilters={() => fetchCategoryData(1, true)}
          />
        </div>

        <FeaturedSection />
      </main>
    </div>
  );
}