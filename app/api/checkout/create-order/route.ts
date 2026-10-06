import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSQL } from '@/lib/db';
import { getRazorpay } from '@/lib/razorpay';
import { isServiceable } from '@/lib/pincodes';
import { checkRateLimit } from '@/lib/rateLimit';
import { calculateDeliveryFee } from '@/lib/delivery';

// Characters excluding easily confused ones: 0/O, 1/I/L
const ORDER_NUM_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 30 chars

function generateOrderNumber(): string {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ORDER_NUM_CHARS[bytes[i] % ORDER_NUM_CHARS.length];
  }
  return `WAG-${code}`;
}

interface RawCartItem {
  variantId?: string;
  product_variant_id?: string;
  quantity: number;
  isSubscription?: boolean;
  subscriptionTrays?: number;
  subscriptionWeeks?: number;
}

interface RawCreateOrderBody {
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
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 10 requests per IP per 5 minutes ──
    const rateLimited = await checkRateLimit(request, 'checkout/create-order', 10, 300);
    if (rateLimited) return rateLimited;

    const sql = getSQL();
    const body: RawCreateOrderBody = await request.json();

    // ── Normalize input fields (support both camelCase and snake_case) ──
    const items = body.items || [];
    const customerName = body.customerName || body.customer_name;
    const customerPhone = body.customerPhone || body.customer_phone;
    const customerEmail = body.customerEmail || body.customer_email;
    const deliveryAddress = body.deliveryAddress || body.delivery_address;
    const deliveryPincode = body.deliveryPincode || body.delivery_pincode;
    const purchaseType = body.purchaseType || body.purchase_type;
    const subscriptionFrequency = body.subscriptionFrequency || body.subscription_frequency;

    // ── Validate required fields ──
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!customerName || !customerPhone || !customerEmail || !deliveryAddress || !deliveryPincode) {
      return NextResponse.json({ error: 'Missing required customer/delivery fields (name, phone, email, address, pincode)' }, { status: 400 });
    }
    if (!purchaseType || !['one_time', 'subscription'].includes(purchaseType)) {
      return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 });
    }
    if (purchaseType === 'subscription' && !['weekly', 'monthly'].includes(subscriptionFrequency || '')) {
      return NextResponse.json({ error: 'Subscription requires a valid frequency (weekly or monthly)' }, { status: 400 });
    }

    // ── Length limits (defense-in-depth) ──
    if (typeof customerName !== 'string' || customerName.length > 200) {
      return NextResponse.json({ error: 'Customer name is too long (max 200 characters)' }, { status: 400 });
    }
    if (typeof customerPhone !== 'string' || customerPhone.length > 20) {
      return NextResponse.json({ error: 'Phone number is too long (max 20 characters)' }, { status: 400 });
    }
    if (typeof customerEmail !== 'string' || customerEmail.length > 254 || !customerEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (typeof deliveryAddress !== 'string' || deliveryAddress.length > 1000) {
      return NextResponse.json({ error: 'Delivery address is too long (max 1000 characters)' }, { status: 400 });
    }
    if (typeof deliveryPincode !== 'string' || deliveryPincode.length > 10) {
      return NextResponse.json({ error: 'Invalid pincode format' }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Too many items in cart' }, { status: 400 });
    }

    // ── Validate pincode ──
    if (!isServiceable(deliveryPincode)) {
      return NextResponse.json(
        { error: 'Please provide a valid 6-digit delivery pincode.' },
        { status: 400 }
      );
    }

    // ── Fetch variant prices from DB (never trust client prices) ──
    const normalizedItems = items.map((item) => ({
      variantId: (item.variantId || item.product_variant_id) as string,
      quantity: Number(item.quantity) || 1,
      isSubscription: Boolean(item.isSubscription),
      subscriptionTrays: item.subscriptionTrays ? Number(item.subscriptionTrays) : undefined,
      subscriptionWeeks: item.subscriptionWeeks ? Number(item.subscriptionWeeks) : undefined,
    }));

    const variantIds = normalizedItems.map((item) => item.variantId).filter(Boolean);
    if (variantIds.length !== normalizedItems.length) {
      return NextResponse.json({ error: 'Missing variant ID in cart items' }, { status: 400 });
    }

    const variants = await sql`
      SELECT pv.id, pv.label, pv.price_paise, pv.stock_qty, pv.is_active,
             p.name AS product_name
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = ANY(${variantIds})
    `;

    const variantMap = new Map(variants.map((v) => [v.id as string, v]));

    // Validate all variants exist, are active, and have sufficient stock
    for (const item of normalizedItems) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 400 });
      }
      if (!variant.is_active) {
        return NextResponse.json(
          { error: `${variant.product_name} (${variant.label}) is no longer available` },
          { status: 400 }
        );
      }
      if ((variant.stock_qty as number) < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for ${variant.product_name} (${variant.label}). Requested: ${item.quantity}, available: ${variant.stock_qty}`,
          },
          { status: 409 }
        );
      }
    }

    // ── Calculate total server-side ──
    let subtotalPaise = 0;
    const lineItems: {
      variantId: string;
      quantity: number;
      unitPricePaise: number;
      subscriptionTrays?: number | null;
      subscriptionWeeks?: number | null;
    }[] = [];

    for (const item of normalizedItems) {
      const variant = variantMap.get(item.variantId)!;
      let unitPrice: number;

      if (item.isSubscription && item.subscriptionTrays && item.subscriptionWeeks) {
        // Formula: Base Price * Number of trays * number of weeks * 0.85 (rounded off to whole rupees without decimals)
        const basePriceRupees = Number(variant.price_paise) / 100;
        const subtotalRupees = basePriceRupees * item.subscriptionTrays * item.subscriptionWeeks;
        const finalPriceRupees = Math.round(subtotalRupees * 0.85);
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

    subtotalPaise = Math.round(subtotalPaise); // Ensure integer paise

    // ── Delivery fee calculation (Warehouse: 140306) ──
    const deliveryCalc = calculateDeliveryFee(deliveryPincode, subtotalPaise);
    const deliveryFeePaise = deliveryCalc.deliveryFeePaise;
    const totalPaise = Math.round(subtotalPaise + deliveryFeePaise);

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
            razorpay_order_id, payment_status
          ) VALUES (
            ${orderNumber},
            ${customerName}, ${customerPhone}, ${customerEmail || null},
            ${deliveryAddress}, ${deliveryPincode},
            ${purchaseType}, ${subscriptionFrequency || null},
            ${subtotalPaise}, ${deliveryFeePaise}, ${totalPaise},
            ${razorpayOrder.id}, 'pending'
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

    // ── Safe server-side log for verification ──
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
