export const PROMO_BANNER_SOURCES = new Set<string>([
  'product_listing',
  'health-goals-plp',
  'our_story',
  'promo_banner',
]);

export const COUPON_GENERIC_ERROR = 'Invalid or inactive code';

/**
 * Normalizes an email address:
 * - Lowercase and trim
 * - Strip any +tag from local part (e.g. user+promo@example.com -> user@example.com)
 * - For gmail.com and googlemail.com: remove all dots in the local part and rewrite
 *   domain to gmail.com.
 */
export function normalizeEmail(rawEmail: string): string {
  if (!rawEmail) return '';
  const trimmed = rawEmail.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let local = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  // Strip +tag
  const plusIndex = local.indexOf('+');
  if (plusIndex !== -1) {
    local = local.slice(0, plusIndex);
  }

  // Gmail / Googlemail rules
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }

  return `${local}@${domain}`;
}

/**
 * Computes the discount in paise server-side:
 * floor(subtotal * percent_off / 100) on the items subtotal only (not delivery fee).
 */
export function computeDiscountPaise(subtotalPaise: number, percentOff: number): number {
  if (subtotalPaise <= 0 || percentOff <= 0) return 0;
  return Math.floor((subtotalPaise * percentOff) / 100);
}

export interface ActiveCoupon {
  id: string;
  code: string;
  percentOff: number;
}

export type ValidateCouponResult =
  | { ok: true; coupon: ActiveCoupon }
  | { ok: false; error: string };

/**
 * Validates that a coupon code exists and currently has status = 'active'.
 * All failures return the single generic message: "Invalid or inactive code".
 */
export async function validateActiveCoupon(rawCode: string): Promise<ValidateCouponResult> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code || code.length > 50) {
    return { ok: false, error: COUPON_GENERIC_ERROR };
  }

  const { getSQL } = await import('@/lib/db');
  const sql = getSQL();

  const rows = (await sql`
    SELECT id, code, percent_off, status
    FROM coupons
    WHERE UPPER(code) = ${code}
    LIMIT 1
  `) as unknown as { id: string; code: string; percent_off: number; status: string }[];

  if (rows.length === 0 || rows[0].status !== 'active') {
    return { ok: false, error: COUPON_GENERIC_ERROR };
  }

  return {
    ok: true,
    coupon: {
      id: rows[0].id,
      code: rows[0].code.toUpperCase(),
      percentOff: Number(rows[0].percent_off),
    },
  };
}
