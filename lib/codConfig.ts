/**
 * Cash on Delivery (COD) configuration and validation helpers.
 */

export function isCodEnabled(): boolean {
  const enabledEnv = process.env.COD_ENABLED?.trim().toLowerCase();
  if (enabledEnv !== 'true') {
    return false;
  }

  const secret = process.env.COD_CHALLENGE_SECRET?.trim();
  if (!secret) {
    console.warn(
      '[COD WARNING] COD_ENABLED is "true", but COD_CHALLENGE_SECRET is not configured! Cash on Delivery is disabled for security.'
    );
    return false;
  }

  return true;
}

export function getCodChallengeSecret(): string {
  return process.env.COD_CHALLENGE_SECRET?.trim() || '';
}

export function getCodMaxOrderPaise(): number {
  if (process.env.COD_MAX_ORDER_PAISE) {
    const parsed = parseInt(process.env.COD_MAX_ORDER_PAISE, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Default: ₹5,000 (500,000 paise) max for COD orders
  return 500000;
}
