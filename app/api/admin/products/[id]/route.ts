import { NextRequest } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateProducts } from '@/lib/revalidate';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const products = await sql`
      SELECT *
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    if (products.length === 0) {
      return adminJsonResponse({ error: 'Product not found' }, { status: 404 });
    }

    const variants = await sql`
      SELECT *
      FROM product_variants
      WHERE product_id = ${id}
      ORDER BY price_paise ASC
    `;

    const images = await sql`
      SELECT id, product_id, image_url, display_order, cloudinary_public_id, alt_text, created_at
      FROM product_images
      WHERE product_id = ${id}
      ORDER BY display_order ASC, created_at ASC
    `;

    return adminJsonResponse({ ...products[0], variants, images });
  } catch (error: unknown) {
    console.error('admin get product error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
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

    const { slug, name, categories, category_orders, display_order, health_goals, badge_label, highlight_1, highlight_2, description, description_lead, description_highlight, nutrition_notes, is_bundle, is_active, thumbnail_url, thumbnail_alt_text, tags, detail_highlight_badges, faqs, detail_accordions, pairs_well_with, seo_title, seo_description } = body;

    const formattedTags = tags !== undefined
      ? (Array.isArray(tags)
          ? Array.from(new Set(tags.map((t: unknown) => String(t ?? '').trim().toLowerCase()).filter(Boolean))).slice(0, 10)
          : [])
      : null;
    const formattedHealthGoals = health_goals !== undefined ? (Array.isArray(health_goals) ? health_goals : []) : null;
    const badgesJson = detail_highlight_badges !== undefined && detail_highlight_badges !== null ? JSON.stringify(detail_highlight_badges) : null;
    const faqsJson = faqs !== undefined && faqs !== null ? JSON.stringify(faqs) : null;
    const accordionsJson = detail_accordions !== undefined && detail_accordions !== null ? JSON.stringify(detail_accordions) : null;
    const pairsJson = pairs_well_with !== undefined && pairs_well_with !== null ? JSON.stringify(pairs_well_with) : null;
    const categoryOrdersJson = category_orders !== undefined && category_orders !== null ? JSON.stringify(category_orders) : null;
    const cleanSeoTitle = typeof seo_title === 'string' && seo_title.trim() ? seo_title.trim() : null;
    const cleanSeoDescription = typeof seo_description === 'string' && seo_description.trim() ? seo_description.trim() : null;

    let result;
    try {
      result = await sql`
        UPDATE products
        SET
          slug            = COALESCE(${slug ?? null}, slug),
          name            = COALESCE(${name ?? null}, name),
          categories      = CASE WHEN ${categories !== undefined} THEN ${categories} ELSE categories END,
          category_orders = CASE WHEN ${category_orders !== undefined} THEN ${categoryOrdersJson}::jsonb ELSE category_orders END,
          display_order   = CASE WHEN ${display_order !== undefined} THEN ${typeof display_order === 'number' ? display_order : 0} ELSE display_order END,
          health_goals    = CASE WHEN ${health_goals !== undefined} THEN ${formattedHealthGoals} ELSE health_goals END,
          badge_label     = CASE WHEN ${badge_label !== undefined} THEN ${badge_label ?? null} ELSE badge_label END,
          highlight_1     = CASE WHEN ${highlight_1 !== undefined} THEN ${highlight_1 ?? null} ELSE highlight_1 END,
          highlight_2     = CASE WHEN ${highlight_2 !== undefined} THEN ${highlight_2 ?? null} ELSE highlight_2 END,
          description     = COALESCE(${description ?? null}, description),
          description_lead = CASE WHEN ${description_lead !== undefined} THEN ${description_lead ?? null} ELSE description_lead END,
          description_highlight = CASE WHEN ${description_highlight !== undefined} THEN ${description_highlight ?? null} ELSE description_highlight END,
          nutrition_notes = COALESCE(${nutrition_notes ?? null}, nutrition_notes),
          is_bundle       = COALESCE(${is_bundle ?? null}, is_bundle),
          is_active       = COALESCE(${is_active ?? null}, is_active),
          thumbnail_url   = CASE WHEN ${thumbnail_url !== undefined} THEN ${thumbnail_url ?? null} ELSE thumbnail_url END,
          thumbnail_alt_text = CASE WHEN ${thumbnail_alt_text !== undefined} THEN ${thumbnail_alt_text ?? null} ELSE thumbnail_alt_text END,
          tags            = CASE WHEN ${tags !== undefined} THEN ${formattedTags} ELSE tags END,
          detail_highlight_badges = CASE WHEN ${detail_highlight_badges !== undefined} THEN ${badgesJson}::jsonb ELSE detail_highlight_badges END,
          faqs            = CASE WHEN ${faqs !== undefined} THEN ${faqsJson}::jsonb ELSE faqs END,
          detail_accordions = CASE WHEN ${detail_accordions !== undefined} THEN ${accordionsJson}::jsonb ELSE detail_accordions END,
          pairs_well_with = CASE WHEN ${pairs_well_with !== undefined} THEN ${pairsJson}::jsonb ELSE pairs_well_with END,
          seo_title       = CASE WHEN ${seo_title !== undefined} THEN ${cleanSeoTitle} ELSE seo_title END,
          seo_description = CASE WHEN ${seo_description !== undefined} THEN ${cleanSeoDescription} ELSE seo_description END,
          updated_at      = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : '';
      if (msg.includes('seo_title') || msg.includes('seo_description') || msg.includes('updated_at')) {
        result = await sql`
          UPDATE products
          SET
            slug            = COALESCE(${slug ?? null}, slug),
            name            = COALESCE(${name ?? null}, name),
            categories      = CASE WHEN ${categories !== undefined} THEN ${categories} ELSE categories END,
            category_orders = CASE WHEN ${category_orders !== undefined} THEN ${categoryOrdersJson}::jsonb ELSE category_orders END,
            display_order   = CASE WHEN ${display_order !== undefined} THEN ${typeof display_order === 'number' ? display_order : 0} ELSE display_order END,
            health_goals    = CASE WHEN ${health_goals !== undefined} THEN ${formattedHealthGoals} ELSE health_goals END,
            badge_label     = CASE WHEN ${badge_label !== undefined} THEN ${badge_label ?? null} ELSE badge_label END,
            highlight_1     = CASE WHEN ${highlight_1 !== undefined} THEN ${highlight_1 ?? null} ELSE highlight_1 END,
            highlight_2     = CASE WHEN ${highlight_2 !== undefined} THEN ${highlight_2 ?? null} ELSE highlight_2 END,
            description     = COALESCE(${description ?? null}, description),
            description_lead = CASE WHEN ${description_lead !== undefined} THEN ${description_lead ?? null} ELSE description_lead END,
            description_highlight = CASE WHEN ${description_highlight !== undefined} THEN ${description_highlight ?? null} ELSE description_highlight END,
            nutrition_notes = COALESCE(${nutrition_notes ?? null}, nutrition_notes),
            is_bundle       = COALESCE(${is_bundle ?? null}, is_bundle),
            is_active       = COALESCE(${is_active ?? null}, is_active),
            thumbnail_url   = CASE WHEN ${thumbnail_url !== undefined} THEN ${thumbnail_url ?? null} ELSE thumbnail_url END,
            thumbnail_alt_text = CASE WHEN ${thumbnail_alt_text !== undefined} THEN ${thumbnail_alt_text ?? null} ELSE thumbnail_alt_text END,
            tags            = CASE WHEN ${tags !== undefined} THEN ${formattedTags} ELSE tags END,
            detail_highlight_badges = CASE WHEN ${detail_highlight_badges !== undefined} THEN ${badgesJson}::jsonb ELSE detail_highlight_badges END,
            faqs            = CASE WHEN ${faqs !== undefined} THEN ${faqsJson}::jsonb ELSE faqs END,
            detail_accordions = CASE WHEN ${detail_accordions !== undefined} THEN ${accordionsJson}::jsonb ELSE detail_accordions END,
            pairs_well_with = CASE WHEN ${pairs_well_with !== undefined} THEN ${pairsJson}::jsonb ELSE pairs_well_with END
          WHERE id = ${id}
          RETURNING *
        `;
      } else {
        throw dbErr;
      }
    }

    if (result.length === 0) {
      return adminJsonResponse({ error: 'Product not found' }, { status: 404 });
    }

    revalidateProducts(result[0]?.slug);
    return adminJsonResponse(result[0]);
  } catch (error: unknown) {
    console.error('admin update product error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
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
      UPDATE products
      SET is_active = false
      WHERE id = ${id}
      RETURNING id, name, slug, is_active
    `;

    if (result.length === 0) {
      return adminJsonResponse({ error: 'Product not found' }, { status: 404 });
    }

    revalidateProducts(result[0]?.slug);
    return adminJsonResponse({ message: 'Product deactivated', product: result[0] });
  } catch (error: unknown) {
    console.error('admin delete product error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
