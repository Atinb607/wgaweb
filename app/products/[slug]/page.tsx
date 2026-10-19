import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getSQL } from '@/lib/db';
import ProductDetailClient from './ProductDetailClient';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, buildBreadcrumbJsonLd, buildPageMetadata, truncate } from '@/lib/seo';

export const revalidate = 60;

export interface Variant {
  id: string;
  product_id: string;
  label: string;
  net_weight_grams: number;
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

export interface HighlightBadge {
  icon: string;
  label: string;
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

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface DetailAccordion {
  title: string;
  content: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  description: string;
  description_lead?: string | null;
  description_highlight?: string | null;
  nutrition_notes: string | null;
  thumbnail_url: string | null;
  thumbnail_alt_text?: string | null;
  tags: string[];
  badge_label?: string | null;
  highlight_1?: string | null;
  highlight_2?: string | null;
  is_bundle: boolean;
  variants: Variant[];
  images: ProductImage[];
  detail_highlight_badges?: HighlightBadge[] | null;
  faqs?: ProductFAQ[] | null;
  detail_accordions?: DetailAccordion[] | null;
  pairs_well_with?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  description: string;
  thumbnail_url: string | null;
  thumbnail_alt_text?: string | null;
  price_paise: number;
  variant_id: string;
  highlight_1?: string | null;
  highlight_2?: string | null;
  badge_label?: string | null;
  is_bundle?: boolean;
}

export interface HatTrickVariantData {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  pricePaise: number;
  maxStock: number;
  thumbnailUrl: string | null;
}

export async function generateStaticParams() {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT slug
      FROM products
      WHERE is_active = true
    `;
    return (rows as unknown as { slug: string }[]).map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const sql = getSQL();
    const products = await sql`
      SELECT *
      FROM products
      WHERE slug = ${slug} AND is_active = true
      LIMIT 1
    `;
    if (products.length === 0) return null;
    const product = products[0];

    const variants = await sql`
      SELECT id, product_id, label, net_weight_grams, price_paise, stock_qty, is_active
      FROM product_variants
      WHERE product_id = ${product.id} AND is_active = true
      ORDER BY price_paise ASC
    `;

    const images = await sql`
      SELECT id, product_id, image_url, display_order, alt_text
      FROM product_images
      WHERE product_id = ${product.id}
      ORDER BY display_order ASC, created_at ASC
    `;

    return {
      ...product,
      variants,
      images,
    } as unknown as Product;
  } catch (err) {
    console.error('Error fetching product:', err);
    return null;
  }
});

function shuffleArray<T extends { id: string }>(array: T[]): T[] {
  if (array.length <= 1) return [...array];
  const shuffled = [...array];
  let attempts = 0;
  do {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    attempts++;
  } while (
    attempts < 5 &&
    shuffled.every((item, idx) => item.id === array[idx]?.id)
  );
  return shuffled;
}

async function getInventoryProducts(currentSlug: string): Promise<RelatedProduct[]> {
  try {
    const sql = getSQL();
    const products = await sql`
      SELECT p.id, p.slug, p.name, p.categories, p.description,
             COALESCE(
               p.thumbnail_url,
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1)
             ) as thumbnail_url,
             p.thumbnail_alt_text,
             p.highlight_1, p.highlight_2, p.badge_label, p.is_bundle,
             COALESCE(MIN(v.price_paise), 9900) as price_paise,
             COALESCE(MIN(v.id::text), '') as variant_id
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
      WHERE p.slug != ${currentSlug} AND p.is_active = true
      GROUP BY p.id, p.slug, p.name, p.categories, p.description, p.thumbnail_url, p.thumbnail_alt_text, p.highlight_1, p.highlight_2, p.badge_label, p.is_bundle, p.created_at
      ORDER BY p.created_at ASC
    `;
    return products as unknown as RelatedProduct[];
  } catch (err) {
    console.error('Error fetching inventory products:', err);
    return [];
  }
}

function getPairedProducts(allOther: RelatedProduct[], pairedIds?: string[] | null): RelatedProduct[] {
  const selected: RelatedProduct[] = [];
  if (Array.isArray(pairedIds) && pairedIds.length > 0) {
    for (const pid of pairedIds) {
      if (!pid) continue;
      const found = allOther.find((p) => p.id === pid || p.slug === pid);
      if (found && !selected.some((s) => s.id === found.id)) {
        selected.push(found);
      }
    }
  }
  for (const p of allOther) {
    if (selected.length >= 3) break;
    if (!selected.some((s) => s.id === p.id)) {
      selected.push(p);
    }
  }
  return selected;
}

async function getContentMap(): Promise<Record<string, string>> {
  try {
    const sql = getSQL();
    const blocks = await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'product-detail' OR page = 'product-listing'
      ORDER BY (CASE WHEN page = 'product-detail' THEN 1 ELSE 0 END) ASC
    `;
    const map: Record<string, string> = {};
    for (const b of blocks as unknown as { key: string; value: string }[]) {
      map[b.key] = b.value;
    }
    return map;
  } catch (err) {
    console.error('Error fetching content blocks:', err);
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

async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const sql = getSQL();
    const reviews = await sql`
      SELECT id, product_id, reviewer_name, reviewer_location, review_text, rating, display_order, is_active
      FROM product_reviews
      WHERE is_active = true AND (product_id = ${productId} OR product_id IS NULL)
      ORDER BY (CASE WHEN product_id = ${productId} THEN 0 ELSE 1 END), display_order ASC, created_at ASC
    `;
    return reviews as unknown as Review[];
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    return [];
  }
}

