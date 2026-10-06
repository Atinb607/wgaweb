-- 044: Add category_orders and display_order to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_orders JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Initialize category_orders with default 1..N order for existing active products
WITH ranked AS (
  SELECT id,
         jsonb_object_agg(cat, rn) AS initial_orders
  FROM (
    SELECT p.id,
           cat,
           ROW_NUMBER() OVER (PARTITION BY cat ORDER BY p.is_bundle ASC, p.created_at ASC) AS rn
    FROM products p,
    LATERAL unnest(p.categories) AS cat
  ) sub
  GROUP BY id
)
UPDATE products p
SET category_orders = ranked.initial_orders,
    display_order = (ranked.initial_orders->>(p.categories[1]))::int
FROM ranked
WHERE p.id = ranked.id AND (p.category_orders IS NULL OR p.category_orders = '{}'::jsonb);
