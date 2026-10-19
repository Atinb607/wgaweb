-- ============================================================
-- Migration 038: Launch SEO fields, updated_at timestamps,
--                alt-text column safety checks, and Site & SEO seed
-- ============================================================

-- 1. Products: SEO fields + updated_at + thumbnail_alt_text
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS thumbnail_alt_text TEXT;

-- 2. Blog Posts (Articles & Recipes): SEO fields + updated_at + cover_image_alt_text
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS cover_image_alt_text TEXT;

-- 3. Product Gallery Images & Carousel Slides: alt_text safety check
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS alt_text TEXT;

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- 4. Seed "Site & SEO" (page = 'site') fixed-field registry in content_blocks
--    Seeds site_name and default_meta_description; leaves contact/social fields blank.
INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES
  (
    'site',
    'site_name',
    'text',
    'Wild About Greens',
    NOW()
  ),
  (
    'site',
    'default_meta_description',
    'textarea',
    'Fresh microgreens grown indoors with pure mineral RO water and zero pesticides. Cut to order and delivered fresh across Chandigarh, Mohali and Panchkula.',
    NOW()
  ),
  (
    'site',
    'default_og_image',
    'image_url',
    '',
    NOW()
  ),
  (
    'site',
    'default_og_image_alt',
    'text',
    'Wild About Greens — Fresh Microgreens Delivered in Tricity',
    NOW()
  ),
  (
    'site',
    'business_phone',
    'text',
    '+91 84272 54445',
    NOW()
  ),
  (
    'site',
    'business_email',
    'text',
    '',
    NOW()
  ),
  (
    'site',
    'business_address',
    'textarea',
    '',
    NOW()
  ),
  (
    'site',
    'instagram_url',
    'text',
    '',
    NOW()
  ),
  (
    'site',
    'facebook_url',
    'text',
    '',
    NOW()
  )
ON CONFLICT (page, key) DO NOTHING;
