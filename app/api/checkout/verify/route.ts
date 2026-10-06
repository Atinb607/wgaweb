import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSQL } from '@/lib/db';
import { sendOrderConfirmation } from '@/lib/email';
import { decrementStock } from '@/lib/stock';

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body: VerifyBody = await request.json();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Length limits (defense-in-depth) ──
    if (razorpay_order_id.length > 100 || razorpay_payment_id.length > 100 || razorpay_signature.length > 200) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // ── Verify signature ──
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isValid) {
      // Mark the order as failed (but never downgrade a successful payment)
      await sql`
        UPDATE orders
        SET payment_status = 'failed'
        WHERE razorpay_order_id = ${razorpay_order_id}
          AND payment_status != 'paid'
      `;
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // ── Update order ──
    const result = await sql`
      UPDATE orders
      SET payment_status = 'paid',
          razorpay_payment_id = ${razorpay_payment_id}
      WHERE razorpay_order_id = ${razorpay_order_id}
        AND payment_status = 'pending'
      RETURNING id, order_number, customer_name, customer_email, customer_phone, subtotal_paise, delivery_fee_paise, total_paise
    `;

    let orderId: string;
    let orderNumber: string;
    let customerEmail: string | null = null;
    let customerName: string = '';
    let totalPaise: number = 0;
    let subtotalPaise: number = 0;
    let deliveryFeePaise: number = 0;

    if (result.length === 0) {
      // Check if already processed (e.g. webhook race or client retry)
      const existing = await sql`
        SELECT id, order_number, customer_name, customer_email, customer_phone, subtotal_paise, delivery_fee_paise, total_paise
        FROM orders
        WHERE razorpay_order_id = ${razorpay_order_id}
          AND payment_status = 'paid'
      `;
      if (existing.length > 0) {
        orderId = existing[0].id as string;
        orderNumber = existing[0].order_number as string;
        customerEmail = existing[0].customer_email as string | null;
        customerName = existing[0].customer_name as string;
        totalPaise = existing[0].total_paise as number;
        subtotalPaise = (existing[0].subtotal_paise as number) || 0;
        deliveryFeePaise = (existing[0].delivery_fee_paise as number) || 0;
      } else {
        return NextResponse.json(
          { error: 'Order not found or already processed' },
          { status: 404 }
        );
      }
    } else {
      orderId = result[0].id as string;
      orderNumber = result[0].order_number as string;
      customerEmail = result[0].customer_email as string | null;
      customerName = result[0].customer_name as string;
      totalPaise = result[0].total_paise as number;
      subtotalPaise = (result[0].subtotal_paise as number) || 0;
      deliveryFeePaise = (result[0].delivery_fee_paise as number) || 0;

      // Decrement stock for ordered variants (dedup-guarded via stock_decremented flag)
      decrementStock(orderId).catch((err) =>
        console.error('Failed to decrement stock:', err)
      );

      // Send confirmation email via Resend (await to guarantee execution before response terminates)
      try {
        await sendOrderConfirmation(orderId);
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }
    }

    return NextResponse.json({
      status: 'paid',
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      subtotalPaise,
      deliveryFeePaise,
      totalPaise,
    });
  } catch (error: unknown) {
    console.error('verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
