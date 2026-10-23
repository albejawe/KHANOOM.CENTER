import {
  getAllProductsAdmin,
  getAllCategoriesFlat,
  getAllSizes,
  getAdminStats,
} from "@/lib/queries";
import AdminProductManager from "./components/AdminProductManager";

export const instant = false;

export default async function AdminProductsPage() {
  const [products, categories, sizes, stats] = await Promise.all([
    getAllProductsAdmin({ limit: 300 }),
    getAllCategoriesFlat(),
    getAllSizes(),
    getAdminStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">إدارة المنتجات</h1>
          <p className="text-xs text-slate-400">
            أضف المنتجات بالصور وحدد الأسعار والقياسات المتوفرة
          </p>
        </div>
      </div>

      <AdminProductManager
        initialProducts={products}
        categories={categories}
        sizes={sizes}
        stats={stats}
      />
    </div>
  );
}
