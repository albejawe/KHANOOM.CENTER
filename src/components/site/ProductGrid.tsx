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
      <div className="py-20 text-center space-y-3 px-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ImageOff className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-700">لا توجد منتجات معروضة حالياً</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          سيتم إضافة أحدث الموديلات قريباً، تفضل بزيارة باقي الأقسام
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 3-Column Instagram Style Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => setActiveProductId(product.id)}
            className="group relative aspect-square bg-slate-100 overflow-hidden cursor-pointer active:opacity-80 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(product.image_key, "thumb")}
              alt={`Product ${product.id}`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />

            {/* Price Badge on Bottom */}
            <div className="absolute bottom-1 inset-x-1 flex justify-center pointer-events-none">
              <span className="text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-lg bg-black/75 text-amber-300 backdrop-blur-xs shadow-xs">
                {formatPrice(product.price)}
              </span>
            </div>
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