async function getHatTrickVariant(): Promise<HatTrickVariantData | null> {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT pv.id AS variant_id, p.slug AS product_slug, p.name AS product_name,
             COALESCE(
               p.thumbnail_url,
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1)
             ) AS thumbnail_url,
             pv.label AS variant_label, pv.price_paise, pv.stock_qty
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
      WHERE p.slug = 'hat-trick-pack' AND p.is_active = true
      ORDER BY pv.price_paise ASC
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0] as unknown as {
      variant_id: string;
      product_slug: string;
      product_name: string;
      thumbnail_url: string | null;
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
      maxStock: r.stock_qty || 20,
      thumbnailUrl: r.thumbnail_url,
    };
  } catch (err) {
    console.error('Error fetching hat-trick variant:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }
  const title = product.seo_title?.trim() || `${product.name} · Fresh Microgreens`;
  const combinedText = [product.description_lead, product.description, product.nutrition_notes]
    .filter(Boolean)
    .join(' ');
  const rawDescription =
    product.seo_description?.trim() ||
    combinedText ||
    `Shop ${product.name} from Wild About Greens: 100% pesticide-free living microgreens cut to order and delivered fresh in Chandigarh, Mohali and Panchkula.`;
  const description = truncate(rawDescription, 158);
  const coverImage = product.thumbnail_url || product.images?.[0]?.image_url || null;
  const coverAlt =
    product.thumbnail_alt_text?.trim() ||
    product.images?.[0]?.alt_text?.trim() ||
    `${product.name} · Fresh Microgreens Tray`;

  return buildPageMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image: coverImage,
    imageAlt: coverAlt,
  });
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const [allOtherProducts, content, reviews, whyChoosePins, hatTrickVariant] = await Promise.all([
    getInventoryProducts(params.slug),
    getContentMap(),
    getProductReviews(product.id),
    getWhyChoosePins(),
    getHatTrickVariant(),
  ]);

  const pairedProducts = getPairedProducts(allOtherProducts, product.pairs_well_with);
  const otherProducts = shuffleArray(allOtherProducts);

  const canonicalUrl = absoluteUrl(`/products/${product.slug}`);
  const activeVariants = (product.variants || []).filter((v) => v.is_active);
  const effectiveVariants = activeVariants.length > 0 ? activeVariants : product.variants || [];
  const hasStock = effectiveVariants.some((v) => (v.stock_qty ?? 0) > 0);
  const availability = hasStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const prices = effectiveVariants
    .map((v) => v.price_paise)
    .filter((p): p is number => typeof p === 'number' && p >= 0);

  let offersSchema: Record<string, unknown> | undefined;
  if (prices.length > 0) {
    const minPaise = Math.min(...prices);
    const maxPaise = Math.max(...prices);
    if (prices.length > 1 && minPaise !== maxPaise) {
      offersSchema = {
        '@type': 'AggregateOffer',
        priceCurrency: 'INR',
        lowPrice: (minPaise / 100).toFixed(2),
        highPrice: (maxPaise / 100).toFixed(2),
        offerCount: effectiveVariants.length,
        availability,
        url: canonicalUrl,
      };
    } else {
      offersSchema = {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: (minPaise / 100).toFixed(2),
        availability,
        url: canonicalUrl,
      };
    }
  }

  const imageUrls = Array.from(
    new Set(
      [
        product.thumbnail_url,
        ...(product.images || []).map((img) => img.image_url),
      ]
        .map((u) => (u ? u.trim() : ''))
        .filter(Boolean)
        .map((u) => absoluteUrl(u))
    )
  );

  const descParts = [product.description_lead, product.description, product.nutrition_notes]
    .map((s) => (s ? s.trim() : ''))
    .filter(Boolean)
    .join(' ');

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(descParts ? { description: descParts } : {}),
    ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Wild About Greens',
    },
    url: canonicalUrl,
    ...(offersSchema ? { offers: offersSchema } : {}),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: product.name, path: `/products/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductDetailClient
        key={product.id}
        product={product}
        pairedProducts={pairedProducts}
        otherProducts={otherProducts}
        relatedProducts={pairedProducts}
        content={content}
        reviews={reviews}
        initialWhyChoosePins={whyChoosePins}
        hatTrickVariant={hatTrickVariant}
      />
    </>
  );
}

