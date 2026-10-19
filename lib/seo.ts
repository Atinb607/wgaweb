import type { Metadata } from 'next';
import React from 'react';
import { getSQL } from '@/lib/db';

const safeCache = typeof (React as unknown as { cache?: <T extends (...args: unknown[]) => unknown>(fn: T) => T }).cache === 'function'
  ? (React as unknown as { cache: <T extends (...args: unknown[]) => unknown>(fn: T) => T }).cache
  : (<T extends (...args: unknown[]) => unknown>(fn: T): T => fn);

const DEFAULT_SITE_URL = 'https://wildaboutgreens.com';
export const DEFAULT_SITE_NAME = 'Wild About Greens';
export const DEFAULT_META_DESCRIPTION =
  'Fresh microgreens grown indoors with pure mineral RO water and zero pesticides. Cut to order and delivered fresh across Chandigarh, Mohali and Panchkula.';
export const DEFAULT_OG_IMAGE_PATH = '/trio-bundle-banner.png';

export interface SiteSettings {
  site_name: string;
  default_meta_description: string;
  default_og_image: string;
  default_og_image_alt: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  instagram_url: string;
  facebook_url: string;
}

export const getSiteSettings = safeCache(async (): Promise<SiteSettings> => {
  const defaults: SiteSettings = {
    site_name: DEFAULT_SITE_NAME,
    default_meta_description: DEFAULT_META_DESCRIPTION,
    default_og_image: '',
    default_og_image_alt: 'Wild About Greens · Fresh Microgreens Delivered in Tricity',
    business_phone: '+91 84272 54445',
    business_email: '',
    business_address: '',
    instagram_url: '',
    facebook_url: '',
  };

  if (!process.env.DATABASE_URL) {
    return defaults;
  }

  try {
    const sql = getSQL();
    const rows = (await sql`
      SELECT key, value
      FROM content_blocks
      WHERE page = 'site'
    `) as unknown as { key: string; value: string }[];

    const map: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && typeof row.value === 'string') {
        map[row.key] = row.value.trim();
      }
    }

    return {
      site_name: map.site_name || defaults.site_name,
      default_meta_description: map.default_meta_description || defaults.default_meta_description,
      default_og_image: map.default_og_image || defaults.default_og_image,
      default_og_image_alt: map.default_og_image_alt || defaults.default_og_image_alt,
      business_phone: map.business_phone || defaults.business_phone,
      business_email: map.business_email || '',
      business_address: map.business_address || '',
      instagram_url: map.instagram_url || '',
      facebook_url: map.facebook_url || '',
    };
  } catch {
    return defaults;
  }
});

/**
 * Returns the canonical base site URL without a trailing slash.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, '');
}

/**
 * Resolves a path or URL to an absolute canonical URL based on siteUrl().
 */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = siteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath === '/') {
    return base;
  }
  return `${base}${cleanPath}`;
}

/**
 * Normalizes a host string by taking the first host (if comma-separated),
 * trimming, lowercasing, and stripping any port and leading "www.".
 */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return '';
  return host
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

/**
 * Returns the normalized canonical hostname from NEXT_PUBLIC_SITE_URL,
 * falling back to "wildaboutgreens.com" if unset.
 */
export function getCanonicalHost(): string {
  try {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://wildaboutgreens.com';
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return normalizeHost(parsed.hostname);
  } catch {
    return 'wildaboutgreens.com';
  }
}

/**
 * Returns true if the provided host matches the canonical host.
 */
export function isCanonicalHost(requestHost?: string | null): boolean {
  if (!requestHost) return false;
  const canonical = getCanonicalHost();
  const req = normalizeHost(requestHost);
  return Boolean(canonical && req && canonical === req);
}

/**
 * Host-based indexing check:
 * Returns true if request host matches canonical host.
 * If no host is provided (build time / static contexts), returns true
 * so a missing env var can NEVER noindex the live site.
 */
export function isIndexingEnabled(requestHost?: string | null): boolean {
  if (requestHost !== undefined && requestHost !== null) {
    return isCanonicalHost(requestHost);
  }
  return true;
}

/**
 * Strips HTML tags, collapses whitespace, and truncates text to at most `n` characters
 * at a word boundary.
 */
export function truncate(text: string | null | undefined, n = 155): string {
  if (!text) return '';
  const clean = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= n) return clean;
  if (n <= 1) return clean.slice(0, Math.max(0, n));

  const maxSlice = n - 1;
  const sliced = clean.slice(0, maxSlice + 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const boundary = lastSpace > Math.floor(maxSlice * 0.5) ? sliced.slice(0, lastSpace) : sliced.slice(0, maxSlice);
  return `${boundary.replace(/[,;:\-–—.\s]+$/, '')}…`;
}

/**
 * Inserts "c_fill,w_1200,h_630,q_auto,f_jpg/" after "/upload/" for Cloudinary URLs.
 * Returns the URL unchanged if the pattern does not match.
 */
