import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ArrowRight, ArrowUpLeft, ChevronLeft, Heart, ShoppingBag } from "lucide-react";
import { getCategoryById, getMainCategoriesWithDetails, getSubcategoriesWithDetails } from "@/lib/queries";
import { getPreviewProductPage } from "@/lib/catalog-preview";
import { PreviewCategoryLink, PreviewProductShelf } from "@/components/site/PreviewCatalog";
import { KHANOM_ADDRESS } from "@/lib/storefront-config";
import "./preview.css";

const previewFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "تجارب تصاميم مجمع خانم",
  robots: { index: false, follow: false },
};

const concepts: Record<string, { name: string; eyebrow: string; tagline: string; hint: string }> = {
  "1": { name: "الستوري", eyebrow: "تسوّقين مثل الستوري", tagline: "أهلاً بيج في خانم", hint: "اختاري القسم اللي يعجبج" },
  "2": { name: "المحادثة", eyebrow: "", tagline: "", hint: "" },
  "3": { name: "المجلة", eyebrow: "معرض أنيق وواضح", tagline: "تشكيلة خانم", hint: "من أقسامنا، اختاري اللي يناسبج" },
  "4": { name: "الريلز", eyebrow: "صور كبيرة مثل السوشل ميديا", tagline: "كلشي تحبينه بمكان واحد", hint: "افتحي القسم وتصفحي الصور" },
  "5": { name: "البسيط", eyebrow: "أوضح تصميم وأكبر أزرار", tagline: "مجمع خانم", hint: "أولاً اختاري القسم" },
};

interface Props {
  params: Promise<{ variant: string; slug?: string[] }>;
}

function PreviewSkeleton() {
  return <div className="preview-inner" aria-busy="true" aria-label="جاري تحضير الأقسام">
    <div className="preview-skeleton preview-skeleton-heading" />
    <div className="preview-skeleton-grid">{[1, 2, 3, 4].map((n) => <div className="preview-skeleton preview-skeleton-card" key={n} />)}</div>
  </div>;
}

export default function PreviewPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="preview-wait"><PreviewSkeleton /></div>}>
      <PreviewContent params={params} />
    </Suspense>
  );
}

async function PreviewContent({ params }: Props) {
  const { variant, slug = [] } = await params;
  const concept = concepts[variant];
  if (!concept || slug.length > 2 || (slug.length && slug.length !== 2)) notFound();

  const base = `/preview/${variant}`;
  const stage = slug.length ? slug[0] : "home";
  const id = slug[1] ? Number(slug[1]) : 0;
  if (stage !== "home" && (!["c", "s"].includes(stage) || !Number.isSafeInteger(id) || id <= 0)) notFound();

  let heading = "الأقسام الرئيسية";
  let title = concept.tagline;
  let hint = concept.hint;
  let backHref: string | null = null;
  let list: { id: number; name: string; href: string; count: string; imageKey: string | null }[] = [];
  let productPage: Awaited<ReturnType<typeof getPreviewProductPage>> | null = null;

  if (stage === "home") {
    const categories = await getMainCategoriesWithDetails();
    list = categories.map((item) => ({
      id: item.id, name: item.name,
      href: item.sub_count > 0 ? `${base}/c/${item.id}` : `${base}/s/${item.id}`,
      count: item.sub_count > 0 ? `${item.sub_count} فئات` : item.direct_product_count > 0 ? `${item.direct_product_count} قطعة` : "اضغطي وشوفي",
      imageKey: item.cover_key,
    }));
  } else if (stage === "c") {
    const [category, subcategories] = await Promise.all([getCategoryById(id), getSubcategoriesWithDetails(id)]);
    if (!category || category.parent_id !== null) notFound();
    if (subcategories.length === 0) {
      // A category without children can show products directly.
      const page = await getPreviewProductPage(id);
      productPage = page;
      heading = "الموديلات";
      title = category.name;
      hint = "اضغطي على أي صورة حتى تكبر";
      backHref = base;
    } else {
      list = subcategories.map((item) => ({
        id: item.id, name: item.name, href: `${base}/s/${item.id}`,
        count: item.product_count > 0 ? `${item.product_count} قطعة` : "شوفي القسم",
        imageKey: item.cover_key,
      }));
      heading = "الأقسام الفرعية";
      title = category.name;
      hint = "اختاري النوع حتى تشوفين القطع والأسعار";
      backHref = base;
    }
  } else {
    const category = await getCategoryById(id);
    if (!category) notFound();
    const [page, parent] = await Promise.all([
      getPreviewProductPage(id),
      category.parent_id === null ? Promise.resolve(null) : getCategoryById(category.parent_id),
    ]);
    productPage = page;
    heading = "المنتجات";
    title = category.name;
    hint = "اضغطي على الصورة حتى تشوفين القياسات والسعر";
    backHref = parent ? `${base}/c/${parent.id}` : base;
  }

  return (
    <div className={`preview-site ${previewFont.className}`} data-variant={variant} dir="rtl">
      <div className="preview-app-shell">
        {variant !== "2" && <div className="preview-design-switch" aria-label="التصاميم الخمسة">
          <span>قارني التصاميم:</span>
          {Object.entries(concepts).map(([number]) => (
            <Link key={number} href={`/preview/${number}`} className={number === variant ? "selected" : ""} aria-current={number === variant ? "page" : undefined}>
              {number}
            </Link>
          ))}
        </div>}
        <header className="preview-header">
          {backHref ?
            <Link href={backHref} className="preview-back" aria-label="رجوع للأقسام"><ArrowRight size={21} /><span>رجوع</span></Link> :
            <div className="preview-mark"><ShoppingBag size={22} strokeWidth={1.5} /></div>}
          <div className="preview-brand"><strong>مجمع خانم</strong><span>ملابس • كوزمتكس • أطفال</span></div>
          {variant !== "2" && <span className="preview-header-heart"><Heart size={20} strokeWidth={1.5} /></span>}
        </header>

        <main className="preview-main">
          {variant !== "2" && <div className="preview-hero">
            <div className="preview-eyebrow"><span className="preview-eyebrow-dot" />{concept.eyebrow}</div>
            <h1>{title}</h1>
            <p>{hint}</p>
          </div>}

          {variant !== "2" && <div className="preview-stepper" aria-label="مراحل التصفح">
            <span className={stage === "home" ? "current" : "complete"}>١ الأقسام</span><ChevronLeft size={15} />
            <span className={stage === "c" ? "current" : stage === "home" ? "" : "complete"}>٢ الفئات</span><ChevronLeft size={15} />
            <span className={productPage !== null ? "current" : ""}>٣ المنتجات</span>
          </div>}

          <div className="preview-section-title">
            <h2>{variant === "2" && stage !== "home" ? title : heading}</h2>
            {productPage === null && <span>{list.length} {stage === "home" ? "أقسام" : "فئات"}</span>}
          </div>

          {productPage !== null ? <PreviewProductShelf key={id} categoryId={id} initial={productPage} /> :
            <div className="preview-categories">
              {list.map((item, index) => (
                <PreviewCategoryLink key={item.id} href={item.href} name={item.name}
                  count={item.count} imageKey={item.imageKey} order={index} />
              ))}
              {!list.length && <div className="preview-empty"><ShoppingBag size={36} />ماكو أقسام معروضة حالياً</div>}
            </div>}

          <div className={`preview-footer ${variant === "2" ? "live-footer" : ""}`}>{variant === "2" ? KHANOM_ADDRESS : <><ArrowUpLeft size={14} /> مجمع خانم • الكوت، شارع الشيرازي</>}</div>
        </main>
      </div>
    </div>
  );
}
