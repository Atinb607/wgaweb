import { Resend } from 'resend';
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
              total_paise, purchase_type, subscription_frequency, created_at
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

  const fromEmail = process.env.FROM_EMAIL || 'wildaboutgreens@gmail.com';

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
        <!-- Brand Header -->
        <tr>
          <td style="background-color: #1C3F2D; padding: 28px 24px; text-align: center;">
            <p style="margin: 0; font-size: 11px; letter-spacing: 3px; color: #CFFA57; font-weight: 700; text-transform: uppercase;">
              FRESH HARVEST
            </p>
            <h1 style="margin: 6px 0 0; font-size: 22px; letter-spacing: 2px; color: #FFFFFF; font-weight: 800; text-transform: uppercase;">
              WILD ABOUT GREENS
            </h1>
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
  const fromEmail = process.env.FROM_EMAIL || 'wildaboutgreens@gmail.com';
  // Send to the business owner's email (FROM_EMAIL doubles as the admin inbox for MVP)
  const toEmail = process.env.FROM_EMAIL || 'wildaboutgreens@gmail.com';

  const resend = getResend();
  if (!resend) {
    console.warn(`Inquiry ${inquiry.id}: RESEND_API_KEY not configured, skipping notification email`);
    return false;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New Bulk Inquiry: ${inquiry.business_name}`,
      html: `
        <h2>New Restaurant / Bulk Inquiry</h2>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Business</td><td>${inquiry.business_name}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Contact</td><td>${inquiry.contact_name}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Phone</td><td>${inquiry.phone}</td></tr>
          ${inquiry.email ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Email</td><td>${inquiry.email}</td></tr>` : ''}
        </table>
        ${inquiry.message ? `<h3>Message</h3><p>${inquiry.message}</p>` : ''}
        <hr />
        <p style="color: #888; font-size: 12px;">Inquiry ID: ${inquiry.id}</p>
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
  const fromEmail = process.env.FROM_EMAIL || 'wildaboutgreens@gmail.com';
  const toEmail = process.env.FROM_EMAIL || 'wildaboutgreens@gmail.com';

  const resend = getResend();
  if (!resend) {
    console.warn(`Bulk Order ${req.ticket_number}: RESEND_API_KEY not configured, skipping notification email`);
    return false;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New Bulk Order Request: ${req.ticket_number} (${req.trays_count} Trays)`,
      html: `
        <h2>New Bulk Order Request: ${req.ticket_number}</h2>
        <table style="border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
          <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Ticket Number</td><td><strong>${req.ticket_number}</strong></td></tr>
          <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Customer Name</td><td>${req.customer_name}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Phone</td><td>${req.customer_phone}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Email</td><td>${req.customer_email}</td></tr>
          ${req.business_name ? `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Business Name</td><td>${req.business_name}</td></tr>` : ''}
          <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Trays Count</td><td><strong>${req.trays_count} trays</strong></td></tr>
          <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Products Requested</td><td>${req.products}</td></tr>
          ${req.frequency ? `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Order Frequency</td><td>${req.frequency}</td></tr>` : ''}
          ${req.delivery_address ? `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Delivery Address</td><td>${req.delivery_address}</td></tr>` : ''}
          ${req.delivery_pincode ? `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Pincode</td><td>${req.delivery_pincode}</td></tr>` : ''}
        </table>
        ${req.notes ? `<h3>Special Notes / Instructions</h3><p style="background: #f7f7f7; padding: 12px; border-radius: 8px;">${req.notes}</p>` : ''}
        <hr />
        <p style="color: #888; font-size: 12px;">Submitted via Wild About Greens Bulk Order portal.</p>
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

  const fromEmail = process.env.FROM_EMAIL || 'wildaboutgreens@gmail.com';

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

    const subject = contentMap.newsletter_thankyou_subject || 'Welcome to Wild About Greens!';
    const heading = contentMap.newsletter_thankyou_heading || 'Welcome to the Wild About Greens Family!';
    const bodyText = contentMap.newsletter_thankyou_body || "Hi there!\n\nWelcome to Wild About Greens, we're thrilled to have you with us.\n\nHere is your exclusive 15% discount for your first order: USE CODE: WELCOME15\n\nStay fresh,\nThe Wild About Greens Team";
    const footerText = contentMap.newsletter_thankyou_footer || 'Fresh harvest delivered straight from our indoor farm to your doorstep.';

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
          <!-- Header -->
          <tr>
            <td style="background-color: #1C3F2D; padding: 26px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 3px; color: #CFFA57; font-weight: 700; text-transform: uppercase;">
                FRESH HARVEST
              </p>
              <h1 style="margin: 6px 0 0; font-size: 20px; letter-spacing: 2px; color: #FFFFFF; font-weight: 800; text-transform: uppercase;">
                WILD ABOUT GREENS
              </h1>
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
