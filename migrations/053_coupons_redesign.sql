-- 053_coupons_redesign.sql
-- Redesign coupon system:
-- 1. Rename old per-customer coupons table to coupons_legacy (do not drop).
-- 2. Create shared admin-managed coupons table with unique index on upper(code).
-- 3. Create coupon_requests table for manual follow-up from the 15% promo banner.
-- 4. Delete coupon_email_subject and coupon_email_body rows from content_blocks.
-- (orders.coupon_code and orders.discount_paise are kept as-is.)

ALTER TABLE coupons RENAME TO coupons_legacy;

ALTER INDEX IF EXISTS coupons_pkey RENAME TO coupons_legacy_pkey;
ALTER INDEX IF EXISTS coupons_code_key RENAME TO coupons_legacy_code_key;
ALTER INDEX IF EXISTS coupons_email_normalized_key RENAME TO coupons_legacy_email_normalized_key;
ALTER INDEX IF EXISTS idx_coupons_status RENAME TO idx_coupons_legacy_status;
ALTER INDEX IF EXISTS idx_coupons_reserved_order_id RENAME TO idx_coupons_legacy_reserved_order_id;

CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  percent_off int NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'void')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_coupons_upper_code ON coupons (upper(code));

CREATE TABLE coupon_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text UNIQUE NOT NULL,
  source text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'sent', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  handled_at timestamptz
);

CREATE INDEX idx_coupon_requests_status_created_at ON coupon_requests (status, created_at DESC);

DELETE FROM content_blocks
WHERE page = 'emails'
  AND key IN ('coupon_email_subject', 'coupon_email_body');
