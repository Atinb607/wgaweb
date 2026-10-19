import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateProducts } from '@/lib/revalidate';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json();

    const { label, net_weight_grams, price_paise, stock_qty, is_active } = body;

    const result = await sql`
      UPDATE product_variants
      SET
        label            = COALESCE(${label ?? null}, label),
        net_weight_grams = COALESCE(${net_weight_grams ?? null}, net_weight_grams),
        price_paise      = COALESCE(${price_paise ?? null}, price_paise),
        stock_qty        = COALESCE(${stock_qty ?? null}, stock_qty),
        is_active        = COALESCE(${is_active ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    revalidateProducts();
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update variant error:', error);
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
      UPDATE product_variants
      SET is_active = false
      WHERE id = ${id}
      RETURNING id, label, is_active
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    revalidateProducts();
    return NextResponse.json({ message: 'Variant deactivated', variant: result[0] });
  } catch (error: unknown) {
    console.error('admin delete variant error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
