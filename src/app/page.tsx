"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { FeaturedSection } from "@/components/marketplace/FeaturedSection";
import { Product, ProductApiResponse } from "@/types/marketplace";

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
      setIsLoading(true);
      setError(null);

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
        } else {
          setProducts((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.pagination.hasMore);
        setPage(result.pagination.page);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
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