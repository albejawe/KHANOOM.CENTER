import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getCategoryById,
  getSubcategoriesWithDetails,
} from "@/lib/queries";
import LiveStorefront from "@/components/site/LiveStorefront";

// Ultra-fast single SQL query to load all subcategories with counts and covers

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
  const ogImageUrl = `/api/og?cat=${encodeURIComponent(category.name)}`;

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
  const parentId = Number(id);
  if (!Number.isSafeInteger(parentId) || parentId <= 0) notFound();

  const [category, subcategories] = await Promise.all([
    getCategoryById(parentId),
    getSubcategoriesWithDetails(parentId),
  ]);
  if (!category || category.parent_id !== null) notFound();

  // Existing links to categories without children still open their products.
  if (subcategories.length === 0) redirect(`/s/${parentId}`);

  return <LiveStorefront
    heading={category.name}
    backHref="/"
    items={subcategories.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/s/${item.id}`,
      count: item.product_count > 0 ? `${item.product_count} قطعة` : "تصفحي القسم",
      imageKey: item.cover_key,
    }))}
  />;
}
