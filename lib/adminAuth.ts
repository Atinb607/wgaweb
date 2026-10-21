'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';

/**
 * Client-side admin auth check. Calls /api/admin/stats to verify
 * the admin_token cookie is still valid. If not, redirects to /{panelKey}/login.
 */
export function useAdminAuth(panelKey?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Derive panelKey from params, explicit prop, or pathname (e.g. /my-secret-slug/products)
  const currentKey =
    (params?.panelKey as string) ||
    panelKey ||
    pathname.split('/').filter(Boolean)[0] ||
    'admin';
  const loginPath = `/${currentKey}/login`;

  useEffect(() => {
    // Don't check auth on the login page itself
    if (pathname.endsWith('/login')) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/stats', { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          setIsAuthed(true);
        } else {
          router.replace(loginPath);
        }
      })
      .catch(() => {
        router.replace(loginPath);
      })
      .finally(() => setLoading(false));
  }, [pathname, router, loginPath]);

  return { isAuthed, loading };
}

/** Wrapper for admin fetch calls: returns the response or redirects on 401 */
export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (res.status === 401 && typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const currentKey = segments[0] || 'admin';
    window.location.href = `/${currentKey}/login`;
  }
  return res;
}

const KNOWN_PUBLIC_PREFIXES = [
  '/products',
  '/cart',
  '/checkout',
  '/order-confirmation',
  '/track-order',
  '/bulk-order',
  '/our-story',
  '/pathshala',
  '/recipes',
  '/recipe',
  '/blog',
  '/recipe-khazana',
  '/contact-us',
  '/policies',
  '/privacy-policy',
  '/terms-and-conditions',
  '/terms-of-service',
  '/shipping-and-returns',
  '/returns-and-exchange',
  '/shipping',
  '/health-goals',
];

const ADMIN_SUBPAGES = [
  'products',
  'orders',
  'bulk-orders',
  'delivery-pincodes',
  'health-goals',
  'newsletter',
  'inquiries',
  'reviews',
  'content',
  'email-content',
  'partner-logos',
  'pins',
  'blog',
  'carousel',
  'login',
  'coupons',
];

export function isAdminPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return false;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return true;
  }

  // If matches known public prefixes, definitely not admin
  if (KNOWN_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }

  const segments = pathname.split('/').filter(Boolean);

  // Subpage matches known admin subpages (e.g. /<slug>/orders, /<slug>/login)
  if (segments.length >= 2 && ADMIN_SUBPAGES.includes(segments[1])) {
    return true;
  }
  if (segments.length >= 1 && ADMIN_SUBPAGES.includes(segments[segments.length - 1])) {
    return true;
  }

  // A single non-public segment is the dynamic admin panel root (/[panelKey])
  if (segments.length === 1) {
    return true;
  }

  return false;
}
