import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidatePartnerLogos } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// PUT /api/admin/partner-logos/[id]: update a partner logo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json();
    const { name, logo_url, website_url, display_order, is_active } = body;

    const result = await sql`
      UPDATE partner_logos
      SET
        name = COALESCE(${name !== undefined ? name.trim() : null}, name),
        logo_url = COALESCE(${logo_url !== undefined ? logo_url.trim() : null}, logo_url),
        website_url = CASE WHEN ${website_url !== undefined} THEN ${website_url ? website_url.trim() : null} ELSE website_url END,
        display_order = COALESCE(${display_order ?? null}, display_order),
        is_active = COALESCE(${is_active ?? null}, is_active),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Partner logo not found' }, { status: 404 });
    }

    revalidatePartnerLogos();
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update partner logo error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/partner-logos/[id]: delete a partner logo
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    await sql`
      DELETE FROM partner_logos
      WHERE id = ${id}
    `;

    revalidatePartnerLogos();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('admin delete partner logo error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
