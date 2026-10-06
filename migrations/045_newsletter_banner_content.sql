-- 045: Add additional newsletter banner content blocks for product-listing and our-story

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES
  ('product-listing', 'newsletter_button_text', 'text', 'Sign Up', now()),
  ('product-listing', 'newsletter_placeholder', 'text', 'your@email.com', now()),
  ('product-listing', 'newsletter_disclaimer', 'text', 'No spam. Unsubscribe anytime.', now()),
  ('our-story', 'newsletter_button_text', 'text', 'Sign Up', now()),
  ('our-story', 'newsletter_placeholder', 'text', 'your@email.com', now()),
  ('our-story', 'newsletter_disclaimer', 'text', 'No spam. Unsubscribe anytime.', now())
ON CONFLICT (page, key) DO NOTHING;
