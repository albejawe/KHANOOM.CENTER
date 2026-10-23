import { getAllCategoriesFlat } from "@/lib/queries";
import CategoriesManager from "./CategoriesManager";

export const instant = false;

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesFlat();

  return <CategoriesManager initialCategories={categories} />;
}
