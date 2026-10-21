import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['new', 'sent', 'dismissed'] as const;

// PUT /api/admin/coupon-requests/[id]: update status ('sent' | 'dismissed' | 'new') and set handled_at
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: 'new', 'sent', 'dismissed'." },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE coupon_requests
      SET status = ${status},
          handled_at = now()
      WHERE id = ${id}
      RETURNING id, email, email_normalized, source, status, created_at, handled_at
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Coupon request not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0], {
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

// DELETE /api/admin/coupon-requests/[id]: permanently remove a coupon request
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const deleted = await sql`
      DELETE FROM coupon_requests
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Coupon request not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, id: deleted[0].id },
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
