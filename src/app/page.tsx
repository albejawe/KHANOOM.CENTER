import type { Metadata } from "next";
import { getMainCategoriesWithDetails } from "@/lib/queries";
import CategoryCard from "@/components/site/CategoryCard";
import { Store } from "lucide-react";

// Ultra-fast single SQL query to load all categories + counts + covers

export const instant = false;

export const metadata: Metadata = {
  title: "مجمع خانم للأزياء والكوزمتكس - انقر هنا لمشاهدة جميع المنتجات",
  description: "تصفح أحدث تشكيلات الأزياء النسائية وملابس الأطفال ومستحضرات التجميل مع الأسعار الحصرية في مجمع خانم",
  openGraph: {
    title: "انقر هنا لمشاهدة جميع المنتجات",
    description: "تصفح أحدث تشكيلات الأزياء النسائية وملابس الأطفال ومستحضرات التجميل في مجمع خانم",
    url: "/",
    siteName: "مجمع خانم للأزياء والكوزمتكس",
    images: [
      {
        url: `/api/og?cat=${encodeURIComponent("جميع المنتجات")}`,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "انقر هنا لمشاهدة جميع المنتجات - مجمع خانم",
      },
    ],
    locale: "ar_IQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "انقر هنا لمشاهدة جميع المنتجات",
    description: "تصفح أحدث تشكيلات الأزياء النسائية وملابس الأطفال ومستحضرات التجميل في مجمع خانم",
    images: [`/api/og?cat=${encodeURIComponent("جميع المنتجات")}`],
  },
};

export default async function HomePage() {
  // Ultra-fast single SQL query to load all categories + counts + covers
  const categories = await getMainCategoriesWithDetails();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Header without any admin links */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black border border-amber-500/20 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-950 text-base leading-tight block">
                مجمع خانم
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">
                أزياء نسائية • ملابس أطفال • كوزمتكس
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Categories Only */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
          <h2 className="text-sm font-extrabold text-slate-800">
            الأقسام الرئيسية
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {categories.length} أقسام
          </span>
        </div>

        {/* Neatly Styled Categories List */}
        <div className="space-y-2.5">
          {categories.map((cat, index) => {
            const targetHref = cat.sub_count > 0 ? `/c/${cat.id}` : `/s/${cat.id}`;
            const countLabel =
              cat.sub_count > 0
                ? `${cat.sub_count} فئات فرعية`
                : cat.direct_product_count > 0
                ? `${cat.direct_product_count} قطعة متوفرة`
                : "تصفح القسم";

            return (
              <CategoryCard
                key={cat.id}
                href={targetHref}
                name={cat.name}
                countLabel={countLabel}
                imageKey={cat.cover_key}
                priority={index === 0}
              />
            );
          })}
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-10 text-center text-slate-400 text-xs space-y-1">
          <p className="font-bold text-slate-600">مجمع خانم للأزياء والكوزمتكس</p>
          <p className="text-[11px]">الموقع مخصص لعرض البضاعة والأسعار لزبائننا الكرام</p>
        </footer>
      </main>
    </div>
  );
}
