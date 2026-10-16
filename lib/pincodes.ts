/**
 * Validates that a pincode is a 6-digit Indian postal code.
 * Automated delivery eligibility is determined by the city selection
 * (Chandigarh, Panchkula, Mohali vs Others).
 */
export function isServiceable(pincode: string): boolean {
  if (!pincode || typeof pincode !== 'string') return false;
  return /^\d{6}$/.test(pincode.trim());
}

export const SERVICEABLE_PINCODES = {
  has: (pincode: string) => isServiceable(pincode),
};
