import crypto from 'crypto';
import { getSQL } from './db';

/**
 * Cash on Delivery (COD) configuration and validation helpers.
 */

export function isCodEnabled(): boolean {
  const enabledEnv = process.env.COD_ENABLED?.trim().toLowerCase();
  // Cash on Delivery is enabled by default unless explicitly disabled ('false', '0', 'off', 'no')
  if (enabledEnv === 'false' || enabledEnv === '0' || enabledEnv === 'off' || enabledEnv === 'no') {
    return false;
  }

  return true;
}

export function getCodChallengeSecret(): string {
  const configured = process.env.COD_CHALLENGE_SECRET?.trim();
  if (configured) {
    return configured;
  }

  // Derive a stable server-side fallback secret from existing secrets or a fallback seed
  // Ensures COD challenges can be generated and verified safely on any host (like Netlify) without manual setup
  const seed =
    process.env.ADMIN_PASSWORD ||
    process.env.DATABASE_URL ||
    process.env.RAZORPAY_KEY_SECRET ||
    'wga-cod-fallback-challenge-secret-key-2026';
  return crypto.createHash('sha256').update(seed).digest('hex');
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

let _ordersSchemaEnsured = false;
/**
 * Ensures the orders table has the payment_method column (from migration 049)
 * to avoid checkout insertion failures if migrations have not been applied manually.
 */
export async function ensureCodOrdersSchema(): Promise<void> {
  if (_ordersSchemaEnsured) return;
  try {
    const sql = getSQL();
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online'
    `;
    _ordersSchemaEnsured = true;
  } catch (err) {
    console.warn('ensureCodOrdersSchema warning:', err);
  }
}
