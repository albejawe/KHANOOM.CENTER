import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getCategoryById,
  getSubcategories,
  getCategoryCoverKey,
  getProductsForSubcategory,
} from "@/lib/queries";
import SiteHeader from "@/components/site/SiteHeader";
import CategoryCard from "@/components/site/CategoryCard";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const parentId = parseInt(id, 10);
  if (isNaN(parentId)) return {};

  const category = await getCategoryById(parentId);
  if (!category) return {};

  const ctaText = `انقر هنا لمشاهدة ${category.name}`;
  const ogImageUrl = `/api/og?title=${encodeURIComponent(ctaText)}&subtitle=${encodeURIComponent("مجمع خانم للأزياء والكوزمتكس")}`;

  return {
    title: `${ctaText} | مجمع خانم`,
    description: `تصفح تشكيلة ${category.name} مع الأسعار والتفاصيل في مجمع خانم للأزياء والكوزمتكس`,
    openGraph: {
      title: ctaText,
      description: `تصفح تشكيلة ${category.name} مع الأسعار والتفاصيل في مجمع خانم للأزياء والكوزمتكس`,
      url: `/c/${parentId}`,
      siteName: "مجمع خانم للأزياء والكوزمتكس",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: ctaText,
        },
      ],
      locale: "ar_IQ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ctaText,
      description: `تصفح تشكيلة ${category.name} مع الأسعار والتفاصيل في مجمع خانم للأزياء والكوزمتكس`,
      images: [ogImageUrl],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const parentId = parseInt(id, 10);
  if (isNaN(parentId)) notFound();

  const category = await getCategoryById(parentId);
  if (!category) notFound();

  const subcategories = await getSubcategories(parentId);

  // If this category has NO subcategories, redirect immediately to its products view!
  if (subcategories.length === 0) {
    redirect(`/s/${parentId}`);
  }

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <SiteHeader
        title={category.name}
        subtitle="اختر الفئة لمشاهدة الموديلات"
        backHref="/"
        backLabel="الرئيسية"
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-sm font-black text-slate-800">
            فئات {category.name}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {subsWithData.length} فئة متوفرة
          </span>
        </div>

        <div className="space-y-3.5">
          {subsWithData.map((sub, index) => (
            <CategoryCard
              key={sub.id}
              href={`/s/${sub.id}`}
              name={sub.name}
              countLabel={
                sub.productCount > 0
                  ? `${sub.productCount} قطعة متوفرة`
                  : "تصفح الفئة"
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
