import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Contact Us · Customer Support & Farm Inquiries',
    description:
      'Get in touch with Wild About Greens for order support, subscription questions, bulk restaurant partnerships or feedback across Chandigarh, Mohali & Panchkula.',
    path: '/contact-us',
    imageAlt: 'Contact Wild About Greens',
  });
}

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
