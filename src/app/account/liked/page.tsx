export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Heart, Package } from "lucide-react";
import { getLikedProducts } from "@/app/actions/wishlist";

export default async function LikedProductsPage() {
  const products = await getLikedProducts();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 max-w-md mx-auto shadow-2xl border-x border-slate-200/60 font-sans">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md px-4 py-3.5 flex items-center gap-3 sticky top-0 z-40 border-b border-slate-100 shadow-2xs">
        <Link href="/account" className="text-slate-800 hover:text-[#FF5500] transition-colors">
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </Link>
        <h1 className="text-base font-bold text-slate-900">Liked Products</h1>
      </header>

      {/* Product List */}
      <main className="p-4">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-xl mb-2.5 relative overflow-hidden flex items-center justify-center">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-xs">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">
                    ₹{product.minPrice?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {product.moq} {product.unit} (MOQ)
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-400 mb-3">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">No liked products yet</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Tap the heart icon on any product to save it here for quick access later.
            </p>
            <Link
              href="/"
              className="mt-4 bg-[#FF5500] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-[#E04B00] transition"
            >
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}