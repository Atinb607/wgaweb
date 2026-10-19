import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateBlogPosts } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// GET /api/admin/blog: list posts (published and drafts), optional ?type= filter
export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const type = request.nextUrl.searchParams.get('type');

    let posts;
    if (type) {
      posts = await sql`
        SELECT * FROM blog_posts
        WHERE post_type = ${type}
        ORDER BY created_at DESC
      `;
    } else {
      posts = await sql`
        SELECT * FROM blog_posts
        ORDER BY created_at DESC
      `;
    }
    return NextResponse.json(posts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/blog: create a post (article or recipe)
export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const {
      slug,
      title,
      excerpt,
      content,
      cover_image_url,
      cover_image_alt_text,
      is_published,
      post_type,
      show_on_homepage,
      recipe_ingredients,
      recipe_method_steps,
      recipe_prep_time,
      recipe_cook_time,
      recipe_difficulty,
      recipe_serves,
      recipe_categories,
      seo_title,
      seo_description,
    } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: 'slug, title, and content are required' },
        { status: 400 }
      );
    }

    const type = post_type === 'recipe' ? 'recipe' : 'article';
    const publishedAt = is_published ? new Date().toISOString() : null;

    const ingredientsJson = type === 'recipe' && Array.isArray(recipe_ingredients)
      ? JSON.stringify(recipe_ingredients)
      : null;
    const stepsJson = type === 'recipe' && Array.isArray(recipe_method_steps)
      ? JSON.stringify(recipe_method_steps)
      : null;
    const categoriesArr = Array.isArray(recipe_categories)
      ? recipe_categories.filter((c: string) => typeof c === 'string' && c.trim().length > 0)
      : [];
    const cleanSeoTitle = typeof seo_title === 'string' && seo_title.trim() ? seo_title.trim() : null;
    const cleanSeoDescription = typeof seo_description === 'string' && seo_description.trim() ? seo_description.trim() : null;

    let result;
    try {
      result = await sql`
        INSERT INTO blog_posts (
          slug, title, excerpt, content, cover_image_url, cover_image_alt_text,
          is_published, published_at, post_type, show_on_homepage,
          recipe_ingredients, recipe_method_steps, recipe_prep_time, recipe_cook_time,
          recipe_difficulty, recipe_serves, recipe_categories,
          seo_title, seo_description, updated_at
        )
        VALUES (
          ${slug}, ${title}, ${excerpt || null}, ${content}, ${cover_image_url || null}, ${cover_image_alt_text || null},
          ${is_published || false}, ${publishedAt}, ${type}, ${show_on_homepage || false},
          ${ingredientsJson}::jsonb, ${stepsJson}::jsonb,
          ${type === 'recipe' ? (recipe_prep_time || null) : null},
          ${type === 'recipe' ? (recipe_cook_time || null) : null},
          ${type === 'recipe' ? (recipe_difficulty || null) : null},
          ${type === 'recipe' ? (recipe_serves || null) : null},
          ${categoriesArr},
          ${cleanSeoTitle}, ${cleanSeoDescription}, NOW()
        )
        RETURNING *
      `;
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : '';
      if (msg.includes('seo_title') || msg.includes('seo_description') || msg.includes('updated_at')) {
        result = await sql`
          INSERT INTO blog_posts (
            slug, title, excerpt, content, cover_image_url, cover_image_alt_text,
            is_published, published_at, post_type, show_on_homepage,
            recipe_ingredients, recipe_method_steps, recipe_prep_time, recipe_cook_time,
            recipe_difficulty, recipe_serves, recipe_categories
          )
          VALUES (
            ${slug}, ${title}, ${excerpt || null}, ${content}, ${cover_image_url || null}, ${cover_image_alt_text || null},
            ${is_published || false}, ${publishedAt}, ${type}, ${show_on_homepage || false},
            ${ingredientsJson}::jsonb, ${stepsJson}::jsonb,
            ${type === 'recipe' ? (recipe_prep_time || null) : null},
            ${type === 'recipe' ? (recipe_cook_time || null) : null},
            ${type === 'recipe' ? (recipe_difficulty || null) : null},
            ${type === 'recipe' ? (recipe_serves || null) : null},
            ${categoriesArr}
          )
          RETURNING *
        `;
      } else {
        throw dbErr;
      }
    }

    revalidateBlogPosts(result[0]?.slug, result[0]?.post_type);
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('admin create blog post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'A post with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
