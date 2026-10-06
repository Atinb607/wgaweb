-- 043_cart_fresh_greens_update.sql: Update cart empty subtitle from 'living greens' to 'fresh greens'
UPDATE content_blocks
SET value = 'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.',
    updated_at = now()
WHERE page = 'cart-drawer' AND key = 'cart_empty_subtitle';
