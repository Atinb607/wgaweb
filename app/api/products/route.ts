import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const goal = searchParams.get('goal') || searchParams.get('health_goal');

    // Fetch products, optionally filtered by category or goal
    let products;
    if (goal && goal !== 'all' && goal !== 'all-trays') {
      products = await sql`
        SELECT id, slug, name, categories, category_orders, display_order, health_goals, badge_label, highlight_1, highlight_2, description, nutrition_notes,
               thumbnail_url, thumbnail_alt_text, tags, is_bundle, is_active, created_at, pairs_well_with
        FROM products
        WHERE is_active = true AND ${goal} = ANY(health_goals)
        ORDER BY display_order ASC, created_at DESC
      `;
    } else if (category) {
      products = await sql`
        SELECT id, slug, name, categories, category_orders, display_order, health_goals, badge_label, highlight_1, highlight_2, description, nutrition_notes,
               thumbnail_url, thumbnail_alt_text, tags, is_bundle, is_active, created_at, pairs_well_with
        FROM products
        WHERE is_active = true AND ${category} = ANY(categories)
        ORDER BY COALESCE((category_orders->>${category})::int, display_order, 9999) ASC, created_at DESC
      `;
    } else {
      products = await sql`
        SELECT id, slug, name, categories, category_orders, display_order, health_goals, badge_label, highlight_1, highlight_2, description, nutrition_notes,
               thumbnail_url, thumbnail_alt_text, tags, is_bundle, is_active, created_at, pairs_well_with
        FROM products
        WHERE is_active = true
        ORDER BY display_order ASC, created_at DESC
      `;
    }

    // Fetch variants and images for the returned products
    const productIds = products.map((p) => p.id as string);
    let variants: Awaited<ReturnType<typeof sql>> = [];
    let images: Awaited<ReturnType<typeof sql>> = [];

    if (productIds.length > 0) {
      variants = await sql`
        SELECT pv.id, pv.product_id, pv.label, pv.net_weight_grams,
               pv.price_paise, pv.stock_qty, pv.is_active
        FROM product_variants pv
        WHERE pv.is_active = true AND pv.product_id = ANY(${productIds})
        ORDER BY pv.price_paise ASC
      `;

      images = await sql`
        SELECT id, product_id, image_url, display_order
        FROM product_images
        WHERE product_id = ANY(${productIds})
        ORDER BY display_order ASC, created_at ASC
      `;
    }

    // Nest variants under their products
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const pid = v.product_id as string;
      if (!variantsByProduct.has(pid)) {
        variantsByProduct.set(pid, []);
      }
      variantsByProduct.get(pid)!.push(v);
    }

    // Nest images under their products
    const imagesByProduct = new Map<string, typeof images>();
    for (const img of images) {
      const pid = img.product_id as string;
      if (!imagesByProduct.has(pid)) {
        imagesByProduct.set(pid, []);
      }
      imagesByProduct.get(pid)!.push(img);
    }

    const result = products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(p.id as string) || [],
      images: imagesByProduct.get(p.id as string) || [],
    }));

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
