"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import type { Category, Size, Product } from "@/lib/queries";
import { toggleProductHiddenAction } from "@/app/actions/products";
import BatchUploadModal from "./BatchUploadModal";
import ProductEditModal from "./ProductEditModal";
import {
  Plus,
  Eye,
  EyeOff,
  Filter,
  Package,
  Layers,
  Ruler,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Props {
  initialProducts: Product[];
  categories: Category[];
  sizes: Size[];
  stats: {
    totalProducts: number;
    visibleProducts: number;
    hiddenProducts: number;
    totalSubcategories: number;
    totalSizes: number;
  };
}

export default function AdminProductManager({
  initialProducts,
  categories,
  sizes,
  stats,
}: Props) {
  const router = useRouter();
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const mainCategories = categories.filter((c) => c.parent_id === null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleHidden = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setTogglingId(product.id);
    const res = await toggleProductHiddenAction(product.id);
    setTogglingId(null);
    if (res.success) {
      showNotification(
        product.is_hidden === 1 ? "تم إظهار المنتج للزوار" : "تم إخفاء المنتج عن الزوار"
      );
      router.refresh();
    }
  };

  // Filter products by selected category
  const filteredProducts = filterCategoryId
    ? initialProducts.filter(
        (p) =>
          p.category_id === Number(filterCategoryId) ||
          p.parent_category_id === Number(filterCategoryId)
      )
    : initialProducts;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium">كل المنتجات</span>
          </div>
          <span className="text-2xl font-black text-white">{stats.totalProducts}</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium">الظاهرة للزوار</span>
          </div>
          <span className="text-2xl font-black text-emerald-400">{stats.visibleProducts}</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <EyeOff className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium">المخفية</span>
          </div>
          <span className="text-2xl font-black text-rose-400">{stats.hiddenProducts}</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium">الفئات النشطة</span>
          </div>
          <span className="text-2xl font-black text-blue-400">{stats.totalSubcategories}</span>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category filter dropdown */}
        <div className="relative flex-1 sm:max-w-xs">
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-12 px-4 ps-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium outline-none focus:border-amber-400 appearance-none"
          >
            <option value="">جميع الأقسام والفئات</option>
            {mainCategories.map((main) => {
              const subs = categories.filter((c) => c.parent_id === main.id);
              return (
                <optgroup key={main.id} label={`-- ${main.name} --`}>
                  <option value={main.id}>{main.name} (الكل)</option>
                  {subs.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <Filter className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Big Add Products Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="h-12 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>إضافة منتجات (رفع جماعي)</span>
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 p-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-300">لا توجد منتجات حتى الآن</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            انقر على زر &quot;إضافة منتجات&quot; بالأعلى لاختيار صور من الاستوديو وتعبئة المعرض بسرعة وسهولة
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="h-10 px-4 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول منتج</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredProducts.map((prod) => {
            const isHidden = prod.is_hidden === 1;
            return (
              <div
                key={prod.id}
                onClick={() => setEditingProduct(prod)}
                className={`group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900 border transition cursor-pointer hover:border-slate-700 ${
                  isHidden ? "border-slate-800/60 opacity-75" : "border-slate-800"
                }`}
              >
                {/* Image Aspect ratio container */}
                <div className="relative aspect-square bg-slate-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(prod.image_key, "thumb")}
                    alt={`Product ${prod.id}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shadow backdrop-blur ${
                        isHidden
                          ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                          : "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {isHidden ? "مخفي" : "ظاهر"}
                    </span>

                    {/* Quick eye toggle button */}
                    <button
                      type="button"
                      title={isHidden ? "إظهار للزوار" : "إخفاء عن الزوار"}
                      disabled={togglingId === prod.id}
                      onClick={(e) => handleToggleHidden(e, prod)}
                      className="pointer-events-auto w-7 h-7 rounded-lg bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur transition active:scale-95"
                    >
                      {isHidden ? (
                        <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Details card */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-slate-400 truncate">
                        {prod.category_name}
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {formatPrice(prod.price)}
                      </span>
                    </div>

                    {/* Sizes chips */}
                    {prod.sizes && prod.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prod.sizes.slice(0, 3).map((s) => (
                          <span
                            key={s.id}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium"
                          >
                            {s.name}
                          </span>
                        ))}
                        {prod.sizes.length > 3 && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-500">
                            +{prod.sizes.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 mt-2 block text-end">
                    انقر للتعديل ←
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Upload Modal */}
      <BatchUploadModal
        categories={categories}
        sizes={sizes}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          showNotification("تم رفع المنتجات بنجاح!");
          router.refresh();
        }}
      />

      {/* Single Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          sizes={sizes}
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            showNotification("تم تحديث المنتج بنجاح!");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
