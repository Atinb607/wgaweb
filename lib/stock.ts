import { getSQL } from '@/lib/db';

/**
 * Atomically decrement stock for all items in a paid or COD order.
 * Uses the stock_decremented flag as a dedup guard so that if multiple
 * handlers fire (e.g. verify + webhook), stock is only decremented once.
 *
 * Returns true if stock was decremented, false if already done or order not eligible.
 */
export async function decrementStock(orderId: string): Promise<boolean> {
  const sql = getSQL();

  // Atomically claim the decrement: only one caller wins this UPDATE
  const claimed = await sql`
    UPDATE orders
    SET stock_decremented = true
    WHERE id = ${orderId}
      AND stock_decremented = false
      AND payment_status IN ('paid', 'cod_pending')
    RETURNING id
  `;

  if (claimed.length === 0) {
    // Already decremented, or order not eligible, or not found
    return false;
  }

  // Fetch the order's line items
  const items = await sql`
    SELECT product_variant_id, quantity
    FROM order_items
    WHERE order_id = ${orderId}
  `;

  // Decrement each variant's stock
  for (const item of items) {
    await sql`
      UPDATE product_variants
      SET stock_qty = GREATEST(stock_qty - ${item.quantity as number}, 0)
      WHERE id = ${item.product_variant_id}
    `;
  }

  console.log(`Order ${orderId}: stock decremented for ${items.length} variant(s)`);
  return true;
}

/**
 * Atomically restore stock for all items in a cancelled / refused order.
 * Only restores if stock was actually decremented (stock_decremented = true),
 * then resets stock_decremented to false so it can never double-restore.
 *
 * Returns true if stock was restored, false otherwise.
 */
export async function restoreStock(orderId: string): Promise<boolean> {
  const sql = getSQL();

  // Atomically claim the restoration
  const claimed = await sql`
    UPDATE orders
    SET stock_decremented = false
    WHERE id = ${orderId}
      AND stock_decremented = true
    RETURNING id
  `;

  if (claimed.length === 0) {
    // Stock was never decremented or already restored
    return false;
  }

  // Fetch the order's line items
  const items = await sql`
    SELECT product_variant_id, quantity
    FROM order_items
    WHERE order_id = ${orderId}
  `;

  // Restore each variant's stock
  for (const item of items) {
    await sql`
      UPDATE product_variants
      SET stock_qty = stock_qty + ${item.quantity as number}
      WHERE id = ${item.product_variant_id}
    `;
  }

  console.log(`Order ${orderId}: stock restored for ${items.length} variant(s)`);
  return true;
}
