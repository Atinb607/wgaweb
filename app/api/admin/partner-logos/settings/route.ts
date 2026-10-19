import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidatePartnerLogos } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// PUT /api/admin/partner-logos/settings: update section enabled toggle and text
export async function PUT(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { enabled, eyebrow, title, card_style, logo_size } = body;

    if (enabled !== undefined) {
      const val = enabled ? 'true' : 'false';
      await sql`
        INSERT INTO content_blocks (page, key, value_type, value, updated_at)
        VALUES ('homepage', 'homepage_partner_logos_enabled', 'string', ${val}, now())
        ON CONFLICT (page, key)
        DO UPDATE SET value = ${val}, updated_at = now()
      `;
    }

    if (eyebrow !== undefined) {
      await sql`
        INSERT INTO content_blocks (page, key, value_type, value, updated_at)
        VALUES ('homepage', 'homepage_partner_logos_eyebrow', 'string', ${eyebrow}, now())
        ON CONFLICT (page, key)
        DO UPDATE SET value = ${eyebrow}, updated_at = now()
      `;
    }

    if (title !== undefined) {
      await sql`
        INSERT INTO content_blocks (page, key, value_type, value, updated_at)
        VALUES ('homepage', 'homepage_partner_logos_title', 'string', ${title}, now())
        ON CONFLICT (page, key)
        DO UPDATE SET value = ${title}, updated_at = now()
      `;
    }

    if (card_style !== undefined) {
      await sql`
        INSERT INTO content_blocks (page, key, value_type, value, updated_at)
        VALUES ('homepage', 'homepage_partner_logos_card_style', 'string', ${card_style}, now())
        ON CONFLICT (page, key)
        DO UPDATE SET value = ${card_style}, updated_at = now()
      `;
    }

    if (logo_size !== undefined) {
      await sql`
        INSERT INTO content_blocks (page, key, value_type, value, updated_at)
        VALUES ('homepage', 'homepage_partner_logos_size', 'string', ${logo_size}, now())
        ON CONFLICT (page, key)
        DO UPDATE SET value = ${logo_size}, updated_at = now()
      `;
    }

    revalidatePartnerLogos();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('admin update partner logos settings error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
