"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Size } from "@/lib/queries";
import { createSizeAction, updateSizeAction, deleteSizeAction } from "@/app/actions/sizes";
import { Ruler, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  initialSizes: Size[];
}

export default function SizesManager({ initialSizes }: Props) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [targetSize, setTargetSize] = useState<Size | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [orderInput, setOrderInput] = useState("0");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openAdd = () => {
    setNameInput("");
    setOrderInput((initialSizes.length + 1).toString());
    setTargetSize(null);
    setModalMode("add");
  };

  const openEdit = (size: Size) => {
    setNameInput(size.name);
    setOrderInput(size.sort_order.toString());
    setTargetSize(size);
    setModalMode("edit");
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (!nameInput.trim()) {
      setErrorMessage("يرجى كتابة اسم القياس");
      return;
    }

    setIsLoading(true);

    if (modalMode === "edit" && targetSize) {
      const res = await updateSizeAction({
        id: targetSize.id,
        name: nameInput.trim(),
        sortOrder: parseInt(orderInput, 10) || 0,
      });
      setIsLoading(false);
      if (res.success) {
        setModalMode(null);
        showNotification("تم تعديل القياس بنجاح");
        router.refresh();
      } else {
        setErrorMessage(res.error || "تعذر التعديل");
      }
    } else {
      const res = await createSizeAction({
        name: nameInput.trim(),
        sortOrder: parseInt(orderInput, 10) || 0,
      });
      setIsLoading(false);
      if (res.success) {
        setModalMode(null);
        showNotification("تمت إضافة القياس بنجاح");
        router.refresh();
      } else {
        setErrorMessage(res.error || "تعذر الإضافة");
      }
    }
  };

  const handleDelete = async (size: Size) => {
    if (!window.confirm(`هل أنت متأكد من حذف القياس "${size.name}"؟`)) return;

    setIsLoading(true);
    const res = await deleteSizeAction(size.id);
    setIsLoading(false);

    if (res.success) {
      showNotification("تم حذف القياس");
      router.refresh();
    } else {
      alert(res.error || "تعذر حذف القياس");
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
          <h1 className="text-xl md:text-2xl font-black text-white">إدارة القياسات</h1>
          <p className="text-xs text-slate-400">
            مخزون القياسات الجاهزة التي تختار منها بنقرة واحدة عند إضافة أي منتج
          </p>
        </div>

        <button
          onClick={openAdd}
          className="h-11 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>إضافة قياس جديد</span>
        </button>
      </div>

      {/* Sizes List */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {initialSizes.map((size) => (
            <div
              key={size.id}
              className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:border-slate-600 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                  {size.sort_order}
                </span>
                <span className="text-sm font-bold text-white">{size.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(size)}
                  className="w-8 h-8 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(size)}
                  className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {modalMode === "add" ? "إضافة قياس جديد" : "تعديل القياس"}
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
                  اسم القياس
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="مثال: XXL أو قياس 38 أو 3 سنوات..."
                  className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ترتيب الظهور
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
