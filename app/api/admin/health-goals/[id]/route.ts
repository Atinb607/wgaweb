import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateHealthGoals } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const rows = await sql`
      SELECT id, slug, title, tag, icon, subtitle, popup_title, popup_description, image_url, display_order, is_active, created_at, updated_at
      FROM health_goals_content
      WHERE id = ${id} OR slug = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Health goal not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: unknown) {
    console.error('admin get health-goal by id error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
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

    const {
      title,
      tag,
      icon,
      subtitle,
      popup_title,
      popup_description,
      image_url,
      display_order,
      is_active,
    } = body;

    const result = await sql`
      UPDATE health_goals_content
      SET
        title             = COALESCE(${title ?? null}, title),
        tag               = COALESCE(${tag ?? null}, tag),
        icon              = CASE WHEN ${icon !== undefined} THEN ${icon} ELSE icon END,
        subtitle          = COALESCE(${subtitle ?? null}, subtitle),
        popup_title       = COALESCE(${popup_title ?? null}, popup_title),
        popup_description = COALESCE(${popup_description ?? null}, popup_description),
        image_url         = CASE WHEN ${image_url !== undefined} THEN ${image_url ?? null} ELSE image_url END,
        display_order     = CASE WHEN ${display_order !== undefined} THEN ${display_order} ELSE display_order END,
        is_active         = CASE WHEN ${is_active !== undefined} THEN ${is_active} ELSE is_active END,
        updated_at        = now()
      WHERE id = ${id} OR slug = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Health goal not found' }, { status: 404 });
    }

    revalidateHealthGoals();
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update health-goal error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
