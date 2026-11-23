import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['new', 'contacted', 'closed'];

// PUT /api/admin/inquiries/[id]: update inquiry status or action=delete
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sql = getSQL();
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id?.trim();
    const body = await request.json();
    const { action, status } = body;

    if (action === 'delete') {
      const result = await sql`
        DELETE FROM business_inquiries
        WHERE id::text = ${id}
        RETURNING id
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, id });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE business_inquiries
      SET status = ${status}
      WHERE id::text = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update inquiry error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/inquiries/[id]: permanently delete inquiry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sql = getSQL();
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id?.trim();

    const result = await sql`
      DELETE FROM business_inquiries
      WHERE id::text = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    console.error('admin delete inquiry error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
