import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  computeDiscountPaise,
  validateActiveCoupon,
  COUPON_GENERIC_ERROR,
} from '@/lib/coupons';
import { priceCartItems, RawCartItem } from '@/lib/checkoutValidation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 10 requests per IP per 10 minutes (600s) to prevent guessing ──
    const rateLimited = await checkRateLimit(request, 'checkout/coupon/validate', 10, 600);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => ({}));
    const rawCode = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const items: RawCartItem[] = Array.isArray(body.items) ? body.items : [];
    const clientSubtotalPaise = typeof body.subtotalPaise === 'number' ? body.subtotalPaise : 0;

    if (!rawCode) {
      return NextResponse.json({ error: COUPON_GENERIC_ERROR }, { status: 400 });
    }

    const couponCheck = await validateActiveCoupon(rawCode);
    if (!couponCheck.ok) {
      return NextResponse.json({ error: COUPON_GENERIC_ERROR }, { status: 400 });
    }

    const { coupon } = couponCheck;

    // Compute discount preview for the cart subtotal server-side
    let subtotalPaise = 0;
    if (items.length > 0) {
      const priced = await priceCartItems(items);
      if (priced.ok) {
        subtotalPaise = priced.subtotalPaise;
      }
    }
    if (subtotalPaise === 0 && clientSubtotalPaise > 0) {
      subtotalPaise = clientSubtotalPaise;
    }

    const percentOff = coupon.percentOff;
    const discountPaise = computeDiscountPaise(subtotalPaise, percentOff);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      percentOff,
      discountPaise,
      subtotalPaise,
    });
  } catch (err: unknown) {
    console.error('coupon validate error:', err);
    return NextResponse.json({ error: COUPON_GENERIC_ERROR }, { status: 400 });
  }
}
