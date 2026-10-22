import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { isCanonicalHost } from '@/lib/seo';
import { isAdminPath } from '@/lib/adminPaths';
import { ADMIN_NO_CACHE_HEADERS } from '@/lib/adminResponse';

// ── Security headers applied to ALL responses ──
const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://challenges.cloudflare.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://cloudinary.com https://images.unsplash.com https://plus.unsplash.com https://*.unsplash.com https://images.pexels.com https://*.pexels.com https://www.google-analytics.com https://www.googletagmanager.com",
    "media-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://cloudinary.com https://images.unsplash.com https://plus.unsplash.com https://*.unsplash.com https://images.pexels.com https://*.pexels.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.razorpay.com https://challenges.cloudflare.com https://res.cloudinary.com https://*.cloudinary.com https://cloudinary.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    "frame-src https://api.razorpay.com https://challenges.cloudflare.com",
  ].join('; '),
};

function shouldAddNoIndexHeader(request: NextRequest): boolean {
  try {
    const requestHost =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.host ||
      '';
    return !isCanonicalHost(requestHost);
  } catch {
    return true;
  }
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  if (shouldAddNoIndexHeader(request)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Defeat caching on all admin panel pages and admin API endpoints (especially on SiteGround / Nginx)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/admin/') || isAdminPath(pathname)) {
    for (const [key, value] of Object.entries(ADMIN_NO_CACHE_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin auth check (all /api/admin/* except /api/admin/login) ──
  if (pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        request
      );
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        request
      );
    }
  }

  // Apply security headers to all responses
  const response = NextResponse.next();
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: [
    // Apply to all routes (security headers): admin auth is checked conditionally above
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
