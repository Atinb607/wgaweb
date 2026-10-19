import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateReviews } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    let reviews;
    if (productId && productId !== 'all') {
      reviews = await sql`
        SELECT r.id, r.product_id, r.reviewer_name, r.reviewer_location, r.review_text,
               r.rating, r.display_order, r.is_active, r.created_at,
               p.name AS product_name
        FROM product_reviews r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.product_id = ${productId}
        ORDER BY r.display_order ASC, r.created_at ASC
      `;
    } else {
      reviews = await sql`
        SELECT r.id, r.product_id, r.reviewer_name, r.reviewer_location, r.review_text,
               r.rating, r.display_order, r.is_active, r.created_at,
               p.name AS product_name
        FROM product_reviews r
        LEFT JOIN products p ON r.product_id = p.id
        ORDER BY r.display_order ASC, r.created_at ASC
      `;
    }

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    console.error('admin get reviews error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();

    const {
      product_id,
      reviewer_name,
      reviewer_location,
      review_text,
      rating = 5,
      display_order = 0,
      is_active = true,
    } = body;

    if (!reviewer_name?.trim() || !review_text?.trim()) {
      return NextResponse.json(
        { error: 'reviewer_name and review_text are required' },
        { status: 400 }
      );
    }

    const validProductId = product_id && product_id.trim() !== '' ? product_id : null;
    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const numOrder = Number(display_order) || 0;

    const result = await sql`
      INSERT INTO product_reviews (
        product_id, reviewer_name, reviewer_location, review_text, rating, display_order, is_active
      )
      VALUES (
        ${validProductId},
        ${reviewer_name.trim()},
        ${reviewer_location?.trim() || null},
        ${review_text.trim()},
        ${numRating},
        ${numOrder},
        ${Boolean(is_active)}
      )
      RETURNING *
    `;

    const inserted = result[0];
    if (inserted?.product_id) {
      try {
        const p = await sql`SELECT slug FROM products WHERE id = ${inserted.product_id} LIMIT 1`;
        revalidateReviews(p[0]?.slug);
      } catch {
        revalidateReviews();
      }
    } else {
      revalidateReviews();
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (error: unknown) {
    console.error('admin create review error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
