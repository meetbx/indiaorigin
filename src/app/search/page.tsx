import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Search, ArrowLeft } from "lucide-react";
import SearchInterface from "@/components/search/SearchInterface";
import { executeProductSearch } from "@/lib/services/search.service";
import SearchProductGridWrapper from "@/components/search/SearchProductGridWrapper";
import { searchParamsSchema } from "@/lib/validations/search";
import { Product } from "@/types/marketplace";

interface SearchProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const rawParams = await searchParams;
  
  const parsedValidation = searchParamsSchema.safeParse(rawParams);
  const filters = parsedValidation.success ? parsedValidation.data : {
    page: 1,
    limit: 20,
    sort: "relevance" as const,
  };

  const {
    q,
    category,
    categoryId,
    minPrice,
    maxPrice,
    minMoq,
    maxMoq,
    material,
    state,
    verifiedOnly,
    sort,
    page,
    limit,
  } = filters;

  const session = await getServerSession();
  let userHistory: { id: string; query: string }[] = [];

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        searchHistory: {
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, query: true },
        },
      },
    });
    if (user?.searchHistory) {
      userHistory = user.searchHistory;
    }
  }

  const recommendedTerms = [
    "virgin plastic",
    "garage tiles",
    "vegetable chips",
    "lemon juice",
    "xinfa pvc sg-5",
  ];

  const hasActiveFilters = Boolean(
    q || category || categoryId || minPrice !== undefined || maxPrice !== undefined || minMoq !== undefined || maxMoq !== undefined || material || state || verifiedOnly
  );

  if (!hasActiveFilters) {
    return (
      <SearchInterface
        initialQuery={typeof rawParams.q === "string" ? rawParams.q : ""}
        serverHistory={userHistory}
        recommendedTerms={recommendedTerms}
      />
    );
  }

  const searchResult = await executeProductSearch({
    q,
    categorySlug: category,
    categoryId,
    minPrice,
    maxPrice,
    minMoq,
    maxMoq,
    material,
    state,
    verifiedOnly,
    sort,
    page,
    limit,
  });

  const categoriesList = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });

  const formattedProducts: Product[] = searchResult.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    moq: p.moq,
    unit: p.unit,
    images: p.images,
    inStock: p.inStock,
    isPublished: p.isPublished,
    specifications: p.specifications as Record<string, any>,
    manufacturer: {
      id: p.supplier.id,
      name: p.supplier.name,
      slug: p.supplier.slug,
      logo: p.supplier.logo || undefined,
      isVerified: p.supplier.isVerified,
      badge: p.supplier.badge as any,
      location: {
        state: p.supplier.location.state,
        slug: p.supplier.location.slug,
      },
    },
  }));

  const hasMore = page < searchResult.meta.totalPages;
  const nextPageParams = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined ? { minPrice: String(minPrice) } : {}),
    ...(maxPrice !== undefined ? { maxPrice: String(maxPrice) } : {}),
    ...(sort ? { sort } : {}),
    page: String(page + 1),
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-20 max-w-7xl mx-auto shadow-2xl border-x border-gray-200">
      {/* Mobile Sticky Header */}
      <header className="bg-white p-3 sticky top-0 z-40 border-b border-gray-100 shadow-sm flex items-center gap-3">
        <Link href="/search" className="text-gray-700 hover:text-[#FF5500] flex-shrink-0 p-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Link 
          href="/search"
          className="flex-1 min-w-0 bg-gray-100 rounded-full flex items-center px-3.5 py-2 border border-gray-200 hover:bg-gray-200/80 transition cursor-pointer"
        >
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className="text-xs font-bold text-gray-800 truncate">{q || category || "All Products"}</span>
        </Link>
      </header>

      {/* Horizontal Scrollable Filter Bar & Sorting */}
      <div className="bg-white px-3 py-2.5 border-b border-gray-100 flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar text-xs items-center py-1">
          <Link
            href="/search"
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition ${
              !category && !categoryId ? "bg-[#FF5500] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            All
          </Link>
          {categoriesList.map((cat) => {
            const queryParams = new URLSearchParams();
            if (q) queryParams.set("q", q);
            queryParams.set("category", cat.slug);
            return (
              <Link
                key={cat.id}
                href={`/search?${queryParams.toString()}`}
                className={`px-3.5 py-1.5 rounded-full font-medium shrink-0 transition ${
                  category === cat.slug ? "bg-[#FF5500] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
          <span>Found <strong className="text-slate-900">{searchResult.meta.total}</strong> products</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Sort:</span>
            <div className="flex gap-1">
              {[
                { label: "Relevance", value: "relevance" },
                { label: "Price", value: "price_asc" },
                { label: "Popular", value: "popular" },
              ].map((s) => {
                const sp = new URLSearchParams();
                if (q) sp.set("q", q);
                if (category) sp.set("category", category);
                sp.set("sort", s.value);
                return (
                  <Link
                    key={s.value}
                    href={`/search?${sp.toString()}`}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition ${
                      sort === s.value ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid & Pagination Wrapper */}
      <main className="p-3">
        <SearchProductGridWrapper
          products={formattedProducts}
          hasMore={hasMore}
          nextPageUrl={`/search?${nextPageParams.toString()}`}
        />
      </main>
    </div>
  );
}