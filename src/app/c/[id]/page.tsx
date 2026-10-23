import { notFound } from "next/navigation";
import { getCategoryById, getSubcategories, getCategoryCoverKey, getProductsForSubcategory } from "@/lib/queries";
import SiteHeader from "@/components/site/SiteHeader";
import CategoryCard from "@/components/site/CategoryCard";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const parentId = parseInt(id, 10);
  if (isNaN(parentId)) notFound();

  const category = await getCategoryById(parentId);
  if (!category) notFound();

  const subcategories = await getSubcategories(parentId);

  // Fetch covers and product count for each subcategory
  const subsWithData = await Promise.all(
    subcategories.map(async (sub) => {
      const [coverKey, products] = await Promise.all([
        getCategoryCoverKey(sub.id),
        getProductsForSubcategory(sub.id),
      ]);
      return {
        ...sub,
        coverKey,
        productCount: products.length,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader
        title={category.name}
        subtitle="اختر الفئة المطلوبة"
        backHref="/"
        backLabel="الرئيسية"
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base font-extrabold text-slate-800">
            فئات {category.name}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {subsWithData.length} فئة
          </span>
        </div>

        <div className="space-y-3">
          {subsWithData.map((sub, index) => (
            <CategoryCard
              key={sub.id}
              href={`/s/${sub.id}`}
              name={sub.name}
              countLabel={
                sub.productCount > 0
                  ? `${sub.productCount} قطعة متوفرة`
                  : "جديد المعرض"
              }
              imageKey={sub.coverKey}
              priority={index === 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