export function cloudinaryOgImage(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  const marker = '/upload/';
  const transform = 'c_fill,w_1200,h_630,q_auto,f_jpg/';

  if (!trimmed.includes('cloudinary.com') || !trimmed.includes(marker)) {
    return trimmed;
  }
  if (trimmed.includes(`${marker}${transform}`)) {
    return trimmed;
  }
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return trimmed;
  return (
    trimmed.slice(0, idx + marker.length) +
    transform +
    trimmed.slice(idx + marker.length)
  );
}

/**
 * Optimizes delivery of a Cloudinary image URL by inserting f_auto,q_auto (and optional width)
 * after "/upload/" if no transformation is present. Returns non-Cloudinary URLs unchanged.
 */
export function cloudinaryImage(url: string | null | undefined, width?: number): string {
  if (!url) return '';
  const trimmed = url.trim();
  const marker = '/upload/';
  if (!trimmed.includes('cloudinary.com') || !trimmed.includes(marker)) {
    return trimmed;
  }
  const idx = trimmed.indexOf(marker);
  const afterUpload = trimmed.slice(idx + marker.length);
  // Avoid double-transforming if transformations are already present before version/public_id
  if (/^(c_|w_|f_|q_|ar_|g_|e_)/.test(afterUpload)) {
    return trimmed;
  }
  const transform = width ? `f_auto,q_auto,w_${width}/` : 'f_auto,q_auto/';
  return trimmed.slice(0, idx + marker.length) + transform + afterUpload;
}

/**
 * Safe JSON-LD serializer: JSON.stringify then replace "<" with "\u003c"
 * to prevent script-tag breakout / XSS.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Parses human-readable duration strings (e.g. "5 minutes", "1 hour 10 minutes", "15 mins")
 * into ISO 8601 duration format (e.g. "PT5M", "PT1H10M"). Returns null if unparseable.
 */
export function parseIsoDuration(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  // Already valid ISO 8601 duration
  if (/^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/i.test(text) && text.length > 2) {
    return text.toUpperCase();
  }

  const lower = text.toLowerCase();
  let hours = 0;
  let minutes = 0;
  let matched = false;

  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/);
  if (hourMatch) {
    const hVal = parseFloat(hourMatch[1]);
    if (!Number.isNaN(hVal) && hVal >= 0) {
      hours += Math.floor(hVal);
      minutes += Math.round((hVal - Math.floor(hVal)) * 60);
      matched = true;
    }
  }

  const minMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|min|m)\b/);
  if (minMatch) {
    const mVal = parseInt(minMatch[1], 10);
    if (!Number.isNaN(mVal) && mVal >= 0) {
      minutes += mVal;
      matched = true;
    }
  }

  if (!matched) {
    return null;
  }

  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }

  if (hours === 0 && minutes === 0) {
    return null;
  }

  return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}`;
}

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  noIndex?: boolean;
  absoluteTitle?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  noIndex = false,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const rawImg = image?.trim() || DEFAULT_OG_IMAGE_PATH;
  const transformedImg = cloudinaryOgImage(rawImg);
  const ogImgUrl = /^https?:\/\//i.test(transformedImg)
    ? transformedImg
    : absoluteUrl(transformedImg);
  const resolvedAlt = (imageAlt && imageAlt.trim()) || title;

  // Normalize any long hyphens (em-dash — or en-dash –) to a clean middle dot separator
  const noLongHyphenTitle = title.replace(/\s*[—–]\s*/g, ' · ');
  const cleanTitle = noLongHyphenTitle.replace(/\s*\|\s*Wild About Greens$/i, '').trim();
  const fullSocialTitle = /Wild About Greens/i.test(noLongHyphenTitle)
    ? noLongHyphenTitle.trim()
    : `${cleanTitle} | ${DEFAULT_SITE_NAME}`;

  const allowIndex = !noIndex;

  return {
    title: absoluteTitle ? { absolute: noLongHyphenTitle.trim() } : cleanTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      siteName: DEFAULT_SITE_NAME,
      locale: 'en_IN',
      title: fullSocialTitle,
      description,
      url: canonical,
      images: [
        {
          url: ogImgUrl,
          width: 1200,
          height: 630,
          alt: resolvedAlt,
        },
      ],
      ...(type === 'article' && publishedTime
        ? { publishedTime: new Date(publishedTime).toISOString() }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullSocialTitle,
      description,
      images: [
        {
          url: ogImgUrl,
          alt: resolvedAlt,
        },
      ],
    },
    robots: allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function buildOrganizationJsonLd(settings: SiteSettings): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'Store'],
    name: settings.site_name || DEFAULT_SITE_NAME,
    url: siteUrl(),
    logo: absoluteUrl('/logo-white-bg.png'),
    areaServed: [
      { '@type': 'City', name: 'Chandigarh' },
      { '@type': 'City', name: 'Mohali' },
      { '@type': 'City', name: 'Panchkula' },
    ],
  };

  if (settings.business_phone?.trim()) {
    schema.telephone = settings.business_phone.trim();
  }
  if (settings.business_email?.trim()) {
    schema.email = settings.business_email.trim();
  }
  if (settings.business_address?.trim()) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: settings.business_address.trim(),
      addressCountry: 'IN',
    };
  }
  const sameAs = [settings.instagram_url, settings.facebook_url]
    .map((u) => (u ? u.trim() : ''))
    .filter(Boolean);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}


