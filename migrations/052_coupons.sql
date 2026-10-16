-- 052_coupons.sql
-- One-time 15% newsletter coupon system (promo banner on /products and /products/health-goals).
--
-- Rules enforced by this schema + application code:
--   * One coupon per normalized email, ever (email_normalized UNIQUE). Redeemed
--     coupons are never deleted; they stay 'redeemed' so the email can't claim again.
--   * status: 'available' | 'reserved' | 'redeemed' | 'void'
--   * A 'reserved' coupon whose reserved_until has passed is treated as available
--     by the checkout reservation UPDATE.

CREATE TABLE IF NOT EXISTS coupons (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text UNIQUE NOT NULL,
  email             text NOT NULL,
  email_normalized  text UNIQUE NOT NULL,
  percent_off       int NOT NULL DEFAULT 15,
  status            text NOT NULL DEFAULT 'available',
  reserved_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  reserved_until    timestamptz,
  redeemed_order_id uuid,
  redeemed_at       timestamptz,
  email_sent_at     timestamptz,
  created_at        timestamptz DEFAULT now(),
  CONSTRAINT coupons_status_check
    CHECK (status IN ('available', 'reserved', 'redeemed', 'void')),
  CONSTRAINT coupons_percent_off_check
    CHECK (percent_off > 0 AND percent_off <= 100)
);

CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_reserved_order_id ON coupons(reserved_order_id);

-- Orders: coupon code applied + server-computed discount (paise).
-- subtotal_paise stays the PRE-discount items subtotal;
-- total_paise = subtotal_paise + delivery_fee_paise - discount_paise.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_paise int NOT NULL DEFAULT 0;

-- Same normalization as normalizeEmail() in lib/coupons.ts. Used by the
-- "first order only" check so a returning customer can't dodge it with
-- a +tag or dotted Gmail variant.
CREATE OR REPLACE FUNCTION wag_normalize_email(e text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN e IS NULL THEN NULL
    WHEN position('@' IN e) = 0 THEN lower(trim(e))
    WHEN split_part(lower(trim(e)), '@', 2) IN ('gmail.com', 'googlemail.com')
      THEN replace(split_part(split_part(lower(trim(e)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    ELSE split_part(split_part(lower(trim(e)), '@', 1), '+', 1) || '@' || split_part(lower(trim(e)), '@', 2)
  END
$$;

-- Coupon email copy (editable in admin: Content > Emails, and Email Content page).
-- PLACEHOLDER COPY: replace before launch. Supports {{code}} and {{percent}}.
INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES (
  'emails',
  'coupon_email_subject',
  'text',
  '[PLACEHOLDER] Your {{percent}}% off code from Wild About Greens',
  now()
)
ON CONFLICT (page, key) DO NOTHING;

INSERT INTO content_blocks (page, key, value_type, value, updated_at)
VALUES (
  'emails',
  'coupon_email_body',
  'textarea',
  E'[PLACEHOLDER COPY - EDIT BEFORE LAUNCH]\n\nHi there!\n\nThanks for joining Wild About Greens. Here is your one-time code for {{percent}}% off your first order:\n\n{{code}}\n\nEnter it in the "Have a coupon?" box at checkout. The code works once and applies to the items subtotal.\n\nStay fresh,\nThe Wild About Greens Team',
  now()
)
ON CONFLICT (page, key) DO NOTHING;
