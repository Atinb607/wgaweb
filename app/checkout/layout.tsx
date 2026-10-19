import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Checkout',
    description: 'Complete your Wild About Greens order for fresh microgreens delivery in Tricity.',
    path: '/checkout',
    noIndex: true,
  });
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
