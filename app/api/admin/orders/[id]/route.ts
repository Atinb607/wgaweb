import { NextRequest } from 'next/server';
import { getUncachedSQL } from '@/lib/db';
import { restoreStock } from '@/lib/stock';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const VALID_FULFILLMENT_STATUSES = ['unfulfilled', 'fulfilled', 'shipped', 'delivered', 'cancelled'];

// GET /api/admin/orders/[id]: full order detail with line items + product names
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sql = getUncachedSQL();
    const { id } = await Promise.resolve(params);

    const orders = await sql`
      SELECT * FROM orders WHERE id = ${id} LIMIT 1
    `;

    if (orders.length === 0) {
      return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    const items = await sql`
      SELECT oi.id, oi.quantity, oi.unit_price_paise,
             oi.subscription_trays, oi.subscription_weeks,
             pv.label, pv.net_weight_grams,
             p.name AS product_name, p.slug AS product_slug
      FROM order_items oi
      JOIN product_variants pv ON pv.id = oi.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE oi.order_id = ${id}
    `;

    return adminJsonResponse({ ...order, items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/orders/[id]: update fulfillment_status or execute actions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sql = getUncachedSQL();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { action, fulfillment_status, payment_status } = body;

    // Action 1: "Mark cash collected" (cod_pending -> paid)
    if (action === 'mark_cash_collected') {
      const result = await sql`
        UPDATE orders
        SET payment_status = 'paid'
        WHERE id = ${id}
        RETURNING id, order_number, payment_method, payment_status, fulfillment_status
      `;

      if (result.length === 0) {
        return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
      }

      console.log(`[admin] Order ${id} marked cash collected (paid)`);
      return adminJsonResponse(result[0]);
    }

    // Action 2: "Cancel / refused" (fulfillment_status='cancelled'; restore stock if decremented)
    if (action === 'cancel' || fulfillment_status === 'cancelled') {
      // Restore stock exactly once if it was decremented
      const restored = await restoreStock(id);
      if (restored) {
        console.log(`[admin] Stock restored for cancelled order ${id}`);
      }

      const result = await sql`
        UPDATE orders
        SET fulfillment_status = 'cancelled'
        WHERE id = ${id}
        RETURNING id, order_number, payment_method, payment_status, fulfillment_status, stock_decremented
      `;

      if (result.length === 0) {
        return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
      }

      return adminJsonResponse(result[0]);
    }

    // Direct payment_status update
    if (payment_status) {
      const result = await sql`
        UPDATE orders
        SET payment_status = ${payment_status}
        WHERE id = ${id}
        RETURNING id, order_number, payment_method, payment_status, fulfillment_status
      `;

      if (result.length === 0) {
        return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
      }

      return adminJsonResponse(result[0]);
    }

    // Direct fulfillment_status update
    if (fulfillment_status) {
      if (!VALID_FULFILLMENT_STATUSES.includes(fulfillment_status)) {
        return adminJsonResponse(
          { error: `fulfillment_status must be one of: ${VALID_FULFILLMENT_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }

      const result = await sql`
        UPDATE orders
        SET fulfillment_status = ${fulfillment_status}
        WHERE id = ${id}
        RETURNING id, order_number, payment_method, payment_status, fulfillment_status
      `;

      if (result.length === 0) {
        return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
      }

      return adminJsonResponse(result[0]);
    }

    return adminJsonResponse({ error: 'No valid action or update provided' }, { status: 400 });
  } catch (error: unknown) {
    console.error('admin update order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DELETE /api/admin/orders/[id]: permanently delete a dummy/test order (restoring stock if decremented)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sql = getUncachedSQL();
    const { id } = await Promise.resolve(params);

    if (!UUID_REGEX.test(id)) {
      return adminJsonResponse({ error: 'Invalid order ID' }, { status: 400 });
    }

    const existing = await sql`
      SELECT id, order_number FROM orders WHERE id = ${id} LIMIT 1
    `;
    if (existing.length === 0) {
      return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
    }

    const stockRestored = await restoreStock(id);
    if (stockRestored) {
      console.log(`[admin] Stock restored before deleting order ${id}`);
    }

    const deleted = await sql`
      DELETE FROM orders
      WHERE id = ${id}
      RETURNING id, order_number
    `;

    if (deleted.length === 0) {
      return adminJsonResponse({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[admin] Deleted order ${deleted[0].order_number || id}`);
    return adminJsonResponse({
      success: true,
      deleted: deleted[0],
      stockRestored,
    });
  } catch (error: unknown) {
    console.error('admin delete order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
