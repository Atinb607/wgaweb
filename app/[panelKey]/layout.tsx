import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Wild About Greens Admin Panel',
  description: 'Wild About Greens Admin Panel',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function DynamicPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { panelKey: string };
}) {
  const secretSlug = process.env.ADMIN_PANEL_SLUG;

  // If ADMIN_PANEL_SLUG is not configured or does not match exactly,
  // return a standard 404 with no indication that an admin panel exists.
  if (!secretSlug || params.panelKey !== secretSlug) {
    notFound();
  }

  return <AdminLayoutClient panelKey={params.panelKey}>{children}</AdminLayoutClient>;
}
