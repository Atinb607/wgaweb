import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonNoCache(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  response.headers.set('X-Cache-Enabled', 'False');
  return response;
}

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  unit_price_paise: number;
  variant_label: string;
  net_weight_grams: number;
  product_name: string;
  product_slug: string;
}

// GET /api/orders/lookup?order_number=X&phone=Y&email=Z&turnstileToken=T
// Public order tracking: three-factor auth (order_number + phone + email),
// paid orders only, Turnstile CAPTCHA required.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const orderNumber = searchParams.get('order_number')?.trim();
    const phone = searchParams.get('phone')?.trim();
    const email = searchParams.get('email')?.trim();
    const turnstileToken = searchParams.get('turnstileToken')?.trim();

    // ── Require Turnstile token ──
    if (!turnstileToken) {
      return jsonNoCache(
        { error: 'Turnstile verification is required.' },
        { status: 400 }
      );
    }

    // ── Require order number, phone number, and email address ──
    if (!orderNumber || !phone || !email) {
      return jsonNoCache(
        { error: 'Order number, phone number, and email address are all required.' },
        { status: 400 }
      );
    }

    // ── Input length limits ──
    if (orderNumber.length > 30 || (phone && phone.length > 25) || (email && email.length > 254)) {
      return jsonNoCache(
        { error: 'Invalid input length.' },
        { status: 400 }
      );
    }

    // ── Verify Turnstile token server-side (skip verify only for dev mock tokens in development) ──
    const isDevToken = process.env.NODE_ENV !== 'production' && turnstileToken === 'dev-token';
    if (!isDevToken) {
      const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
      if (!turnstileSecret) {
        console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY is not configured');
        return jsonNoCache(
          { error: 'CAPTCHA verification is not configured. Please contact support.' },
          { status: 500 }
        );
      }

      const turnstileRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
          }),
        }
      );

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return jsonNoCache(
          { error: 'CAPTCHA verification failed. Please try again.' },
          { status: 403 }
        );
      }
    }

    // ── Rate Limiting: 10 requests per IP per 10 minutes (600s) ──
    const rateLimitError = await checkRateLimit(request, 'orders/lookup', 10, 600);
    if (rateLimitError) {
      return rateLimitError;
    }

    const sql = getSQL();

    // Normalize phone (extract digits, take last 10 digits for Indian numbers)
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    const last10Digits = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    // Query: order_number, phone, AND email must all match.
    // Exclude cancelled orders.
    // Online orders require payment_status = 'paid'.
    // COD orders require payment_status IN ('cod_pending', 'paid').
    const orders = await sql`
      SELECT id, order_number, customer_name, customer_phone, customer_email, delivery_address, delivery_pincode,
             subtotal_paise, delivery_fee_paise, discount_paise, coupon_code, total_paise, purchase_type, subscription_frequency,
             payment_method, payment_status, fulfillment_status, created_at
      FROM orders
      WHERE UPPER(TRIM(order_number)) = ${orderNumber.toUpperCase()}
        AND RIGHT(REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g'), 10) = ${last10Digits}
        AND LOWER(TRIM(customer_email)) = ${cleanEmail}
        AND fulfillment_status != 'cancelled'
        AND (
          (payment_method = 'online' AND payment_status = 'paid')
          OR
          (payment_method = 'cod' AND payment_status IN ('cod_pending', 'paid'))
        )
      ORDER BY created_at DESC
    `;

    if (orders.length === 0) {
      return jsonNoCache([]);
    }

    const orderIds = orders.map((o) => o.id as string);
    const items = await sql`
      SELECT oi.id, oi.order_id, oi.quantity, oi.unit_price_paise,
             oi.subscription_trays, oi.subscription_weeks,
             pv.label AS variant_label, pv.net_weight_grams,
             p.name AS product_name, p.slug AS product_slug
      FROM order_items oi
      JOIN product_variants pv ON pv.id = oi.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE oi.order_id = ANY(${orderIds})
    `;

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of items as unknown as OrderItem[]) {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push(item);
    }

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id as string) || [],
    }));

    return jsonNoCache(ordersWithItems);
  } catch (error: unknown) {
    console.error('orders lookup error:', error);
    return jsonNoCache({ error: 'Internal server error' }, { status: 500 });
  }
}
