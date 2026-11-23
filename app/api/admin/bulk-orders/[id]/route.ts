import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['new', 'contacted', 'in_progress', 'fulfilled', 'cancelled'];

async function deleteBulkOrder(id: string): Promise<boolean> {
  const sql = getSQL();
  const cleanId = id.trim();
  const result = await sql`
    DELETE FROM bulk_order_requests
    WHERE id::text = ${cleanId}
    RETURNING id
  `;
  return result.length > 0;
}

// PUT /api/admin/bulk-orders/[id]: update status, admin notes, or action=delete
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { action, status, admin_notes } = body;

    if (action === 'delete') {
      const deleted = await deleteBulkOrder(id);
      if (!deleted) {
        return NextResponse.json({ error: 'Bulk order request not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, id });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    let result;
    if (status !== undefined && admin_notes !== undefined) {
      result = await sql`
        UPDATE bulk_order_requests
        SET status = ${status},
            admin_notes = ${admin_notes},
            updated_at = now()
        WHERE id::text = ${id.trim()}
        RETURNING *
      `;
    } else if (status !== undefined) {
      result = await sql`
        UPDATE bulk_order_requests
        SET status = ${status},
            updated_at = now()
        WHERE id::text = ${id.trim()}
        RETURNING *
      `;
    } else if (admin_notes !== undefined) {
      result = await sql`
        UPDATE bulk_order_requests
        SET admin_notes = ${admin_notes},
            updated_at = now()
        WHERE id::text = ${id.trim()}
        RETURNING *
      `;
    } else {
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 });
    }

    if (result.length === 0) {
      return NextResponse.json({ error: 'Bulk order request not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update bulk order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/bulk-orders/[id]: delete request
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const deleted = await deleteBulkOrder(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Bulk order request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    console.error('admin delete bulk order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
