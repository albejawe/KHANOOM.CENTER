"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";
import {
  X,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Share2,
  Check,
  MessageCircle,
} from "lucide-react";

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
  // Find index of the currently open product
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (!initialProductId) return 0;
    const idx = products.findIndex((p) => p.id === initialProductId);
    return idx !== -1 ? idx : 0;
  });

  const [scale, setScale] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [touchDeltaY, setTouchDeltaY] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);

  const currentProduct = products[currentIndex];

  // Sync URL ?p=[id]
  useEffect(() => {
    if (currentProduct) {
      const url = new URL(window.location.href);
      url.searchParams.set("p", currentProduct.id.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [currentProduct]);

  // Handle hardware / browser back button to close modal
  useEffect(() => {
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handleNext();
      if (e.key === "ArrowRight") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, products.length]);

  // Preload adjacent full resolution images
  useEffect(() => {
    if (products.length <= 1) return;
    const nextIdx = (currentIndex + 1) % products.length;
    const prevIdx = (currentIndex - 1 + products.length) % products.length;

    if (products[nextIdx]) {
      const img1 = new Image();
      img1.src = imageUrl(products[nextIdx].image_key, "full");
    }
    if (products[prevIdx]) {
      const img2 = new Image();
      img2.src = imageUrl(products[prevIdx].image_key, "full");
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

  // Touch Swipe Handlers (supports both horizontal swipe and swipe-down-to-dismiss)
  const onTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return; // Disable swipe while zoomed
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchDeltaX(0);
    setTouchDeltaY(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || scale > 1) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    setTouchDeltaX(currentX - touchStartX);
    setTouchDeltaY(currentY - touchStartY);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || scale > 1) return;

    // Swipe down to dismiss gesture (> 90px downwards)
    if (touchDeltaY > 90 && Math.abs(touchDeltaX) < 100) {
      handleClose();
      return;
    }

    // Horizontal swipe gesture (> 50px)
    if (touchDeltaX > 50) {
      handleNext();
    } else if (touchDeltaX < -50) {
      handlePrev();
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDeltaX(0);
    setTouchDeltaY(0);
  };

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("p");
    window.history.replaceState({}, "", url.toString());
    onClose();
  };

  const toggleZoom = () => {
    setScale((prev) => (prev === 1 ? 2.3 : 1));
  };

  // WhatsApp 1-tap direct inquiry message
  const handleWhatsAppInquiry = () => {
    if (!currentProduct) return;
    const sizesText =
      currentProduct.sizes && currentProduct.sizes.length > 0
        ? currentProduct.sizes.map((s) => s.name).join("، ")
        : "قياس موحد";
    const text = `مرحباً مجمع خانم، أود الاستفسار عن هذا الموديل:\n- كود القطعة: #${currentProduct.id}\n- السعر: ${formatPrice(currentProduct.price)}\n- القياسات: ${sizesText}\n- رابط القطعة:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Quick Share / Copy Link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `مجمع خانم - موديل #${currentProduct.id}`,
          text: `شاهد هذا الموديل من مجمع خانم بسعر ${formatPrice(currentProduct.price)}`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!currentProduct) return null;

  // Swipe-down transform calculation for TikTok-style fluid dismiss
  const dismissOpacity = touchDeltaY > 0 ? Math.max(0.3, 1 - touchDeltaY / 300) : 1;
  const dismissScale = touchDeltaY > 0 ? Math.max(0.8, 1 - touchDeltaY / 600) : scale;

  return (
    <div
      style={{ opacity: dismissOpacity }}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white select-none transition-opacity duration-150"
    >
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between p-3.5 pt-safe z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Counter and Zoom Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20">
            {currentIndex + 1} / {products.length}
          </span>

          <button
            type="button"
            onClick={toggleZoom}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition border border-white/20"
            title={scale > 1 ? "تصغير" : "تكبير"}
          >
            {scale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
        </div>

        {/* Share and Close Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition border border-white/20"
            title="مشاركة الرابط"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? "تم النسخ" : "مشاركة"}</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center transition border border-white/25 shadow-lg"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Image Stage (Edge to Edge with Touch Gestures) */}
      <div
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
            className="absolute start-2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center transition border border-white/20 backdrop-blur"
            aria-label="السابق"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* The Full High-Detail Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentProduct.id}
          src={imageUrl(currentProduct.image_key, "full")}
          alt={`Product ${currentProduct.id}`}
          style={{
            transform: `translate(${touchDeltaX * 0.4}px, ${touchDeltaY > 0 ? touchDeltaY : 0}px) scale(${dismissScale})`,
            transition: touchStartX === null ? "transform 0.22s ease-out" : "none",
          }}
          className="max-h-full max-w-full object-contain cursor-zoom-in"
        />

        {/* Navigation Arrow - Left */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute end-2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center transition border border-white/20 backdrop-blur"
            aria-label="التالي"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Sticky Card with Price, Sizes, and 1-Tap WhatsApp Inquiry */}
      <div className="z-30 p-4 pb-safe bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-md mx-auto space-y-3">
          {/* Price & Category info */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">
                {currentProduct.parent_category_name ? `${currentProduct.parent_category_name} • ` : ""}
                {currentProduct.category_name}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow">
                {formatPrice(currentProduct.price)}
              </span>
            </div>

            <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-slate-300">
              #{currentProduct.id}
            </span>
          </div>

          {/* Available Sizes Pills */}
          {currentProduct.sizes && currentProduct.sizes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-semibold text-slate-300 shrink-0">
                القياسات المتوفرة:
              </span>
              <div className="flex gap-1.5 shrink-0">
                {currentProduct.sizes.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 backdrop-blur"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {currentProduct.description && (
            <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-white/10 line-clamp-2">
              {currentProduct.description}
            </p>
          )}

          {/* 1-Tap WhatsApp Direct Inquiry Button */}
          <button
            type="button"
            onClick={handleWhatsAppInquiry}
            className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2.5"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>طلب أو استفسار عن هذا الموديل عبر واتساب</span>
          </button>

          <p className="text-[10px] text-center text-slate-400 pt-0.5">
            اسحب لليمين أو اليسار للتنقل • اسحب للأسفل للإغلاق
          </p>
        </div>
      </div>
    </div>
  );
}
