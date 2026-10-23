"use client";

import { useState } from "react";
import { uploadBatchProducts } from "@/lib/client/upload";
import { formatPrice } from "@/lib/format";
import type { Category, Size } from "@/lib/queries";
import { UploadCloud, X, Check, AlertCircle, Image as ImageIcon } from "lucide-react";

interface Props {
  categories: Category[];
  sizes: Size[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchUploadModal({
  categories,
  sizes,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | "">("");
  const [selectedSubId, setSelectedSubId] = useState<number | "">("");
  const [price, setPrice] = useState<string>("15000");
  const [description, setDescription] = useState("");
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    phase: "uploading",
    percent: 0,
    current: 0,
    total: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const mainCategories = categories.filter((c) => c.parent_id === null);
  const subCategories = selectedParentId
    ? categories.filter((c) => c.parent_id === Number(selectedParentId))
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (sizeId: number) => {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]
    );
  };

  const handleStartUpload = async () => {
    setErrorMessage(null);

    if (files.length === 0) {
      setErrorMessage("يرجى اختيار صورة واحدة على الأقل من الاستوديو");
      return;
    }

    if (!selectedSubId) {
      setErrorMessage("يرجى تحديد الفئة الفرعية للمنتجات");
      return;
    }

    const numericPrice = parseInt(price, 10);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setErrorMessage("يرجى إدخال سعر صحيح");
      return;
    }

    setIsUploading(true);

    const result = await uploadBatchProducts({
      files,
      categoryId: Number(selectedSubId),
      price: numericPrice,
      description: description.trim() || undefined,
      sizeIds: selectedSizeIds,
      onProgress: (p) => {
        setProgressInfo(p);
      },
    });

    setIsUploading(false);

    if (result.success) {
      // Reset form and close
      setFiles([]);
      setDescription("");
      onSuccess();
      onClose();
    } else {
      setErrorMessage(result.error || "حدث خطأ أثناء الرفع");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl my-auto text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إضافة منتجات (رفع جماعي)</h2>
              <p className="text-xs text-slate-400">
                كل صورة يتم اختيارها ستتحول تلقائياً لمنتج مستقل
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload in progress state */}
        {isUploading ? (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {progressInfo.phase === "compressing" && "جاري تجهيز وضغط الصور في جهازك..."}
                {progressInfo.phase === "uploading" &&
                  `جاري رفع الصور (${progressInfo.current} من ${progressInfo.total})...`}
                {progressInfo.phase === "saving" && "جاري حفظ المنتجات في قاعدة البيانات..."}
              </h3>
              <p className="text-xs text-slate-400">
                يرجى الانتظار وعدم إغلاق الصفحة، يتم ضغط الصور لتوفير استهلاك باقة الإنترنت
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressInfo.percent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-amber-400">{progressInfo.percent}%</span>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Image picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. اختيار الصور من الاستوديو ({files.length} صورة مختارة)
              </label>

              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <ImageIcon className="w-7 h-7 text-amber-400 mb-1" />
                  <p className="text-xs font-medium text-slate-300">
                    انقر لاختيار مجموعة صور معاً
                  </p>
                  <p className="text-[11px] text-slate-500">يمكنك تحديد أي عدد من الصور</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Thumbnails preview */}
              {files.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${i}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  2. القسم الرئيسي
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setSelectedParentId(val);
                    setSelectedSubId("");
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                >
                  <option value="">-- اختر القسم الرئيسي --</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الفئة الفرعية
                </label>
                <select
                  value={selectedSubId}
                  disabled={!selectedParentId}
                  onChange={(e) => setSelectedSubId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400 disabled:opacity-40"
                >
                  <option value="">-- اختر الفئة الفرعية --</option>
                  {subCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">3. السعر للقطعة</label>
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
                placeholder="15000"
                className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-base outline-none focus:border-amber-400"
              />
            </div>

            {/* Sizes picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                4. القياسات المتوفرة (انقر للتحديد)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-800/40 rounded-2xl border border-slate-800">
                {sizes.map((s) => {
                  const isSelected = selectedSizeIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSize(s.id)}
                      className={`h-8 px-3 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm"
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

            {/* Optional description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                5. وصف أو ملاحظات (اختياري)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: قماش كوري درجة أولى، ألوان متعددة"
                className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={files.length === 0 || !selectedSubId}
                className="flex-1 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <UploadCloud className="w-5 h-5" />
                <span>
                  رفع {files.length > 0 ? `(${files.length}) منتجات` : "المنتجات الآن"}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-12 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
