"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { categorySchema } from "@/lib/validation";
import { deleteImageFromR2 } from "@/lib/r2";

export async function createCategoryAction(data: {
  name: string;
  parentId?: number | null;
  imageKey?: string | null;
  sortOrder?: number;
}) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { name, parentId, imageKey, sortOrder } = parsed.data;

  try {
    const result = await db.execute({
      sql: "INSERT INTO categories (name, parent_id, image_key, sort_order) VALUES (?, ?, ?, ?) RETURNING id",
      args: [name.trim(), parentId ?? null, imageKey ?? null, sortOrder ?? 0],
    });

    revalidatePath("/", "layout");
    return { success: true, id: Number(result.rows[0].id) };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "تعذر إضافة القسم، يرجى المحاولة لاحقاً" };
  }
}

export async function updateCategoryAction(data: {
  id: number;
  name: string;
  parentId?: number | null;
  imageKey?: string | null;
  sortOrder?: number;
}) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success || !data.id) {
    return { success: false, error: parsed.error?.issues[0]?.message || "معرف القسم غير صحيح" };
  }

  const { name, parentId, imageKey, sortOrder } = parsed.data;
  const categoryId = data.id;

  try {
    await db.execute({
      sql: `
        UPDATE categories 
        SET name = ?, parent_id = ?, image_key = ?, sort_order = ?
        WHERE id = ?
      `,
      args: [name.trim(), parentId ?? null, imageKey ?? null, sortOrder ?? 0, categoryId],
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, error: "تعذر تعديل القسم" };
  }
}

export async function deleteCategoryAction(id: number) {
  await requireAdmin();

  try {
    // Check if category has subcategories
    const childCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM categories WHERE parent_id = ?",
      args: [id],
    });
    if (Number(childCheck.rows[0].count) > 0) {
      return { success: false, error: "لا يمكن حذف هذا القسم لأنه يحتوي على فئات فرعية" };
    }

    // Check if category has products
    const prodCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
      args: [id],
    });
    if (Number(prodCheck.rows[0].count) > 0) {
      return { success: false, error: "لا يمكن حذف هذه الفئة لأنها تحتوي على منتجات" };
    }

    // Check if category has an image to delete from R2
    const cat = await db.execute({
      sql: "SELECT image_key FROM categories WHERE id = ?",
      args: [id],
    });
    const imgKey = cat.rows[0]?.image_key as string | null;
    if (imgKey) {
      await deleteImageFromR2(imgKey);
    }

    await db.execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [id],
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "تعذر حذف القسم" };
  }
}
