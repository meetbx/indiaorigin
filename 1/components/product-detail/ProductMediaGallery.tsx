"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart, Scan, Package, Play, ChevronLeft, ChevronRight } from "lucide-react";
import BadgeDisplay from "@/components/marketplace/BadgeDisplay";
import { checkIsLiked, toggleWishlist } from "@/app/actions/wishlist";
import { useRouter } from "next/navigation";
import { BadgeType } from "@prisma/client";


// Helper to inject Cloudinary optimization parameters securely
function getOptimizedCloudinaryUrl(url: string, transformation: string) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (url.includes(transformation)) return url; // Prevent duplicate injection
  
  // Inserts transformation right after /upload/
  return url.replace("/upload/", `/upload/${transformation}/`);
}

interface MediaGalleryProps {
  productId: string;
  images: string[];
  videoUrl?: string | null;
  productName: string;
  badge?: string;
}

export default function ProductMediaGallery({
  productId,
  images = [],
  videoUrl,
  productName,
  badge,
}: MediaGalleryProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize initial liked status from database
  useEffect(() => {
    if (productId) {
      checkIsLiked(productId).then((liked) => setIsLiked(liked));
    }
  }, [productId]);

  // Native scroll tracking
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;
    const clientWidth = scrollContainerRef.current.clientWidth;
    const clampedIndex = Math.max(0, Math.min(index, images.length - 1));
    scrollContainerRef.current.scrollTo({
      left: clampedIndex * clientWidth,
      behavior: "smooth",
    });
    setCurrentIndex(clampedIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToSlide(currentIndex + 1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToSlide(currentIndex - 1);
  };

  const handleLikeToggle = async () => {
    if (loading) return;
    setLoading(true);

    const previousState = isLiked;
    setIsLiked(!previousState);

    try {
      const res = await toggleWishlist(productId);
      setIsLiked(res.liked);
      router.refresh();
    } catch (err) {
      setIsLiked(previousState);
      console.error("Failed to toggle wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  if (images.length === 0 && !videoUrl) {
    return (
      <div className="w-full aspect-square bg-slate-100 flex flex-col items-center justify-center text-slate-400 border-b border-slate-200">
        <Package className="w-16 h-16 stroke-1 mb-2" />
        <span className="text-sm font-medium">No Product Media Available</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square bg-white border-b border-slate-200 group overflow-hidden">
      {/* Badge Indicator */}
{badge && badge !== "NONE" && (
  <div className="absolute top-3 left-3 z-20 pointer-events-none">
    <BadgeDisplay badge={badge as BadgeType} />
  </div>
      )}

      {/* Media Display Area */}
      {activeTab === "photo" || !videoUrl ? (
        <div className="relative w-full h-full">
          {/* Native Hardware-Accelerated Scroll Snap Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
            style={{ 
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
              overscrollBehaviorX: "none" // Prevents empty space bouncing on edges
            }}
          >
            {images.map((imgUrl, index) => {
              // Apply w_1000 for main gallery image
              const optimizedSrc = getOptimizedCloudinaryUrl(imgUrl, "f_auto,q_auto,c_limit,w_1000");
              
              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className="w-full h-full flex-shrink-0 snap-start snap-always relative"
                >
<Image
                    src={optimizedSrc}
                    alt={`${productName} - Image ${index + 1}`}
                    fill
                    className="object-cover select-none"
                    priority={index === 0}
                    {...(index === 0 ? { fetchPriority: "high" } : {})}
                    sizes="(max-width: 768px) 100vw, 448px"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Desktop Arrow Navigation */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 items-center justify-center shadow-md transition z-20 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentIndex < images.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next image"
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 items-center justify-center shadow-md transition z-20 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        /* Video Player Layer */
        <div className="w-full h-full bg-black relative flex items-center justify-center">
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute right-3 top-3 flex flex-col gap-3 z-20">
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={loading}
          aria-label="Add to Wishlist"
          className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition active:scale-95 cursor-pointer"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isLiked
                ? "text-red-500 fill-red-500 stroke-red-500"
                : "text-slate-700 hover:text-red-500"
            }`}
          />
        </button>

      </div>

      {/* Floating Counter & Media Toggle Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md z-20 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab("photo")}
          className={activeTab === "photo" ? "text-white font-bold" : "text-slate-300 hover:text-white"}
        >
          Photos {images.length > 0 ? `${currentIndex + 1}/${images.length}` : "0"}
        </button>

        {videoUrl && (
          <>
            <div className="w-px h-3 bg-white/30" />
            <button
              type="button"
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-1 ${
                activeTab === "video" ? "text-[#FF5500] font-bold" : "text-slate-300 hover:text-white"
              }`}
            >
              <Play className="w-3 h-3 fill-current" /> Video
            </button>
          </>
        )}
      </div>
    </div>
  );
}