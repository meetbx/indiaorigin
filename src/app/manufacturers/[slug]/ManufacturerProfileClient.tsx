"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Share2,
  Heart,
  MessageSquare,
  BadgeCheck,
  MapPin,
  Star,
  ChevronRight,
  ShieldCheck,
  Check,
  Building2,
  Globe,
  Award,
  Package,
  Copy,
  Layers,
  Send,
  Image as ImageIcon,
  ChevronDown,
  X,
} from "lucide-react";
import InquiryModal from "./InquiryModal";
import BadgeDisplay from "@/components/marketplace/BadgeDisplay";


interface Props {
  manufacturer: any;
}

export default function ManufacturerProfileClient({ manufacturer }: Props) {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "products" | "profile">("profile");
  const [profileSubTab, setProfileSubTab] = useState<"overview" | "capability" | "certifications">("overview");
  const [certFilter, setCertFilter] = useState<string>("All");

  // Interaction State
  const [isFavorited, setIsFavorited] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "videos">("photos");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);
  
  // Modals
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState<any>(null);

  // Derived Values
  const currentYear = new Date().getFullYear();
  const yearsInBusiness = manufacturer.yearEstablished
    ? currentYear - manufacturer.yearEstablished
    : null;

  const photos: string[] = manufacturer.mediaPhotos || [];
  const certsList = manufacturer.certificationsList || [];
  const stringCerts = manufacturer.certifications || [];
  const reviews = manufacturer.reviews || [];
  const reviewStats = manufacturer.reviewStats;

  // Filter certifications by category
  const certCategories = ["All", ...Array.from(new Set(certsList.map((c: any) => c.category).filter(Boolean)))];
  const filteredCerts = certsList.filter((c: any) => {
    if (certFilter === "All") return true;
    return c.category === certFilter;
  });

  // Action Handlers
  const handleChatNow = () => {
    // Standardized Progressive Auth Hook Trigger
    if (typeof window !== "undefined" && (window as any).triggerAuthAction) {
      (window as any).triggerAuthAction(() => {
        router.push(`/chat?manufacturerId=${manufacturer.id}`);
      });
    } else {
      router.push(`/chat?manufacturerId=${manufacturer.id}`);
    }
  };

  const handleOpenInquiry = (product?: any) => {
    setSelectedProductForInquiry(product || null);
    setIsInquiryOpen(true);
  };

  const handleCopyCertNo = (certNo: string, id: string) => {
    navigator.clipboard.writeText(certNo);
    setCopiedCertId(id);
    setTimeout(() => setCopiedCertId(null), 2000);
  };

  const handleStoreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSearch.trim()) return;
    setActiveTab("products");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manufacturer.name,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback copy
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Store link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-900 pb-24 lg:pb-12">
      {/* ========================================================= */}
      {/* 1. TOP NAVIGATION HEADER                                   */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Search Store Bar */}
          <form onSubmit={handleStoreSearch} className="flex-1 max-w-xl flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-xs">
            <span className="text-gray-500 font-medium border-r border-gray-300 pr-2 mr-2 whitespace-nowrap hidden sm:inline">
              This store
            </span>
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={`Search in ${manufacturer.name}...`}
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
            />
          </form>

          {/* Cart & Share Actions */}
          <div className="flex items-center gap-1">
            <Link href="/cart" className="p-2 rounded-full hover:bg-gray-100 text-gray-700 relative">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 text-gray-700">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-0 sm:px-4 pt-0 sm:pt-4">
{/* ========================================================= */}
{/* 2. MANUFACTURER IDENTITY CARD                              */}
{/* ========================================================= */}
<section className="bg-white p-4 sm:p-6 sm:rounded-2xl border-b sm:border border-gray-200 shadow-sm">
  {/* Render Manufacturer Badge (Diamond, Gold, Silver) or fallback Verified Badge */}
  {manufacturer.badge && manufacturer.badge !== "NONE" ? (
    <div className="mb-2">
      <BadgeDisplay badge={manufacturer.badge} />
    </div>
  ) : manufacturer.isVerified ? (
    <div className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 text-[11px] font-semibold px-2.5 py-1 rounded-md mb-2 border border-blue-100">
      <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-100" />
      <span>Verified Direct Manufacturer</span>
    </div>
  ) : null}

  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-start gap-3">
      {manufacturer.logo ? (
        <img
          src={manufacturer.logo}
          alt={manufacturer.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
        />
      ) : (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl border border-gray-200 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xl">
          {manufacturer.name.charAt(0)}
        </div>
      )}

      <div>
        <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight">
          {manufacturer.name}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-600">
          {reviewStats.avgRating > 0 && (
            <span className="font-bold text-gray-900 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {reviewStats.avgRating.toFixed(1)}/5
            </span>
          )}

          {yearsInBusiness !== null && (
            <>
              <span>•</span>
              <span className="font-medium">{yearsInBusiness} yrs exp</span>
            </>
          )}

          <span>•</span>
          <span className="flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {manufacturer.city}, {manufacturer.location?.state || "India"}
          </span>
        </div>
      </div>
    </div>

    {/* Favorite & Chat Buttons */}
    <div className="flex items-center gap-2 mt-2 sm:mt-0">
      <button
        onClick={() => setIsFavorited(!isFavorited)}
        className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
          isFavorited
            ? "bg-rose-50 border-rose-200 text-rose-600"
            : "border-gray-300 hover:bg-gray-50 text-gray-700"
        }`}
        aria-label="Save Manufacturer"
      >
        <Heart className={`w-5 h-5 ${isFavorited ? "fill-rose-600" : ""}`} />
      </button>

      <button
        onClick={handleChatNow}
        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm"
      >
        <MessageSquare className="w-4 h-4 text-blue-600" />
        Chat Now
      </button>
    </div>
  </div>
</section>
        {/* ========================================================= */}
        {/* 3. MAIN TABS NAVIGATION                                    */}
        {/* ========================================================= */}
        <nav className="bg-white border-b border-gray-200 sticky top-[53px] z-20 px-4 mt-2 sm:mt-4 sm:rounded-t-2xl shadow-sm">
          <div className="flex gap-6 overflow-x-auto scrollbar-none text-sm font-semibold">
            <button
              onClick={() => setActiveTab("home")}
              className={`py-3.5 border-b-2 whitespace-nowrap transition ${
                activeTab === "home"
                  ? "border-[#FF5500] text-[#FF5500]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-3.5 border-b-2 whitespace-nowrap transition ${
                activeTab === "products"
                  ? "border-[#FF5500] text-[#FF5500]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Products ({manufacturer.products.length})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-3.5 border-b-2 whitespace-nowrap transition ${
                activeTab === "profile"
                  ? "border-[#FF5500] text-[#FF5500]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Company Profile
            </button>
          </div>
        </nav>

        {/* TAB CONTENT AREAS */}
        {activeTab === "profile" && (
          <div className="space-y-4 mt-2 sm:mt-4">
            {/* ========================================================= */}
            {/* 4. COMPANY PROFILE SUB-NAVIGATION                          */}
            {/* ========================================================= */}
            <div className="bg-white p-3 sm:rounded-xl border border-gray-200 flex gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setProfileSubTab("overview")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  profileSubTab === "overview"
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setProfileSubTab("capability")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  profileSubTab === "capability"
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Manufacturer capability
              </button>
              {(certsList.length > 0 || stringCerts.length > 0) && (
                <button
                  onClick={() => setProfileSubTab("certifications")}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                    profileSubTab === "certifications"
                      ? "bg-slate-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Certifications
                </button>
              )}
            </div>

            {/* ========================================================= */}
            {/* 5. MEDIA GALLERY                                           */}
            {/* ========================================================= */}
            {photos.length > 0 && (
              <section className="bg-white p-4 sm:rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video max-h-[380px] flex items-center justify-center">
                  <img
                    src={photos[selectedPhotoIndex]}
                    alt={`Factory photo ${selectedPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Photo Switcher Overlay Controls */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <button
                      onClick={() => setActiveMediaTab("photos")}
                      className="bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Photos
                    </button>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
                    {selectedPhotoIndex + 1}/{photos.length}
                  </div>
                </div>

                {/* Thumbnails Row */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {photos.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                        selectedPhotoIndex === idx ? "border-[#FF5500]" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* 6. PERFORMANCE SUMMARY METRICS                             */}
            {/* ========================================================= */}
            <section className="bg-white p-4 sm:rounded-2xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {reviewStats.avgRating > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xl font-extrabold text-gray-900 flex items-center justify-center gap-1">
                      {reviewStats.avgRating.toFixed(1)}
                      <span className="text-xs text-gray-500 font-normal">({reviewStats.reviewCount})</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Buyer Reviews</p>
                  </div>
                )}

                {manufacturer.onTimeDispatchRate !== null && manufacturer.onTimeDispatchRate !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xl font-extrabold text-emerald-600">
                      {manufacturer.onTimeDispatchRate.toFixed(1)}%
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">On-time dispatch</p>
                  </div>
                )}

                {yearsInBusiness !== null && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xl font-extrabold text-gray-900">{yearsInBusiness} yrs</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Years in business</p>
                  </div>
                )}

                {manufacturer.factoryAreaSqFt && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xl font-extrabold text-gray-900">
                      {manufacturer.factoryAreaSqFt.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Sq Ft Factory Area</p>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================= */}
            {/* 7. VERIFIED CAPABILITY SECTION                             */}
            {/* ========================================================= */}
            {(profileSubTab === "overview" || profileSubTab === "capability") && (
              <section className="bg-white p-4 sm:p-6 sm:rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Verified capability
                  </h2>
                </div>

                {/* Trade & Market Sub-card */}
                {(manufacturer.annualTurnover || manufacturer.mainMarketsList.length > 0 || yearsInBusiness) && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Trade & Market
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {yearsInBusiness !== null && (
                        <div>
                          <span className="text-gray-500 block">Years operating</span>
                          <span className="font-bold text-gray-900 text-sm">{yearsInBusiness} Years</span>
                        </div>
                      )}

                      {manufacturer.annualTurnover && (
                        <div>
                          <span className="text-gray-500 block">Annual Turnover / Revenue</span>
                          <span className="font-bold text-gray-900 text-sm">{manufacturer.annualTurnover}</span>
                        </div>
                      )}

                      {manufacturer.mainMarketsList.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-500 block mb-1">Main Markets</span>
                          <div className="flex flex-wrap gap-1.5">
                            {manufacturer.mainMarketsList.map((market: string, i: number) => (
                              <span key={i} className="bg-white px-2.5 py-1 rounded-md border text-gray-700 font-medium text-[11px]">
                                {market}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manufacturing Capability Sub-card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Manufacturing Capability
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {manufacturer.factoryAreaSqFt && (
                      <div>
                        <span className="text-gray-500 block">Factory Area</span>
                        <span className="font-bold text-gray-900 text-sm">{manufacturer.factoryAreaSqFt.toLocaleString()} Sq Ft</span>
                      </div>
                    )}

                    {manufacturer.rndEngineers !== null && manufacturer.rndEngineers !== undefined && (
                      <div>
                        <span className="text-gray-500 block">R&D Engineers</span>
                        <span className="font-bold text-gray-900 text-sm">{manufacturer.rndEngineers} Staff</span>
                      </div>
                    )}

                    {manufacturer.responseTimeHours !== null && manufacturer.responseTimeHours !== undefined && (
                      <div>
                        <span className="text-gray-500 block">Avg. Response Time</span>
                        <span className="font-bold text-gray-900 text-sm font-mono">&le; {manufacturer.responseTimeHours}h</span>
                      </div>
                    )}

                    {manufacturer.gstNumber && (
                      <div className="col-span-2">
                        <span className="text-gray-500 block">GSTIN / Tax ID</span>
                        <span className="font-mono font-bold text-emerald-700">{manufacturer.gstNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Factory Address */}
                <div className="border-t pt-4 text-xs text-gray-600">
                  <span className="font-bold text-gray-900 block mb-1">Factory Location & Address</span>
                  <p>{manufacturer.addressLine}</p>
                  <p>{manufacturer.city}, {manufacturer.location?.state} - {manufacturer.pincode}</p>
                </div>
              </section>
            )}

          {/* ========================================================= */}
{/* 8. CERTIFICATIONS SECTION                                 */}
{/* ========================================================= */}
{(profileSubTab === "overview" || profileSubTab === "certifications") &&
  (certsList.length > 0 || stringCerts.length > 0) && (
    <section className="bg-white p-4 sm:p-6 sm:rounded-2xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Certifications & Standards
        </h2>
      </div>

      {/* 1. Category Filter Pills */}


      {/* 2. Relational Certifications - Horizontal Scroll Carousel */}
      {filteredCerts.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x scrollbar-none">
          {filteredCerts.map((cert: any) => (
            <div
              key={cert.id}
              className="w-[250px] sm:w-[270px] shrink-0 snap-start bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div>
                {/* Header: Name & Logo / Icon */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-extrabold text-sm text-gray-900 leading-snug line-clamp-1">
                    {cert.name}
                  </h3>
                  {cert.logo ? (
                    <img
                      src={cert.logo}
                      alt={cert.name}
                      className="h-6 w-auto max-w-[40px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 shrink-0">
                      ISO
                    </div>
                  )}
                </div>

                {/* Description */}
                {cert.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {cert.description}
                  </p>
                )}

                {/* Issuing Body Badge */}
                {cert.issuingBody && (
                  <span className="inline-block mt-2 text-[10px] bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded font-medium">
                    Issued by {cert.issuingBody}
                  </span>
                )}
              </div>

              {/* Footer: Certificate Number & Copy Action */}
              {cert.certificateNo && (
                <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-gray-500">
                  <span className="truncate max-w-[170px]" title={cert.certificateNo}>
                    {cert.certificateNo}
                  </span>
                  <button
                    onClick={() => handleCopyCertNo(cert.certificateNo, cert.id)}
                    className="p-1 hover:bg-slate-200/80 rounded text-gray-500 transition-colors"
                    title="Copy Certificate No"
                  >
                    {copiedCertId === cert.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* String Fallback Cards */
        <div className="flex flex-wrap gap-2 pt-1">
          {stringCerts.map((c: string, idx: number) => (
            <span
              key={idx}
              className="bg-slate-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-blue-600" />
              {c}
            </span>
          ))}
        </div>
      )}
    </section>
  )}

            {/* ========================================================= */}
            {/* 9. REVIEWS SECTION                                         */}
            {/* ========================================================= */}
            {reviewStats.reviewCount > 0 && (
              <section className="bg-white p-4 sm:p-6 sm:rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Buyer Reviews</h2>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Verified Purchases
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-gray-900">{reviewStats.avgRating.toFixed(1)}</span>
                    <div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(reviewStats.avgRating) ? "fill-amber-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-0.5 block">{reviewStats.reviewCount} total rating(s)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
                    {reviewStats.avgService > 0 && <div>Service: <span className="text-gray-900 font-bold">{reviewStats.avgService.toFixed(1)}</span></div>}
                    {reviewStats.avgShipping > 0 && <div>Shipping: <span className="text-gray-900 font-bold">{reviewStats.avgShipping.toFixed(1)}</span></div>}
                    {reviewStats.avgQuality > 0 && <div>Quality: <span className="text-gray-900 font-bold">{reviewStats.avgQuality.toFixed(1)}</span></div>}
                  </div>
                </div>

                {/* Review Cards */}
                <div className="space-y-3">
                  {reviews.map((rev: any) => (
                    <div key={rev.id} className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {rev.buyer?.name?.charAt(0) || "B"}
                          </div>
                          <span className="font-semibold text-gray-900">{rev.buyer?.name || "Verified Buyer"}</span>
                        </div>
                        <span className="text-gray-400 text-[10px]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? "fill-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>

                      {rev.reviewText && <p className="text-gray-700 leading-relaxed">{rev.reviewText}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 12. PRODUCTS TAB                                           */}
        {/* ========================================================= */}
        {(activeTab === "products" || activeTab === "home") && (
          <section className="bg-white p-4 sm:rounded-2xl border border-gray-200 shadow-sm mt-2 sm:mt-4 space-y-4">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 uppercase tracking-wider">
              Product Catalog ({manufacturer.products.length})
            </h2>

            {manufacturer.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {manufacturer.products.map((product: any) => {
                  const hasImage = product.images && product.images.length > 0;
                  return (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-xl p-3 flex flex-col justify-between hover:border-[#FF5500] transition group bg-white"
                    >
                      <Link href={`/products/${product.slug}`} className="flex gap-3">
                        <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                          {hasImage ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <Package className="w-8 h-8 text-slate-400 stroke-1" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {product.category?.name && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {product.category.name}
                            </span>
                          )}
                          <h3 className="text-xs font-bold text-gray-900 mt-1 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          <div className="mt-2">
                            <span className="text-xs font-extrabold text-[#059669] block">
                              ₹{product.minPrice} - ₹{product.maxPrice}
                            </span>
                            {product.moq && <span className="text-[10px] text-gray-400">MOQ: {product.moq}</span>}
                          </div>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleOpenInquiry(product)}
                        className="mt-3 w-full py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF5500] border border-gray-200 hover:border-orange-200 rounded-lg text-xs font-bold text-gray-700 transition flex items-center justify-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Inquire for Product
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-xs">No products currently listed for this manufacturer.</div>
            )}
          </section>
        )}
      </div>

      {/* ========================================================= */}
      {/* 13. FIXED MOBILE ACTION BAR                                */}
      {/* ========================================================= */}
      <aside className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2 z-40 shadow-lg flex items-center gap-2">
        <button
          onClick={() => setActiveTab("products")}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-700 hover:text-gray-900 shrink-0"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Categories</span>
        </button>

        <button
          onClick={handleChatNow}
          className="flex-1 py-2.5 px-3 rounded-full border border-gray-300 font-bold text-xs text-gray-800 hover:bg-gray-50 transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Chat now
        </button>

        <button
          onClick={() => handleOpenInquiry()}
          className="flex-1 py-2.5 px-3 rounded-full bg-[#FF5500] hover:bg-orange-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
        >
          <Send className="w-4 h-4" />
          Send inquiry
        </button>
      </aside>

      {/* INQUIRY MODAL */}
      {isInquiryOpen && (
        <InquiryModal
          manufacturer={manufacturer}
          product={selectedProductForInquiry}
          onClose={() => setIsInquiryOpen(false)}
        />
      )}
    </div>
  );
}