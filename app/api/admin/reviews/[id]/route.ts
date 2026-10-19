import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateReviews } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const reviews = await sql`
      SELECT r.*, p.name AS product_name
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = ${id}
      LIMIT 1
    `;

    if (reviews.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(reviews[0]);
  } catch (error: unknown) {
    console.error('admin get review error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json();

    const {
      product_id,
      reviewer_name,
      reviewer_location,
      review_text,
      rating,
      display_order,
      is_active,
    } = body;

    const validProductId = product_id !== undefined
      ? (product_id && product_id.trim() !== '' ? product_id : null)
      : undefined;

    const numRating = rating !== undefined ? Math.max(1, Math.min(5, Number(rating) || 5)) : undefined;
    const numOrder = display_order !== undefined ? (Number(display_order) || 0) : undefined;

    const result = await sql`
      UPDATE product_reviews
      SET
        product_id        = CASE WHEN ${validProductId !== undefined} THEN ${validProductId} ELSE product_id END,
        reviewer_name     = COALESCE(${reviewer_name?.trim() ?? null}, reviewer_name),
        reviewer_location = CASE WHEN ${reviewer_location !== undefined} THEN ${reviewer_location?.trim() || null} ELSE reviewer_location END,
        review_text       = COALESCE(${review_text?.trim() ?? null}, review_text),
        rating            = COALESCE(${numRating ?? null}, rating),
        display_order     = COALESCE(${numOrder ?? null}, display_order),
        is_active         = COALESCE(${is_active ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = result[0];
    if (updated?.product_id) {
      try {
        const p = await sql`SELECT slug FROM products WHERE id = ${updated.product_id} LIMIT 1`;
        revalidateReviews(p[0]?.slug);
      } catch {
        revalidateReviews();
      }
    } else {
      revalidateReviews();
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('admin update review error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const result = await sql`
      DELETE FROM product_reviews
      WHERE id = ${id}
      RETURNING id, reviewer_name, product_id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const deleted = result[0];
    if (deleted?.product_id) {
      try {
        const p = await sql`SELECT slug FROM products WHERE id = ${deleted.product_id} LIMIT 1`;
        revalidateReviews(p[0]?.slug);
      } catch {
        revalidateReviews();
      }
    } else {
      revalidateReviews();
    }

    return NextResponse.json({ message: 'Review deleted', review: deleted });
  } catch (error: unknown) {
    console.error('admin delete review error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
