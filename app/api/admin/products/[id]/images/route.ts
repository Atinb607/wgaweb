import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateProducts } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id: productId } = params;
    const body = await request.json();

    const { image_url, display_order, cloudinary_public_id, alt_text } = body;

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 }
      );
    }

    const order = typeof display_order === 'number' ? display_order : 0;

    const result = await sql`
      INSERT INTO product_images (product_id, image_url, display_order, cloudinary_public_id, alt_text)
      VALUES (${productId}, ${image_url}, ${order}, ${cloudinary_public_id ?? null}, ${alt_text ?? null})
      RETURNING *
    `;

    revalidateProducts();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin add product image error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}