import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSQL } from '@/lib/db';
import { sendOrderConfirmation } from '@/lib/email';
import { decrementStock } from '@/lib/stock';

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // ── Verify webhook signature ──
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ── Process webhook event ──
    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        const updated = await sql`
          UPDATE orders
          SET payment_status = 'paid',
              razorpay_payment_id = ${razorpayPaymentId}
          WHERE razorpay_order_id = ${razorpayOrderId}
            AND payment_status = 'pending'
          RETURNING id
        `;

        if (updated.length > 0) {
          const orderId = updated[0].id as string;

          // Decrement stock (dedup-guarded via stock_decremented flag)
          decrementStock(orderId).catch((err) =>
            console.error('Webhook: failed to decrement stock:', err)
          );

          // Send confirmation email as backup path
          // (sendOrderConfirmation has its own dedup guard via confirmation_email_sent flag)
          sendOrderConfirmation(orderId).catch((err) =>
            console.error('Webhook: failed to send confirmation email:', err)
          );
        }
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;

      if (razorpayOrderId) {
        // Mark as failed, but never downgrade a successful payment
        await sql`
          UPDATE orders
          SET payment_status = 'failed'
          WHERE razorpay_order_id = ${razorpayOrderId}
            AND payment_status != 'paid'
        `;

        console.log(`[webhook] payment.failed for razorpay_order_id: ${razorpayOrderId}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (error: unknown) {
    console.error('webhook error:', error);
    // Return 200 even on error to prevent Razorpay from retrying
    return NextResponse.json({ status: 'ok' });
  }
}
