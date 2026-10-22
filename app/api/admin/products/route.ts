import { NextRequest } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateProducts } from '@/lib/revalidate';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminProductRow {
  id: string;
  [key: string]: unknown;
}

interface AdminVariantRow {
  id: string;
  product_id: string;
  label: string;
  net_weight_grams: number | null;
  price_paise: number;
  stock_qty: number;
  is_active: boolean;
}

export async function GET() {
  try {
    const sql = getSQL();
    const products = await sql`
      SELECT *
      FROM products
      ORDER BY created_at DESC
    `;
    const productList = products as unknown as AdminProductRow[];
    if (productList.length === 0) {
      return adminJsonResponse([]);
    }

    const productIds = productList.map((p) => p.id);
    const variants = await sql`
      SELECT id, product_id, label, net_weight_grams, price_paise, stock_qty, is_active
      FROM product_variants
      WHERE product_id = ANY(${productIds})
      ORDER BY price_paise ASC
    `;
    const variantList = variants as unknown as AdminVariantRow[];

    const withVariants = productList.map((p) => ({
      ...p,
      variants: variantList.filter((v) => v.product_id === p.id),
    }));

    return adminJsonResponse(withVariants);
  } catch (error: unknown) {
    console.error('admin get products error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const cleaned = String(item ?? '').trim().toLowerCase();
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      out.push(cleaned);
      if (out.length >= 10) break;
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();

    const { slug, name, categories, category_orders, display_order, health_goals, badge_label, highlight_1, highlight_2, description, description_lead, description_highlight, nutrition_notes, is_bundle, thumbnail_url, thumbnail_alt_text, tags, detail_highlight_badges, faqs, detail_accordions, pairs_well_with, seo_title, seo_description } = body;

    if (!slug || !name || !categories || !Array.isArray(categories) || categories.length === 0) {
      return adminJsonResponse(
        { error: 'slug, name, and at least one category are required' },
        { status: 400 }
      );
    }

    const formattedCategoryOrders = category_orders && typeof category_orders === 'object'
      ? JSON.stringify(category_orders)
      : JSON.stringify({});
    const resolvedDisplayOrder = typeof display_order === 'number'
      ? display_order
      : (category_orders && categories[0] && typeof category_orders[categories[0]] === 'number'
          ? category_orders[categories[0]]
          : 0);

    const formattedHealthGoals = Array.isArray(health_goals) ? health_goals : [];
    const formattedTags = normalizeTags(tags);
    const formattedBadges = Array.isArray(detail_highlight_badges)
      ? JSON.stringify(detail_highlight_badges)
      : JSON.stringify([
          { icon: 'zap', label: '40x Sulforaphane' },
          { icon: 'shield', label: 'Immunity Booster' },
          { icon: 'droplet', label: 'Mineral Water' },
          { icon: 'scissors', label: 'Cut to Order' },
        ]);
    const formattedFaqs = Array.isArray(faqs) ? JSON.stringify(faqs) : JSON.stringify([]);
    const formattedAccordions = Array.isArray(detail_accordions) ? JSON.stringify(detail_accordions) : JSON.stringify([]);
    const formattedPairs = Array.isArray(pairs_well_with) ? JSON.stringify(pairs_well_with) : JSON.stringify([]);
    const cleanSeoTitle = typeof seo_title === 'string' && seo_title.trim() ? seo_title.trim() : null;
    const cleanSeoDescription = typeof seo_description === 'string' && seo_description.trim() ? seo_description.trim() : null;

    let result;
    try {
      result = await sql`
        INSERT INTO products (slug, name, categories, category_orders, display_order, health_goals, description, description_lead, description_highlight, nutrition_notes, is_bundle, thumbnail_url, thumbnail_alt_text, tags, badge_label, highlight_1, highlight_2, detail_highlight_badges, faqs, detail_accordions, pairs_well_with, seo_title, seo_description)
        VALUES (${slug}, ${name}, ${categories}, ${formattedCategoryOrders}::jsonb, ${resolvedDisplayOrder}, ${formattedHealthGoals}, ${description || null}, ${description_lead || null}, ${description_highlight || null}, ${nutrition_notes || null}, ${is_bundle || false}, ${thumbnail_url || null}, ${thumbnail_alt_text || null}, ${formattedTags}, ${badge_label || null}, ${highlight_1 || null}, ${highlight_2 || null}, ${formattedBadges}::jsonb, ${formattedFaqs}::jsonb, ${formattedAccordions}::jsonb, ${formattedPairs}::jsonb, ${cleanSeoTitle}, ${cleanSeoDescription})
        RETURNING *
      `;
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : '';
      if (msg.includes('seo_title') || msg.includes('seo_description') || msg.includes('updated_at')) {
        result = await sql`
          INSERT INTO products (slug, name, categories, category_orders, display_order, health_goals, description, description_lead, description_highlight, nutrition_notes, is_bundle, thumbnail_url, thumbnail_alt_text, tags, badge_label, highlight_1, highlight_2, detail_highlight_badges, faqs, detail_accordions, pairs_well_with)
          VALUES (${slug}, ${name}, ${categories}, ${formattedCategoryOrders}::jsonb, ${resolvedDisplayOrder}, ${formattedHealthGoals}, ${description || null}, ${description_lead || null}, ${description_highlight || null}, ${nutrition_notes || null}, ${is_bundle || false}, ${thumbnail_url || null}, ${thumbnail_alt_text || null}, ${formattedTags}, ${badge_label || null}, ${highlight_1 || null}, ${highlight_2 || null}, ${formattedBadges}::jsonb, ${formattedFaqs}::jsonb, ${formattedAccordions}::jsonb, ${formattedPairs}::jsonb)
          RETURNING *
        `;
      } else {
        throw dbErr;
      }
    }

    revalidateProducts(result[0]?.slug);
    return adminJsonResponse(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create product error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('unique') || message.includes('duplicate')) {
      return adminJsonResponse({ error: 'A product with that slug already exists' }, { status: 409 });
    }
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
