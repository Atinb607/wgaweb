import { Resend } from 'resend';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';
import { getSQL } from '@/lib/db';

let _resend: Resend | null = null;

/**
 * Returns a Resend client, or null if RESEND_API_KEY is not configured.
 * Callers must guard against null and skip email sending gracefully.
 */
function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key || key.trim() === '') {
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

/**
 * Resolves the sender email address and display name.
 * Defaults to 'Wild About Greens <info@wildaboutgreens.com>' to match verified Resend domain.
 */
export function getFromEmail(): string {
  const envFrom = process.env.FROM_EMAIL?.trim();
  if (envFrom && !envFrom.includes('destresshub.com')) {
    if (!envFrom.includes('<') && envFrom.includes('@')) {
      return `Wild About Greens <${envFrom}>`;
    }
    return envFrom;
  }
  return 'Wild About Greens <info@wildaboutgreens.com>';
}

interface OrderForEmail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string;
  subtotal_paise?: number;
  delivery_fee_paise?: number;
  total_paise: number;
  coupon_code?: string | null;
  discount_paise?: number;
  purchase_type: string;
  subscription_frequency: string | null;
}

interface OrderItemForEmail {
  quantity: number;
  unit_price_paise: number;
  label: string;
  product_name: string;
}

/**
 * Send an order confirmation email via Resend.
 * Guards against double-sending by checking the confirmation_email_sent flag.
 * Returns true if email was sent, false if skipped (already sent or no email).
 */
