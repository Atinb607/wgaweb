import { NextRequest } from 'next/server';
import { getUncachedSQL } from '@/lib/db';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const VALID_STATUSES = ['new', 'contacted', 'closed'];

// GET /api/admin/inquiries: list inquiries, optionally filtered by status
export async function GET(request: NextRequest) {
  try {
    const sql = getUncachedSQL();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let inquiries;
    if (status && VALID_STATUSES.includes(status)) {
      inquiries = await sql`
        SELECT * FROM business_inquiries
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      inquiries = await sql`
        SELECT * FROM business_inquiries
        ORDER BY created_at DESC
      `;
    }

    return adminJsonResponse(inquiries);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
