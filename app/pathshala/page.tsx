import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import PathshalaClient, { ArticleItem } from './PathshalaClient';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Pathshala · Microgreen Nutrition & Farming Guides',
    description:
      'Explore Pathshala by Wild About Greens: science-backed articles on microgreen nutrition, sulforaphane benefits, indoor vertical farming and healthy living.',
    path: '/pathshala',
    imageAlt: 'Pathshala · Microgreen Nutrition & Farming Guides',
  });
}

async function getArticles(): Promise<ArticleItem[]> {
  try {
    const sql = getSQL();
    const posts = await sql`
      SELECT id, slug, title, excerpt, cover_image_url, cover_image_alt_text, post_type, published_at, recipe_categories
      FROM blog_posts
      WHERE is_published = true AND post_type = 'article'
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    `;
    return posts as unknown as ArticleItem[];
  } catch (err) {
    console.error('Error fetching blog articles:', err);
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
        WHERE is_published = true AND post_type = 'article' AND recipe_categories IS NOT NULL
      ) sub
      WHERE cat IS NOT NULL AND trim(cat) != ''
      ORDER BY category ASC
    `;
    return (rows as unknown as { category: string }[]).map((r) => r.category);
  } catch (err) {
    console.error('Error fetching article categories:', err);
    return [];
  }
}

async function getContentMap(): Promise<Record<string, string>> {
  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page IN ('pathshala', 'blog')
      ORDER BY (page = 'pathshala') ASC
    `;
    const map: Record<string, string> = {};
    for (const b of blocks as unknown as { key: string; value: string }[]) {
      map[b.key] = b.value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching pathshala content blocks:', err);
    return {};
  }
}

export default async function PathshalaPage() {
  const [posts, categories, content] = await Promise.all([
    getArticles(),
    getCategories(),
    getContentMap(),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Pathshala', path: '/pathshala' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <PathshalaClient
        posts={posts}
        categories={categories}
        content={content}
      />
    </>
  );
}
