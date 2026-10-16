-- 054_free_delivery_pincodes_only.sql
-- Remove non-free deliverable pincodes from delivery_pincodes so the table
-- exclusively manages pincodes eligible for free delivery on all orders.

DELETE FROM delivery_pincodes
WHERE is_free_delivery = false;

ALTER TABLE delivery_pincodes
ALTER COLUMN is_free_delivery SET DEFAULT true;

UPDATE delivery_pincodes
SET is_free_delivery = true
WHERE is_free_delivery IS DISTINCT FROM true;
