import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { ensureDeliveryPincodesTable } from '@/lib/deliveryServer';

export const dynamic = 'force-dynamic';

// GET /api/admin/delivery-pincodes: list all pincodes
export async function GET() {
  try {
    await ensureDeliveryPincodesTable();
    const sql = getSQL();
    const pincodes = await sql`
      SELECT id, pincode, area_name, city, notes, is_active, is_free_delivery, created_at, updated_at
      FROM delivery_pincodes
      ORDER BY pincode ASC
    `;

    return NextResponse.json({ pincodes });
  } catch (error: unknown) {
    console.error('admin fetch delivery pincodes error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/delivery-pincodes: create a new delivery pincode
export async function POST(request: NextRequest) {
  try {
    await ensureDeliveryPincodesTable();
    const sql = getSQL();
    const body = await request.json();
    const { pincode, area_name, city, notes, is_active, is_free_delivery } = body;

    const cleanPin = pincode ? String(pincode).trim() : '';

    if (!cleanPin) {
      return NextResponse.json({ error: 'Pincode is required.' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json(
        { error: 'Pincode must be a valid 6-digit postal code (e.g. 140306).' },
        { status: 400 }
      );
    }

    // Check if pincode already exists
    const existing = await sql`
      SELECT id, pincode FROM delivery_pincodes WHERE pincode = ${cleanPin}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Pincode ${cleanPin} is already registered in the free delivery pincodes list.` },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO delivery_pincodes (pincode, area_name, city, notes, is_active, is_free_delivery)
      VALUES (
        ${cleanPin},
        ${area_name ? String(area_name).trim() : null},
        ${city ? String(city).trim() : 'Mohali'},
        ${notes ? String(notes).trim() : null},
        ${is_active !== undefined ? Boolean(is_active) : true},
        ${is_free_delivery !== undefined ? Boolean(is_free_delivery) : true}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create delivery pincode error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
