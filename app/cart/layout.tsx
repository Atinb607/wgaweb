import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Your Shopping Cart',
    description: 'Review your selected fresh microgreen trays and weekly subscriptions before checkout.',
    path: '/cart',
    noIndex: true,
  });
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
