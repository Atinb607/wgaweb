import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateContentPins } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// GET /api/admin/pins: list all pins, optionally filter by ?group_key=
export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const groupKey = request.nextUrl.searchParams.get('group_key');

    let pins;
    if (groupKey) {
      pins = await sql`
        SELECT * FROM content_pins
        WHERE group_key = ${groupKey}
        ORDER BY display_order ASC
      `;
    } else {
      pins = await sql`
        SELECT * FROM content_pins
        WHERE group_key NOT IN ('homepage_shop_by_goal', 'shop_by_health_goal', 'shop_by_goal')
        ORDER BY group_key ASC, display_order ASC
      `;
    }

    return NextResponse.json(pins);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/pins: create a pin
export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { group_key, icon, title, description, display_order, is_active, image_url, link_url } = body;

    if (!group_key || !title) {
      return NextResponse.json(
        { error: 'group_key and title are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO content_pins (group_key, icon, title, description, image_url, link_url, display_order, is_active)
      VALUES (${group_key}, ${icon || null}, ${title}, ${description || null}, ${image_url || null}, ${link_url || null}, ${display_order ?? 0}, ${is_active ?? true})
      RETURNING *
    `;

    revalidateContentPins();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create pin error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
