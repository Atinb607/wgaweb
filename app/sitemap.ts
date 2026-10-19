import type { MetadataRoute } from 'next';
import { getSQL } from '@/lib/db';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

interface SitemapProductRow {
  slug: string;
  created_at: string | Date | null;
  updated_at?: string | Date | null;
}

interface SitemapPostRow {
  slug: string;
  post_type: string | null;
  published_at: string | Date | null;
  created_at: string | Date | null;
  updated_at?: string | Date | null;
}

function resolveDate(
  updatedAt?: string | Date | null,
  createdAt?: string | Date | null
): Date {
  const raw = updatedAt || createdAt;
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1.0 },
    { path: '/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/products/health-goals', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/our-story', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/bulk-order', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/pathshala', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/recipes', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/contact-us', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/policies', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/shipping-and-returns', changeFrequency: 'yearly', priority: 0.4 },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  if (!process.env.DATABASE_URL) {
    return entries;
  }

  try {
    const sql = getSQL();
    const [products, posts] = await Promise.all([
      sql`
        SELECT
          slug,
          created_at,
          to_jsonb(products)->>'updated_at' AS updated_at
        FROM products
        WHERE is_active = true
        ORDER BY created_at DESC
      `,
      sql`
        SELECT
          slug,
          post_type,
          published_at,
          created_at,
          to_jsonb(blog_posts)->>'updated_at' AS updated_at
        FROM blog_posts
        WHERE is_published = true
        ORDER BY published_at DESC NULLS LAST, created_at DESC
      `,
    ]);

    for (const p of products as unknown as SitemapProductRow[]) {
      if (!p.slug) continue;
      entries.push({
        url: absoluteUrl(`/products/${p.slug}`),
        lastModified: resolveDate(p.updated_at, p.created_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    for (const post of posts as unknown as SitemapPostRow[]) {
      if (!post.slug) continue;
      const prefix = post.post_type === 'recipe' ? '/recipes' : '/pathshala';
      entries.push({
        url: absoluteUrl(`${prefix}/${post.slug}`),
        lastModified: resolveDate(post.updated_at, post.created_at),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch (err) {
    console.error('Error building dynamic sitemap:', err);
  }

  return entries;
}
