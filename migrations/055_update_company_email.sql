-- ============================================================
-- Migration 055: Update company contact email to info@wildaboutgreens.com
-- ============================================================

-- 1. Update content_blocks (site settings, policy content, tracking support, and footer/contact copy)
UPDATE content_blocks
SET value = REPLACE(value, 'wildaboutgreens@gmail.com', 'info@wildaboutgreens.com'),
    updated_at = NOW()
WHERE value LIKE '%wildaboutgreens@gmail.com%';

UPDATE content_blocks
SET value = REPLACE(value, 'hello@wildaboutgreens.com', 'info@wildaboutgreens.com'),
    updated_at = NOW()
WHERE value LIKE '%hello@wildaboutgreens.com%';

-- 2. Update blog_posts (articles and recipes) if any post body mentions the old email
UPDATE blog_posts
SET content = REPLACE(content, 'wildaboutgreens@gmail.com', 'info@wildaboutgreens.com'),
    updated_at = NOW()
WHERE content LIKE '%wildaboutgreens@gmail.com%';

UPDATE blog_posts
SET content = REPLACE(content, 'hello@wildaboutgreens.com', 'info@wildaboutgreens.com'),
    updated_at = NOW()
WHERE content LIKE '%hello@wildaboutgreens.com%';
