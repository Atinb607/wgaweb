/**
 * Pure isomorphic Cloudinary helpers for client and server.
 * Does not import the Node.js Cloudinary SDK to keep client bundles lean.
 */

/**
 * Inserts f_auto,q_auto,w_{width},c_limit after /upload/ for Cloudinary URLs.
 * Returns non-Cloudinary URLs or URLs that already contain transformations unchanged.
 */
export function cldUrl(url: string | null | undefined, width?: number): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Return non-Cloudinary URLs unchanged
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/upload/')) {
    return trimmed;
  }

  // Check if it already contains transformations after /upload/
  const uploadIndex = trimmed.indexOf('/upload/');
  const afterUpload = trimmed.slice(uploadIndex + '/upload/'.length);
  const firstSegment = afterUpload.split('/')[0] || '';

  // If already transformed (contains common transformation keys)
  const hasTransformations =
    /^(?:[a-z]{1,2}_[a-zA-Z0-9_.,-]+)/.test(firstSegment) ||
    firstSegment.includes('f_auto') ||
    firstSegment.includes('q_auto') ||
    firstSegment.includes('w_') ||
    firstSegment.includes('c_');

  if (hasTransformations) {
    return trimmed;
  }

  const cleanWidth = width && Number.isFinite(width) && width > 0 ? Math.round(width) : undefined;
  const transform = cleanWidth
    ? `f_auto,q_auto,w_${cleanWidth},c_limit`
    : 'f_auto,q_auto';

  return trimmed.slice(0, uploadIndex + '/upload/'.length) + transform + '/' + afterUpload;
}

/**
 * Extracts Cloudinary public_id from a full Cloudinary URL.
 * Handles URLs with or without version strings and file extensions.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1234567890/products/greens/thumbnail/thumbnail.jpg"
 *   -> "products/greens/thumbnail/thumbnail"
 */
export function extractPublicIdFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  let uploadIndex = url.indexOf('/image/upload/');
  let uploadPrefixLength = '/image/upload/'.length;
  if (uploadIndex === -1) {
    uploadIndex = url.indexOf('/video/upload/');
    uploadPrefixLength = '/video/upload/'.length;
  }
  if (uploadIndex === -1) return null;

  let pathAfterUpload = url.slice(uploadIndex + uploadPrefixLength);
  pathAfterUpload = pathAfterUpload.split('?')[0];

  const parts = pathAfterUpload.split('/');
  const filteredParts: string[] = [];
  let foundVersionOrPath = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!foundVersionOrPath) {
      if (/^v\d+$/.test(part)) {
        foundVersionOrPath = true;
        continue;
      }
      if (part.includes(',') || /^(c_|w_|h_|q_|f_|e_|b_|r_|a_|g_)/.test(part)) {
        continue;
      }
      foundVersionOrPath = true;
    }
    filteredParts.push(part);
  }

  if (filteredParts.length === 0) return null;
  const fullPath = filteredParts.join('/');
  const lastDotIndex = fullPath.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    return fullPath.slice(0, lastDotIndex);
  }
  return fullPath;
}

/**
 * Optimizes a partner logo URL:
 * - Injects `e_trim` for Cloudinary images to automatically crop away excess transparent
 *   or uniform solid white border margins, so square/small-framed logos expand to fill their container.
 * - Injects `f_auto,q_auto` for optimal delivery format and compression.
 */
export function getOptimizedLogoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    if (!trimmed.includes('e_trim')) {
      return trimmed.replace('/image/upload/', '/image/upload/e_trim,f_auto,q_auto/');
    }
  }

  return trimmed;
}
