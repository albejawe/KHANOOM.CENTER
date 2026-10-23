import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryById, getProductDetails } from "@/lib/queries";
import { imageUrl } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import LiveStorefront from "@/components/site/LiveStorefront";
import { getPreviewProductPage } from "@/lib/catalog-preview";

// Fast server rendering with direct product lookup

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string; [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { p: productParam } = await searchParams;
  const subcategoryId = parseInt(id, 10);
  if (isNaN(subcategoryId)) return {};

  const category = await getCategoryById(subcategoryId);
  if (!category) return {};

  // Case 1: Specific product link is shared (e.g., /s/4?p=1)
  if (productParam) {
    const productId = parseInt(productParam, 10);
    if (!isNaN(productId)) {
      const product = await getProductDetails(productId);
      if (product && !product.is_hidden) {
        const fullImageUrl = imageUrl(product.image_key, "full");
        const priceStr = formatPrice(product.price);
        const sizesStr =
          product.sizes && product.sizes.length > 0
            ? ` | القياسات: ${product.sizes.map((s) => s.name).join("، ")}`
            : "";
        const title = `${category.name} (${priceStr}) | مجمع خانم`;
        const description = product.description
          ? `${product.description} • السعر: ${priceStr}${sizesStr}`
          : `السعر: ${priceStr}${sizesStr} • مجمع خانم للأزياء والكوزمتكس`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `/s/${subcategoryId}?p=${productId}`,
            siteName: "مجمع خانم للأزياء والكوزمتكس",
            images: [
              {
                url: fullImageUrl,
                alt: title,
              },
            ],
            locale: "ar_IQ",
            type: "website",
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [fullImageUrl],
          },
        };
      }
    }
  }

  // Case 2: Category / Subcategory view without ?p=
  const ctaText = `انقر هنا لمشاهدة ${category.name}`;
  const ogImageUrl = `/api/og?cat=${encodeURIComponent(category.name)}`;

  return {
    title: `${ctaText} | مجمع خانم`,
    description: `تصفح تشكيلة ${category.name} مع الأسعار والتفاصيل في مجمع خانم للأزياء والكوزمتكس`,
    openGraph: {
      title: ctaText,
      description: `تصفح تشكيلة ${category.name} مع الأسعار والتفاصيل في مجمع خانم للأزياء والكوزمتكس`,
      url: `/s/${subcategoryId}`,
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

export default async function SubcategoryProductsPage({ params, searchParams }: Props) {
  const [{ id }, { p }] = await Promise.all([params, searchParams]);
  const subcategoryId = Number(id);
  if (!Number.isSafeInteger(subcategoryId) || subcategoryId <= 0) notFound();

  const [category, productPage] = await Promise.all([
    getCategoryById(subcategoryId),
    getPreviewProductPage(subcategoryId),
  ]);
  if (!category) notFound();

  // Keep old product-sharing URLs working even when the item isn't in the first 24.
  const requestedId = typeof p === "string" && /^[1-9]\d*$/.test(p) ? Number(p) : null;
  const focused = requestedId && Number.isSafeInteger(requestedId)
    ? await getProductDetails(requestedId)
    : null;
  const initialFocusProduct = focused && focused.category_id === subcategoryId && !focused.is_hidden ? focused : null;

  return <LiveStorefront
    heading={category.name}
    categoryId={subcategoryId}
    productPage={productPage}
    initialFocusProduct={initialFocusProduct}
    backHref={category.parent_id ? `/c/${category.parent_id}` : "/"}
  />;
}
