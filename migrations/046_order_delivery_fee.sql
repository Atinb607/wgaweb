-- 046_order_delivery_fee.sql
-- Add delivery_fee_paise to orders table to store delivery charges accurately

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_fee_paise integer DEFAULT 0;
