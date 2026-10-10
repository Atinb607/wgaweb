import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/subscription-discount
 * Public endpoint returning the storewide subscription discount percentage.
 */
export async function GET() {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT value FROM content_blocks
      WHERE page = 'product-detail' AND key = 'subscription_discount_percent'
      LIMIT 1
    `;

    let discountPercent = 15;
    if (rows.length > 0 && rows[0].value) {
      const parsed = parseFloat(rows[0].value);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        discountPercent = parsed;
      }
    }

    return NextResponse.json(
      { discount_percent: discountPercent },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: unknown) {
    console.error('Error reading subscription discount:', error);
    return NextResponse.json({ discount_percent: 15 });
  }
}
