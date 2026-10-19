import { getSQL } from '@/lib/db';
import HomePageClient, { type ContentPin } from './HomePageClient';
import type { Metadata } from 'next';
import type { HealthGoalContentItem } from '@/app/[panelKey]/health-goals/page';
import type { Product, Variant, ProductImage } from '@/app/products/page';
import JsonLd from '@/components/JsonLd';
import {
  buildOrganizationJsonLd,
  buildPageMetadata,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_NAME,
  getSiteSettings,
} from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name || DEFAULT_SITE_NAME;
  const description = settings.default_meta_description || DEFAULT_META_DESCRIPTION;
  return buildPageMetadata({
    title: `${siteName} · Fresh Microgreens Delivered in Tricity`,
    description,
    path: '/',
    image: settings.default_og_image || DEFAULT_OG_IMAGE_PATH,
    imageAlt: settings.default_og_image_alt || `${siteName} · Fresh Microgreens Delivered in Tricity`,
    absoluteTitle: true,
  });
}

interface ContentBlock {
  key: string;
  value: string;
}

async function getContentMap(): Promise<Record<string, string>> {
  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'homepage'
    `;
    const map: Record<string, string> = {};
    for (const b of blocks as unknown as ContentBlock[]) {
      map[b.key] = b.value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching homepage content blocks:', err);
    return {};
  }
}

async function getPins(): Promise<ContentPin[]> {
  try {
    const sql = getSQL();
    const pins = await sql`
      SELECT id, icon, title, description, display_order
      FROM content_pins
      WHERE group_key = 'homepage_icon_strip'
        AND is_active = true
      ORDER BY display_order ASC
    `;
    return pins as unknown as ContentPin[];
  } catch (err) {
    console.error('Error fetching homepage pins:', err);
    return [];
  }
}

async function getHealthGoalsContent(): Promise<HealthGoalContentItem[]> {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT id, slug, title, tag, icon, subtitle, popup_title, popup_description, image_url, display_order, is_active
      FROM health_goals_content
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    return rows as unknown as HealthGoalContentItem[];
  } catch (err) {
    console.error('Error fetching health goals content:', err);
    return [];
  }
}

async function getActiveProducts(): Promise<(Product & { health_goals?: string[] })[]> {
  try {
    const sql = getSQL();
    const products = await sql`
      SELECT id, slug, name, categories, health_goals, badge_label, highlight_1, highlight_2,
             description, nutrition_notes, thumbnail_url, thumbnail_alt_text, is_bundle
      FROM products
      WHERE is_active = true
      ORDER BY is_bundle ASC, created_at ASC
    `;
    const productList = products as unknown as (Product & { health_goals?: string[] })[];
    if (productList.length === 0) return [];
    const productIds = productList.map((p) => p.id);

    const [variants, images] = await Promise.all([
      sql`
        SELECT id, product_id, label, net_weight_grams, price_paise, stock_qty, is_active
        FROM product_variants
        WHERE is_active = true AND product_id = ANY(${productIds})
        ORDER BY price_paise ASC
      `,
      sql`
        SELECT id, product_id, image_url, display_order, alt_text
        FROM product_images
        WHERE product_id = ANY(${productIds})
        ORDER BY display_order ASC, created_at ASC
      `,
    ]);

    const variantList = variants as unknown as Variant[];
    const imageList = images as unknown as ProductImage[];

    return productList.map((p) => ({
      ...p,
      variants: variantList.filter((v) => v.product_id === p.id),
      images: imageList.filter((img) => img.product_id === p.id),
    }));
  } catch (err) {
    console.error('Error fetching active products for homepage:', err);
    return [];
  }
}

async function getRecipeCount(): Promise<number> {
  try {
    const sql = getSQL();
    const result = await sql`
      SELECT COUNT(*)::int AS count
      FROM blog_posts
      WHERE is_published = true AND post_type = 'recipe'
    `;
    return (result[0] as unknown as { count: number }).count || 0;
  } catch (err) {
    console.error('Error fetching recipe count:', err);
    return 0;
  }
}

interface FeaturedRecipe {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
}

async function getFeaturedRecipes(contentMap?: Record<string, string>): Promise<FeaturedRecipe[]> {
  try {
    const sql = getSQL();
    const pinned1 = contentMap?.recipes_pinned_1?.trim() || contentMap?.homepage_pinned_recipe_1?.trim();
    const pinned2 = contentMap?.recipes_pinned_2?.trim() || contentMap?.homepage_pinned_recipe_2?.trim();

    if (pinned1 || pinned2) {
      const activeSlugs = [pinned1, pinned2].filter(Boolean) as string[];
      const posts = await sql`
        SELECT id, slug, title, excerpt
        FROM blog_posts
        WHERE is_published = true AND slug = ANY(${activeSlugs})
      `;

      const result: FeaturedRecipe[] = [];
      const postList = posts as unknown as FeaturedRecipe[];
      if (pinned1) {
        const p1 = postList.find((p) => p.slug === pinned1);
        if (p1) result.push(p1);
      }
      if (pinned2 && pinned2 !== pinned1) {
        const p2 = postList.find((p) => p.slug === pinned2);
        if (p2) result.push(p2);
      }

      if (result.length === 2) {
        return result;
      }

      if (result.length < 2) {
        const foundSlugs = result.map((r) => r.slug);
        const fillers = await sql`
          SELECT id, slug, title, excerpt
          FROM blog_posts
          WHERE is_published = true AND post_type = 'recipe'
            ${foundSlugs.length > 0 ? sql`AND slug != ALL(${foundSlugs})` : sql``}
          ORDER BY published_at DESC NULLS LAST, created_at DESC
          LIMIT ${2 - result.length}
        `;
        return [...result, ...(fillers as unknown as FeaturedRecipe[])];
      }

      return result.slice(0, 2);
    }

    const defaultPosts = await sql`
      SELECT id, slug, title, excerpt
      FROM blog_posts
      WHERE is_published = true AND post_type = 'recipe'
      ORDER BY (CASE WHEN show_on_homepage = true THEN 0 ELSE 1 END), published_at DESC NULLS LAST, created_at DESC
      LIMIT 2
    `;
    return defaultPosts as unknown as FeaturedRecipe[];
  } catch (err) {
    console.error('Error fetching featured recipes:', err);
    return [];
  }
}

export interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active: boolean;
}

async function getPartnerLogos(content: Record<string, string>): Promise<PartnerLogo[]> {
  if (content.homepage_partner_logos_enabled === 'false') {
    return [];
  }
  try {
    const sql = getSQL();
    const logos = await sql`
      SELECT id, name, logo_url, website_url, display_order, is_active
      FROM partner_logos
      WHERE is_active = true
      ORDER BY display_order ASC, created_at ASC
    `;
    return logos as unknown as PartnerLogo[];
  } catch (err) {
    console.error('Error fetching partner logos:', err);
    return [];
  }
}

export default async function HomePage() {
  const [
    content,
    dbPins,
    recipeCount,
    healthGoalsContent,
    allProducts,
    siteSettings,
  ] = await Promise.all([
    getContentMap(),
    getPins(),
    getRecipeCount(),
    getHealthGoalsContent(),
    getActiveProducts(),
    getSiteSettings(),
  ]);

  const [featuredRecipes, partnerLogos] = await Promise.all([
    getFeaturedRecipes(content),
    getPartnerLogos(content),
  ]);

  const orgJsonLd = buildOrganizationJsonLd(siteSettings);

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <HomePageClient
        content={content}
        dbPins={dbPins}
        recipeCount={recipeCount}
        featuredRecipes={featuredRecipes}
        initialHealthGoals={healthGoalsContent}
        allProducts={allProducts}
        partnerLogos={partnerLogos}
      />
    </>
  );
}
