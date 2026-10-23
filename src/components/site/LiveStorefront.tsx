import Link from "next/link";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { CatalogPage } from "@/lib/catalog-preview";
import { KHANOM_ADDRESS } from "@/lib/storefront-config";
import { PreviewCategoryLink, PreviewProductShelf } from "@/components/site/PreviewCatalog";
import "@/app/preview/[variant]/[[...slug]]/preview.css";

const customerFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: false,
});

export interface StorefrontSection {
  id: number;
  name: string;
  href: string;
  count: string;
  imageKey: string | null;
}

interface Props {
  heading: string;
  items?: StorefrontSection[];
  categoryId?: number;
  productPage?: CatalogPage;
  initialFocusProduct?: CatalogPage["products"][number] | null;
  backHref?: string;
}

/** Approved messaging-style public storefront; preview theme 2 without marketing filler. */
export default function LiveStorefront({ heading, items, categoryId, productPage, initialFocusProduct, backHref }: Props) {
  return (
    <div className={`preview-site ${customerFont.className}`} data-variant="2" dir="rtl">
      <div className="preview-app-shell">
        <header className="preview-header">
          {backHref ? (
            <Link href={backHref} className="preview-back" aria-label="رجوع للأقسام">
              <ArrowRight size={21} /><span>رجوع</span>
            </Link>
          ) : (
            <div className="preview-mark"><ShoppingBag size={22} strokeWidth={1.5} /></div>
          )}
          <div className="preview-brand">
            <strong>مجمع خانم</strong>
            <span>ملابس • كوزمتكس • أطفال</span>
          </div>
        </header>

        <main className="preview-main">
          <div className="preview-section-title live-section-title">
            <h1>{heading}</h1>
            {items && <span>{items.length} {backHref ? "فئات" : "أقسام"}</span>}
          </div>

          {productPage && categoryId ? (
            <PreviewProductShelf key={categoryId} categoryId={categoryId} initial={productPage} initialFocusProduct={initialFocusProduct} />
          ) : (
            <div className="preview-categories">
              {items?.map((item, index) => (
                <PreviewCategoryLink key={item.id} href={item.href} name={item.name}
                  count={item.count} imageKey={item.imageKey} order={index} />
              ))}
              {!items?.length && <div className="preview-empty"><ShoppingBag size={36} strokeWidth={1.4} /><span>ماكو أقسام معروضة حالياً</span></div>}
            </div>
          )}
          <footer className="preview-footer live-footer">{KHANOM_ADDRESS}</footer>
        </main>
      </div>
    </div>
  );
}
