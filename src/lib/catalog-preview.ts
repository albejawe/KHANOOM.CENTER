import { db } from "@/lib/db";
import type { Product, Size } from "@/lib/queries";

export interface CatalogPage {
  products: Product[];
  nextCursor: number | null;
}

/** Cursor pagination: query only the selected subcategory, never the entire catalogue. */
export async function getPreviewProductPage(categoryId: number, after?: number | null): Promise<CatalogPage> {
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) return { products: [], nextCursor: null };
  const pageSize = 24;
  const args: number[] = [categoryId];
  const cursorClause = Number.isSafeInteger(after) && (after ?? 0) > 0 ? "AND p.id < ?" : "";
  if (cursorClause) args.push(after as number);
  args.push(pageSize + 1);

  const result = await db.execute({
    sql: `SELECT p.id, p.category_id, p.price, p.description, p.image_key,
                 p.is_hidden, p.created_at, c.name AS category_name,
                 c.parent_id AS parent_category_id, parent.name AS parent_category_name
          FROM products p
          INNER JOIN categories c ON c.id = p.category_id
          LEFT JOIN categories parent ON parent.id = c.parent_id
          WHERE p.category_id = ? AND p.is_hidden = 0 ${cursorClause}
          ORDER BY p.id DESC LIMIT ?`,
    args,
  });

  const hasNext = result.rows.length > pageSize;
  const products = result.rows.slice(0, pageSize).map((row) => ({
    id: Number(row.id),
    category_id: Number(row.category_id),
    price: Number(row.price),
    description: row.description == null ? null : String(row.description),
    image_key: String(row.image_key),
    is_hidden: Number(row.is_hidden),
    created_at: String(row.created_at),
    category_name: String(row.category_name),
    parent_category_id: row.parent_category_id == null ? null : Number(row.parent_category_id),
    parent_category_name: row.parent_category_name == null ? undefined : String(row.parent_category_name),
    sizes: [] as Size[],
  })) as Product[];

  if (products.length) {
    const ids = products.map((p) => p.id);
    const resultSizes = await db.execute({
      sql: `SELECT ps.product_id, s.id, s.name, s.sort_order
            FROM product_sizes ps JOIN sizes s ON s.id = ps.size_id
            WHERE ps.product_id IN (${ids.map(() => "?").join(",")})
            ORDER BY s.sort_order, s.id`,
      args: ids,
    });
    const byProduct = new Map<number, Size[]>();
    for (const row of resultSizes.rows) {
      const id = Number(row.product_id);
      const entries = byProduct.get(id) ?? [];
      entries.push({ id: Number(row.id), name: String(row.name), sort_order: Number(row.sort_order) });
      byProduct.set(id, entries);
    }
    for (const product of products) product.sizes = byProduct.get(product.id) ?? [];
  }

  return {
    products,
    nextCursor: hasNext && products.length ? products[products.length - 1].id : null,
  };
}
