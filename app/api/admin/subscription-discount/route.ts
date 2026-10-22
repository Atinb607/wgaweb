import { NextRequest } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateProducts } from '@/lib/revalidate';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/subscription-discount
 * Returns the storewide subscription discount percentage.
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

    return adminJsonResponse({ discount_percent: discountPercent });
  } catch (error: unknown) {
    console.error('Error fetching subscription discount:', error);
    return adminJsonResponse({ error: 'Failed to fetch subscription discount' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/subscription-discount
 * Updates the storewide subscription discount percentage.
 * Body: { discount_percent: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const parsed = parseFloat(body.discount_percent);

    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return adminJsonResponse(
        { error: 'Discount percentage must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Round to whole percentage or up to 2 decimal places
    const cleanPercent = Math.round(parsed * 100) / 100;

    await sql`
      INSERT INTO content_blocks (page, key, value, value_type, updated_at)
      VALUES ('product-detail', 'subscription_discount_percent', ${String(cleanPercent)}, 'text', now())
      ON CONFLICT (page, key)
      DO UPDATE SET
        value = ${String(cleanPercent)},
        updated_at = now()
    `;

    revalidateProducts();

    return adminJsonResponse({
      success: true,
      discount_percent: cleanPercent,
      message: `Subscription discount set to ${cleanPercent}% across all products.`,
    });
  } catch (error: unknown) {
    console.error('Error updating subscription discount:', error);
    return adminJsonResponse({ error: 'Failed to update subscription discount' }, { status: 500 });
  }
}
