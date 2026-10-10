-- Migration 048: Bulk Orders Request Table
CREATE TABLE IF NOT EXISTS bulk_order_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number    text UNIQUE NOT NULL,
  customer_name    text NOT NULL,
  customer_email   text NOT NULL,
  customer_phone   text NOT NULL,
  trays_count      integer NOT NULL,
  products         text NOT NULL,
  business_name    text,
  delivery_address text,
  delivery_pincode text,
  frequency        text DEFAULT 'one-time',
  notes            text,
  status           text NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'in_progress' | 'fulfilled' | 'cancelled'
  admin_notes      text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_orders_ticket_number ON bulk_order_requests(ticket_number);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_order_requests(status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_created_at ON bulk_order_requests(created_at DESC);
