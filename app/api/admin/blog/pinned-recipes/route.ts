import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateContentBlocks } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// GET /api/admin/blog/pinned-recipes
// Returns list of all recipes and the current 2 pinned recipe slugs for homepage
export async function GET() {
  try {
    const sql = getSQL();

    // 1. Fetch all published recipes (and drafts too, so admin can see all available recipes)
    const recipes = await sql`
      SELECT id, slug, title, is_published
      FROM blog_posts
      WHERE post_type = 'recipe'
      ORDER BY title ASC
    `;

    // 2. Fetch current pinned recipes from content_blocks
    const pinnedBlocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'homepage' AND key IN ('recipes_pinned_1', 'recipes_pinned_2')
    `;

    let pinned1 = '';
    let pinned2 = '';
    for (const b of pinnedBlocks as unknown as { key: string; value: string }[]) {
      if (b.key === 'recipes_pinned_1') pinned1 = b.value;
      if (b.key === 'recipes_pinned_2') pinned2 = b.value;
    }

    return NextResponse.json({
      recipes,
      pinned1,
      pinned2,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admin/blog/pinned-recipes
// Saves the 2 pinned recipe slugs for the homepage
export async function PUT(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { pinned1, pinned2 } = body;

    const p1 = (pinned1 || '').trim();
    const p2 = (pinned2 || '').trim();

    // Upsert into content_blocks for homepage
    await sql`
      INSERT INTO content_blocks (page, key, value, value_type, updated_at)
      VALUES
        ('homepage', 'recipes_pinned_1', ${p1}, 'text', now()),
        ('homepage', 'recipes_pinned_2', ${p2}, 'text', now())
      ON CONFLICT (page, key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;

    // Also update show_on_homepage flag in blog_posts so DB remains consistent
    const activeSlugs = [p1, p2].filter(Boolean);
    if (activeSlugs.length > 0) {
      await sql`
        UPDATE blog_posts
        SET show_on_homepage = (slug = ANY(${activeSlugs}))
        WHERE post_type = 'recipe'
      `;
    }

    revalidateContentBlocks('homepage');
    return NextResponse.json({
      success: true,
      pinned1: p1,
      pinned2: p2,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
