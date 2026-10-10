import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSQL } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendBulkOrderNotification } from '@/lib/email';

const TICKET_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateTicketNumber(): string {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += TICKET_CHARS[bytes[i] % TICKET_CHARS.length];
  }
  return `BOR-${code}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per 10 minutes per IP
    const rateLimited = await checkRateLimit(request, 'bulk-order', 5, 600);
    if (rateLimited) return rateLimited;

    const body = await request.json();

    const customerName = (body.customer_name || body.name || '').trim();
    const customerEmail = (body.customer_email || body.email || '').trim().toLowerCase();
    const customerPhone = (body.customer_phone || body.phone || '').trim();
    const traysRaw = body.trays_count ?? body.trays ?? body.number_of_trays;
    const traysCount = parseInt(String(traysRaw), 10);

    let products = '';
    if (Array.isArray(body.products)) {
      products = body.products.map((p: unknown) => String(p).trim()).filter(Boolean).join(', ');
    } else if (typeof body.products === 'string') {
      products = body.products.trim();
    }

    const businessName = (body.business_name || body.company_name || '').trim();
    const deliveryAddress = (body.delivery_address || body.address || '').trim();
    const deliveryPincode = (body.delivery_pincode || body.pincode || '').trim();
    const frequency = (body.frequency || 'one-time').trim();
    const notes = (body.notes || body.message || '').trim();

    // Validation
    if (!customerName) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (customerName.length > 200) {
      return NextResponse.json({ error: 'Name is too long (max 200 characters).' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Please enter your email address.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail) || customerEmail.length > 254) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!customerPhone) {
      return NextResponse.json({ error: 'Please enter your phone number.' }, { status: 400 });
    }
    const phoneClean = customerPhone.replace(/[^\d+]/g, '');
    if (phoneClean.length < 7 || phoneClean.length > 20) {
      return NextResponse.json({ error: 'Please enter a valid phone number (at least 7 digits).' }, { status: 400 });
    }

    if (!traysCount || isNaN(traysCount) || traysCount < 1) {
      return NextResponse.json({ error: 'Please enter a valid number of trays (minimum 1).' }, { status: 400 });
    }
    if (traysCount > 10000) {
      return NextResponse.json({ error: 'Tray quantity exceeds standard bulk limit. Please contact us directly for enterprise contracts.' }, { status: 400 });
    }

    if (!products) {
      return NextResponse.json({ error: 'Please specify the microgreen products or varieties you want.' }, { status: 400 });
    }
    if (products.length > 2000) {
      return NextResponse.json({ error: 'Products list is too long.' }, { status: 400 });
    }

    const sql = getSQL();

    // Ensure table exists safety
    await sql`
      CREATE TABLE IF NOT EXISTS bulk_order_requests (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number    text UNIQUE NOT NULL,
        customer_name    text NOT NULL,
        customer_email   text NOT NULL,
        customer_phone   text NOT NULL,
        trays_count      integer NOT NULL,
        products         text NOT NULL,
        business_name    text,
        delivery_address text,
        delivery_pincode text,
        frequency        text DEFAULT 'one-time',
        notes            text,
        status           text NOT NULL DEFAULT 'new',
        admin_notes      text,
        created_at       timestamptz DEFAULT now(),
        updated_at       timestamptz DEFAULT now()
      )
    `;

    let insertedRow;
    let ticketNumber = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      ticketNumber = generateTicketNumber();
      try {
        const rows = await sql`
          INSERT INTO bulk_order_requests (
            ticket_number,
            customer_name,
            customer_email,
            customer_phone,
            trays_count,
            products,
            business_name,
            delivery_address,
            delivery_pincode,
            frequency,
            notes,
            status
          ) VALUES (
            ${ticketNumber},
            ${customerName},
            ${customerEmail},
            ${customerPhone},
            ${traysCount},
            ${products},
            ${businessName || null},
            ${deliveryAddress || null},
            ${deliveryPincode || null},
            ${frequency || 'one-time'},
            ${notes || null},
            'new'
          )
          RETURNING *
        `;
        insertedRow = rows[0];
        break;
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
          continue; // collision retry
        }
        throw err;
      }
    }

    if (!insertedRow) {
      return NextResponse.json({ error: 'Failed to record bulk order request. Please try again.' }, { status: 500 });
    }

    // Fire email notification to admin asynchronously
    sendBulkOrderNotification({
      id: insertedRow.id as string,
      ticket_number: ticketNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      trays_count: traysCount,
      products,
      business_name: businessName || null,
      delivery_address: deliveryAddress || null,
      delivery_pincode: deliveryPincode || null,
      frequency: frequency || null,
      notes: notes || null,
    }).catch((err) => console.error('Bulk order notification failed:', err));

    return NextResponse.json(
      {
        success: true,
        ticket_number: ticketNumber,
        message: 'Your bulk order request has been submitted successfully! Our harvest team will contact you shortly.',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('bulk order submission error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
