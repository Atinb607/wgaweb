import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { getRazorpay } from '@/lib/razorpay';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  validateCheckoutPayload,
  generateOrderNumber,
  RawCheckoutBody,
} from '@/lib/checkoutValidation';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 10 requests per IP per 5 minutes ──
    const rateLimited = await checkRateLimit(request, 'checkout/create-order', 10, 300);
    if (rateLimited) return rateLimited;

    const sql = getSQL();
    const body: RawCheckoutBody = await request.json();

    // ── Shared checkout validation ──
    const validation = await validateCheckoutPayload(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryPincode,
      purchaseType,
      subscriptionFrequency,
      subtotalPaise,
      deliveryFeePaise,
      totalPaise,
      deliveryCalc,
      lineItems,
    } = validation.data;

    // ── Create Razorpay order ──
    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: totalPaise,
        currency: 'INR',
        receipt: `wga_${Date.now()}`,
        notes: {
          customer_name: customerName,
          customer_phone: customerPhone,
          purchase_type: purchaseType,
        },
      });
    } catch (rzpErr: unknown) {
      console.error('Razorpay orders.create failed:', rzpErr);
      const rzpMessage =
        typeof rzpErr === 'object' && rzpErr !== null && 'error' in rzpErr
          ? JSON.stringify((rzpErr as { error: unknown }).error)
          : rzpErr instanceof Error
          ? rzpErr.message
          : 'Payment gateway order creation failed';
      return NextResponse.json(
        { error: `Payment gateway error: ${rzpMessage}` },
        { status: 502 }
      );
    }

    if (!razorpayOrder || !razorpayOrder.id) {
      console.error('Razorpay order response missing id:', razorpayOrder);
      return NextResponse.json(
        { error: 'Payment gateway returned invalid order response' },
        { status: 502 }
      );
    }

    // ── Insert order into DB (with order_number, retry on collision) ──
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
            razorpay_order_id, payment_status, payment_method
          ) VALUES (
            ${orderNumber},
            ${customerName}, ${customerPhone}, ${customerEmail || null},
            ${deliveryAddress}, ${deliveryPincode},
            ${purchaseType}, ${subscriptionFrequency || null},
            ${subtotalPaise}, ${deliveryFeePaise}, ${totalPaise},
            ${razorpayOrder.id}, 'pending', 'online'
          )
          RETURNING id
        `;
        orderId = orderRows[0].id as string;
        break;
      } catch (insertErr: unknown) {
        // Check for unique constraint violation on order_number
        const pgCode = (insertErr as { code?: string })?.code;
        if (pgCode === '23505' && attempt < MAX_RETRIES - 1) {
          console.warn(`[create-order] order_number collision on ${orderNumber}, retrying...`);
          continue;
        }
        throw insertErr;
      }
    }

    // ── Insert order items ──
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

    console.log('[create-order] Generated razorpay_order_id:', razorpayOrder.id, 'order_number:', orderNumber!);

    return NextResponse.json({
      orderId: orderId!,
      order_id: orderId!,
      orderNumber: orderNumber!,
      order_number: orderNumber!,
      razorpayOrderId: razorpayOrder.id,
      razorpay_order_id: razorpayOrder.id,
      subtotalPaise,
      deliveryFeePaise,
      deliveryCalc,
      amount: totalPaise,
      currency: 'INR',
    });
  } catch (error: unknown) {
    console.error('create-order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
