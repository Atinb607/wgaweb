import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import BulkOrderClient from './BulkOrderClient';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Bulk Orders & Commercial Supply',
    description:
      'Partner with Wild About Greens for bulk and recurring microgreens supply for restaurants, cafes, hotels, cloud kitchens and events across Tricity.',
    path: '/bulk-order',
    imageAlt: 'Bulk Microgreens Orders · Wild About Greens',
  });
}

async function getActiveProducts(): Promise<{ name: string; slug: string }[]> {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT name, slug
      FROM products
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `;
    return rows.map((r) => ({
      name: r.name as string,
      slug: r.slug as string,
    }));
  } catch (err) {
    console.error('Error fetching products for bulk order page:', err);
    return [];
  }
}

export default async function BulkOrderPage() {
  const products = await getActiveProducts();

  return <BulkOrderClient initialProducts={products} />;
}
