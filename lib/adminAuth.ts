'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { isAdminPath, KNOWN_PUBLIC_PREFIXES, ADMIN_SUBPAGES } from './adminPaths';

export { isAdminPath, KNOWN_PUBLIC_PREFIXES, ADMIN_SUBPAGES };

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

    // Pass cache: 'no-store' and cache-buster
    fetch(`/api/admin/stats?_t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Cache-Enabled': 'False',
      },
    })
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
  const method = (options?.method || 'GET').toUpperCase();
  let fetchUrl = url;

  // Append timestamp cache-buster for GET / HEAD requests to defeat SiteGround Nginx SuperCacher & browser caching
  if (method === 'GET' || method === 'HEAD') {
    const separator = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${separator}_t=${Date.now()}`;
  }

  const headers = new Headers(options?.headers);
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  if (!headers.has('Pragma')) {
    headers.set('Pragma', 'no-cache');
  }
  if (!headers.has('X-Cache-Enabled')) {
    headers.set('X-Cache-Enabled', 'False');
  }

  const res = await fetch(fetchUrl, {
    ...options,
    headers,
    cache: options?.cache || 'no-store',
    credentials: options?.credentials || 'include',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const currentKey = segments[0] || 'admin';
    window.location.href = `/${currentKey}/login`;
  }
  return res;
}
