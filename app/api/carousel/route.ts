import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/carousel: public: active slides sorted by display_order
export async function GET() {
  try {
    const sql = getSQL();
    const slides = await sql`
      SELECT id, image_url, link_url, display_order, alt_text
      FROM carousel_slides
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    return NextResponse.json(slides);
  } catch (error: unknown) {
    console.error('carousel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
