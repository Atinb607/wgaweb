-- 047_delivery_pincodes.sql
-- Table to manage pincodes eligible for free delivery on all orders

CREATE TABLE IF NOT EXISTS delivery_pincodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode varchar(10) NOT NULL UNIQUE,
  area_name text,
  city text DEFAULT 'Mohali / Chandigarh',
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial eligible free delivery pincodes
INSERT INTO delivery_pincodes (pincode, area_name, city, notes, is_active)
VALUES
  ('140306', 'Mohali Sectors 81, 82, 83, Manauli, Aerocity', 'Mohali', 'Immediate Local Farm Zone', true),
  ('160062', 'Chandigarh Sectors 61, 62, 65, 67 / Mohali-side', 'Mohali / Chandigarh', 'Local Farm Zone', true),
  ('160071', 'Mohali Sector 71', 'Mohali', 'Local Farm Zone', true),
  ('160059', 'Chandigarh Sectors 59, 60', 'Chandigarh', 'Local Farm Zone', true),
  ('160055', 'Chandigarh / Mohali Sectors 55, 56 and Balongi', 'Mohali / Chandigarh', 'Local Farm Zone', true)
ON CONFLICT (pincode) DO NOTHING;
