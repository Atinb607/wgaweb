import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { FREE_DELIVERY_PINCODES } from '@/lib/delivery';
import { ensureDeliveryPincodesTable } from '@/lib/deliveryServer';

export const dynamic = 'force-dynamic';

interface PincodeRow {
  pincode: string;
  area_name?: string | null;
  city?: string | null;
  is_free_delivery?: boolean;
}

export async function GET() {
  try {
    await ensureDeliveryPincodesTable();
    const sql = getSQL();
    const rows = (await sql`
      SELECT pincode, area_name, city, is_free_delivery
      FROM delivery_pincodes
      WHERE is_active = true
      ORDER BY pincode ASC
    `) as unknown as PincodeRow[];

    if (rows && rows.length > 0) {
      const availablePincodes = rows.map((r) => String(r.pincode).trim());
      const freePincodes = rows
        .filter((r) => Boolean(r.is_free_delivery))
        .map((r) => String(r.pincode).trim());

      return NextResponse.json({
        availablePincodes,
        freePincodes: freePincodes.length > 0 ? freePincodes : Array.from(FREE_DELIVERY_PINCODES),
        pincodes: availablePincodes,
        items: rows,
      });
    }
  } catch (error) {
    console.error('Failed to fetch delivery pincodes:', error);
  }

  // Fallback to defaults
  const defaults = Array.from(FREE_DELIVERY_PINCODES);
  const { DEFAULT_AVAILABLE_DELIVERY_PINCODES } = await import('@/lib/delivery');
  const availableDefaults = Array.from(DEFAULT_AVAILABLE_DELIVERY_PINCODES);

  return NextResponse.json({
    availablePincodes: availableDefaults,
    freePincodes: defaults,
    pincodes: availableDefaults,
    items: availableDefaults.map((pin) => ({
      pincode: pin,
      area_name: 'Tricity Delivery Zone',
      city: 'Mohali / Chandigarh / Panchkula',
      is_free_delivery: defaults.includes(pin),
    })),
  });
}
