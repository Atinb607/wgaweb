import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateContentBlocks } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/content/[page]: read all blocks for a page (with full metadata)
export async function GET(
  _request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const sql = getSQL();
    const { page } = params;

    const blocks = await sql`
      SELECT id, page, key, value_type, value, updated_at
      FROM content_blocks
      WHERE page = ${page}
      ORDER BY key ASC
    `;

    return NextResponse.json(blocks, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/content/[page]: upsert content_blocks for a page
// Body: { blocks: [{ key, value, value_type? }] }
export async function PUT(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const sql = getSQL();
    const { page } = params;
    const { blocks } = await request.json();

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'blocks must be an array of { key, value, value_type? }' },
        { status: 400 }
      );
    }

    const results: unknown[] = [];
    for (const block of blocks) {
      const { key, value, value_type } = block;
      if (!key) continue;

      const result = await sql`
        INSERT INTO content_blocks (page, key, value, value_type, updated_at)
        VALUES (${page}, ${key}, ${value ?? ''}, ${value_type ?? 'text'}, now())
        ON CONFLICT (page, key)
        DO UPDATE SET
          value = EXCLUDED.value,
          value_type = EXCLUDED.value_type,
          updated_at = now()
        RETURNING *
      `;
      results.push(result[0]);
    }

    if (page === 'homepage') {
      const p1 = blocks.find((b: { key?: string; value?: string }) => b.key === 'recipes_pinned_1')?.value?.trim();
      const p2 = blocks.find((b: { key?: string; value?: string }) => b.key === 'recipes_pinned_2')?.value?.trim();
      const activeSlugs = [p1, p2].filter(Boolean) as string[];
      if (activeSlugs.length > 0) {
        await sql`
          UPDATE blog_posts
          SET show_on_homepage = (slug = ANY(${activeSlugs}))
          WHERE post_type = 'recipe'
        `;
      }
    }

    revalidateContentBlocks(page);
    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error('admin content upsert error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
