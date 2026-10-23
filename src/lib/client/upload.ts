import { compressImage } from "./compress";
import { prepareUploadUrlsAction, createBulkProductsAction } from "@/app/actions/products";

export interface UploadBatchOptions {
  files: File[];
  categoryId: number;
  price: number;
  description?: string;
  sizeIds: number[];
  onProgress?: (progress: {
    phase: "compressing" | "uploading" | "saving";
    current: number;
    total: number;
    percent: number;
  }) => void;
}

export async function uploadBatchProducts({
  files,
  categoryId,
  price,
  description,
  sizeIds,
  onProgress,
}: UploadBatchOptions): Promise<{ success: boolean; count?: number; error?: string }> {
  if (files.length === 0) {
    return { success: false, error: "يرجى اختيار صورة واحدة على الأقل" };
  }

  const total = files.length;

  try {
    // 1. Get presigned upload URLs for all files
    onProgress?.({ phase: "compressing", current: 0, total, percent: 5 });
    const prepRes = await prepareUploadUrlsAction(total);
    if (!prepRes.success || !prepRes.items) {
      return { success: false, error: prepRes.error || "تعذر إنشاء روابط رفع الصور" };
    }

    const uploadSlots = prepRes.items;
    const uploadedImageKeys: string[] = [];

    // 2. Process and upload files in batches of 3
    const concurrency = 3;
    let completed = 0;

    for (let i = 0; i < files.length; i += concurrency) {
      const slice = files.slice(i, i + concurrency);

      await Promise.all(
        slice.map(async (file, indexInSlice) => {
          const globalIndex = i + indexInSlice;
          const slot = uploadSlots[globalIndex];

          // Compress in browser
          const { thumb, full } = await compressImage(file);

          onProgress?.({
            phase: "uploading",
            current: completed,
            total,
            percent: 15 + Math.round((completed / total) * 75),
          });

          // Upload thumb to R2
          const thumbRes = await fetch(slot.thumbUploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
            body: thumb,
          });

          if (!thumbRes.ok) {
            throw new Error(`تعذر رفع الصورة المصغرة رقم ${globalIndex + 1}`);
          }

          // Upload full to R2
          const fullRes = await fetch(slot.fullUploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
            body: full,
          });

          if (!fullRes.ok) {
            throw new Error(`تعذر رفع الصورة الأصلية رقم ${globalIndex + 1}`);
          }

          uploadedImageKeys.push(slot.imageKey);
          completed++;

          onProgress?.({
            phase: "uploading",
            current: completed,
            total,
            percent: 15 + Math.round((completed / total) * 75),
          });
        })
      );
    }

    // 3. Save products in database
    onProgress?.({ phase: "saving", current: total, total, percent: 95 });
    const saveRes = await createBulkProductsAction({
      categoryId,
      price,
      description,
      imageKeys: uploadedImageKeys,
      sizeIds,
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || "تعذر حفظ المنتجات في قاعدة البيانات" };
    }

    onProgress?.({ phase: "saving", current: total, total, percent: 100 });
    return { success: true, count: uploadedImageKeys.length };
  } catch (err) {
    console.error("Batch upload error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الرفع",
    };
  }
}
