"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";
import ProductViewer from "./ProductViewer";
import { ImageOff } from "lucide-react";

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  const searchParams = useSearchParams();
  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  // Auto-open product if ?p=[id] is present in URL
  useEffect(() => {
    const pParam = searchParams.get("p");
    if (pParam) {
      const pId = parseInt(pParam, 10);
      if (!isNaN(pId)) {
        setActiveProductId(pId);
      }
    }
  }, [searchParams]);

  if (products.length === 0) {
    return (
      <div className="py-24 text-center space-y-3 px-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ImageOff className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">لا توجد قطع معروضة في هذه الفئة</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          سيتم تنزيل أحدث الموديلات قريباً، يمكنك العودة وتصفح باقي الفئات
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 2-Column on Mobile, 3-Column on Tablet/Desktop, 4:5 Portrait Ratio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 p-2 sm:p-3">
        {products.map((product) => (
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

            {/* Price Badge on Bottom */}
            <div className="absolute inset-x-0 bottom-0 p-2.5 pt-6 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end pointer-events-none">
              <span className="text-sm sm:text-base font-black text-amber-300 drop-shadow">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Available Sizes Tag on Top Corner */}
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

      {/* Fullscreen Lightbox Viewer */}
      {activeProductId !== null && (
        <ProductViewer
          products={products}
          initialProductId={activeProductId}
          onClose={() => setActiveProductId(null)}
        />
      )}
    </>
  );
}
