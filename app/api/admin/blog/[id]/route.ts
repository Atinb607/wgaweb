import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { revalidateBlogPosts } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// PUT /api/admin/blog/[id]: update a post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
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

    const ingredientsJson = recipe_ingredients !== undefined
      ? (Array.isArray(recipe_ingredients) ? JSON.stringify(recipe_ingredients) : null)
      : undefined;
    const stepsJson = recipe_method_steps !== undefined
      ? (Array.isArray(recipe_method_steps) ? JSON.stringify(recipe_method_steps) : null)
      : undefined;
    const categoriesArr = recipe_categories !== undefined
      ? (Array.isArray(recipe_categories) ? recipe_categories : [])
      : undefined;
    const cleanSeoTitle = typeof seo_title === 'string' && seo_title.trim() ? seo_title.trim() : null;
    const cleanSeoDescription = typeof seo_description === 'string' && seo_description.trim() ? seo_description.trim() : null;

    if (is_published === true) {
      let result;
      try {
        result = await sql`
          UPDATE blog_posts
          SET
            slug            = COALESCE(${slug ?? null}, slug),
            title           = COALESCE(${title ?? null}, title),
            excerpt         = COALESCE(${excerpt ?? null}, excerpt),
            content         = COALESCE(${content ?? null}, content),
            cover_image_url = COALESCE(${cover_image_url ?? null}, cover_image_url),
            cover_image_alt_text = CASE WHEN ${cover_image_alt_text !== undefined} THEN ${cover_image_alt_text ?? null} ELSE cover_image_alt_text END,
            post_type       = COALESCE(${post_type ?? null}, post_type),
            is_published    = true,
            published_at    = COALESCE(published_at, now()),
            show_on_homepage = COALESCE(${show_on_homepage ?? null}, show_on_homepage),
            recipe_ingredients = CASE WHEN ${ingredientsJson !== undefined} THEN ${ingredientsJson ?? null}::jsonb ELSE recipe_ingredients END,
            recipe_method_steps = CASE WHEN ${stepsJson !== undefined} THEN ${stepsJson ?? null}::jsonb ELSE recipe_method_steps END,
            recipe_prep_time = CASE WHEN ${recipe_prep_time !== undefined} THEN ${recipe_prep_time ?? null} ELSE recipe_prep_time END,
            recipe_cook_time = CASE WHEN ${recipe_cook_time !== undefined} THEN ${recipe_cook_time ?? null} ELSE recipe_cook_time END,
            recipe_difficulty = CASE WHEN ${recipe_difficulty !== undefined} THEN ${recipe_difficulty ?? null} ELSE recipe_difficulty END,
            recipe_serves = CASE WHEN ${recipe_serves !== undefined} THEN ${recipe_serves ?? null} ELSE recipe_serves END,
            recipe_categories = CASE WHEN ${categoriesArr !== undefined} THEN ${categoriesArr}::text[] ELSE recipe_categories END,
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
            UPDATE blog_posts
            SET
              slug            = COALESCE(${slug ?? null}, slug),
              title           = COALESCE(${title ?? null}, title),
              excerpt         = COALESCE(${excerpt ?? null}, excerpt),
              content         = COALESCE(${content ?? null}, content),
              cover_image_url = COALESCE(${cover_image_url ?? null}, cover_image_url),
              cover_image_alt_text = CASE WHEN ${cover_image_alt_text !== undefined} THEN ${cover_image_alt_text ?? null} ELSE cover_image_alt_text END,
              post_type       = COALESCE(${post_type ?? null}, post_type),
              is_published    = true,
              published_at    = COALESCE(published_at, now()),
              show_on_homepage = COALESCE(${show_on_homepage ?? null}, show_on_homepage),
              recipe_ingredients = CASE WHEN ${ingredientsJson !== undefined} THEN ${ingredientsJson ?? null}::jsonb ELSE recipe_ingredients END,
              recipe_method_steps = CASE WHEN ${stepsJson !== undefined} THEN ${stepsJson ?? null}::jsonb ELSE recipe_method_steps END,
              recipe_prep_time = CASE WHEN ${recipe_prep_time !== undefined} THEN ${recipe_prep_time ?? null} ELSE recipe_prep_time END,
              recipe_cook_time = CASE WHEN ${recipe_cook_time !== undefined} THEN ${recipe_cook_time ?? null} ELSE recipe_cook_time END,
              recipe_difficulty = CASE WHEN ${recipe_difficulty !== undefined} THEN ${recipe_difficulty ?? null} ELSE recipe_difficulty END,
              recipe_serves = CASE WHEN ${recipe_serves !== undefined} THEN ${recipe_serves ?? null} ELSE recipe_serves END,
              recipe_categories = CASE WHEN ${categoriesArr !== undefined} THEN ${categoriesArr}::text[] ELSE recipe_categories END
            WHERE id = ${id}
            RETURNING *
          `;
        } else {
          throw dbErr;
        }
      }
      if (result.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      revalidateBlogPosts(result[0]?.slug, result[0]?.post_type);
      return NextResponse.json(result[0]);
    } else {
      let result;
      try {
        result = await sql`
          UPDATE blog_posts
          SET
            slug            = COALESCE(${slug ?? null}, slug),
            title           = COALESCE(${title ?? null}, title),
            excerpt         = COALESCE(${excerpt ?? null}, excerpt),
            content         = COALESCE(${content ?? null}, content),
            cover_image_url = COALESCE(${cover_image_url ?? null}, cover_image_url),
            cover_image_alt_text = CASE WHEN ${cover_image_alt_text !== undefined} THEN ${cover_image_alt_text ?? null} ELSE cover_image_alt_text END,
            post_type       = COALESCE(${post_type ?? null}, post_type),
            is_published    = COALESCE(${is_published ?? null}, is_published),
            show_on_homepage = COALESCE(${show_on_homepage ?? null}, show_on_homepage),
            recipe_ingredients = CASE WHEN ${ingredientsJson !== undefined} THEN ${ingredientsJson ?? null}::jsonb ELSE recipe_ingredients END,
            recipe_method_steps = CASE WHEN ${stepsJson !== undefined} THEN ${stepsJson ?? null}::jsonb ELSE recipe_method_steps END,
            recipe_prep_time = CASE WHEN ${recipe_prep_time !== undefined} THEN ${recipe_prep_time ?? null} ELSE recipe_prep_time END,
            recipe_cook_time = CASE WHEN ${recipe_cook_time !== undefined} THEN ${recipe_cook_time ?? null} ELSE recipe_cook_time END,
            recipe_difficulty = CASE WHEN ${recipe_difficulty !== undefined} THEN ${recipe_difficulty ?? null} ELSE recipe_difficulty END,
            recipe_serves = CASE WHEN ${recipe_serves !== undefined} THEN ${recipe_serves ?? null} ELSE recipe_serves END,
            recipe_categories = CASE WHEN ${categoriesArr !== undefined} THEN ${categoriesArr}::text[] ELSE recipe_categories END,
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
            UPDATE blog_posts
            SET
              slug            = COALESCE(${slug ?? null}, slug),
              title           = COALESCE(${title ?? null}, title),
              excerpt         = COALESCE(${excerpt ?? null}, excerpt),
              content         = COALESCE(${content ?? null}, content),
              cover_image_url = COALESCE(${cover_image_url ?? null}, cover_image_url),
              cover_image_alt_text = CASE WHEN ${cover_image_alt_text !== undefined} THEN ${cover_image_alt_text ?? null} ELSE cover_image_alt_text END,
              post_type       = COALESCE(${post_type ?? null}, post_type),
              is_published    = COALESCE(${is_published ?? null}, is_published),
              show_on_homepage = COALESCE(${show_on_homepage ?? null}, show_on_homepage),
              recipe_ingredients = CASE WHEN ${ingredientsJson !== undefined} THEN ${ingredientsJson ?? null}::jsonb ELSE recipe_ingredients END,
              recipe_method_steps = CASE WHEN ${stepsJson !== undefined} THEN ${stepsJson ?? null}::jsonb ELSE recipe_method_steps END,
              recipe_prep_time = CASE WHEN ${recipe_prep_time !== undefined} THEN ${recipe_prep_time ?? null} ELSE recipe_prep_time END,
              recipe_cook_time = CASE WHEN ${recipe_cook_time !== undefined} THEN ${recipe_cook_time ?? null} ELSE recipe_cook_time END,
              recipe_difficulty = CASE WHEN ${recipe_difficulty !== undefined} THEN ${recipe_difficulty ?? null} ELSE recipe_difficulty END,
              recipe_serves = CASE WHEN ${recipe_serves !== undefined} THEN ${recipe_serves ?? null} ELSE recipe_serves END,
              recipe_categories = CASE WHEN ${categoriesArr !== undefined} THEN ${categoriesArr}::text[] ELSE recipe_categories END
            WHERE id = ${id}
            RETURNING *
          `;
        } else {
          throw dbErr;
        }
      }
      if (result.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      revalidateBlogPosts(result[0]?.slug, result[0]?.post_type);
      return NextResponse.json(result[0]);
    }
  } catch (error: unknown) {
    console.error('admin update blog post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/blog/[id]: hard delete a post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const result = await sql`
      DELETE FROM blog_posts
      WHERE id = ${id}
      RETURNING id, slug, post_type
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    revalidateBlogPosts(result[0]?.slug, result[0]?.post_type);
    return NextResponse.json({ success: true, deleted: id });
  } catch (error: unknown) {
    console.error('admin delete blog post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/admin/blog/[id]: get a single post for editing
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const result = await sql`
      SELECT * FROM blog_posts
      WHERE id = ${id}
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
