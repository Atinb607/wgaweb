import { NextRequest } from 'next/server';
import { getUncachedSQL } from '@/lib/db';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/admin/orders: list orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const sql = getUncachedSQL();
    const { searchParams } = new URL(request.url);
    const paymentStatus = searchParams.get('payment_status');
    const fulfillmentStatus = searchParams.get('fulfillment_status');

    // Build query based on filters
    let orders;
    if (paymentStatus && fulfillmentStatus) {
      orders = await sql`
        SELECT * FROM orders
        WHERE payment_status = ${paymentStatus}
          AND fulfillment_status = ${fulfillmentStatus}
        ORDER BY created_at DESC
      `;
    } else if (paymentStatus) {
      orders = await sql`
        SELECT * FROM orders
        WHERE payment_status = ${paymentStatus}
        ORDER BY created_at DESC
      `;
    } else if (fulfillmentStatus) {
      orders = await sql`
        SELECT * FROM orders
        WHERE fulfillment_status = ${fulfillmentStatus}
        ORDER BY created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT * FROM orders
        ORDER BY created_at DESC
      `;
    }

    // Fetch order items for all orders
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id as string);
      const items = await sql`
        SELECT oi.*, pv.label, p.name AS product_name
        FROM order_items oi
        JOIN product_variants pv ON pv.id = oi.product_variant_id
        JOIN products p ON p.id = pv.product_id
        WHERE oi.order_id = ANY(${orderIds})
      `;

      const itemsByOrder = new Map<string, typeof items>();
      for (const item of items) {
        const oid = item.order_id as string;
        if (!itemsByOrder.has(oid)) {
          itemsByOrder.set(oid, []);
        }
        itemsByOrder.get(oid)!.push(item);
      }

      const result = orders.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id as string) || [],
      }));

      return adminJsonResponse(result);
    }

    return adminJsonResponse(orders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
