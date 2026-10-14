import { getSQL } from './db';

export interface ProductCategoryRow {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

let _categoryTableEnsured = false;

/**
 * Ensures the product_categories table exists in the Neon database
 * and automatically populates any categories found in active products.
 */
export async function ensureProductCategoriesTable(): Promise<void> {
  if (_categoryTableEnsured) return;
  try {
    const sql = getSQL();
    await sql`
      CREATE TABLE IF NOT EXISTS product_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        display_order integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `;

    // Create index on display_order for fast ordered queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_categories_display_order
      ON product_categories(display_order ASC)
    `;

    // Automatically sync distinct categories present in active products
    await sql`
      INSERT INTO product_categories (name, display_order, is_active)
      SELECT DISTINCT unnest(categories) AS cat,
             ROW_NUMBER() OVER () * 10 AS initial_order,
             true AS is_active
      FROM products
      WHERE is_active = true AND categories IS NOT NULL
      ON CONFLICT (name) DO NOTHING
    `;

    _categoryTableEnsured = true;
  } catch (err) {
    console.warn('ensureProductCategoriesTable warning:', err);
  }
}

/**
 * Returns active categories in their configured display order.
 * Falls back to distinct product categories if table is unreachable or empty.
 */
export async function getOrderedActiveCategories(): Promise<string[]> {
  try {
    await ensureProductCategoriesTable();
    const sql = getSQL();
    const rows = await sql`
      SELECT name
      FROM product_categories
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `;
    if (rows && rows.length > 0) {
      return (rows as unknown as Array<{ name: string }>).map((r) => r.name);
    }
  } catch (err) {
    console.warn('getOrderedActiveCategories failed, falling back:', err);
  }

  // Fallback to distinct product categories if table is empty or error
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT DISTINCT unnest(categories) AS cat
      FROM products
      WHERE is_active = true AND categories IS NOT NULL
      ORDER BY cat ASC
    `;
    return (rows as unknown as Array<{ cat: string }>).map((r) => r.cat);
  } catch (err) {
    console.error('getOrderedActiveCategories fallback error:', err);
    return [];
  }
}

/**
 * Returns all categories (active and inactive) with live product counts for the admin panel.
 * Also syncs any new categories found in products.
 */
export async function getAllCategoriesWithCounts(): Promise<ProductCategoryRow[]> {
  await ensureProductCategoriesTable();
  const sql = getSQL();

  // Sync any newly introduced categories on products
  try {
    await sql`
      INSERT INTO product_categories (name, display_order, is_active)
      SELECT DISTINCT unnest(categories) AS cat,
             COALESCE((SELECT MAX(display_order) FROM product_categories), 0) + 10,
             true
      FROM products
      WHERE categories IS NOT NULL
      ON CONFLICT (name) DO NOTHING
    `;
  } catch (err) {
    console.warn('Sync categories from products warning:', err);
  }

  const rows = await sql`
    SELECT 
      c.id,
      c.name,
      c.display_order,
      c.is_active,
      c.created_at,
      c.updated_at,
      (
        SELECT count(*)::int 
        FROM products p 
        WHERE p.is_active = true AND c.name = ANY(p.categories)
      ) AS product_count
    FROM product_categories c
    ORDER BY c.display_order ASC, c.name ASC
  `;

  return rows as unknown as ProductCategoryRow[];
}

/**
 * Updates display order and visibility for a list of categories.
 */
export async function updateCategoriesOrderAndVisibility(
  updates: Array<{ name: string; display_order: number; is_active: boolean }>
): Promise<void> {
  await ensureProductCategoriesTable();
  const sql = getSQL();

  for (const item of updates) {
    await sql`
      INSERT INTO product_categories (name, display_order, is_active, updated_at)
      VALUES (${item.name}, ${item.display_order}, ${item.is_active}, now())
      ON CONFLICT (name)
      DO UPDATE SET
        display_order = ${item.display_order},
        is_active = ${item.is_active},
        updated_at = now()
    `;
  }
}

/**
 * Adds a new category.
 */
export async function addCategory(rawName: string): Promise<ProductCategoryRow> {
  await ensureProductCategoriesTable();
  const sql = getSQL();

  const name = rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!name) {
    throw new Error('Invalid category name');
  }

  const nextOrderRow = await sql`
    SELECT COALESCE(MAX(display_order), 0) + 10 AS next_order
    FROM product_categories
  `;
  const nextOrder = nextOrderRow[0]?.next_order ?? 10;

  const rows = await sql`
    INSERT INTO product_categories (name, display_order, is_active, updated_at)
    VALUES (${name}, ${nextOrder}, true, now())
    ON CONFLICT (name)
    DO UPDATE SET
      is_active = true,
      updated_at = now()
    RETURNING id, name, display_order, is_active, created_at, updated_at
  `;

  return rows[0] as unknown as ProductCategoryRow;
}

/**
 * Deletes a category from product_categories.
 */
export async function deleteCategory(name: string): Promise<void> {
  await ensureProductCategoriesTable();
  const sql = getSQL();

  await sql`
    DELETE FROM product_categories
    WHERE name = ${name}
  `;
}
