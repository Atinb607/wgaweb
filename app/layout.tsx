import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { fontVariables } from '@/lib/fonts';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
import {
  absoluteUrl,
  cloudinaryOgImage,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_NAME,
  getSiteSettings,
  siteUrl,
} from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const base = siteUrl();
  const settings = await getSiteSettings();
  const siteName = settings.site_name || DEFAULT_SITE_NAME;
  const defaultDesc = settings.default_meta_description || DEFAULT_META_DESCRIPTION;
  const rawOgImg = settings.default_og_image || DEFAULT_OG_IMAGE_PATH;
  const transformedOgImg = cloudinaryOgImage(rawOgImg);
  const ogImageUrl = /^https?:\/\//i.test(transformedOgImg)
    ? transformedOgImg
    : absoluteUrl(transformedOgImg);
  const ogImageAlt =
    settings.default_og_image_alt || `${siteName} · Fresh Microgreens Delivered in Tricity`;
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return {
    metadataBase: new URL(base),
    title: {
      default: `${siteName} · Fresh Microgreens Delivered in Tricity`,
      template: `%s | ${siteName}`,
    },
    description: defaultDesc,
    openGraph: {
      type: 'website',
      siteName,
      locale: 'en_IN',
      title: `${siteName} · Fresh Microgreens Delivered in Tricity`,
      description: defaultDesc,
      url: base,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} · Fresh Microgreens Delivered in Tricity`,
      description: defaultDesc,
      images: [
        {
          url: ogImageUrl,
          alt: ogImageAlt,
        },
      ],
    },
    ...(googleVerification
      ? {
          verification: {
            google: googleVerification,
          },
        }
      : {}),
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/favicon.webp', type: 'image/webp', sizes: '64x64' },
        { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
        { url: '/favicon.ico', sizes: '32x32' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const allowGa = Boolean(gaId);

  return (
    <html lang="en-IN" className={fontVariables}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://plus.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://plus.unsplash.com" />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-white text-[#151F19] antialiased">
        <Header />
        <CartDrawer />
        <div className="flex-1">{children}</div>
        <Footer />
        <WhatsAppButton />
        {allowGa && gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
