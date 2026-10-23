"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { productSchema, bulkProductSchema, type ProductInput, type BulkProductInput } from "@/lib/validation";
import { newImageKey } from "@/lib/images";
import { getPresignedUploadUrls, deleteImageFromR2 } from "@/lib/r2";

/**
 * Prepares presigned upload URLs for batch or single uploads.
 */
export async function prepareUploadUrlsAction(count: number) {
  await requireAdmin();

  if (count <= 0 || count > 100) {
    return { success: false, error: "العدد يجب أن يكون بين 1 و 100" };
  }

  const items = [];
  for (let i = 0; i < count; i++) {
    const key = newImageKey("products");
    const urls = await getPresignedUploadUrls(key);
    items.push(urls);
  }

  return { success: true, items };
}

/**
 * Inserts a batch of products created from multiple images with shared category, price, sizes.
 */
export async function createBulkProductsAction(data: BulkProductInput) {
  await requireAdmin();

  const parsed = bulkProductSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { categoryId, price, description, imageKeys, sizeIds } = parsed.data;

  try {
    const batchStatements: Array<{ sql: string; args: (string | number | null)[] }> = [];

    // For each image, insert a product
    for (const imageKey of imageKeys) {
      batchStatements.push({
        sql: `INSERT INTO products (category_id, price, description, image_key, is_hidden)
              VALUES (?, ?, ?, ?, 0)`,
        args: [categoryId, price, description || null, imageKey],
      });
    }

    // Execute product insertions
    await db.batch(batchStatements, "write");

    // Fetch the newly inserted product IDs for these image keys to link their sizes
    if (sizeIds.length > 0) {
      const placeholders = imageKeys.map(() => "?").join(",");
      const inserted = await db.execute({
        sql: `SELECT id FROM products WHERE image_key IN (${placeholders})`,
        args: imageKeys,
      });

      const sizeStatements: Array<{ sql: string; args: (string | number)[] }> = [];
      for (const row of inserted.rows) {
        const prodId = Number(row.id);
        for (const sId of sizeIds) {
          sizeStatements.push({
            sql: "INSERT OR IGNORE INTO product_sizes (product_id, size_id) VALUES (?, ?)",
            args: [prodId, sId],
          });
        }
      }

      if (sizeStatements.length > 0) {
        await db.batch(sizeStatements, "write");
      }
    }

    revalidatePath("/", "layout");
    return { success: true, count: imageKeys.length };
  } catch (error) {
    console.error("Failed to insert bulk products:", error);
    return { success: false, error: "تعذر حفظ المنتجات في قاعدة البيانات" };
  }
}

/**
 * Updates a single product.
 */
export async function updateProductAction(data: ProductInput) {
  await requireAdmin();

  const parsed = productSchema.safeParse(data);
  if (!parsed.success || !data.id) {
    return { success: false, error: parsed.error?.issues[0]?.message || "بيانات المنتج غير صحيحة" };
  }

  const { categoryId, price, description, isHidden, sizeIds } = parsed.data;
  const productId = data.id;

  try {
    // Update main product details
    await db.execute({
      sql: `
        UPDATE products
        SET category_id = ?, price = ?, description = ?, is_hidden = ?
        WHERE id = ?
      `,
      args: [categoryId, price, description || null, isHidden ? 1 : 0, productId],
    });

    // Update sizes: delete old, insert new
    await db.execute({
      sql: "DELETE FROM product_sizes WHERE product_id = ?",
      args: [productId],
    });

    if (sizeIds.length > 0) {
      const sizeStatements = sizeIds.map((sId) => ({
        sql: "INSERT INTO product_sizes (product_id, size_id) VALUES (?, ?)",
        args: [productId, sId],
      }));
      await db.batch(sizeStatements, "write");
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "تعذر تعديل المنتج" };
  }
}

/**
 * Toggle hide/show status of a product.
 */
export async function toggleProductHiddenAction(id: number) {
  await requireAdmin();

  try {
    await db.execute({
      sql: "UPDATE products SET is_hidden = 1 - is_hidden WHERE id = ?",
      args: [id],
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle product visibility:", error);
    return { success: false, error: "تعذر تغيير حالة ظهور المنتج" };
  }
}

/**
 * Deletes a product and its images from R2.
 */
export async function deleteProductAction(id: number) {
  await requireAdmin();

  try {
    const prod = await db.execute({
      sql: "SELECT image_key FROM products WHERE id = ?",
      args: [id],
    });

    if (prod.rows.length === 0) {
      return { success: false, error: "المنتج غير موجود" };
    }

    const imageKey = String(prod.rows[0].image_key);

    // Delete from DB (cascade deletes product_sizes)
    await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [id],
    });

    // Delete image from Cloudflare R2
    await deleteImageFromR2(imageKey);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "تعذر حذف المنتج" };
  }
}
