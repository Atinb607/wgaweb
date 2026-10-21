import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['new', 'sent', 'dismissed'] as const;

// GET /api/admin/coupon-requests?status=&page=&limit= — newest first, paginated
export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const offset = (page - 1) * limit;

    const isValidStatus =
      status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]);

    const newCountRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM coupon_requests
      WHERE status = 'new'
    `;
    const newCount = Number(newCountRows[0]?.count ?? 0);

    let rows;
    let totalRows;

    if (isValidStatus) {
      totalRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM coupon_requests
        WHERE status = ${status}
      `;
      rows = await sql`
        SELECT id, email, email_normalized, source, status, created_at, handled_at
        FROM coupon_requests
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      totalRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM coupon_requests
      `;
      rows = await sql`
        SELECT id, email, email_normalized, source, status, created_at, handled_at
        FROM coupon_requests
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const total = Number(totalRows[0]?.count ?? 0);

    return NextResponse.json(
      {
        requests: rows,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        new_count: newCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
