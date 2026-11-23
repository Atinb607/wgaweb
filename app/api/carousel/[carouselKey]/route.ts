import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/carousel/[carouselKey]: active slides for a specific carousel
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ carouselKey: string }> | { carouselKey: string } }
) {
  try {
    const sql = getSQL();
    const { carouselKey } = await Promise.resolve(params);

    const slides = await sql`
      SELECT id, image_url, link_url, display_order
      FROM carousel_slides
      WHERE carousel_key = ${carouselKey}
        AND is_active = true
      ORDER BY display_order ASC
    `;

    return NextResponse.json(slides);
  } catch (error: unknown) {
    console.error('carouselKey error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
