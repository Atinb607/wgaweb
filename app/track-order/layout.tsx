import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Track Your Order',
    description: 'Track the harvest and delivery status of your Wild About Greens microgreens order.',
    path: '/track-order',
    noIndex: true,
  });
}

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
