"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { sizeSchema } from "@/lib/validation";

export async function createSizeAction(data: { name: string; sortOrder?: number }) {
  await requireAdmin();

  const parsed = sizeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { name, sortOrder } = parsed.data;

  try {
    const result = await db.execute({
      sql: "INSERT INTO sizes (name, sort_order) VALUES (?, ?) RETURNING id",
      args: [name.trim(), sortOrder ?? 0],
    });

    revalidatePath("/", "layout");
    return { success: true, id: Number(result.rows[0].id) };
  } catch (error: unknown) {
    console.error("Failed to create size:", error);
    const msg = error instanceof Error && error.message.includes("UNIQUE")
      ? "هذا القياس مضاف مسبقاً"
      : "تعذر إضافة القياس";
    return { success: false, error: msg };
  }
}

export async function updateSizeAction(data: { id: number; name: string; sortOrder?: number }) {
  await requireAdmin();

  const parsed = sizeSchema.safeParse(data);
  if (!parsed.success || !data.id) {
    return { success: false, error: parsed.error?.issues[0]?.message || "معرف القياس غير صحيح" };
  }

  const { name, sortOrder } = parsed.data;
  const sizeId = data.id;

  try {
    await db.execute({
      sql: "UPDATE sizes SET name = ?, sort_order = ? WHERE id = ?",
      args: [name.trim(), sortOrder ?? 0, sizeId],
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update size:", error);
    return { success: false, error: "تعذر تعديل القياس" };
  }
}

export async function deleteSizeAction(id: number) {
  await requireAdmin();

  try {
    await db.execute({
      sql: "DELETE FROM sizes WHERE id = ?",
      args: [id],
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete size:", error);
    return { success: false, error: "تعذر حذف القياس" };
  }
}
