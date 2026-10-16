import crypto from 'crypto';
import { getSQL } from '@/lib/db';
import { calculateDeliveryFee, DeliveryCalculation, isDeliverableCity } from '@/lib/delivery';
import { getFreeDeliveryPincodesFromDb } from '@/lib/deliveryServer';

export const ORDER_NUM_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 30 unambiguous chars

export function generateOrderNumber(): string {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ORDER_NUM_CHARS[bytes[i] % ORDER_NUM_CHARS.length];
  }
  return `WAG-${code}`;
}

export interface RawCartItem {
  variantId?: string;
  product_variant_id?: string;
  quantity: number;
  isSubscription?: boolean;
  subscriptionTrays?: number;
  subscriptionWeeks?: number;
}

export interface RawCheckoutBody {
  items?: RawCartItem[];
  purchaseType?: 'one_time' | 'subscription';
  purchase_type?: 'one_time' | 'subscription';
  subscriptionFrequency?: 'weekly' | 'monthly';
  subscription_frequency?: 'weekly' | 'monthly';
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerEmail?: string;
  customer_email?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  deliveryPincode?: string;
  delivery_pincode?: string;
  deliveryCity?: string;
  delivery_city?: string;
  /** Optional coupon code. Validated and priced server-side only. */
  couponCode?: string;
}

export interface ValidatedLineItem {
  variantId: string;
  quantity: number;
  unitPricePaise: number;
  subscriptionTrays?: number | null;
  subscriptionWeeks?: number | null;
}

export interface ValidatedCheckoutData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryPincode: string;
  purchaseType: 'one_time' | 'subscription';
  subscriptionFrequency?: 'weekly' | 'monthly' | null;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  deliveryCalc: DeliveryCalculation;
  lineItems: ValidatedLineItem[];
}

export type CheckoutValidationResult =
  | { ok: true; data: ValidatedCheckoutData }
  | { ok: false; error: string; status: number };

export async function validateCheckoutPayload(
  body: RawCheckoutBody
): Promise<CheckoutValidationResult> {
  const items = body.items || [];
  const customerName = (body.customerName || body.customer_name || '').trim();
  const customerPhone = (body.customerPhone || body.customer_phone || '').trim();
  const customerEmail = (body.customerEmail || body.customer_email || '').trim();
  let deliveryAddress = (body.deliveryAddress || body.delivery_address || '').trim();
  const deliveryPincode = (body.deliveryPincode || body.delivery_pincode || '').trim();
  const deliveryCity = (body.deliveryCity || body.delivery_city || '').trim();
  const purchaseType = (body.purchaseType || body.purchase_type) as 'one_time' | 'subscription' | undefined;
  const subscriptionFrequency = (body.subscriptionFrequency || body.subscription_frequency) as
    | 'weekly'
    | 'monthly'
    | undefined;

  // ── Validate required fields ──
  if (!items || items.length === 0) {
    return { ok: false, error: 'Cart is empty', status: 400 };
  }
  if (!customerName || !customerPhone || !customerEmail || !deliveryAddress || !deliveryPincode) {
    return {
      ok: false,
      error: 'Missing required customer/delivery fields (name, phone, email, address, pincode)',
      status: 400,
    };
  }
  if (!purchaseType || !['one_time', 'subscription'].includes(purchaseType)) {
    return { ok: false, error: 'Invalid purchase type', status: 400 };
  }
  if (purchaseType === 'subscription' && !['weekly', 'monthly'].includes(subscriptionFrequency || '')) {
    return { ok: false, error: 'Subscription requires a valid frequency (weekly or monthly)', status: 400 };
  }

  // ── Length limits ──
  if (customerName.length > 200) {
    return { ok: false, error: 'Customer name is too long (max 200 characters)', status: 400 };
  }
  if (customerPhone.length > 20) {
    return { ok: false, error: 'Phone number is too long (max 20 characters)', status: 400 };
  }
  if (customerEmail.length > 254 || !customerEmail.includes('@')) {
    return { ok: false, error: 'A valid email address is required', status: 400 };
  }
  if (deliveryAddress.length > 1000) {
    return { ok: false, error: 'Delivery address is too long (max 1000 characters)', status: 400 };
  }
  if (!/^\d{6}$/.test(deliveryPincode)) {
    return { ok: false, error: 'Please enter a valid 6-digit delivery pincode.', status: 400 };
  }
  if (items.length > 50) {
    return { ok: false, error: 'Too many items in cart', status: 400 };
  }

  // ── Validate delivery city (Chandigarh, Panchkula, Mohali) ──
  if (deliveryCity) {
    if (!isDeliverableCity(deliveryCity)) {
      return {
        ok: false,
        error:
          'Automated delivery is only available in Chandigarh, Panchkula, and Mohali. Please tap the WhatsApp button to request delivery.',
        status: 400,
      };
    }
    // Append city to deliveryAddress if not already present
    if (!deliveryAddress.toLowerCase().includes(deliveryCity.toLowerCase())) {
      deliveryAddress = `${deliveryAddress}, ${deliveryCity}`;
    }
  }

  // ── Price cart items server-side (shared with the coupon preview endpoint) ──
  const priced = await priceCartItems(items);
  if (!priced.ok) return priced;
  const { lineItems, subtotalPaise } = priced;

  // ── Delivery fee calculation ──
  const freeDeliveryPincodes = await getFreeDeliveryPincodesFromDb();
  const deliveryCalc = calculateDeliveryFee(deliveryPincode, subtotalPaise, freeDeliveryPincodes);
  const deliveryFeePaise = deliveryCalc.deliveryFeePaise;
  const totalPaise = Math.round(subtotalPaise + deliveryFeePaise);

  return {
    ok: true,
    data: {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryPincode,
      purchaseType,
      subscriptionFrequency: purchaseType === 'subscription' ? subscriptionFrequency || 'weekly' : null,
      subtotalPaise,
      deliveryFeePaise,
      totalPaise,
      deliveryCalc,
      lineItems,
    },
  };
}

