import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import BulkOrderClient from './BulkOrderClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bulk Orders & Commercial Supply · Wild About Greens',
  description:
    'Order fresh microgreens in bulk trays for restaurants, hotels, cafes, catering, and large events. Harvested fresh on indoor vertical racks.',
  openGraph: {
    title: 'Bulk Orders & Commercial Supply · Wild About Greens',
    description:
      'Order fresh microgreens in bulk trays for restaurants, hotels, cafes, and catering.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bulk Orders & Commercial Supply · Wild About Greens',
    description: 'Order fresh microgreens in bulk trays cut to order.',
  },
};

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
