import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { isCodEnabled, getCodMaxOrderPaise, ensureCodOrdersSchema } from '@/lib/codConfig';
import { verifyCodChallenge } from '@/lib/codCaptcha';
import {
  validateCheckoutPayload,
  generateOrderNumber,
  RawCheckoutBody,
} from '@/lib/checkoutValidation';
import { decrementStock } from '@/lib/stock';
import { sendOrderConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface CodCreateRequestBody extends RawCheckoutBody {
  challengeToken?: string;
  challengeAnswer?: string | number;
  turnstileToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Check Rate Limit: 5 per IP per 10 minutes (600s) ──
    const rateLimited = await checkRateLimit(request, 'checkout/cod/create', 5, 600);
    if (rateLimited) return rateLimited;

    // ── 2. Check if COD is enabled on the server ──
    if (!isCodEnabled()) {
      return NextResponse.json(
        { error: 'Cash on delivery is currently disabled.' },
        { status: 403 }
      );
    }

    const body: CodCreateRequestBody = await request.json();
    const { challengeToken, challengeAnswer, turnstileToken } = body;

    const customerPhone = (body.customerPhone || body.customer_phone || '').trim();
    let phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      phoneDigits = phoneDigits.slice(2);
    } else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) {
      phoneDigits = phoneDigits.slice(1);
    }

    // ── 3. Validate 10-digit Indian mobile number ──
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: 'A valid 10-digit Indian mobile number is required for Cash on Delivery.' },
        { status: 400 }
      );
    }

    // ── 4. Verify invisible Turnstile token ──
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Verification token is required. Please refresh and try again.' },
          { status: 400 }
        );
      }

      const isDevOrTestToken =
        process.env.NODE_ENV !== 'production' &&
        (turnstileToken === 'XXXX.DUMMY.TOKEN.XXXX' ||
          turnstileToken === 'dev-token' ||
          turnstileToken === '1x00000000000000000000AA' ||
          !turnstileToken);

      if (!isDevOrTestToken && turnstileToken) {
        try {
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
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                '[cod/create] Dev Turnstile verification bypassed for local testing:',
                turnstileData
              );
            } else {
              return NextResponse.json(
                { error: 'Security check failed. Please refresh and try again.' },
                { status: 403 }
              );
            }
          }
        } catch (tErr) {
          console.error('Turnstile verification error:', tErr);
          // Fail closed for security in production
          if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
              { error: 'Security check service unreachable. Please try again.' },
              { status: 503 }
            );
          }
        }
      }
    }

    // ── 5. Verify Math Captcha Challenge Token and Answer ──
    const captchaCheck = verifyCodChallenge(challengeToken, challengeAnswer);
    if (!captchaCheck.valid) {
      return NextResponse.json(
        { error: captchaCheck.error || 'Incorrect or expired math answer. Please try again.' },
        { status: 400 }
      );
    }

    // ── 6. Shared Checkout Validation (pricing, active products, stock, pincode) ──
    const validation = await validateCheckoutPayload(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const {
      customerName,
      customerEmail,
      deliveryAddress,
      deliveryPincode,
      purchaseType,
      subscriptionFrequency,
      subtotalPaise,
      deliveryFeePaise,
      totalPaise: baseTotalPaise,
      deliveryCalc,
      lineItems,
    } = validation.data;

    // ── Coupon handling ──
    const rawCoupon = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : '';
    let appliedCouponCode: string | null = null;
    let discountPaise = 0;
    let finalTotalPaise = baseTotalPaise;

    if (rawCoupon) {
      const { validateActiveCoupon, computeDiscountPaise } = await import('@/lib/coupons');

      const couponCheck = await validateActiveCoupon(rawCoupon);
      if (!couponCheck.ok) {
        return NextResponse.json({ error: couponCheck.error }, { status: 400 });
      }

      appliedCouponCode = couponCheck.coupon.code;
      discountPaise = computeDiscountPaise(subtotalPaise, couponCheck.coupon.percentOff);
      finalTotalPaise = Math.max(0, Math.round(subtotalPaise + deliveryFeePaise - discountPaise));
    }

    // ── 7. Verify order total does not exceed COD_MAX_ORDER_PAISE ──
    const maxOrderPaise = getCodMaxOrderPaise();
    if (finalTotalPaise > maxOrderPaise) {
      const maxRupees = Math.floor(maxOrderPaise / 100);
      return NextResponse.json(
        {
          error: `Cash on Delivery is limited to orders up to ₹${maxRupees.toLocaleString('en-IN')}. Please choose online payment.`,
        },
        { status: 400 }
      );
    }

    // ── 8. Create Order in Database (with payment_method = 'cod' and payment_status = 'cod_pending') ──
    await ensureCodOrdersSchema();
    const sql = getSQL();
    let orderId: string;
    let orderNumber: string;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      orderNumber = generateOrderNumber();
      try {
        const orderRows = await sql`
          INSERT INTO orders (
            order_number,
            customer_name, customer_phone, customer_email,
            delivery_address, delivery_pincode,
            purchase_type, subscription_frequency,
            subtotal_paise, delivery_fee_paise, total_paise,
            coupon_code, discount_paise,
            payment_status, payment_method
          ) VALUES (
            ${orderNumber},
            ${customerName}, ${phoneDigits}, ${customerEmail || null},
            ${deliveryAddress}, ${deliveryPincode},
            ${purchaseType}, ${subscriptionFrequency || null},
            ${subtotalPaise}, ${deliveryFeePaise}, ${finalTotalPaise},
            ${appliedCouponCode}, ${discountPaise},
            'cod_pending', 'cod'
          )
          RETURNING id
        `;
        orderId = orderRows[0].id as string;
        break;
      } catch (insertErr: unknown) {
        const pgCode = (insertErr as { code?: string })?.code;
        if (pgCode === '23505' && attempt < MAX_RETRIES - 1) {
          console.warn(`[cod/create] order_number collision on ${orderNumber}, retrying...`);
          continue;
        }
        throw insertErr;
      }
    }

    // ── Insert Line Items ──
    for (const item of lineItems) {
      await sql`
        INSERT INTO order_items (
          order_id, product_variant_id, quantity, unit_price_paise,
          subscription_trays, subscription_weeks
        )
        VALUES (
          ${orderId!}, ${item.variantId}, ${item.quantity}, ${item.unitPricePaise},
          ${item.subscriptionTrays ?? null}, ${item.subscriptionWeeks ?? null}
        )
      `;
    }

    // ── Decrement Stock (guarded by stock_decremented flag) ──
    try {
      await decrementStock(orderId!);
    } catch (stockErr) {
      console.error(`[cod/create] Stock decrement failed for order ${orderId!}:`, stockErr);
    }

    // ── Send Confirmation Email ──
    try {
      await sendOrderConfirmation(orderId!);
    } catch (emailErr) {
      console.warn(`[cod/create] Order confirmation email failed or unconfigured:`, emailErr);
    }

    console.log(`[cod/create] Created COD order ${orderNumber!} (${orderId!}) for ${customerName}`);

    return NextResponse.json({
      success: true,
      orderId: orderId!,
      order_id: orderId!,
      orderNumber: orderNumber!,
      order_number: orderNumber!,
      customerName,
      customerEmail,
      customerPhone: phoneDigits,
      deliveryAddress,
      deliveryPincode,
      subtotalPaise,
      deliveryFeePaise,
      discountPaise,
      couponCode: appliedCouponCode,
      totalPaise: finalTotalPaise,
      deliveryCalc,
      purchaseType,
      subscriptionFrequency,
      paymentMethod: 'cod',
      paymentStatus: 'cod_pending',
    });
  } catch (err: unknown) {
    console.error('cod/create error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