export type CartPricingResult =
  | { ok: true; lineItems: ValidatedLineItem[]; subtotalPaise: number }
  | { ok: false; error: string; status: number };

/**
 * Prices cart items from DB variant prices (never trusts client prices).
 * Validates variant IDs, active status and stock. Returns the items subtotal
 * in paise (before delivery fee and before any coupon discount).
 */
export async function priceCartItems(items: RawCartItem[]): Promise<CartPricingResult> {
  const sql = getSQL();

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Cart is empty', status: 400 };
  }
  if (items.length > 50) {
    return { ok: false, error: 'Too many items in cart', status: 400 };
  }

  // ── Normalize cart items ──
  const normalizedItems = items.map((item) => ({
    variantId: (item.variantId || item.product_variant_id) as string,
    quantity: Number(item.quantity) || 1,
    isSubscription: Boolean(item.isSubscription),
    subscriptionTrays: item.subscriptionTrays ? Number(item.subscriptionTrays) : undefined,
    subscriptionWeeks: item.subscriptionWeeks ? Number(item.subscriptionWeeks) : undefined,
  }));

  const variantIds = normalizedItems.map((item) => item.variantId).filter(Boolean);
  if (variantIds.length !== normalizedItems.length) {
    return { ok: false, error: 'Missing variant ID in cart items', status: 400 };
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const id of variantIds) {
    if (!UUID_REGEX.test(id)) {
      return {
        ok: false,
        error: 'One or more items in your cart have an invalid ID. Please clear your cart and re-add them.',
        status: 400,
      };
    }
  }

  // Fetch variant records from DB (defense against client price tampering)
  let variants: Record<string, unknown>[];
  try {
    variants = (await sql`
      SELECT pv.id, pv.label, pv.price_paise, pv.stock_qty, pv.is_active,
             p.name AS product_name
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = ANY(${variantIds})
    `) as unknown as Record<string, unknown>[];
  } catch (dbErr) {
    console.error('[validateCheckoutPayload] DB variant lookup error:', dbErr);
    return {
      ok: false,
      error: 'Database error validating cart items. Please try again.',
      status: 500,
    };
  }

  const variantMap = new Map(variants.map((v) => [v.id as string, v]));

  // Validate all variants exist, are active, and have sufficient stock
  for (const item of normalizedItems) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      return { ok: false, error: `Variant ${item.variantId} not found`, status: 400 };
    }
    if (!variant.is_active) {
      return {
        ok: false,
        error: `${variant.product_name} (${variant.label}) is no longer available`,
        status: 400,
      };
    }
    if ((variant.stock_qty as number) < item.quantity) {
      return {
        ok: false,
        error: `Not enough stock for ${variant.product_name} (${variant.label}). Requested: ${item.quantity}, available: ${variant.stock_qty}`,
        status: 409,
      };
    }
  }

  // Fetch configured subscription discount percent from DB (default 15%)
  let subDiscountPercent = 15;
  try {
    const discountRows = await sql`
      SELECT value FROM content_blocks
      WHERE page = 'product-detail' AND key = 'subscription_discount_percent'
      LIMIT 1
    `;
    if (discountRows && discountRows.length > 0 && discountRows[0].value) {
      const parsed = parseFloat(discountRows[0].value);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        subDiscountPercent = parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch subscription_discount_percent, defaulting to 15%:', err);
  }
  const subDiscountMultiplier = (100 - subDiscountPercent) / 100;

  // ── Calculate subtotal ──
  let subtotalPaise = 0;
  const lineItems: ValidatedLineItem[] = [];

  for (const item of normalizedItems) {
    const variant = variantMap.get(item.variantId)!;
    let unitPrice: number;

    if (item.isSubscription && item.subscriptionTrays && item.subscriptionWeeks) {
      // Dynamic subscription formula: Base Price * trays * weeks * ((100 - discountPercent) / 100) (rounded to whole rupees)
      const basePriceRupees = Number(variant.price_paise) / 100;
      const subtotalRupees = basePriceRupees * item.subscriptionTrays * item.subscriptionWeeks;
      const finalPriceRupees = Math.round(subtotalRupees * subDiscountMultiplier);
      unitPrice = finalPriceRupees * 100; // in paise
    } else {
      unitPrice = Number(variant.price_paise);
    }

    subtotalPaise += unitPrice * item.quantity;
    lineItems.push({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPricePaise: unitPrice,
      subscriptionTrays: item.subscriptionTrays || null,
      subscriptionWeeks: item.subscriptionWeeks || null,
    });
  }

  subtotalPaise = Math.round(subtotalPaise);

  return { ok: true, lineItems, subtotalPaise };
}
