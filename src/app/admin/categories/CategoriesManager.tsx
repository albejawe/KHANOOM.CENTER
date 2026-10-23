"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/queries";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/categories";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

interface Props {
  initialCategories: (Category & { children_count?: number })[];
}

export default function CategoriesManager({ initialCategories }: Props) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<"add-main" | "add-sub" | "edit" | null>(null);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [orderInput, setOrderInput] = useState("0");
  const [parentIdInput, setParentIdInput] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const mainCategories = initialCategories.filter((c) => c.parent_id === null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openAddMain = () => {
    setNameInput("");
    setOrderInput((mainCategories.length + 1).toString());
    setParentIdInput(null);
    setTargetCategory(null);
    setModalMode("add-main");
  };

  const openAddSub = (parentId: number) => {
    setNameInput("");
    setOrderInput("1");
    setParentIdInput(parentId);
    setTargetCategory(null);
    setModalMode("add-sub");
  };

  const openEdit = (cat: Category) => {
    setNameInput(cat.name);
    setOrderInput(cat.sort_order.toString());
    setParentIdInput(cat.parent_id);
    setTargetCategory(cat);
    setModalMode("edit");
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (!nameInput.trim()) {
      setErrorMessage("يرجى كتابة اسم القسم");
      return;
    }

    setIsLoading(true);

    if (modalMode === "edit" && targetCategory) {
      const res = await updateCategoryAction({
        id: targetCategory.id,
        name: nameInput.trim(),
        parentId: parentIdInput,
        sortOrder: parseInt(orderInput, 10) || 0,
      });
      setIsLoading(false);
      if (res.success) {
        setModalMode(null);
        showNotification("تم تعديل القسم بنجاح");
        router.refresh();
      } else {
        setErrorMessage(res.error || "تعذر التعديل");
      }
    } else {
      const res = await createCategoryAction({
        name: nameInput.trim(),
        parentId: parentIdInput,
        sortOrder: parseInt(orderInput, 10) || 0,
      });
      setIsLoading(false);
      if (res.success) {
        setModalMode(null);
        showNotification("تمت إضافة القسم بنجاح");
        router.refresh();
      } else {
        setErrorMessage(res.error || "تعذر الإضافة");
      }
    }
  };

  const handleDelete = async (cat: Category) => {
    const isMain = cat.parent_id === null;
    const confirmMsg = isMain
      ? `هل أنت متأكد من حذف القسم الرئيسي "${cat.name}"؟`
      : `هل أنت متأكد من حذف الفئة الفرعية "${cat.name}"؟`;

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    const res = await deleteCategoryAction(cat.id);
    setIsLoading(false);

    if (res.success) {
      showNotification("تم الحذف بنجاح");
      router.refresh();
    } else {
      alert(res.error || "تعذر الحذف");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">الأقسام والفئات</h1>
          <p className="text-xs text-slate-400">
            أضف أو عدل الأقسام الرئيسية (نسائي، أطفال...) والفئات التابعة لها
          </p>
        </div>

        <button
          onClick={openAddMain}
          className="h-11 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>قسم رئيسي جديد</span>
        </button>
      </div>

      {/* Categories Accordion / List */}
      <div className="space-y-4">
        {mainCategories.map((main) => {
          const subs = initialCategories.filter((c) => c.parent_id === main.id);

          return (
            <div
              key={main.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden"
            >
              {/* Main Category Header Bar */}
              <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    {main.sort_order}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{main.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                        {subs.length} فئة فرعية
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddSub(main.id)}
                    className="h-9 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>فئة فرعية</span>
                  </button>

                  <button
                    onClick={() => openEdit(main)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(main)}
                    className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subcategories list */}
              <div className="p-3 divide-y divide-slate-800/60">
                {subs.length === 0 ? (
                  <p className="text-xs text-slate-500 p-3 text-center">
                    لا توجد فئات فرعية مضافة في هذا القسم بعد
                  </p>
                ) : (
                  subs.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                        <span className="text-sm font-semibold text-slate-200">
                          {sub.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(sub)}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub)}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {modalMode === "add-main" && "إضافة قسم رئيسي جديد"}
                {modalMode === "add-sub" && "إضافة فئة فرعية جديدة"}
                {modalMode === "edit" && "تعديل القسم"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم القسم / الفئة
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="مثال: فساتين، أحذية، ملابس مواليد..."
                  className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ترتيب الظهور (رقم)
                </label>
                <input
                  type="number"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSave}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isLoading ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="h-11 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
