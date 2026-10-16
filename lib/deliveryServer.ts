import { getSQL } from './db';
import { FREE_DELIVERY_PINCODES } from './delivery';

/**
 * Ensures the delivery_pincodes table exists in the Neon database
 * and seeds the default free-delivery local farm zone pincodes if empty.
 */
export async function ensureDeliveryPincodesTable(): Promise<void> {
  try {
    const sql = getSQL();
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_pincodes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        pincode varchar(10) NOT NULL UNIQUE,
        area_name text,
        city text DEFAULT 'Mohali / Chandigarh',
        notes text,
        is_active boolean DEFAULT true,
        is_free_delivery boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `;

    // Seed initial eligible free-delivery pincodes if table is empty
    const check = await sql`SELECT count(*) FROM delivery_pincodes`;
    const count = Number(check[0]?.count || 0);

    if (count === 0) {
      await sql`
        INSERT INTO delivery_pincodes (pincode, area_name, city, notes, is_active, is_free_delivery)
        VALUES
          ('140306', 'Mohali Sectors 81, 82, 83, Manauli, Aerocity', 'Mohali', 'Immediate Local Farm Zone', true, true),
          ('160062', 'Chandigarh Sectors 61, 62, 65, 67 / Mohali-side', 'Mohali / Chandigarh', 'Local Farm Zone', true, true),
          ('160071', 'Mohali Sector 71', 'Mohali', 'Local Farm Zone', true, true),
          ('160059', 'Chandigarh Sectors 59, 60', 'Chandigarh', 'Local Farm Zone', true, true),
          ('160055', 'Chandigarh / Mohali Sectors 55, 56 and Balongi', 'Mohali / Chandigarh', 'Local Farm Zone', true, true)
        ON CONFLICT (pincode) DO NOTHING
      `;
    }
  } catch (err) {
    console.warn('ensureDeliveryPincodesTable warning:', err);
  }
}

interface PincodeDbRow {
  pincode: string;
}

/**
 * Queries active free delivery pincodes from the database.
 * Falls back to default hardcoded set if database is unreachable.
 */
export async function getFreeDeliveryPincodesFromDb(): Promise<Set<string>> {
  try {
    const sql = getSQL();
    const rows = (await sql`
      SELECT pincode
      FROM delivery_pincodes
      WHERE is_active = true
    `) as unknown as PincodeDbRow[];

    if (rows) {
      const pinSet = new Set<string>();
      for (const r of rows) {
        const pin = String(r.pincode || '').trim();
        if (pin) pinSet.add(pin);
      }
      return pinSet;
    }
  } catch (err) {
    console.warn('Could not query free delivery_pincodes from DB, using fallback defaults:', err);
  }

  return FREE_DELIVERY_PINCODES;
}
