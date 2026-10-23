"use client";

import { useState } from "react";
import { updateProductAction, deleteProductAction, toggleProductHiddenAction } from "@/app/actions/products";
import { formatPrice } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import type { Category, Size, Product } from "@/lib/queries";
import { X, Check, Trash2, Eye, EyeOff, Save, AlertCircle } from "lucide-react";

interface Props {
  product: Product;
  categories: Category[];
  sizes: Size[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductEditModal({
  product,
  categories,
  sizes,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(product.category_id);
  const [price, setPrice] = useState<string>(product.price.toString());
  const [description, setDescription] = useState<string>(product.description || "");
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>(
    product.sizes?.map((s) => s.id) || []
  );
  const [isHidden, setIsHidden] = useState<boolean>(product.is_hidden === 1);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subCategories = categories.filter((c) => c.parent_id !== null);

  const toggleSize = (sizeId: number) => {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]
    );
  };

  const handleSave = async () => {
    setErrorMessage(null);
    const numericPrice = parseInt(price, 10);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setErrorMessage("يرجى إدخال سعر صحيح");
      return;
    }

    setIsSaving(true);
    const result = await updateProductAction({
      id: product.id,
      categoryId: selectedCategoryId,
      price: numericPrice,
      description: description.trim() || null,
      imageKey: product.image_key,
      isHidden,
      sizeIds: selectedSizeIds,
    });
    setIsSaving(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMessage(result.error || "تعذر حفظ التعديلات");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProductAction(product.id);
    setIsDeleting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMessage(result.error || "تعذر حذف المنتج");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl my-auto text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">تعديل المنتج #{product.id}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Image & Hide/Show Toggle */}
          <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(product.image_key, "thumb")}
                alt="Product thumbnail"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <span className="text-xs text-slate-400 block mb-1">حالة الظهور للزوار:</span>
              <button
                type="button"
                onClick={() => setIsHidden(!isHidden)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border ${
                  isHidden
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {isHidden ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>مخفي (لا يظهر للزوار)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>ظاهر للزوار بالموقع</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              الفئة الفرعية
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
            >
              {subCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">السعر</label>
              <span className="text-xs font-bold text-amber-400">
                {formatPrice(parseInt(price, 10) || 0)}
              </span>
            </div>
            <input
              type="number"
              step="500"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-base outline-none focus:border-amber-400"
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              القياسات المتوفرة
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-800/40 rounded-2xl border border-slate-800">
              {sizes.map((s) => {
                const isSelected = selectedSizeIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSize(s.id)}
                    className={`h-8 px-3 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              الوصف (اختياري)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف القطعة..."
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="flex-1 h-11 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
            </button>

            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-11 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                >
                  {isDeleting ? "جاري الحذف..." : "تأكيد الحذف نهائياً"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-11 px-3 rounded-2xl bg-slate-800 text-slate-300 text-xs transition"
                >
                  تراجع
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-11 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف القطعة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
