import { getAllVisibleCatalog } from "@/lib/queries";
import FastCatalog from "@/components/site/FastCatalog";

export const instant = false;

export default async function HomePage() {
  const { mainCategories, subCategories, products } = await getAllVisibleCatalog();

  return (
    <FastCatalog
      mainCategories={mainCategories}
      subCategories={subCategories}
      products={products}
    />
  );
}
