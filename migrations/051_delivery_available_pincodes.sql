-- 051_delivery_available_pincodes.sql
-- Add is_free_delivery column if missing
ALTER TABLE delivery_pincodes ADD COLUMN IF NOT EXISTS is_free_delivery boolean DEFAULT false;

-- Mark existing local farm free delivery pincodes
UPDATE delivery_pincodes
SET is_free_delivery = true
WHERE pincode IN ('140306', '160062', '160071', '160059', '160055');

-- Seed all 47 client deliverable pincodes
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
ON CONFLICT (pincode) DO UPDATE SET
  is_active = true,
  area_name = COALESCE(delivery_pincodes.area_name, EXCLUDED.area_name),
  city = COALESCE(delivery_pincodes.city, EXCLUDED.city),
  is_free_delivery = (CASE WHEN delivery_pincodes.pincode IN ('140306', '160062', '160071', '160059', '160055') THEN true ELSE delivery_pincodes.is_free_delivery END),
  updated_at = now();
