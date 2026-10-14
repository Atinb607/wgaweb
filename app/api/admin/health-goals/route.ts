import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT id, slug, title, tag, icon, subtitle, popup_title, popup_description, image_url, display_order, is_active, created_at, updated_at
      FROM health_goals_content
      ORDER BY display_order ASC
    `;
    return NextResponse.json(rows);
  } catch (error: unknown) {
    console.error('admin get health-goals error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/health-goals
 * Batch updates health goals display order and visibility.
 * Body: { goals: Array<{ id: string; slug?: string; display_order: number; is_active: boolean }> }
 */
export async function PUT(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();

    if (!body || !Array.isArray(body.goals)) {
      return NextResponse.json(
        { error: 'Invalid request body. "goals" array is required.' },
        { status: 400 }
      );
    }

    for (const g of body.goals) {
      const id = g.id || g.slug;
      const displayOrder = typeof g.display_order === 'number' ? g.display_order : 0;
      const isActive = Boolean(g.is_active);

      await sql`
        UPDATE health_goals_content
        SET
          display_order = ${displayOrder},
          is_active = ${isActive},
          updated_at = now()
        WHERE id = ${id} OR slug = ${id}
      `;
    }

    const refreshed = await sql`
      SELECT id, slug, title, tag, icon, subtitle, popup_title, popup_description, image_url, display_order, is_active, created_at, updated_at
      FROM health_goals_content
      ORDER BY display_order ASC
    `;

    return NextResponse.json({
      success: true,
      goals: refreshed,
      message: 'Health goal display order and visibility updated successfully.',
    });
  } catch (error: unknown) {
    console.error('admin batch update health-goals error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update health goals';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
