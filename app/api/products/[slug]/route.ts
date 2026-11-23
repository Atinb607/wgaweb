import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const sql = getSQL();
    const { slug } = await Promise.resolve(params);

    const products = await sql`
      SELECT id, slug, name, categories, badge_label, highlight_1, highlight_2, description, description_lead, description_highlight, nutrition_notes,
             thumbnail_url, thumbnail_alt_text, tags, is_bundle, is_active, created_at, detail_highlight_badges, faqs, detail_accordions, pairs_well_with
      FROM products
      WHERE slug = ${slug} AND is_active = true
      LIMIT 1
    `;

    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];

    const variants = await sql`
      SELECT id, product_id, label, net_weight_grams,
             price_paise, stock_qty, is_active
      FROM product_variants
      WHERE product_id = ${product.id} AND is_active = true
      ORDER BY price_paise ASC
    `;

    const images = await sql`
      SELECT id, product_id, image_url, display_order
      FROM product_images
      WHERE product_id = ${product.id}
      ORDER BY display_order ASC, created_at ASC
    `;

    return NextResponse.json({ ...product, variants, images });
  } catch (error: unknown) {
    console.error('product detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
