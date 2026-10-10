import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { FREE_DELIVERY_PINCODES } from '@/lib/delivery';
import { ensureDeliveryPincodesTable } from '@/lib/deliveryServer';

export const dynamic = 'force-dynamic';

interface PincodeRow {
  pincode: string;
  area_name?: string | null;
  city?: string | null;
}

export async function GET() {
  try {
    await ensureDeliveryPincodesTable();
    const sql = getSQL();
    const rows = (await sql`
      SELECT pincode, area_name, city
      FROM delivery_pincodes
      WHERE is_active = true
      ORDER BY pincode ASC
    `) as unknown as PincodeRow[];

    if (rows && rows.length > 0) {
      const pincodes = rows.map((r) => String(r.pincode).trim());
      return NextResponse.json({
        pincodes,
        items: rows,
      });
    }
  } catch (error) {
    console.error('Failed to fetch delivery pincodes:', error);
  }

  // Fallback to defaults
  const defaults = Array.from(FREE_DELIVERY_PINCODES);
  return NextResponse.json({
    pincodes: defaults,
    items: defaults.map((pin) => ({
      pincode: pin,
      area_name: 'Local Farm Delivery Zone',
      city: 'Mohali / Chandigarh',
    })),
  });
}
