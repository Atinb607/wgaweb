import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidatePartnerLogos } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// GET /api/admin/partner-logos: list all partner logos and settings
export async function GET() {
  try {
    const sql = getSQL();
    const logos = await sql`
      SELECT id, name, logo_url, website_url, display_order, is_active, created_at, updated_at
      FROM partner_logos
      ORDER BY display_order ASC, created_at ASC
    `;

    const settingsRows = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'homepage' AND key IN (
        'homepage_partner_logos_enabled',
        'homepage_partner_logos_eyebrow',
        'homepage_partner_logos_title'
      )
    `;

    const settings: Record<string, string> = {
      homepage_partner_logos_enabled: 'true',
      homepage_partner_logos_eyebrow: 'TRUSTED BY',
      homepage_partner_logos_title: 'Leading organizations choose wild about greens.',
    };

    for (const r of settingsRows as { key: string; value: string }[]) {
      settings[r.key] = r.value;
    }

    return NextResponse.json({ logos, settings });
  } catch (error: unknown) {
    console.error('admin fetch partner logos error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/partner-logos: create a partner logo
export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { name, logo_url, website_url, display_order, is_active } = body;

    if (!name || !logo_url) {
      return NextResponse.json({ error: 'Name and logo image are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO partner_logos (name, logo_url, website_url, display_order, is_active)
      VALUES (${name.trim()}, ${logo_url.trim()}, ${website_url ? website_url.trim() : null}, ${display_order ?? 0}, ${is_active ?? true})
      RETURNING *
    `;

    revalidatePartnerLogos();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create partner logo error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
