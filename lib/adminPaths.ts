export const KNOWN_PUBLIC_PREFIXES = [
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

export const ADMIN_SUBPAGES = [
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

  // All /api/admin/* endpoints
  if (pathname.startsWith('/api/admin')) {
    return true;
  }

  // Common /admin prefixes
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return true;
  }

  // Check known public prefixes
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
