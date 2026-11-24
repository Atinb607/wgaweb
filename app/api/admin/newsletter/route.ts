import { NextRequest } from 'next/server';
import { getUncachedSQL } from '@/lib/db';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/admin/newsletter: list all newsletter subscribers
export async function GET() {
  try {
    const sql = getUncachedSQL();

    const subscribers = await sql`
      SELECT id, email, source, subscribed_at
      FROM newsletter_subscribers
      ORDER BY subscribed_at DESC
    `;

    return adminJsonResponse(subscribers);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/newsletter: delete a subscriber by id
export async function DELETE(request: NextRequest) {
  try {
    const sql = getUncachedSQL();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return adminJsonResponse({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM newsletter_subscribers
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return adminJsonResponse({ error: 'Subscriber not found' }, { status: 404 });
    }

    return adminJsonResponse({ success: true, id: result[0].id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
