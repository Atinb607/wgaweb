-- Migration 050: Product categories ordering and visibility table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_display_order ON product_categories(display_order ASC);

-- Seed any distinct active categories from existing products
INSERT INTO product_categories (name, display_order, is_active)
SELECT DISTINCT unnest(categories) AS cat,
       ROW_NUMBER() OVER () * 10 AS initial_order,
       true AS is_active
FROM products
WHERE is_active = true
ON CONFLICT (name) DO NOTHING;
