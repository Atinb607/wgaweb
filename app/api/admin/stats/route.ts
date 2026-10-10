import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats: dashboard summary in a single call
export async function GET() {
  try {
    const sql = getSQL();

    // ── Orders today ──
    const todayOrders = await sql`
      SELECT
        COUNT(*)::int AS count,
        COALESCE(SUM(total_paise), 0)::bigint AS revenue_paise
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= CURRENT_DATE
    `;

    // ── Pending fulfillment (both paid and active COD pending orders) ──
    const pendingFulfillment = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE fulfillment_status = 'unfulfilled'
        AND (payment_status = 'paid' OR payment_status = 'cod_pending')
    `;

    // ── COD Pending orders ──
    const codPending = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE payment_status = 'cod_pending'
    `;

    // ── Low stock variants (stock_qty <= 5) ──
    const lowStock = await sql`
      SELECT pv.id, pv.label, pv.stock_qty,
             p.name AS product_name
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.stock_qty <= 5
        AND pv.is_active = true
        AND p.is_active = true
      ORDER BY pv.stock_qty ASC
    `;

    // ── Newsletter subscribers ──
    const subscribers = await sql`
      SELECT COUNT(*)::int AS count
      FROM newsletter_subscribers
    `;

    // ── New inquiries ──
    const newInquiries = await sql`
      SELECT COUNT(*)::int AS count
      FROM business_inquiries
      WHERE status = 'new'
    `;

    // NOTE: Reviews/testimonials are intentionally excluded from this endpoint.
    // The designs show a reviews section with ratings, but this is a brand-new
    // store with no real customer reviews yet. A decision is pending on whether
    // to seed placeholder content or hide that section until real reviews exist.
    // When reviews are implemented, add review stats here.

    // ── Stale pending orders (likely abandoned) ──
    const stalePending = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE payment_status = 'pending'
        AND created_at < now() - interval '1 hour'
    `;

    // NOTE: Stock reservation with TTL-based expiry/rollback is intentionally
    // not implemented. Currently stock is decremented only on successful payment,
    // meaning two customers could theoretically both pass the stock check for the
    // last tray during the same payment window. At this store's realistic order
    // volume, that's an acceptable launch risk. Revisit if volume grows enough
    // to warrant TTL-based reservation logic. This is a deliberate scope decision,
    // not an oversight.

    return NextResponse.json({
      orders_today_count: todayOrders[0]?.count ?? 0,
      orders_today_revenue_paise: Number(todayOrders[0]?.revenue_paise ?? 0),
      pending_fulfillment_count: pendingFulfillment[0]?.count ?? 0,
      cod_pending_count: codPending[0]?.count ?? 0,
      low_stock_variants: lowStock,
      newsletter_subscriber_count: subscribers[0]?.count ?? 0,
      new_inquiry_count: newInquiries[0]?.count ?? 0,
      stale_pending_orders_count: stalePending[0]?.count ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
