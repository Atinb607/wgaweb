import { NextResponse } from 'next/server';

/**
 * Anti-caching headers specifically tailored to defeat:
 * - SiteGround Nginx SuperCacher (Dynamic Cache) via X-Cache-Enabled: False
 * - Nginx proxy buffering via X-Accel-Buffering: no
 * - Cloudflare / edge / CDN proxies via Surrogate-Control: no-store
 * - Browser HTTP caching via Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
 */
export const ADMIN_NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Cache-Enabled': 'False',
  'X-Accel-Buffering': 'no',
  'Surrogate-Control': 'no-store',
};

export function adminJsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(ADMIN_NO_CACHE_HEADERS)) {
    headers.set(key, value);
  }
  return NextResponse.json(data, { ...init, headers });
}
