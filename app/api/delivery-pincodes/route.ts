import { getUncachedSQL } from '@/lib/db';
import { FREE_DELIVERY_PINCODES } from '@/lib/delivery';
import { ensureDeliveryPincodesTable } from '@/lib/deliveryServer';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface PincodeRow {
  pincode: string;
  area_name?: string | null;
  city?: string | null;
  is_free_delivery?: boolean;
}

export async function GET() {
  try {
    await ensureDeliveryPincodesTable();
    const sql = getUncachedSQL();
    const rows = (await sql`
      SELECT pincode, area_name, city, is_free_delivery
      FROM delivery_pincodes
      WHERE is_active = true
        AND COALESCE(is_free_delivery, true) = true
      ORDER BY pincode ASC
    `) as unknown as PincodeRow[];

    if (rows && rows.length > 0) {
      const freePincodes = rows.map((r) => String(r.pincode).trim());

      return adminJsonResponse({
        freePincodes,
        pincodes: freePincodes,
        items: rows,
      });
    }
  } catch (error) {
    console.error('Failed to fetch delivery pincodes:', error);
  }

  // Fallback to defaults
  const defaults = Array.from(FREE_DELIVERY_PINCODES);

  return adminJsonResponse({
    freePincodes: defaults,
    pincodes: defaults,
    items: defaults.map((pin) => ({
      pincode: pin,
      area_name: 'Immediate Farm Zone',
      city: 'Mohali',
      is_free_delivery: true,
    })),
  });
}
