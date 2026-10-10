-- Migration 049: Cash on Delivery (COD) Support
-- Add payment_method column to orders table

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';

-- Index on payment_method for fast lookups and admin filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Note on valid values:
-- payment_method: 'online' | 'cod'
-- payment_status: 'pending' | 'paid' | 'failed' | 'cod_pending'
