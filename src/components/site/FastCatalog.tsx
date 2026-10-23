"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/queries";
import ProductViewer from "./ProductViewer";
import { Store, Sparkles, ImageOff } from "lucide-react";

interface Props {
  mainCategories: Category[];
  subCategories: Category[];
  products: Product[];
}

export default function FastCatalog({
  mainCategories,
  subCategories,
  products,
}: Props) {
  const searchParams = useSearchParams();

  // Active Main Category ID (null = "الكل")
  const [activeMainId, setActiveMainId] = useState<number | null>(null);

  // Active Sub Category ID (null = "الكل في هذا القسم")
  const [activeSubId, setActiveSubId] = useState<number | null>(null);

  // Active Product ID for Fullscreen Lightbox
  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  // Check URL parameters on mount (?p= or #)
  useEffect(() => {
    const pParam = searchParams.get("p");
    if (pParam) {
      const pId = parseInt(pParam, 10);
      if (!isNaN(pId)) setActiveProductId(pId);
    }
  }, [searchParams]);

  // Subcategories belonging to the active main category
  const currentSubCategories = useMemo(() => {
    if (!activeMainId) return [];
    return subCategories.filter((sub) => sub.parent_id === activeMainId);
  }, [activeMainId, subCategories]);

  // Instant in-memory filtered products (0ms latency!)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeSubId !== null) {
        return p.category_id === activeSubId;
      }
      if (activeMainId !== null) {
        return p.parent_category_id === activeMainId;
      }
      return true;
    });
  }, [products, activeMainId, activeSubId]);

  const selectMainCategory = (mainId: number | null) => {
    setActiveMainId(mainId);
    setActiveSubId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Sticky App-Style Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black border border-amber-500/20 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-950 text-base leading-tight block">
                مجمع خانم
              </span>
              <span className="text-[11px] font-semibold text-slate-600 block">
                أزياء نسائية • أطفال • كوزمتكس
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {filteredProducts.length} قطعة
            </span>
          </div>
        </div>

        {/* 1. Main Category Tabs (Story Pills) */}
        <div className="border-t border-slate-100/80 bg-white">
          <div className="max-w-xl mx-auto px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* "All" button */}
            <button
              type="button"
              onClick={() => selectMainCategory(null)}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                activeMainId === null
                  ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                  : "bg-slate-100 text-slate-800 border-transparent hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>الكل ({products.length})</span>
            </button>

            {/* Main Categories Pills */}
            {mainCategories.map((main) => {
              const isSelected = activeMainId === main.id;
              const count = products.filter((p) => p.parent_category_id === main.id).length;
              return (
                <button
                  key={main.id}
                  type="button"
                  onClick={() => selectMainCategory(main.id)}
                  className={`h-9 px-4 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                      : "bg-slate-100 text-slate-800 border-transparent hover:bg-slate-200"
                  }`}
                >
                  <span>{main.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 font-bold"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Subcategory Pills Bar (if main category selected) */}
        {activeMainId !== null && currentSubCategories.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/80">
            <div className="max-w-xl mx-auto px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {/* All in this category */}
              <button
                type="button"
                onClick={() => setActiveSubId(null)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold transition shrink-0 ${
                  activeSubId === null
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
                }`}
              >
                الكل
              </button>

              {currentSubCategories.map((sub) => {
                const isSelected = activeSubId === sub.id;
                const count = products.filter((p) => p.category_id === sub.id).length;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveSubId(sub.id)}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                        : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
                    }`}
                  >
                    <span>{sub.name}</span>
                    {count > 0 && (
                      <span className="text-[10px] opacity-75">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-2 sm:p-3">
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center space-y-3 px-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ImageOff className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              لا توجد قطع معروضة في هذا القسم حالياً
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              سيتم تنزيل موديلات جديدة قريباً، اختر قسماً آخر للتصفح
            </p>
          </div>
        ) : (
          /* Instagram 4:5 Portrait Grid (2 columns on mobile, 3 on tablet) */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setActiveProductId(product.id)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-200 cursor-pointer active:scale-[0.98] transition shadow-xs hover:shadow-md border border-slate-200/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(product.image_key, "thumb")}
                  alt={`Product ${product.id}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Bottom Gradient Overlay for clear price visibility */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 pt-6 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end pointer-events-none">
                  {/* Category Name tag */}
                  <span className="text-[10px] font-medium text-slate-300 truncate drop-shadow">
                    {product.category_name}
                  </span>

                  {/* Iraqi Dinar Price */}
                  <span className="text-sm sm:text-base font-black text-amber-300 drop-shadow">
                    {formatPrice(product.price)}
                  </span>
                </div>

                {/* Available Sizes Dot Indicator on Top Corner */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="absolute top-2 end-2 pointer-events-none">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur shadow-xs">
                      {product.sizes[0].name}
                      {product.sizes.length > 1 ? ` +${product.sizes.length - 1}` : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Subtle, Clean Footer */}
        <footer className="pt-8 pb-10 text-center text-slate-600 text-xs space-y-1">
          <p className="font-bold text-slate-800">مجمع خانم للأزياء والكوزمتكس</p>
          <p className="text-[11px] text-slate-600">
            انقر على أي صورة لتكبيرها وسحب باقي الموديلات
          </p>
        </footer>
      </main>

      {/* Supercharged Fullscreen Lightbox Modal */}
      {activeProductId !== null && (
        <ProductViewer
          products={filteredProducts}
          initialProductId={activeProductId}
          onClose={() => setActiveProductId(null)}
        />
      )}
    </div>
  );
}
