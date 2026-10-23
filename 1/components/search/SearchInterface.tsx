"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Search, Camera, Mic, Sparkles, Trash2, RotateCw, X, Building2, Layers 
} from "lucide-react";
import { deleteSearchQuery, clearAllSearchHistory, saveSearchQuery } from "@/app/actions/searchHistory";

interface SearchHistoryItem {
  id: string;
  query: string;
}

interface SuggestionItem {
  type: "product";
  text: string;
  slug: string;
}

interface CategorySuggestion {
  name: string;
  slug: string;
}

interface ManufacturerSuggestion {
  name: string;
  slug: string;
}

interface SearchInterfaceProps {
  initialQuery?: string;
  serverHistory: SearchHistoryItem[];
  recommendedTerms: string[];
}

export default function SearchInterface({
  initialQuery = "",
  serverHistory,
  recommendedTerms,
}: SearchInterfaceProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"searches" | "images">("searches");
  const [localHistory, setLocalHistory] = useState<SearchHistoryItem[]>(serverHistory);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerSuggestion[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [, setIsLoading] = useState(false);
  const [, setErrorState] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLocalHistory(serverHistory);
  }, [serverHistory]);

  // Debounced Autocomplete effect (~250ms) with AbortController cleanup
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setCategories([]);
      setManufacturers([]);
      setIsDropdownOpen(false);
      setErrorState(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        setErrorState(null);
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to fetch autocomplete suggestions");
        }

        const data = await res.json();
        
        if (!controller.signal.aborted && data.success) {
          setSuggestions(data.suggestions || []);
          setCategories(data.categories || []);
          setManufacturers(data.manufacturers || []);
          setIsDropdownOpen(true);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Autocomplete error:", err);
          setErrorState("Unable to load suggestions");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const handleSearchSubmit = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsDropdownOpen(false);
    await saveSearchQuery(searchQuery.trim());
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRemoveSingleHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLocalHistory((prev) => prev.filter((item) => item.id !== id));
    await deleteSearchQuery(id);
  };

  const handleClearAllHistory = async () => {
    setLocalHistory([]);
    await clearAllSearchHistory();
  };

  return (
    <div className="bg-white min-h-screen p-4 max-w-md mx-auto relative">
      {/* Compact Mobile Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-gray-800 hover:text-[#FF5500] p-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-1 text-lg font-extrabold text-gray-900">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>IndiaOrigin</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Prominent Mobile Search Input Container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit(query);
        }}
        className="relative rounded-2xl p-[2px] bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 mb-6 shadow-sm z-30"
      >
        <div className="bg-white rounded-[14px] p-3 flex flex-col justify-between min-h-[90px] relative">
          <div className="flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industrial products..."
              className="w-full text-base font-medium text-gray-800 outline-none placeholder:text-gray-400"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-3">
            <button type="button" className="text-gray-700 hover:text-gray-900 transition p-2" title="Camera Search">
              <Camera className="w-5 h-5 stroke-[1.75]" />
            </button>
            <button type="button" className="text-gray-700 hover:text-gray-900 transition p-2" title="Voice Search">
              <Mic className="w-5 h-5 stroke-[1.75]" />
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-[#FF5500] to-orange-500 text-white p-2.5 rounded-xl shadow-md hover:opacity-95 transition"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Viewport-Safe Autocomplete Dropdown */}
          {isDropdownOpen && (suggestions.length > 0 || categories.length > 0 || manufacturers.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
              {suggestions.length > 0 && (
                <div className="py-2 border-b border-slate-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products</div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={`sug-${idx}`}
                      type="button"
                      onClick={() => handleSearchSubmit(item.text)}
                      className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-800 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {categories.length > 0 && (
                <div className="py-2 border-b border-slate-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categories</div>
                  {categories.map((cat, idx) => (
                    <Link
                      key={`cat-${idx}`}
                      href={`/search?category=${cat.slug}`}
                      className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-800 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {manufacturers.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturers</div>
                  {manufacturers.map((mfg, idx) => (
                    <button
                      key={`mfg-${idx}`}
                      type="button"
                      onClick={() => handleSearchSubmit(mfg.name)}
                      className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-800 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{mfg.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Recent Searches & Landing History */}
      <div className="mb-6">
        <div className="flex items-center justify-between pb-2 mb-2">
          <div className="flex items-center gap-4 text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("searches")}
              className={`${activeTab === "searches" ? "text-gray-900" : "text-gray-400"} transition`}
            >
              Recent searches
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setActiveTab("images")}
              className={`${activeTab === "images" ? "text-gray-900" : "text-gray-400"} transition`}
            >
              Searched images
            </button>
          </div>

          {localHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="text-gray-400 hover:text-red-500 transition p-2"
              title="Clear all search history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {activeTab === "searches" && (
          <div className="space-y-2.5">
            {localHistory.length > 0 ? (
              localHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSearchSubmit(item.query)}
                  className="flex items-center justify-between text-sm text-gray-700 font-medium cursor-pointer hover:text-[#FF5500] group py-1"
                >
                  <span>{item.query}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSingleHistory(item.id, e)}
                    className="text-transparent group-hover:text-gray-400 hover:!text-red-500 transition p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-1">No recent searches</p>
            )}
          </div>
        )}
      </div>

      {/* Recommended Search Chips */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Recommended for you</h3>
          <button type="button" className="text-gray-400 hover:text-gray-600 transition p-1">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {recommendedTerms.map((term, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSearchSubmit(term)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 text-xs font-medium rounded-full transition"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}