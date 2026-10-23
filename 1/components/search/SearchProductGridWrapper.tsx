"use client";

import React from "react";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Product } from "@/types/marketplace";
import { useRouter } from "next/navigation";

interface SearchProductGridWrapperProps {
  products: Product[];
  hasMore: boolean;
  nextPageUrl: string;
}

export default function SearchProductGridWrapper({
  products,
  hasMore,
  nextPageUrl,
}: SearchProductGridWrapperProps) {
  const router = useRouter();

  return (
    <>
      <ProductGrid
        products={products}
        isLoading={false}
        error={null}
        hasMore={hasMore}
        onLoadMore={() => {
          if (hasMore) {
            router.push(nextPageUrl);
          }
        }}
        onRetry={() => {
          window.location.reload();
        }}
        onClearFilters={() => {
          router.push("/search");
        }}
      />
    </>
  );
}