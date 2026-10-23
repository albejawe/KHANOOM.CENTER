"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { ArrowLeft, ChevronLeft, ImageOff, LoaderCircle, ShoppingBag } from "lucide-react";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";
import type { CatalogPage } from "@/lib/catalog-preview";
import ProductViewer from "@/components/site/ProductViewer";

function LinkProgress() {
  const { pending } = useLinkStatus();
  return <span className={`preview-link-progress ${pending ? "is-pending" : ""}`} aria-hidden="true"><LoaderCircle size={19} /></span>;
}

interface CategoryLinkProps {
  href: string;
  name: string;
  count?: string;
  imageKey?: string | null;
  order?: number;
}

export function PreviewCategoryLink({ href, name, count, imageKey, order = 0 }: CategoryLinkProps) {
  return (
    <Link href={href} className="preview-category-link" prefetch={true} aria-label={`عرض ${name}`}>
      <span className="preview-category-photo">
        {imageKey ? <img src={imageUrl(imageKey, "thumb")} loading={order < 2 ? "eager" : "lazy"} decoding="async" alt="" /> :
          <span className="preview-category-fallback"><ShoppingBag size={28} strokeWidth={1.3} /></span>}
      </span>
      <span className="preview-category-copy">
        <strong className="preview-category-name">{name}</strong>
        {count && <small className="preview-category-count">{count}</small>}
      </span>
      <span className="preview-category-arrow"><ChevronLeft size={23} strokeWidth={1.6} /></span>
      <LinkProgress />
    </Link>
  );
}

interface ProductShelfProps {
  categoryId: number;
  initial: CatalogPage;
}

export function PreviewProductShelf({ categoryId, initial }: ProductShelfProps) {
  const [products, setProducts] = useState<Product[]>(initial.products);
  const [cursor, setCursor] = useState<number | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const busy = useRef(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const deepLink = new URLSearchParams(window.location.search).get("p");
    if (deepLink && /^\d+$/.test(deepLink)) {
      const id = Number(deepLink);
      if (initial.products.some((p) => p.id === id)) setSelectedId(id);
    }
    return () => { alive.current = false; };
  }, [initial.products]);

  const loadMore = useCallback(async () => {
    if (busy.current || cursor === null) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/catalog-preview?categoryId=${categoryId}&after=${cursor}`, { cache: "force-cache" });
      if (!response.ok) throw new Error("catalog load failed");
      const data = await response.json() as CatalogPage;
      if (!alive.current) return;
      setProducts((previous) => {
        const present = new Set(previous.map((p) => p.id));
        return [...previous, ...data.products.filter((p) => !present.has(p.id))];
      });
      setCursor(data.nextCursor);
    } catch {
      if (alive.current) setFailed(true);
    } finally {
      busy.current = false;
      if (alive.current) setLoading(false);
    }
  }, [categoryId, cursor]);

  useEffect(() => {
    if (cursor === null || failed) return;
    const element = observerTarget.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "240px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [cursor, loadMore, failed]);

  if (!products.length) {
    return <div className="preview-empty"><ImageOff size={42} strokeWidth={1.3} /><strong>حالياً ماكو موديلات بهذا القسم</strong><span>ارجعي واختاري قسم ثاني</span></div>;
  }

  return (
    <>
      <div className="preview-products-grid">
        {products.map((product, index) => (
          <button key={product.id} type="button" className="preview-product-tile"
            onClick={() => setSelectedId(product.id)} aria-label={`تكبير صورة القطعة ${product.id}، السعر ${formatPrice(product.price)}`}>
            <span className="preview-product-photo">
              <img src={imageUrl(product.image_key, "thumb")} alt={product.description || `قطعة رقم ${product.id}`}
                loading={index < 4 ? "eager" : "lazy"} decoding="async" fetchPriority={index < 2 ? "high" : "auto"} />
            </span>
            <span className="preview-product-info">
              <strong className="preview-product-price">{formatPrice(product.price)}</strong>
              {product.sizes && product.sizes.length > 0 && <small className="preview-product-size">{product.sizes.map((s) => s.name).slice(0, 3).join(" · ")}</small>}
            </span>
          </button>
        ))}
      </div>
      <div ref={observerTarget} className="preview-load-footer">
        {cursor !== null ? (
          <button type="button" onClick={() => void loadMore()} disabled={loading} className="preview-load-more">
            {loading ? <><LoaderCircle className="animate-spin" size={18} /> جاري عرض المزيد...</> :
              <><ArrowLeft size={18} /> عرض قطع أكثر</>}
          </button>
        ) : <p>وصلتي لآخر القطع المعروضة ♡</p>}
        {failed && <p role="alert">ضعف الاتصال، اضغطي على «عرض قطع أكثر» للمحاولة مجدداً</p>}
      </div>
      {selectedId !== null && <ProductViewer products={products} initialProductId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}
