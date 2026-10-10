import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['new', 'contacted', 'in_progress', 'fulfilled', 'cancelled'];

// GET /api/admin/bulk-orders: list bulk order requests, optionally filtered by status & search
export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim().toLowerCase();
    const query = searchParams.get('q')?.trim().toLowerCase();

    // Ensure table exists
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

    let requests;

    if (status && VALID_STATUSES.includes(status)) {
      if (query) {
        const searchPattern = `%${query}%`;
        requests = await sql`
          SELECT * FROM bulk_order_requests
          WHERE status = ${status}
            AND (
              LOWER(customer_name) LIKE ${searchPattern}
              OR LOWER(customer_phone) LIKE ${searchPattern}
              OR LOWER(customer_email) LIKE ${searchPattern}
              OR LOWER(ticket_number) LIKE ${searchPattern}
              OR LOWER(COALESCE(business_name, '')) LIKE ${searchPattern}
              OR LOWER(products) LIKE ${searchPattern}
            )
          ORDER BY created_at DESC
        `;
      } else {
        requests = await sql`
          SELECT * FROM bulk_order_requests
          WHERE status = ${status}
          ORDER BY created_at DESC
        `;
      }
    } else {
      if (query) {
        const searchPattern = `%${query}%`;
        requests = await sql`
          SELECT * FROM bulk_order_requests
          WHERE (
            LOWER(customer_name) LIKE ${searchPattern}
            OR LOWER(customer_phone) LIKE ${searchPattern}
            OR LOWER(customer_email) LIKE ${searchPattern}
            OR LOWER(ticket_number) LIKE ${searchPattern}
            OR LOWER(COALESCE(business_name, '')) LIKE ${searchPattern}
            OR LOWER(products) LIKE ${searchPattern}
          )
          ORDER BY created_at DESC
        `;
      } else {
        requests = await sql`
          SELECT * FROM bulk_order_requests
          ORDER BY created_at DESC
        `;
      }
    }

    return NextResponse.json(requests);
  } catch (error: unknown) {
    console.error('admin get bulk orders error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