export async function sendOrderConfirmation(
  orderId: string
): Promise<boolean> {
  const sql = getSQL();

  // Atomically check and set the email_sent flag to prevent duplicates
  const updated = await sql`
    UPDATE orders
    SET confirmation_email_sent = true
    WHERE id = ${orderId}
      AND confirmation_email_sent = false
      AND payment_status IN ('paid', 'cod_pending')
    RETURNING id, order_number, customer_name, customer_email, customer_phone,
              delivery_address, delivery_pincode, subtotal_paise, delivery_fee_paise,
              total_paise, coupon_code, discount_paise, purchase_type, subscription_frequency, created_at
  `;

  if (updated.length === 0) {
    // Already sent, or order not paid, or order not found
    return false;
  }

  const order = updated[0] as unknown as OrderForEmail & { delivery_pincode?: string; created_at?: string };

  if (!order.customer_email) {
    console.log(`Order ${orderId}: no customer email, skipping confirmation`);
    return false;
  }

  // Fetch order items with product and variant info
  const items = await sql`
    SELECT oi.quantity, oi.unit_price_paise,
           pv.label, p.name AS product_name
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.product_variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE oi.order_id = ${orderId}
  ` as unknown as OrderItemForEmail[];

  // Fetch email content templates configured in admin
  const emailBlocks = await sql`
    SELECT key, value
    FROM content_blocks
    WHERE page = 'emails'
  `;
  const emailConfig: Record<string, string> = {};
  for (const b of emailBlocks as unknown as { key: string; value: string }[]) {
    emailConfig[b.key] = b.value;
  }

  const rawSubject = emailConfig.order_confirmation_subject || 'Wild About Greens: Order #{order_number} Confirmed!';
  const rawHeading = emailConfig.order_confirmation_heading || 'Thanks for your order, {customer_name}!';
  const rawIntro = emailConfig.order_confirmation_intro || "We've received your order and payment. Our urban farm team will harvest and prepare your microgreens fresh for delivery.";
  const rawFooter = emailConfig.order_confirmation_footer || "Questions about your delivery? Reply directly to this email or reach us on WhatsApp. Thank you for supporting sustainable urban farming!";

  const totalFormatted = `₹${(order.total_paise / 100).toFixed(2)}`;
  const cleanPincode = order.delivery_pincode ? ` — ${order.delivery_pincode}` : '';
  const fullAddress = `${order.delivery_address}${cleanPincode}`;

  // Replace dynamic tags
  const subject = rawSubject
    .replace(/{order_number}/gi, order.order_number)
    .replace(/{customer_name}/gi, order.customer_name)
    .replace(/{total}/gi, totalFormatted);

  const heading = rawHeading
    .replace(/{order_number}/gi, order.order_number)
    .replace(/{customer_name}/gi, order.customer_name)
    .replace(/{total}/gi, totalFormatted);

  const intro = rawIntro
    .replace(/{order_number}/gi, order.order_number)
    .replace(/{customer_name}/gi, order.customer_name)
    .replace(/{total}/gi, totalFormatted);

  const footer = rawFooter
    .replace(/{order_number}/gi, order.order_number)
    .replace(/{customer_name}/gi, order.customer_name)
    .replace(/{total}/gi, totalFormatted);

  const introHtml = intro
    .split('\n')
    .map((line) => (line.trim() === '' ? '<br />' : `<p style="margin: 0 0 10px; line-height: 1.6;">${line}</p>`))
    .join('');

  const footerHtml = footer
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : `<p style="margin: 0 0 6px;">${line}</p>`))
    .join('');

  const subscriptionNote =
    order.purchase_type === 'subscription'
      ? `<span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; margin-left: 6px;">${order.subscription_frequency} subscription</span>`
      : '';

  // Build items rows
  const itemRowsHtml = items
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #EEEEEE;">
          <td style="padding: 12px 8px; vertical-align: top;">
            <strong style="color: #151F19; font-size: 14px;">${item.product_name}</strong>
          </td>
          <td style="padding: 12px 8px; color: #5C6B60; font-size: 13px; vertical-align: top;">
            ${item.label}
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #151F19; font-size: 13px; font-weight: 600; vertical-align: top;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #151F19; font-size: 13px; font-weight: 600; vertical-align: top;">
            ₹${((item.unit_price_paise * item.quantity) / 100).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

  const fromEmail = getFromEmail();

  const resend = getResend();
  if (!resend) {
    console.warn(`Order ${orderId}: RESEND_API_KEY not configured, skipping confirmation email`);
    // Reset the flag so a retry can be attempted once the key is set
    await sql`
      UPDATE orders SET confirmation_email_sent = false WHERE id = ${orderId}
    `;
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8E2D2; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        <!-- Brand Header with Official Logo -->
        <tr>
          <td align="center" style="background-color: #1C3F2D; padding: 26px 20px; text-align: center;">
            <a href="https://wildaboutgreens.com" target="_blank" style="text-decoration: none; display: inline-block;">
              <img
                src="${CLOUDINARY_ASSETS.logoPictureBg}"
                alt="Wild About Greens"
                width="196"
                height="44"
                style="display: block; width: 196px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 1.5px;"
              />
            </a>
          </td>
        </tr>

        <!-- Main Content -->
        <tr>
          <td style="padding: 32px 28px;">
            <!-- Greeting -->
            <h2 style="margin: 0 0 14px; font-size: 22px; font-weight: 700; color: #151F19;">
              ${heading}
            </h2>
            <div style="font-size: 15px; color: #4A5568; line-height: 1.6; margin-bottom: 24px;">
              ${introHtml}
            </div>

            <!-- Order Number Banner -->
            <div style="background-color: #F9FAFB; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 18px 20px; margin-bottom: 28px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: #5C6B60; display: block;">
                      ORDER NUMBER
                    </span>
                    <span style="font-size: 22px; font-weight: 800; color: #1C3F2D; font-family: monospace; letter-spacing: 1px;">
                      #${order.order_number}
                    </span>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <span style="display: inline-block; background-color: #DCFCE7; color: #166534; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 9999px; border: 1px solid #86EFAC;">
                      PAID
                    </span>
                    ${subscriptionNote ? `<div style="margin-top: 4px;">${subscriptionNote}</div>` : ''}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #151F19;">
              Ordered Items
            </h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="border-bottom: 2px solid #E8E2D2; text-align: left;">
                  <th style="padding: 8px 8px; font-size: 11px; font-weight: 700; color: #5C6B60; text-transform: uppercase;">Product</th>
                  <th style="padding: 8px 8px; font-size: 11px; font-weight: 700; color: #5C6B60; text-transform: uppercase;">Pack</th>
                  <th style="padding: 8px 8px; font-size: 11px; font-weight: 700; color: #5C6B60; text-transform: uppercase; text-align: center;">Qty</th>
                  <th style="padding: 8px 8px; font-size: 11px; font-weight: 700; color: #5C6B60; text-transform: uppercase; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRowsHtml}
                <tr style="border-top: 1px solid #E8E2D2;">
                  <td colspan="3" style="padding: 10px 8px 4px; font-size: 13px; color: #5C6B60;">
                    Items Subtotal
                  </td>
                  <td style="padding: 10px 8px 4px; font-size: 13px; font-weight: 600; color: #151F19; text-align: right;">
                    ₹${(((order.subtotal_paise ?? (order.total_paise - (order.delivery_fee_paise ?? 0)))) / 100).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 4px 8px 8px; font-size: 13px; color: #5C6B60;">
                    Farm Direct Delivery
                  </td>
                  <td style="padding: 4px 8px 8px; font-size: 13px; font-weight: 600; color: ${(order.delivery_fee_paise ?? 0) > 0 ? '#151F19' : '#166534'}; text-align: right;">
                    ${(order.delivery_fee_paise ?? 0) > 0 ? `₹${((order.delivery_fee_paise ?? 0) / 100).toFixed(2)}` : 'FREE'}
                  </td>
                </tr>
                ${(order.discount_paise ?? 0) > 0 ? `
                <tr>
                  <td colspan="3" style="padding: 4px 8px 8px; font-size: 13px; color: #166534;">
                    Coupon Discount (${order.coupon_code || '15% OFF'})
                  </td>
                  <td style="padding: 4px 8px 8px; font-size: 13px; font-weight: 600; color: #166534; text-align: right;">
                    -₹${((order.discount_paise || 0) / 100).toFixed(2)}
                  </td>
                </tr>` : ''}
                <tr style="border-top: 2px solid #1C3F2D;">
                  <td colspan="3" style="padding: 14px 8px 4px; font-size: 15px; font-weight: 700; color: #151F19;">
                    Total Paid
                  </td>
                  <td style="padding: 14px 8px 4px; font-size: 18px; font-weight: 800; color: #1C3F2D; text-align: right;">
                    ${totalFormatted}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Delivery Address Card -->
            <div style="background-color: #F8F9FA; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px; border: 1px solid #EDF2F7;">
              <h4 style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2D3748;">
                Delivery Details
              </h4>
              <p style="margin: 0; font-size: 14px; color: #4A5568; line-height: 1.5;">
                <strong style="color: #1A202C;">${order.customer_name}</strong><br />
                Phone: ${order.customer_phone}<br />
                Address: ${fullAddress}
              </p>
            </div>

            <!-- Track Order Button -->
            <div style="text-align: center; margin: 30px 0 20px;">
              <a href="https://wildaboutgreens.com/track-order" style="display: inline-block; background-color: #1C3F2D; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 9999px; letter-spacing: 0.5px;">
                Track Your Order →
              </a>
            </div>

            <!-- Footer / Help -->
            <div style="border-top: 1px solid #E8E2D2; padding-top: 20px; text-align: center; color: #718096; font-size: 13px; line-height: 1.6;">
              ${footerHtml}
              <p style="margin: 12px 0 0; font-size: 11px; color: #A0AEC0;">
                Wild About Greens • Urban Microgreens Farm • <a href="https://wildaboutgreens.com" style="color: #1C3F2D; text-decoration: underline;">wildaboutgreens.com</a>
              </p>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: order.customer_email,
      replyTo: 'info@wildaboutgreens.com',
      ...({ reply_to: 'info@wildaboutgreens.com' } as Record<string, string>),
      subject,
      html: htmlContent,
    });

    console.log(`Order ${orderId}: confirmation email sent successfully to ${order.customer_email}`);
    return true;
  } catch (error) {
    console.error(`Order ${orderId}: failed to send confirmation email`, error);
    // Reset the flag so a retry can be attempted
    await sql`
      UPDATE orders SET confirmation_email_sent = false WHERE id = ${orderId}
    `;
    return false;
  }
}

