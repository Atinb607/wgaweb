import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import RecipeClient, { RecipeItem } from './RecipeClient';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Recipe Khazana · Fresh Microgreen Recipes',
    description:
      'Discover easy, delicious chef-crafted recipes using fresh microgreens, from vibrant salads and smoothies to everyday Indian meals, sandwiches and wraps.',
    path: '/recipes',
    imageAlt: 'Recipe Khazana · Fresh Microgreen Recipes',
  });
}

async function getRecipes(): Promise<RecipeItem[]> {
  try {
    const sql = getSQL();
    const posts = await sql`
      SELECT id, slug, title, excerpt, cover_image_url, cover_image_alt_text, post_type, published_at, recipe_categories
      FROM blog_posts
      WHERE is_published = true AND post_type = 'recipe'
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    `;
    return posts as unknown as RecipeItem[];
  } catch (err) {
    console.error('Error fetching recipes:', err);
    return [];
  }
}

async function getCategories(): Promise<string[]> {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT DISTINCT trim(cat) AS category
      FROM (
        SELECT unnest(recipe_categories) AS cat
        FROM blog_posts
        WHERE is_published = true AND post_type = 'recipe' AND recipe_categories IS NOT NULL
      ) sub
      WHERE cat IS NOT NULL AND trim(cat) != ''
      ORDER BY category ASC
    `;
    return (rows as unknown as { category: string }[]).map((r) => r.category);
  } catch (err) {
    console.error('Error fetching recipe categories:', err);
    return [];
  }
}

async function getContentMap(): Promise<Record<string, string>> {
  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page IN ('recipes', 'recipe', 'recipe-khazana')
      ORDER BY (page = 'recipes') ASC, (page = 'recipe') ASC
    `;
    const map: Record<string, string> = {};
    for (const b of blocks as unknown as { key: string; value: string }[]) {
      map[b.key] = b.value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching recipe content blocks:', err);
    return {};
  }
}

export default async function RecipePage() {
  const [recipes, categories, content] = await Promise.all([
    getRecipes(),
    getCategories(),
    getContentMap(),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Recipes', path: '/recipes' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <RecipeClient
        recipes={recipes}
        categories={categories}
        content={content}
      />
    </>
  );
}
