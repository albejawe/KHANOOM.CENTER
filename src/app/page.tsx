import { getMainCategories, getCategoryCoverKey, getSubcategories } from "@/lib/queries";
import SiteHeader from "@/components/site/SiteHeader";
import CategoryCard from "@/components/site/CategoryCard";
import { Sparkles } from "lucide-react";

export const instant = false;

export default async function HomePage() {
  const mainCategories = await getMainCategories();

  // Load covers and subcategory counts for each main category
  const categoriesWithData = await Promise.all(
    mainCategories.map(async (cat) => {
      const [coverKey, subs] = await Promise.all([
        getCategoryCoverKey(cat.id),
        getSubcategories(cat.id),
      ]);
      return {
        ...cat,
        coverKey,
        subCount: subs.length,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-5">
        {/* Welcome Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight">
                أهلاً بكم في مجمع خانم
              </h1>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                تصفح أرقى الموديلات والماركات • اضغط على القسم للبدء
              </p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-3.5">
          {categoriesWithData.map((cat, index) => (
            <CategoryCard
              key={cat.id}
              href={`/c/${cat.id}`}
              name={cat.name}
              countLabel={`${cat.subCount} فئة متوفرة`}
              imageKey={cat.coverKey}
              priority={index === 0}
            />
          ))}
        </div>

        {/* Simple Footer */}
        <footer className="pt-6 pb-8 text-center text-slate-400 space-y-1">
          <p className="text-xs font-semibold text-slate-600">مجمع خانم للأزياء والكوزمتكس</p>
          <p className="text-[11px]">المعرض مخصص لعرض البضاعة والأسعار لزبائننا الكرام</p>
        </footer>
      </main>
    </div>
  );
}
