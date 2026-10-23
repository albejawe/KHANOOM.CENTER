import { db } from "./db";

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  image_key: string | null;
  sort_order: number;
}

export interface Size {
  id: number;
  name: string;
  sort_order: number;
}

export interface Product {
  id: number;
  category_id: number;
  price: number;
  description: string | null;
  image_key: string;
  is_hidden: number;
  created_at: string;
  category_name?: string;
  parent_category_name?: string;
  parent_category_id?: number | null;
  sizes?: Size[];
}

export async function getMainCategories(): Promise<Category[]> {
  const result = await db.execute(
    "SELECT id, name, parent_id, image_key, sort_order FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC, id ASC"
  );
  return result.rows as unknown as Category[];
}

export async function getSubcategories(parentId: number): Promise<Category[]> {
  const result = await db.execute({
    sql: "SELECT id, name, parent_id, image_key, sort_order FROM categories WHERE parent_id = ? ORDER BY sort_order ASC, id ASC",
    args: [parentId],
  });
  return result.rows as unknown as Category[];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await db.execute({
    sql: "SELECT id, name, parent_id, image_key, sort_order FROM categories WHERE id = ? LIMIT 1",
    args: [id],
  });
  return (result.rows[0] as unknown as Category) || null;
}

export async function getAllCategoriesFlat(): Promise<(Category & { children_count?: number })[]> {
  const result = await db.execute(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id) as children_count
    FROM categories c 
    ORDER BY c.parent_id IS NOT NULL, c.sort_order ASC, c.id ASC
  `);
  return result.rows as unknown as (Category & { children_count?: number })[];
}

export async function getAllSizes(): Promise<Size[]> {
  const result = await db.execute(
    "SELECT id, name, sort_order FROM sizes ORDER BY sort_order ASC, id ASC"
  );
  return result.rows as unknown as Size[];
}

/**
 * Get category cover image key.
 * If the category itself has an image_key, return it.
 * Otherwise, fallback to the latest visible product image in this category or any child category.
 */
export async function getCategoryCoverKey(categoryId: number): Promise<string | null> {
  const cat = await getCategoryById(categoryId);
  if (!cat) return null;
  if (cat.image_key) return cat.image_key;

  // If this is a main category, find latest product in its children
  if (cat.parent_id === null) {
    const fallback = await db.execute({
      sql: `
        SELECT p.image_key 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE (c.id = ? OR c.parent_id = ?) AND p.is_hidden = 0
        ORDER BY p.id DESC LIMIT 1
      `,
      args: [categoryId, categoryId],
    });
    if (fallback.rows.length > 0 && fallback.rows[0].image_key) {
      return String(fallback.rows[0].image_key);
    }
  } else {
    // Child category
    const fallback = await db.execute({
      sql: "SELECT image_key FROM products WHERE category_id = ? AND is_hidden = 0 ORDER BY id DESC LIMIT 1",
      args: [categoryId],
    });
    if (fallback.rows.length > 0 && fallback.rows[0].image_key) {
      return String(fallback.rows[0].image_key);
    }
  }

  return null;
}

/**
 * Returns products for public visitor view (only visible products, with sizes).
 */
export async function getProductsForSubcategory(subcategoryId: number): Promise<Product[]> {
  const productsResult = await db.execute({
    sql: `
      SELECT p.id, p.category_id, p.price, p.description, p.image_key, p.is_hidden, p.created_at,
             c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.is_hidden = 0
      ORDER BY p.id DESC
    `,
    args: [subcategoryId],
  });

  const products = productsResult.rows as unknown as Product[];
  if (products.length === 0) return [];

  // Fetch sizes for all these products
  const productIds = products.map((p) => p.id);
  const placeholders = productIds.map(() => "?").join(",");
  const sizesResult = await db.execute({
    sql: `
      SELECT ps.product_id, s.id, s.name, s.sort_order
      FROM product_sizes ps
      JOIN sizes s ON ps.size_id = s.id
      WHERE ps.product_id IN (${placeholders})
      ORDER BY s.sort_order ASC, s.id ASC
    `,
    args: productIds,
  });

  const sizesMap = new Map<number, Size[]>();
  for (const row of sizesResult.rows) {
    const pId = Number(row.product_id);
    const size: Size = {
      id: Number(row.id),
      name: String(row.name),
      sort_order: Number(row.sort_order),
    };
    if (!sizesMap.has(pId)) sizesMap.set(pId, []);
    sizesMap.get(pId)!.push(size);
  }

  for (const product of products) {
    product.sizes = sizesMap.get(product.id) || [];
  }

  return products;
}

/**
 * Returns a single product with full category and size information.
 */
export async function getProductDetails(id: number): Promise<Product | null> {
  const result = await db.execute({
    sql: `
      SELECT p.id, p.category_id, p.price, p.description, p.image_key, p.is_hidden, p.created_at,
             c.name as category_name, c.parent_id as parent_category_id,
             pcat.name as parent_category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories pcat ON c.parent_id = pcat.id
      WHERE p.id = ?
      LIMIT 1
    `,
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const product = result.rows[0] as unknown as Product;

  const sizesResult = await db.execute({
    sql: `
      SELECT s.id, s.name, s.sort_order
      FROM product_sizes ps
      JOIN sizes s ON ps.size_id = s.id
      WHERE ps.product_id = ?
      ORDER BY s.sort_order ASC, s.id ASC
    `,
    args: [id],
  });

  product.sizes = sizesResult.rows as unknown as Size[];
  return product;
}

/**
 * Returns all products for Admin panel with optional filtering.
 */
export async function getAllProductsAdmin(options?: {
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const args: (number | string)[] = [];
  let where = "1=1";

  if (options?.categoryId) {
    where += " AND (p.category_id = ? OR c.parent_id = ?)";
    args.push(options.categoryId, options.categoryId);
  }

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;
  args.push(limit, offset);

  const result = await db.execute({
    sql: `
      SELECT p.id, p.category_id, p.price, p.description, p.image_key, p.is_hidden, p.created_at,
             c.name as category_name, pcat.name as parent_category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories pcat ON c.parent_id = pcat.id
      WHERE ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `,
    args,
  });

  const products = result.rows as unknown as Product[];
  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const placeholders = productIds.map(() => "?").join(",");
  const sizesResult = await db.execute({
    sql: `
      SELECT ps.product_id, s.id, s.name, s.sort_order
      FROM product_sizes ps
      JOIN sizes s ON ps.size_id = s.id
      WHERE ps.product_id IN (${placeholders})
      ORDER BY s.sort_order ASC, s.id ASC
    `,
    args: productIds,
  });

  const sizesMap = new Map<number, Size[]>();
  for (const row of sizesResult.rows) {
    const pId = Number(row.product_id);
    const size: Size = {
      id: Number(row.id),
      name: String(row.name),
      sort_order: Number(row.sort_order),
    };
    if (!sizesMap.has(pId)) sizesMap.set(pId, []);
    sizesMap.get(pId)!.push(size);
  }

  for (const product of products) {
    product.sizes = sizesMap.get(product.id) || [];
  }

  return products;
}

/**
 * Admin stats for quick dashboard overview.
 */
export async function getAdminStats() {
  const [productsRes, visibleRes, catsRes, sizesRes] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM products"),
    db.execute("SELECT COUNT(*) as count FROM products WHERE is_hidden = 0"),
    db.execute("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL"),
    db.execute("SELECT COUNT(*) as count FROM sizes"),
  ]);

  return {
    totalProducts: Number(productsRes.rows[0].count),
    visibleProducts: Number(visibleRes.rows[0].count),
    hiddenProducts: Number(productsRes.rows[0].count) - Number(visibleRes.rows[0].count),
    totalSubcategories: Number(catsRes.rows[0].count),
    totalSizes: Number(sizesRes.rows[0].count),
  };
}

/**
 * Returns all visible products across the catalog with full category and size data.
 * Ideal for high-speed instant client-side filtering (0ms latency switching between tabs).
 */
export async function getAllVisibleCatalog(): Promise<{
  mainCategories: Category[];
  subCategories: Category[];
  products: Product[];
}> {
  const [mainRes, subRes, prodRes] = await Promise.all([
    db.execute("SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC, id ASC"),
    db.execute("SELECT * FROM categories WHERE parent_id IS NOT NULL ORDER BY sort_order ASC, id ASC"),
    db.execute(`
      SELECT p.id, p.category_id, p.price, p.description, p.image_key, p.is_hidden, p.created_at,
             c.name as category_name, c.parent_id as parent_category_id,
             pcat.name as parent_category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories pcat ON c.parent_id = pcat.id
      WHERE p.is_hidden = 0
      ORDER BY p.id DESC
    `),
  ]);

  const mainCategories = mainRes.rows as unknown as Category[];
  const subCategories = subRes.rows as unknown as Category[];
  const products = prodRes.rows as unknown as Product[];

  if (products.length > 0) {
    const productIds = products.map((p) => p.id);
    const placeholders = productIds.map(() => "?").join(",");
    const sizesRes = await db.execute({
      sql: `
        SELECT ps.product_id, s.id, s.name, s.sort_order
        FROM product_sizes ps
        JOIN sizes s ON ps.size_id = s.id
        WHERE ps.product_id IN (${placeholders})
        ORDER BY s.sort_order ASC, s.id ASC
      `,
      args: productIds,
    });

    const sizesMap = new Map<number, Size[]>();
    for (const row of sizesRes.rows) {
      const pId = Number(row.product_id);
      const size: Size = {
        id: Number(row.id),
        name: String(row.name),
        sort_order: Number(row.sort_order),
      };
      if (!sizesMap.has(pId)) sizesMap.set(pId, []);
      sizesMap.get(pId)!.push(size);
    }

    for (const product of products) {
      product.sizes = sizesMap.get(product.id) || [];
    }
  }

  return {
    mainCategories,
    subCategories,
    products,
  };
}
