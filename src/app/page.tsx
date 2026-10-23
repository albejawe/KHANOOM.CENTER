import type { Metadata } from "next";
import { getMainCategoriesWithDetails } from "@/lib/queries";
import LiveStorefront from "@/components/site/LiveStorefront";

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
  const categories = await getMainCategoriesWithDetails();

  return <LiveStorefront
    heading="الأقسام الرئيسية"
    items={categories.map((item) => ({
      id: item.id,
      name: item.name,
      href: item.sub_count > 0 ? `/c/${item.id}` : `/s/${item.id}`,
      count: item.sub_count > 0
        ? `${item.sub_count} فئات`
        : item.direct_product_count > 0 ? `${item.direct_product_count} قطعة` : "تصفحي القسم",
      imageKey: item.cover_key,
    }))}
  />;
}
