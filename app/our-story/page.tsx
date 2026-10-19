import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import OurStoryClient from './OurStoryClient';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Our Story & Mission',
    description:
      'Learn how Wild About Greens grows 100% pesticide-free microgreens indoors using mineral RO water and non-GMO seeds to bring peak nutrition to Indian homes.',
    path: '/our-story',
    imageAlt: 'Our Story & Mission · Wild About Greens',
  });
}

async function getContentMap(): Promise<Record<string, string>> {
  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'our-story'
    `;
    const map: Record<string, string> = {};
    for (const b of blocks as unknown as { key: string; value: string }[]) {
      map[b.key] = b.value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching our-story content blocks:', err);
    return {};
  }
}
export interface SamplerVariantData {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  pricePaise: number;
  maxStock: number;
}

async function getSamplerVariant(): Promise<SamplerVariantData | null> {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT pv.id AS variant_id, p.slug AS product_slug, p.name AS product_name,
             pv.label AS variant_label, pv.price_paise, pv.stock_qty
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
      WHERE p.slug = 'classic-trio-bundle' AND p.is_active = true
      ORDER BY pv.price_paise ASC
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0] as unknown as {
      variant_id: string;
      product_slug: string;
      product_name: string;
      variant_label: string;
      price_paise: number;
      stock_qty: number;
    };
    return {
      variantId: r.variant_id,
      productSlug: r.product_slug,
      productName: r.product_name,
      variantLabel: r.variant_label,
      pricePaise: r.price_paise,
      maxStock: r.stock_qty,
    };
  } catch (err) {
    console.error('Error fetching sampler variant:', err);
    return null;
  }
}

export default async function OurStoryPage() {
  const [content, samplerVariant] = await Promise.all([
    getContentMap(),
    getSamplerVariant(),
  ]);
  return <OurStoryClient content={content} samplerVariant={samplerVariant} />;
}
