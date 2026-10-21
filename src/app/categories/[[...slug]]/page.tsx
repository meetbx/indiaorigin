'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CategoryHeader from '@/components/CategoryHeader';
import BottomNav from "@/components/layout/BottomNav";
import { AlertCircle, RefreshCw, LayoutGrid, X, ChevronRight, ArrowLeft } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url?: string;
}

interface Recommendation {
  id: string;
  name: string;
  target_slug: string;
  image_url: string;
  badge_text?: string;
}

interface CategoryDetails {
  category: Category;
  banners: Banner[];
  recommendations: Recommendation[];
  children: Category[];
}

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const currentSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [categories, setCategories] = useState<Category[]>([]);
  const [details, setDetails] = useState<CategoryDetails | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Modal State for "View All" drill-down
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null);
  const [subCategoryItems, setSubCategoryItems] = useState<Recommendation[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const MAX_VISIBLE_RECOMMENDATIONS = 11;

  // 1. Fetch Top-Level Sidebar Categories
  useEffect(() => {
    async function loadSidebarCategories() {
      try {
        setSidebarLoading(true);
        const res = await fetch('/api/categories');
        const json = await res.json();

        if (json.success && json.data.length > 0) {
          setCategories(json.data);
          if (!currentSlug) {
            const defaultCategory = json.data.find((c: Category) => c.slug === 'for-you') || json.data[0];
            router.replace(`/categories/${defaultCategory.slug}`);
          }
        } else {
          setError('No categories found.');
        }
      } catch (err) {
        setError('Failed to load categories.');
      } finally {
        setSidebarLoading(false);
      }
    }

    loadSidebarCategories();
  }, []);

  // 2. Fetch Selected Category Content when slug changes
  useEffect(() => {
    if (!currentSlug) return;

    async function loadCategoryDetails() {
      try {
        setContentLoading(true);
        setError(null);
        const res = await fetch(`/api/categories/${currentSlug}`);
        const json = await res.json();

        if (json.success) {
          setDetails(json.data);
        } else {
          setError('Unable to load category content.');
        }
      } catch (err) {
        setError('Unable to load category details.');
      } finally {
        setContentLoading(false);
      }
    }

    loadCategoryDetails();
  }, [currentSlug]);

  const handleSelectCategory = (slug: string) => {
    if (slug === currentSlug) return;
    setSelectedSubCategory(null); // Reset sub-category state when switching main category
    router.push(`/categories/${slug}`, { scroll: false });
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Handle clicking a sub-category inside the "View All" sheet to load its items (Image B view)
  const handleSelectSubCategory = async (subCat: Category) => {
    setSelectedSubCategory(subCat);
    setSubLoading(true);
    try {
      const res = await fetch(`/api/categories/${subCat.slug}`);
      const json = await res.json();
      if (json.success) {
        setSubCategoryItems(json.data.recommendations);
      }
    } catch (err) {
      console.error("Failed to load sub-category items", err);
    } finally {
      setSubLoading(false);
    }
  };

  // Prepare recommendations slicing (Max 11 items + View All tile)
  const allRecommendations = details?.recommendations || [];
  const hasMoreThanLimit = allRecommendations.length > MAX_VISIBLE_RECOMMENDATIONS;
  const displayedRecommendations = hasMoreThanLimit 
    ? allRecommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS) 
    : allRecommendations;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white overflow-hidden text-gray-950">
      {/* Header */}
      <CategoryHeader />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden pb-16 md:pb-0">
        
        {/* LEFT SIDEBAR - Smooth Vertical Scrolling */}
        <aside 
          className="w-[28%] md:w-64 bg-[#F5F5F7] overflow-y-auto scroll-smooth border-r border-gray-200 select-none flex-shrink-0 no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sidebarLoading ? (
            <div className="p-3 space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <nav className="py-1">
              {categories.map((cat) => {
                const isActive = cat.slug === currentSlug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`w-full text-left px-3 py-3.5 text-xs md:text-sm font-medium transition-all relative flex items-center justify-between ${
                      isActive
                        ? 'bg-white text-gray-950 font-bold'
                        : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100/50'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00] rounded-r" />
                    )}
                    <span className="line-clamp-2 leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        {/* RIGHT CONTENT AREA - Smooth Vertical Scrolling */}
        <main 
          className="flex-1 overflow-y-auto scroll-smooth bg-white p-3 md:p-6 no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-gray-700 font-medium mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold hover:bg-[#e05e00] transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          ) : contentLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-6 animate-pulse">
              <div className="w-full h-28 md:h-40 bg-gray-200 rounded-xl" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 rounded-full" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : details ? (
            <div className="space-y-5">
              
              {/* Category Banner */}
              {details.banners.length > 0 && (
                <div className="relative w-full h-28 md:h-40 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                  {details.banners[0].link_url ? (
                    <Link href={details.banners[0].link_url} className="block relative w-full h-full">
                      <BannerImage banner={details.banners[0]} />
                    </Link>
                  ) : (
                    <BannerImage banner={details.banners[0]} />
                  )}
                </div>
              )}

              {/* Recommendations Section Header */}
              <div className="pt-1">
                <h2 className="text-base md:text-lg font-bold text-gray-950">Recommendations</h2>
              </div>

              {/* 3-Column Recommendations Grid */}
              <div className="grid grid-cols-3 gap-y-5 gap-x-2 md:gap-6">
                {displayedRecommendations.map((item) => {
                  const isFallback = imageErrors[item.id] || !item.image_url;

                  return (
                    <Link
                      key={item.id}
                      href={`/search?category=${encodeURIComponent(item.target_slug)}`}
                      className="flex flex-col items-center group text-center"
                    >
                      {/* Circular Light-Gray Container */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-[#F5F5F7] flex items-center justify-center p-2 mb-2 group-hover:bg-gray-200/80 transition-colors">
                        
                        {/* Optional Badge */}
                        {item.badge_text && (
                          <span className="absolute top-0 right-0 bg-white border border-orange-200 text-[#FF6B00] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm z-10 flex items-center justify-center">
                            {item.badge_text}
                          </span>
                        )}

                        {/* Recommendation Image */}
                        {!isFallback ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-contain w-full h-full p-1"
                            onError={() => handleImageError(item.id)}
                            unoptimized
                          />
                        ) : (
                          <div className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                            {item.name.substring(0, 2)}
                          </div>
                        )}
                      </div>

                      {/* Name Label */}
                      <span className="text-xs md:text-sm font-medium text-gray-850 line-clamp-2 leading-tight group-hover:text-[#FF6B00] transition-colors max-w-[90px] md:max-w-[120px]">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}

                {/* "View All" Tile (Triggers Sub-Category Sheet - Image A) */}
                {hasMoreThanLimit && (
                  <button
                    onClick={() => setIsViewAllOpen(true)}
                    className="flex flex-col items-center group text-center cursor-pointer"
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-[#F5F5F7] flex items-center justify-center p-2 mb-2 group-hover:bg-gray-200 transition-colors text-gray-600">
                      <LayoutGrid className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5]" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-850 line-clamp-2 leading-tight group-hover:text-[#FF6B00] transition-colors max-w-[90px] md:max-w-[120px]">
                      View all
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* VIEW ALL BOTTOM SHEET MODAL (Image A & Image B Drill-Down) */}

      {/* VIEW ALL BOTTOM SHEET MODAL (Image A & Image B Drill-Down) */}
      {isViewAllOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex flex-col justify-end animate-fadeIn">
          <div className="bg-white w-full max-h-[75vh] rounded-t-2xl flex flex-col overflow-hidden shadow-2xl pb-16 animate-slideUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              {selectedSubCategory ? (
                <button 
                  onClick={() => setSelectedSubCategory(null)} 
                  className="p-1 text-gray-700 flex items-center gap-1 font-semibold text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
              ) : <div className="w-12" />}
              
              <h3 className="font-bold text-base text-gray-950 text-center truncate px-2">
                {selectedSubCategory ? selectedSubCategory.name : details?.category.name}
              </h3>
              
              <button 
                onClick={() => { setIsViewAllOpen(false); setSelectedSubCategory(null); }} 
                className="p-1 text-gray-500 hover:text-gray-950 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {!selectedSubCategory ? (
                /* IMAGE A VIEW: List of Sub-Categories */
                <div className="space-y-1">
                  {details?.children && details.children.length > 0 ? (
                    details.children.map((subCat) => (
                      <button
                        key={subCat.id}
                        onClick={() => handleSelectSubCategory(subCat)}
                        className="w-full flex items-center justify-between py-3.5 px-2 border-b border-gray-100 text-left hover:bg-gray-50 transition cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-gray-850">{subCat.name}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm">No sub-categories available.</p>
                  )}
                </div>
              ) : (
                /* IMAGE B VIEW: Grid of Items inside Sub-Category */
                <div>
                  {subLoading ? (
                    <div className="grid grid-cols-4 gap-4 animate-pulse py-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-16 h-16 bg-gray-200 rounded-full mx-auto" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                      {subCategoryItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/search?category=${encodeURIComponent(item.target_slug)}`}
                          onClick={() => { setIsViewAllOpen(false); setSelectedSubCategory(null); }}
                          className="flex flex-col items-center text-center group"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center p-1.5 mb-1.5 group-hover:bg-gray-200 transition">
                            <Image 
                              src={item.image_url} 
                              alt={item.name} 
                              width={70} 
                              height={70} 
                              className="object-contain w-full h-full" 
                              unoptimized 
                            />
                          </div>
                          <span className="text-[11px] font-medium text-gray-850 line-clamp-2 leading-tight">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}



      {/* Mobile Navigation Bar */}
      <BottomNav />
    </div>
  );
}

// Sub-component for rendering banner graphics safely
function BannerImage({ banner }: { banner: Banner }) {
  return (
    <div className="relative w-full h-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-800 to-emerald-600 text-white">
      <div className="z-10 max-w-[65%]">
        <h3 className="font-bold text-sm md:text-lg leading-snug">{banner.title}</h3>
        {banner.subtitle && (
          <p className="text-xs text-emerald-100 mt-1 line-clamp-2">{banner.subtitle}</p>
        )}
      </div>
      {banner.image_url && (
        <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0">
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}