import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSQL } from '@/lib/db';
import { getHealthGoalBySlug, HEALTH_GOALS } from '@/lib/healthGoals';
import HealthGoalClient from './HealthGoalClient';
import type { Product, Variant, ProductImage, WhyChoosePin, Review } from '@/app/products/page';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const goal = getHealthGoalBySlug(params.slug);
  if (!goal) {
    return {
      title: 'Health Goals · Wild About Greens',
      description: 'Fresh microgreens curated by health goal.',
    };
  }

  return {
    title: `${goal.title} · Fresh Microgreens | Wild About Greens`,
    description: goal.heroSubtitle,
    openGraph: {
      title: `${goal.title} · Fresh Microgreens | Wild About Greens`,
      description: goal.heroSubtitle,
      images: [{ url: goal.heroImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${goal.title} · Fresh Microgreens | Wild About Greens`,
      description: goal.heroSubtitle,
    },
  };
}

async function getProductsForGoal(goalSlug: string): Promise<Product[]> {
  try {
    const sql = getSQL();
    const goal = getHealthGoalBySlug(goalSlug);
    if (!goal) return [];

    const isAll = goal.id === 'all-trays' || goal.slug === 'all-trays';

    let productRows;
    if (isAll) {
      productRows = await sql`
        SELECT id, slug, name, categories, health_goals, description, nutrition_notes,
               thumbnail_url, thumbnail_alt_text, tags, badge_label, highlight_1, highlight_2, is_bundle
        FROM products
        WHERE is_active = true
        ORDER BY is_bundle ASC, created_at ASC
      `;
    } else {
      const aliases = [goal.id, goal.slug, ...goal.aliases];
      productRows = await sql`
        SELECT id, slug, name, categories, health_goals, description, nutrition_notes,
               thumbnail_url, thumbnail_alt_text, tags, badge_label, highlight_1, highlight_2, is_bundle
        FROM products
        WHERE is_active = true AND health_goals && ${aliases}::text[]
        ORDER BY is_bundle ASC, created_at ASC
      `;
    }

    const productList = productRows as unknown as (Product & { health_goals?: string[] })[];
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
    console.error('Error fetching products for health goal:', err);
    return [];
  }
}

async function getContentMap(): Promise<Record<string, string>> {
  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'product-listing'
    `;
    const map: Record<string, string> = {};
    for (const b of blocks as unknown as { key: string; value: string }[]) {
      map[b.key] = b.value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching product-listing content blocks:', err);
    return {};
  }
}

async function getWhyChoosePins(): Promise<WhyChoosePin[]> {
  try {
    const sql = getSQL();
    const pins = await sql`
      SELECT id, group_key, icon, title, description, image_url, link_url, display_order
      FROM content_pins
      WHERE group_key = 'product_listing_why_choose'
        AND is_active = true
      ORDER BY display_order ASC
    `;
    return pins as unknown as WhyChoosePin[];
  } catch (err) {
    console.error('Error fetching why choose pins:', err);
    return [];
  }
}

async function getGlobalReviews(): Promise<Review[]> {
  try {
    const sql = getSQL();
    const reviews = await sql`
      SELECT id, product_id, reviewer_name, reviewer_location, review_text, rating, display_order, is_active
      FROM product_reviews
      WHERE is_active = true AND product_id IS NULL
      ORDER BY display_order ASC, created_at ASC
    `;
    return reviews as unknown as Review[];
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  }
}

export default async function HealthGoalPage({ params }: PageProps) {
  const goal = getHealthGoalBySlug(params.slug);
  const targetSlug = goal ? goal.slug : params.slug;
  redirect(`/products/health-goals?goal=${encodeURIComponent(targetSlug)}`);
}
