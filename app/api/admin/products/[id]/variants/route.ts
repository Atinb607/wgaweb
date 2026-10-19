import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateProducts } from '@/lib/revalidate';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const productId = params.id;
    const body = await request.json();

    const { label, net_weight_grams, price_paise, stock_qty } = body;

    if (!label || price_paise === undefined) {
      return NextResponse.json(
        { error: 'label and price_paise are required' },
        { status: 400 }
      );
    }

    // Check the product exists
    const product = await sql`
      SELECT id FROM products WHERE id = ${productId}
    `;
    if (product.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const result = await sql`
      INSERT INTO product_variants (product_id, label, net_weight_grams, price_paise, stock_qty)
      VALUES (${productId}, ${label}, ${net_weight_grams || null}, ${price_paise}, ${stock_qty || 0})
      RETURNING *
    `;

    revalidateProducts();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create variant error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
