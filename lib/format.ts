/** Format paise to INR string like "₹129.00" */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

import { cldUrl, getOptimizedLogoUrl } from '@/lib/cloudinary';

export { cldUrl, getOptimizedLogoUrl };

/**
 * Backwards-compatible alias for cldUrl.
 */
export const cloudinaryImage = cldUrl;

