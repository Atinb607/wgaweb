import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['active', 'disabled', 'void'] as const;

// PUT /api/admin/coupons/[id]: update status (active <-> disabled, or -> void permanently)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    // Reject attempts to edit code or percent_off after creation
    if ('code' in body || 'percent_off' in body || 'percentOff' in body) {
      return NextResponse.json(
        { error: 'Coupon code and percent_off cannot be edited after creation.' },
        { status: 400 }
      );
    }

    const nextStatus = typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';
    if (!ALLOWED_STATUSES.includes(nextStatus as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: 'active', 'disabled', 'void'." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id, code, percent_off, status, created_at, updated_at
      FROM coupons
      WHERE id = ${id}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const current = existing[0];
    if (current.status === 'void') {
      return NextResponse.json(
        { error: 'Coupon is voided permanently and cannot be modified.' },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE coupons
      SET status = ${nextStatus},
          updated_at = now()
      WHERE id = ${id}
        AND status != 'void'
      RETURNING id, code, percent_off, status, created_at, updated_at
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Coupon is voided permanently and cannot be modified.' },
        { status: 400 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
