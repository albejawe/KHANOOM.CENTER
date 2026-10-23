import type { Metadata } from "next";
import { getMainCategories, getSubcategories, getCategoryCoverKey, getProductsForSubcategory } from "@/lib/queries";
import CategoryCard from "@/components/site/CategoryCard";
import { Sparkles, Store } from "lucide-react";

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
        url: `/api/og?title=${encodeURIComponent("انقر هنا لمشاهدة جميع المنتجات")}`,
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
    images: [`/api/og?title=${encodeURIComponent("انقر هنا لمشاهدة جميع المنتجات")}`],
  },
};

export default async function HomePage() {
  const mainCategories = await getMainCategories();

  // Load covers, subcategory counts, and product counts for each main category
  const categoriesWithData = await Promise.all(
    mainCategories.map(async (cat) => {
      const [coverKey, subs] = await Promise.all([
        getCategoryCoverKey(cat.id),
        getSubcategories(cat.id),
      ]);

      // If category has no subcategories, check if it has direct products
      let directProductCount = 0;
      if (subs.length === 0) {
        const prods = await getProductsForSubcategory(cat.id);
        directProductCount = prods.length;
      }

      // If it has subcategories, link to /c/[id]. If no subcategories, link directly to /s/[id]!
      const targetHref = subs.length > 0 ? `/c/${cat.id}` : `/s/${cat.id}`;
      const countLabel =
        subs.length > 0
          ? `${subs.length} فئات فرعية`
          : directProductCount > 0
          ? `${directProductCount} قطعة متوفرة`
          : "تصفح القسم";

      return {
        ...cat,
        coverKey,
        targetHref,
        countLabel,
      };
    })
  );

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
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        {/* Simple Welcome Banner */}
        <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-sm flex items-center gap-3 border border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">
              أهلاً بكم في مجمع خانم
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              اختر القسم المطلوب لمشاهدة الموديلات والأسعار
            </p>
          </div>
        </div>

        {/* Main Categories Cards */}
        <div className="space-y-3.5">
          {categoriesWithData.map((cat, index) => (
            <CategoryCard
              key={cat.id}
              href={cat.targetHref}
              name={cat.name}
              countLabel={cat.countLabel}
              imageKey={cat.coverKey}
              priority={index === 0}
            />
          ))}
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
