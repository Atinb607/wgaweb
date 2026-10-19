import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateCarousel } from '@/lib/revalidate';

// GET /api/admin/carousel: all slides, optionally filter by ?carousel_key=
export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const carouselKey = request.nextUrl.searchParams.get('carousel_key');

    let slides;
    if (carouselKey) {
      slides = await sql`
        SELECT * FROM carousel_slides
        WHERE carousel_key = ${carouselKey}
        ORDER BY display_order ASC
      `;
    } else {
      slides = await sql`
        SELECT * FROM carousel_slides
        ORDER BY carousel_key ASC, display_order ASC
      `;
    }

    return NextResponse.json(slides);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/carousel: create a slide
export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { image_url, link_url, display_order, is_active, carousel_key, cloudinary_public_id, alt_text } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO carousel_slides (image_url, link_url, display_order, is_active, carousel_key, cloudinary_public_id, alt_text)
      VALUES (${image_url}, ${link_url || null}, ${display_order ?? 0}, ${is_active ?? true}, ${carousel_key || 'homepage_hero'}, ${cloudinary_public_id ?? null}, ${alt_text || null})
      RETURNING *
    `;

    revalidateCarousel();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create carousel slide error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
