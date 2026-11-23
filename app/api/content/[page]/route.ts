import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/content/[page]: returns all content_blocks for a page as { key: value }
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ page: string }> | { page: string } }
) {
  try {
    const sql = getSQL();
    const { page } = await Promise.resolve(params);

    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = ${page}
    `;

    const result: Record<string, string> = {};
    for (const b of blocks) {
      result[b.key as string] = b.value as string;
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
