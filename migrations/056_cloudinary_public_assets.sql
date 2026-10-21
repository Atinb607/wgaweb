-- 056_cloudinary_public_assets.sql
-- Update content_pins for product_listing_why_choose with high-res Cloudinary CDN links

UPDATE content_pins
SET image_url = 'https://res.cloudinary.com/qjoihkpr/image/upload/v1792608080/wag_assets/right-choice/grown-not-made.png'
WHERE group_key = 'product_listing_why_choose' AND (title ILIKE '%grown%' OR image_url ILIKE '%grown%');

UPDATE content_pins
SET image_url = 'https://res.cloudinary.com/qjoihkpr/image/upload/v1792608103/wag_assets/right-choice/ro-water.png'
WHERE group_key = 'product_listing_why_choose' AND (title ILIKE '%ro water%' OR image_url ILIKE '%ro-water%');

UPDATE content_pins
SET image_url = 'https://res.cloudinary.com/qjoihkpr/image/upload/v1792608078/wag_assets/right-choice/coco-peat.png'
WHERE group_key = 'product_listing_why_choose' AND (title ILIKE '%coco%' OR image_url ILIKE '%coco%');

UPDATE content_pins
SET image_url = 'https://res.cloudinary.com/qjoihkpr/image/upload/v1792608091/wag_assets/right-choice/no-pest.png'
WHERE group_key = 'product_listing_why_choose' AND (title ILIKE '%pest%' OR image_url ILIKE '%pest%');
