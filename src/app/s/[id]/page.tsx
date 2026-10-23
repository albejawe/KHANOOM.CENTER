import { notFound } from "next/navigation";
import { getCategoryById, getProductsForSubcategory } from "@/lib/queries";
import SiteHeader from "@/components/site/SiteHeader";
import ProductGrid from "@/components/site/ProductGrid";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubcategoryProductsPage({ params }: Props) {
  const { id } = await params;
  const subcategoryId = parseInt(id, 10);
  if (isNaN(subcategoryId)) notFound();

  const category = await getCategoryById(subcategoryId);
  if (!category) notFound();

  const products = await getProductsForSubcategory(subcategoryId);

  const backHref = category.parent_id ? `/c/${category.parent_id}` : "/";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader
        title={category.name}
        subtitle={`${products.length} قطعة معروضة • اضغط على الصورة للتكبير`}
        backHref={backHref}
        backLabel="رجوع"
      />

      <main className="flex-1 max-w-md w-full mx-auto pb-12">
        {/* Instagram 3-columns Style Grid */}
        <ProductGrid products={products} />
      </main>
    </div>
  );
}
