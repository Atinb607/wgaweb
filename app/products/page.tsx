import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import { getOrderedActiveCategories } from '@/lib/categoryServer';
import ProductListClient from './ProductListClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Microgreens · Wild About Greens',
  description: 'Browse our range of fresh microgreen trays, including broccoli, sunflower, radish and bundles. Cut to order, delivered fresh to your doorstep on harvest morning.',
  openGraph: {
    title: 'Shop Microgreens · Wild About Greens',
    description: 'Browse our range of fresh microgreen trays, including broccoli, sunflower, radish and bundles. Cut to order, delivered on harvest morning.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Microgreens · Wild About Greens',
    description: 'Browse our range of fresh microgreen trays. Cut to order, delivered on harvest morning.',
  },
};

export interface Variant {
  id: string;
  product_id: string;
  label: string;
  net_weight_grams?: number;
  price_paise: number;
  stock_qty: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  alt_text?: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  health_goals?: string[];
  category_orders?: Record<string, number> | null;
  display_order?: number;
  description: string;
  nutrition_notes: string | null;
  thumbnail_url: string | null;
  thumbnail_alt_text?: string | null;
  tags: string[];
  badge_label?: string | null;
  highlight_1?: string | null;
  highlight_2?: string | null;
  is_bundle: boolean;
  variants: Variant[];
  images?: ProductImage[];
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  health_goals?: string[];
  category_orders?: Record<string, number> | null;
  display_order?: number;
  description: string;
  nutrition_notes: string | null;
  thumbnail_url: string | null;
  thumbnail_alt_text: string | null;
  tags: string[];
  badge_label?: string | null;
  highlight_1?: string | null;
  highlight_2?: string | null;
  is_bundle: boolean;
}

interface CategoryRow {
  category: string;
}

async function getProducts(): Promise<Product[]> {
  try {
    const sql = getSQL();
    const products = await sql`
      SELECT id, slug, name, categories, health_goals, category_orders, display_order, description, nutrition_notes,
             thumbnail_url, thumbnail_alt_text, tags, badge_label, highlight_1, highlight_2, is_bundle
      FROM products
      WHERE is_active = true
      ORDER BY display_order ASC, is_bundle ASC, created_at ASC
    `;
    const productList = products as unknown as ProductRow[];
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
    console.error('Error fetching products for PLP:', err);
    return [];
  }
}

async function getCategories(): Promise<string[]> {
  return getOrderedActiveCategories();
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

export interface WhyChoosePin {
  id: string;
  group_key: string;
  icon: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  display_order: number;
}

export interface Review {
  id: string;
  product_id: string | null;
  reviewer_name: string;
  reviewer_location: string | null;
  review_text: string;
  rating: number;
  display_order: number;
  is_active: boolean;
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
      WHERE is_active = true
      ORDER BY display_order ASC, created_at ASC
    `;
    return reviews as unknown as Review[];
  } catch (err) {
    console.error('Error fetching reviews for PLP:', err);
    return [];
  }
}

export default async function ProductsPage() {
  const [products, categories, content, whyChoosePins, reviews, samplerVariant] = await Promise.all([
    getProducts(),
    getCategories(),
    getContentMap(),
    getWhyChoosePins(),
    getGlobalReviews(),
    getSamplerVariant(),
  ]);

  return (
    <ProductListClient
      initialProducts={products}
      initialCategories={categories}
      content={content}
      initialWhyChoosePins={whyChoosePins}
      reviews={reviews}
      samplerVariant={samplerVariant}
    />
  );
}


