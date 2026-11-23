import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';
import { isCanonicalHost, siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const requestHost =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    '';

  if (!isCanonicalHost(requestHost)) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/cart',
        '/checkout',
        '/order-confirmation',
        '/track-order',
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
