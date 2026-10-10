import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { restoreStock } from '@/lib/stock';

const VALID_FULFILLMENT_STATUSES = ['unfulfilled', 'fulfilled', 'shipped', 'delivered', 'cancelled'];

// GET /api/admin/orders/[id]: full order detail with line items + product names
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const orders = await sql`
      SELECT * FROM orders WHERE id = ${id} LIMIT 1
    `;

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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

    return NextResponse.json({ ...order, items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/orders/[id]: update fulfillment_status or execute actions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
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
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      console.log(`[admin] Order ${id} marked cash collected (paid)`);
      return NextResponse.json(result[0]);
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
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(result[0]);
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
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(result[0]);
    }

    // Direct fulfillment_status update
    if (fulfillment_status) {
      if (!VALID_FULFILLMENT_STATUSES.includes(fulfillment_status)) {
        return NextResponse.json(
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
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(result[0]);
    }

    return NextResponse.json({ error: 'No valid action or update provided' }, { status: 400 });
  } catch (error: unknown) {
    console.error('admin update order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
