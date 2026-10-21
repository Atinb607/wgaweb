import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['active', 'disabled', 'void'] as const;
const CODE_REGEX = /^[A-Z0-9-]{3,20}$/;

// GET /api/admin/coupons: list all coupons with times_used and total discount
export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim().toLowerCase();

    let rows;
    if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      rows = await sql`
        SELECT
          c.id,
          c.code,
          c.percent_off,
          c.status,
          c.created_at,
          c.updated_at,
          COUNT(o.id)::int AS times_used,
          COALESCE(SUM(o.discount_paise), 0)::bigint AS total_discount_paise
        FROM coupons c
        LEFT JOIN orders o ON UPPER(o.coupon_code) = UPPER(c.code)
        WHERE c.status = ${status}
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT
          c.id,
          c.code,
          c.percent_off,
          c.status,
          c.created_at,
          c.updated_at,
          COUNT(o.id)::int AS times_used,
          COALESCE(SUM(o.discount_paise), 0)::bigint AS total_discount_paise
        FROM coupons c
        LEFT JOIN orders o ON UPPER(o.coupon_code) = UPPER(c.code)
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
    }

    const coupons = rows.map((r) => ({
      id: r.id,
      code: r.code,
      percent_off: Number(r.percent_off),
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      times_used: Number(r.times_used ?? 0),
      total_discount_paise: Number(r.total_discount_paise ?? 0),
      total_discount: Number(r.total_discount_paise ?? 0),
    }));

    return NextResponse.json(coupons, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/coupons: create a new shared coupon
export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json().catch(() => ({}));

    const rawCode = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const rawPercent = body.percent_off ?? body.percentOff;
    const percentOff = typeof rawPercent === 'number' ? rawPercent : Number(rawPercent);

    if (!rawCode || !CODE_REGEX.test(rawCode)) {
      return NextResponse.json(
        {
          error:
            'Code must be 3 to 20 characters and contain only uppercase letters (A-Z), numbers (0-9), and hyphens (-).',
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 90) {
      return NextResponse.json(
        { error: 'Discount percentage must be an integer between 1 and 90.' },
        { status: 400 }
      );
    }

    // Check case-insensitive duplicate
    const existing = await sql`
      SELECT id FROM coupons WHERE UPPER(code) = ${rawCode} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Coupon code "${rawCode}" already exists.` },
        { status: 409 }
      );
    }

    try {
      const inserted = await sql`
        INSERT INTO coupons (code, percent_off, status)
        VALUES (${rawCode}, ${percentOff}, 'active')
        RETURNING id, code, percent_off, status, created_at, updated_at
      `;

      const row = inserted[0];
      return NextResponse.json(
        {
          id: row.id,
          code: row.code,
          percent_off: Number(row.percent_off),
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          times_used: 0,
          total_discount_paise: 0,
          total_discount: 0,
        },
        { status: 201 }
      );
    } catch (dbErr: unknown) {
      const pgCode = (dbErr as { code?: string })?.code;
      if (pgCode === '23505') {
        return NextResponse.json(
          { error: `Coupon code "${rawCode}" already exists.` },
          { status: 409 }
        );
      }
      throw dbErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