// ─── Restaurant / Bulk Inquiry Notification ──────────────────────────────────

interface InquiryForEmail {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string | null;
  message: string | null;
}

export interface BulkOrderForEmail {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trays_count: number;
  products: string;
  business_name?: string | null;
  delivery_address?: string | null;
  delivery_pincode?: string | null;
  frequency?: string | null;
  notes?: string | null;
}

/**
 * Send a notification email to the business owner when a new
 * restaurant/bulk inquiry is submitted.
 */
export async function sendInquiryNotification(
  inquiry: InquiryForEmail
): Promise<boolean> {
  const fromEmail = getFromEmail();
  // Send to the notification recipient (NOTIFY_EMAIL), falling back to FROM_EMAIL or default
  const toEmail = process.env.NOTIFY_EMAIL || process.env.FROM_EMAIL || 'info@wildaboutgreens.com';

  const resend = getResend();
  if (!resend) {
    console.warn(`Inquiry ${inquiry.id}: RESEND_API_KEY not configured, skipping notification email`);
    return false;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: 'info@wildaboutgreens.com',
      ...({ reply_to: 'info@wildaboutgreens.com' } as Record<string, string>),
      subject: `New Bulk Inquiry: ${inquiry.business_name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Bulk Inquiry: ${inquiry.business_name}</title>
        </head>
        <body style="margin: 0; padding: 24px 12px; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8E2D2; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <!-- Brand Header with Official Logo -->
            <tr>
              <td align="center" style="background-color: #1C3F2D; padding: 26px 20px; text-align: center;">
                <a href="https://wildaboutgreens.com" target="_blank" style="text-decoration: none; display: inline-block;">
                  <img
                    src="${CLOUDINARY_ASSETS.logoPictureBg}"
                    alt="Wild About Greens"
                    width="196"
                    height="44"
                    style="display: block; width: 196px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 1.5px;"
                  />
                </a>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 28px 24px;">
                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #151F19;">
                  New Restaurant / Bulk Inquiry
                </h2>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60; width: 140px;">Business</td>
                    <td style="padding: 10px 8px; color: #151F19; font-weight: 600;">${inquiry.business_name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Contact</td>
                    <td style="padding: 10px 8px; color: #151F19;">${inquiry.contact_name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Phone</td>
                    <td style="padding: 10px 8px; color: #151F19;"><a href="tel:${inquiry.phone}" style="color: #1C3F2D; font-weight: 600;">${inquiry.phone}</a></td>
                  </tr>
                  ${inquiry.email ? `
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Email</td>
                    <td style="padding: 10px 8px; color: #151F19;"><a href="mailto:${inquiry.email}" style="color: #1C3F2D;">${inquiry.email}</a></td>
                  </tr>` : ''}
                </table>
                ${inquiry.message ? `
                <div style="background-color: #F8F9FA; border-radius: 10px; padding: 16px 18px; margin-bottom: 20px; border: 1px solid #EDF2F7;">
                  <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2D3748;">Message</h4>
                  <p style="margin: 0; font-size: 14px; color: #4A5568; line-height: 1.6; white-space: pre-wrap;">${inquiry.message}</p>
                </div>` : ''}
                <p style="color: #A0AEC0; font-size: 11px; margin: 20px 0 0; text-align: center; border-top: 1px solid #E8E2D2; padding-top: 14px;">
                  Inquiry ID: ${inquiry.id} • Wild About Greens Urban Farm
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`Inquiry ${inquiry.id}: notification email sent`);
    return true;
  } catch (error) {
    console.error(`Inquiry ${inquiry.id}: failed to send notification`, error);
    return false;
  }
}

/**
 * Send a notification email to the admin/team when a new
 * bulk order request is submitted.
 */
export async function sendBulkOrderNotification(
  req: BulkOrderForEmail
): Promise<boolean> {
  const fromEmail = getFromEmail();
  const toEmail = process.env.NOTIFY_EMAIL || process.env.FROM_EMAIL || 'info@wildaboutgreens.com';

  const resend = getResend();
  if (!resend) {
    console.warn(`Bulk Order ${req.ticket_number}: RESEND_API_KEY not configured, skipping notification email`);
    return false;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: 'info@wildaboutgreens.com',
      ...({ reply_to: 'info@wildaboutgreens.com' } as Record<string, string>),
      subject: `New Bulk Order Request: ${req.ticket_number} (${req.trays_count} Trays)`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Bulk Order Request: ${req.ticket_number}</title>
        </head>
        <body style="margin: 0; padding: 24px 12px; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8E2D2; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <!-- Brand Header with Official Logo -->
            <tr>
              <td align="center" style="background-color: #1C3F2D; padding: 26px 20px; text-align: center;">
                <a href="https://wildaboutgreens.com" target="_blank" style="text-decoration: none; display: inline-block;">
                  <img
                    src="${CLOUDINARY_ASSETS.logoPictureBg}"
                    alt="Wild About Greens"
                    width="196"
                    height="44"
                    style="display: block; width: 196px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 1.5px;"
                  />
                </a>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 28px 24px;">
                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #151F19;">
                  New Bulk Order Request: ${req.ticket_number}
                </h2>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60; width: 140px;">Ticket Number</td>
                    <td style="padding: 10px 8px; color: #1C3F2D; font-weight: 800; font-family: monospace;">${req.ticket_number}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Customer Name</td>
                    <td style="padding: 10px 8px; color: #151F19; font-weight: 600;">${req.customer_name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Phone</td>
                    <td style="padding: 10px 8px; color: #151F19;"><a href="tel:${req.customer_phone}" style="color: #1C3F2D; font-weight: 600;">${req.customer_phone}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Email</td>
                    <td style="padding: 10px 8px; color: #151F19;"><a href="mailto:${req.customer_email}" style="color: #1C3F2D;">${req.customer_email}</a></td>
                  </tr>
                  ${req.business_name ? `
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Business Name</td>
                    <td style="padding: 10px 8px; color: #151F19;">${req.business_name}</td>
                  </tr>` : ''}
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Trays Count</td>
                    <td style="padding: 10px 8px; color: #166534; font-weight: 800;">${req.trays_count} trays</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Products Requested</td>
                    <td style="padding: 10px 8px; color: #151F19;">${req.products}</td>
                  </tr>
                  ${req.frequency ? `
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Order Frequency</td>
                    <td style="padding: 10px 8px; color: #151F19;">${req.frequency}</td>
                  </tr>` : ''}
                  ${req.delivery_address ? `
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Delivery Address</td>
                    <td style="padding: 10px 8px; color: #151F19;">${req.delivery_address}</td>
                  </tr>` : ''}
                  ${req.delivery_pincode ? `
                  <tr style="border-bottom: 1px solid #F0ECE1;">
                    <td style="padding: 10px 8px; font-weight: 700; color: #5C6B60;">Pincode</td>
                    <td style="padding: 10px 8px; color: #151F19;">${req.delivery_pincode}</td>
                  </tr>` : ''}
                </table>
                ${req.notes ? `
                <div style="background-color: #F8F9FA; border-radius: 10px; padding: 16px 18px; margin-bottom: 20px; border: 1px solid #EDF2F7;">
                  <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2D3748;">Special Notes / Instructions</h4>
                  <p style="margin: 0; font-size: 14px; color: #4A5568; line-height: 1.6; white-space: pre-wrap;">${req.notes}</p>
                </div>` : ''}
                <p style="color: #A0AEC0; font-size: 11px; margin: 20px 0 0; text-align: center; border-top: 1px solid #E8E2D2; padding-top: 14px;">
                  Submitted via Wild About Greens Bulk Order portal
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`Bulk Order ${req.ticket_number}: notification email sent`);
    return true;
  } catch (error) {
    console.error(`Bulk Order ${req.ticket_number}: failed to send notification`, error);
    return false;
  }
}

// ─── Newsletter Welcome Email ────────────────────────────────────────────────

/**
 * Send a welcome email to a new newsletter subscriber.
 * Reads subject/body from content_blocks (page: 'emails') at send time.
 * Returns true if email was sent, false if skipped or failed.
 */
export async function sendNewsletterWelcome(
  email: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn(`RESEND_API_KEY not configured, skipping welcome email for ${email}`);
    return false;
  }

  const fromEmail = getFromEmail();

  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'emails'
    `;

    const contentMap: Record<string, string> = {};
    for (const b of blocks as unknown as { key: string; value: string }[]) {
      contentMap[b.key] = b.value;
    }

    let subject = contentMap.newsletter_thankyou_subject || 'Welcome to Wild About Greens! 🌱';
    if (subject.includes('[placeholder')) {
      subject = 'Welcome to Wild About Greens! 🌱';
    }

    let heading = contentMap.newsletter_thankyou_heading || 'Welcome to the Wild About Greens Family!';
    if (heading.includes('[placeholder')) {
      heading = 'Welcome to the Wild About Greens Family!';
    }

    let bodyText = contentMap.newsletter_thankyou_body || "Hi there!\n\nWelcome to Wild About Greens, we're thrilled to have you with us.\n\nHere is your exclusive 15% discount for your first order: USE CODE: WELCOME15\n\nStay fresh,\nThe Wild About Greens Team";
    if (bodyText.includes('[placeholder')) {
      bodyText = "Hi there!\n\nWelcome to Wild About Greens, we're thrilled to have you with us.\n\nHere is your exclusive 15% discount for your first order: USE CODE: WELCOME15\n\nStay fresh,\nThe Wild About Greens Team";
    }

    let footerText = contentMap.newsletter_thankyou_footer || 'Fresh harvest delivered straight from our indoor farm to your doorstep.';
    if (footerText.includes('[placeholder')) {
      footerText = 'Fresh harvest delivered straight from our indoor farm to your doorstep.';
    }

    // Convert plain text body to simple HTML paragraphs
    const bodyHtml = bodyText
      .split('\n')
      .map((line: string) => (line.trim() === '' ? '<br />' : `<p style="margin: 0 0 12px; line-height: 1.6; color: #4A5568;">${line}</p>`))
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8E2D2; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <!-- Brand Header with Official Logo -->
          <tr>
            <td align="center" style="background-color: #1C3F2D; padding: 26px 20px; text-align: center;">
              <a href="https://wildaboutgreens.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img
                  src="${CLOUDINARY_ASSETS.logoPictureBg}"
                  alt="Wild About Greens"
                  width="196"
                  height="44"
                  style="display: block; width: 196px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 1.5px;"
                />
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #151F19;">
                ${heading}
              </h2>
              <div style="font-size: 15px; color: #4A5568; margin-bottom: 28px;">
                ${bodyHtml}
              </div>

              <!-- Shop Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://wildaboutgreens.com/products" style="display: inline-block; background-color: #1C3F2D; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 9999px;">
                  Explore Fresh Greens →
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #E8E2D2; padding-top: 20px; text-align: center; color: #718096; font-size: 13px; line-height: 1.6;">
                <p style="margin: 0 0 8px;">${footerText}</p>
                <p style="margin: 8px 0 0; font-size: 11px; color: #A0AEC0;">
                  Wild About Greens • Urban Microgreens Farm • <a href="https://wildaboutgreens.com" style="color: #1C3F2D; text-decoration: underline;">wildaboutgreens.com</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: email,
      replyTo: 'info@wildaboutgreens.com',
      ...({ reply_to: 'info@wildaboutgreens.com' } as Record<string, string>),
      subject,
      html: htmlContent,
    });

    console.log(`Newsletter welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send newsletter welcome email to ${email}:`, error);
    return false;
  }
}
