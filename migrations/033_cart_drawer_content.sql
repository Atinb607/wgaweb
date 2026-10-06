-- 033_cart_drawer_content.sql
-- Seed content blocks for cart slider / drawer: empty state copy, mascot variant, and product recommendation slots

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_empty_title', 'text', 'This cart is empty inside!', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_empty_subtitle', 'textarea', 'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_mascot_variant', 'mascot_select', 'pleading', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_eyebrow', 'text', 'START WITH', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_title', 'text', 'Our Bestsellers', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_product_1', 'product_select', 'broccoli-microgreens', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_badge_1', 'text', '★ BESTSELLER', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_product_2', 'product_select', 'sunflower-microgreens', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_badge_2', 'text', '☀ FAVORITE', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_product_3', 'product_select', 'radish-microgreens', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_badge_3', 'text', '🌱 PEAK FLAVOUR', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_product_4', 'product_select', 'classic-trio-bundle', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES ('cart-drawer', 'cart_rec_badge_4', 'text', '✦ VALUE PACK', now())
ON CONFLICT (page, key) DO UPDATE SET value_type = EXCLUDED.value_type;
