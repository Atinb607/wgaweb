import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT /api/admin/delivery-pincodes/[id]: update a free delivery pincode
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json();
    const { pincode, area_name, city, notes, is_active } = body;

    const cleanPin = pincode !== undefined ? String(pincode).trim() : undefined;

    if (cleanPin !== undefined && !/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json(
        { error: 'Pincode must be a valid 6-digit postal code.' },
        { status: 400 }
      );
    }

    if (cleanPin !== undefined) {
      const conflict = await sql`
        SELECT id FROM delivery_pincodes WHERE pincode = ${cleanPin} AND id != ${id}
      `;
      if (conflict.length > 0) {
        return NextResponse.json(
          { error: `Pincode ${cleanPin} is already registered under another entry.` },
          { status: 409 }
        );
      }
    }

    const result = await sql`
      UPDATE delivery_pincodes
      SET
        pincode = COALESCE(${cleanPin ?? null}, pincode),
        area_name = CASE WHEN ${area_name !== undefined} THEN ${area_name ? String(area_name).trim() : null} ELSE area_name END,
        city = CASE WHEN ${city !== undefined} THEN ${city ? String(city).trim() : null} ELSE city END,
        notes = CASE WHEN ${notes !== undefined} THEN ${notes ? String(notes).trim() : null} ELSE notes END,
        is_active = COALESCE(${is_active !== undefined ? Boolean(is_active) : null}, is_active),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Delivery pincode not found.' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update delivery pincode error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/delivery-pincodes/[id]: delete a free delivery pincode
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const result = await sql`
      DELETE FROM delivery_pincodes
      WHERE id = ${id}
      RETURNING id, pincode
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Delivery pincode not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (error: unknown) {
    console.error('admin delete delivery pincode error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
