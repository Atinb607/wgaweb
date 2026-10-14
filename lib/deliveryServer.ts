import { getSQL } from './db';
import { FREE_DELIVERY_PINCODES, DEFAULT_AVAILABLE_DELIVERY_PINCODES } from './delivery';

/**
 * Ensures the delivery_pincodes table exists in the Neon database
 * and has initial default seed data if newly created.
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
        is_free_delivery boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `;

    // Ensure is_free_delivery column exists
    await sql`
      ALTER TABLE delivery_pincodes ADD COLUMN IF NOT EXISTS is_free_delivery boolean DEFAULT false
    `;

    // Seed 47 deliverable pincodes if table is empty
    const check = await sql`SELECT count(*) FROM delivery_pincodes`;
    const count = Number(check[0]?.count || 0);

    if (count === 0) {
      await sql`
        INSERT INTO delivery_pincodes (pincode, area_name, city, notes, is_active, is_free_delivery)
        VALUES
          ('133301', 'Pinjore Area', 'Panchkula', 'Deliverable Area', true, false),
          ('133302', 'Kalka Area', 'Panchkula', 'Deliverable Area', true, false),
          ('134101', 'Panchkula Sectors 1-4', 'Panchkula', 'Deliverable Area', true, false),
          ('134103', 'Mansa Devi Complex', 'Panchkula', 'Deliverable Area', true, false),
          ('134104', 'Panchkula Sector 14, 15', 'Panchkula', 'Deliverable Area', true, false),
          ('134105', 'Chandimandir Cantt', 'Panchkula', 'Deliverable Area', true, false),
          ('134107', 'Surajpur Area', 'Panchkula', 'Deliverable Area', true, false),
          ('134108', 'Raipur Rani Area', 'Panchkula', 'Deliverable Area', true, false),
          ('134109', 'Panchkula Sectors 8, 9, 10, 16', 'Panchkula', 'Deliverable Area', true, false),
          ('134112', 'Panchkula Sector 20', 'Panchkula', 'Deliverable Area', true, false),
          ('134113', 'Panchkula Sector 21', 'Panchkula', 'Deliverable Area', true, false),
          ('134114', 'Panchkula Sector 25, 26', 'Panchkula', 'Deliverable Area', true, false),
          ('134115', 'Barwala Area', 'Panchkula', 'Deliverable Area', true, false),
          ('134116', 'Panchkula Sector 24, 26 Ext', 'Panchkula', 'Deliverable Area', true, false),
          ('134117', 'Panchkula Sector 27, 28', 'Panchkula', 'Deliverable Area', true, false),
          ('134118', 'Morni Hills Area', 'Panchkula', 'Deliverable Area', true, false),
          ('140301', 'Kharar / Kurali Area', 'Mohali', 'Deliverable Area', true, false),
          ('140306', 'Mohali Sectors 81-83, Manauli, Aerocity', 'Mohali', 'Immediate Local Farm Zone', true, true),
          ('140307', 'Landran Area', 'Mohali', 'Deliverable Area', true, false),
          ('140308', 'Banur / Majat Area', 'Mohali', 'Deliverable Area', true, false),
          ('160001', 'Chandigarh Sector 1', 'Chandigarh', 'Deliverable Area', true, false),
          ('160002', 'Chandigarh Sector 2', 'Chandigarh', 'Deliverable Area', true, false),
          ('160003', 'Chandigarh Sector 3', 'Chandigarh', 'Deliverable Area', true, false),
          ('160004', 'Chandigarh Sector 4', 'Chandigarh', 'Deliverable Area', true, false),
          ('160009', 'Chandigarh Sector 9', 'Chandigarh', 'Deliverable Area', true, false),
          ('160011', 'Chandigarh Sector 11', 'Chandigarh', 'Deliverable Area', true, false),
          ('160012', 'PGI / Chandigarh Sector 12', 'Chandigarh', 'Deliverable Area', true, false),
          ('160014', 'Panjab University / Sector 14', 'Chandigarh', 'Deliverable Area', true, false),
          ('160015', 'Chandigarh Sector 15', 'Chandigarh', 'Deliverable Area', true, false),
          ('160017', 'Chandigarh Sector 17', 'Chandigarh', 'Deliverable Area', true, false),
          ('160018', 'Chandigarh Sector 18', 'Chandigarh', 'Deliverable Area', true, false),
          ('160019', 'Chandigarh Sector 19', 'Chandigarh', 'Deliverable Area', true, false),
          ('160020', 'Chandigarh Sector 20', 'Chandigarh', 'Deliverable Area', true, false),
          ('160022', 'Chandigarh Sector 22', 'Chandigarh', 'Deliverable Area', true, false),
          ('160023', 'Chandigarh Sector 23', 'Chandigarh', 'Deliverable Area', true, false),
          ('160025', 'Chandigarh Sector 25 / West', 'Chandigarh', 'Deliverable Area', true, false),
          ('160030', 'Chandigarh Sector 30', 'Chandigarh', 'Deliverable Area', true, false),
          ('160036', 'Chandigarh Sector 36', 'Chandigarh', 'Deliverable Area', true, false),
          ('160040', 'Chandigarh Sector 40', 'Chandigarh', 'Deliverable Area', true, false),
          ('160043', 'Chandigarh Sector 43 / ISBT', 'Chandigarh', 'Deliverable Area', true, false),
          ('160047', 'Chandigarh Sector 47', 'Chandigarh', 'Deliverable Area', true, false),
          ('160055', 'Mohali Sector 55 / Balongi', 'Mohali / Chandigarh', 'Local Farm Zone', true, true),
          ('160059', 'Mohali Sector 59 / Phase 5', 'Chandigarh / Mohali', 'Local Farm Zone', true, true),
          ('160062', 'Mohali Sector 62 / Phase 8', 'Mohali / Chandigarh', 'Local Farm Zone', true, true),
          ('160071', 'Mohali Sector 71', 'Mohali', 'Local Farm Zone', true, true),
          ('160103', 'Sector 26 Timber Market / Mani Majra', 'Chandigarh', 'Deliverable Area', true, false),
          ('160104', 'Rajiv Gandhi IT Park', 'Chandigarh', 'Deliverable Area', true, false)
        ON CONFLICT (pincode) DO NOTHING
      `;
    }
  } catch (err) {
    console.warn('ensureDeliveryPincodesTable warning:', err);
  }
}

/**
 * Queries active deliverable pincodes from the database.
 * Falls back to default hardcoded set if database is unreachable or empty.
 */
interface PincodeDbRow {
  pincode: string;
}

export async function getAvailableDeliveryPincodesFromDb(): Promise<Set<string>> {
  try {
    const sql = getSQL();
    const rows = (await sql`
      SELECT pincode
      FROM delivery_pincodes
      WHERE is_active = true
    `) as unknown as PincodeDbRow[];

    if (rows && rows.length > 0) {
      const pinSet = new Set<string>();
      for (const r of rows) {
        const pin = String(r.pincode || '').trim();
        if (pin) pinSet.add(pin);
      }
      return pinSet;
    }
  } catch (err) {
    console.warn('Could not query available delivery_pincodes from DB, using fallback defaults:', err);
  }

  return DEFAULT_AVAILABLE_DELIVERY_PINCODES;
}

/**
 * Queries active free delivery pincodes from the database (local farm zone).
 * Falls back to default hardcoded set if database is unreachable or empty.
 */
export async function getFreeDeliveryPincodesFromDb(): Promise<Set<string>> {
  try {
    const sql = getSQL();
    const rows = (await sql`
      SELECT pincode
      FROM delivery_pincodes
      WHERE is_active = true AND is_free_delivery = true
    `) as unknown as PincodeDbRow[];

    if (rows && rows.length > 0) {
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
