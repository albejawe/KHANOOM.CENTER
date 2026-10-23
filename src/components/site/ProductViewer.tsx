"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";
import { X, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  products: Product[];
  initialProductId?: number | null;
  onClose: () => void;
}

export default function ProductViewer({
  products,
  initialProductId,
  onClose,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Find index of the currently open product
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (!initialProductId) return 0;
    const idx = products.findIndex((p) => p.id === initialProductId);
    return idx !== -1 ? idx : 0;
  });

  const [scale, setScale] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const currentProduct = products[currentIndex];

  // Update URL searchParam ?p=[id] when product changes
  useEffect(() => {
    if (currentProduct) {
      const url = new URL(window.location.href);
      url.searchParams.set("p", currentProduct.id.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [currentProduct]);

  // Handle keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handleNext();
      if (e.key === "ArrowRight") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, products.length]);

  // Preload adjacent images
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % products.length;
    const prevIdx = (currentIndex - 1 + products.length) % products.length;

    if (products[nextIdx]) {
      const img = new Image();
      img.src = imageUrl(products[nextIdx].image_key, "full");
    }
    if (products[prevIdx]) {
      const img = new Image();
      img.src = imageUrl(products[prevIdx].image_key, "full");
    }
  }, [currentIndex, products]);

  const handleNext = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev + 1 < products.length ? prev + 1 : 0));
  }, [products.length]);

  const handlePrev = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : products.length - 1));
  }, [products.length]);

  // Touch Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return; // Disable swipe while zoomed
    setTouchStart(e.targetTouches[0].clientX);
    setTouchDelta(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || scale > 1) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchDelta(currentX - touchStart);
  };

  const onTouchEnd = () => {
    if (touchStart === null || scale > 1) return;
    // In RTL, dragging right (positive delta) = previous, dragging left (negative delta) = next
    if (touchDelta > 60) {
      handleNext();
    } else if (touchDelta < -60) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("p");
    window.history.replaceState({}, "", url.toString());
    onClose();
  };

  const toggleZoom = () => {
    setScale((prev) => (prev === 1 ? 2.2 : 1));
  };

  if (!currentProduct) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between text-white select-none backdrop-blur-md">
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between p-4 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15">
            {currentIndex + 1} من {products.length}
          </span>
          <button
            type="button"
            onClick={toggleZoom}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition border border-white/15"
            title={scale > 1 ? "تصغير" : "تكبير"}
          >
            {scale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
        </div>

        {/* Large Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-11 rounded-full bg-white/15 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center transition border border-white/20 shadow-lg"
          aria-label="إغلاق"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Image Stage with Swipe Gestures */}
      <div
        ref={imageContainerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={toggleZoom}
        className="relative flex-1 flex items-center justify-center overflow-hidden touch-pan-y"
      >
        {/* Navigation Arrow - Right */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute start-3 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition border border-white/15 backdrop-blur-sm"
            aria-label="السابق"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* The Full Resolution Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentProduct.id}
          src={imageUrl(currentProduct.image_key, "full")}
          alt={`Product ${currentProduct.id}`}
          style={{
            transform: `scale(${scale}) translateX(${touchDelta * 0.4}px)`,
            transition: touchStart === null ? "transform 0.25s ease-out" : "none",
          }}
          className="max-h-full max-w-full object-contain cursor-zoom-in"
        />

        {/* Navigation Arrow - Left */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute end-3 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition border border-white/15 backdrop-blur-sm"
            aria-label="التالي"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Product Details Bar */}
      <div className="z-20 p-4 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-md mx-auto space-y-2.5">
          {/* Price & Name */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-400 drop-shadow">
              {formatPrice(currentProduct.price)}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {currentProduct.category_name}
            </span>
          </div>

          {/* Sizes Pills */}
          {currentProduct.sizes && currentProduct.sizes.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">
                القياسات المتوفرة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentProduct.sizes.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs font-bold px-3 py-1 rounded-xl bg-white/15 border border-white/20 text-white backdrop-blur shadow-xs"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {currentProduct.description && (
            <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-white/10">
              {currentProduct.description}
            </p>
          )}

          <div className="text-center pt-1">
            <span className="text-[10px] text-slate-500 font-medium">
              اسحب يمين أو يسار لرؤية باقي القطع • انقر مرتين للتكبير
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
