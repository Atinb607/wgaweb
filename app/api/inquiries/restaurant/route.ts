import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { sendInquiryNotification } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 15 requests per IP per 10 minutes ──
    const rateLimited = await checkRateLimit(request, 'inquiries/restaurant', 15, 600);
    if (rateLimited) return rateLimited;

    const sql = getSQL();
    const body = await request.json();
    const { business_name, contact_name, phone, email, message } = body;

    if (!business_name || !contact_name || !phone) {
      return NextResponse.json(
        { error: 'business_name, contact_name, and phone are required' },
        { status: 400 }
      );
    }

    if (
      typeof business_name !== 'string' ||
      business_name.length > 200 ||
      typeof contact_name !== 'string' ||
      contact_name.length > 200 ||
      typeof phone !== 'string' ||
      phone.length > 20
    ) {
      return NextResponse.json({ error: 'Input fields are too long' }, { status: 400 });
    }

    if (email && (typeof email !== 'string' || email.length > 254)) {
      return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    }

    if (message && (typeof message !== 'string' || message.length > 2000)) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO business_inquiries (business_name, contact_name, phone, email, message)
      VALUES (${business_name}, ${contact_name}, ${phone}, ${email || null}, ${message || null})
      RETURNING id
    `;

    // Notify Gaurav about the new inquiry (fire-and-forget)
    sendInquiryNotification({
      id: result[0].id as string,
      business_name,
      contact_name,
      phone,
      email: email || null,
      message: message || null,
    }).catch((err) =>
      console.error('Failed to send inquiry notification:', err)
    );

    return NextResponse.json(
      { message: 'Thank you for your inquiry! We will get back to you shortly.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('restaurant inquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
