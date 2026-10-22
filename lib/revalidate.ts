import { revalidatePath } from 'next/cache';

/**
 * Revalidates public pages when products, variants, or product images change.
 */
export function revalidateProducts(slug?: string | null) {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/products', 'page');
    revalidatePath('/products/health-goals', 'page');
    revalidatePath('/bulk-order', 'page');
    revalidatePath('/cart', 'page');
    if (slug) {
      revalidatePath(`/products/${slug}`, 'page');
    }
    // Also revalidate layout / segment for all product details
    revalidatePath('/products/[slug]', 'page');
  } catch (err) {
    console.warn('revalidateProducts error:', err);
  }
}

/**
 * Revalidates public pages when articles or recipes change.
 */
export function revalidateBlogPosts(slug?: string | null, type?: string | null) {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/pathshala', 'page');
    revalidatePath('/recipes', 'page');
    if (slug) {
      if (!type || type === 'article') {
        revalidatePath(`/pathshala/${slug}`, 'page');
      }
      if (!type || type === 'recipe') {
        revalidatePath(`/recipes/${slug}`, 'page');
      }
    }
    revalidatePath('/pathshala/[slug]', 'page');
    revalidatePath('/recipes/[slug]', 'page');
  } catch (err) {
    console.warn('revalidateBlogPosts error:', err);
  }
}

/**
 * Revalidates public pages when content pins change (icon strip, why choose).
 */
export function revalidateContentPins() {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/products', 'page');
    revalidatePath('/products/health-goals', 'page');
    revalidatePath('/products/[slug]', 'page');
  } catch (err) {
    console.warn('revalidateContentPins error:', err);
  }
}

/**
 * Revalidates public pages when reviews change.
 */
export function revalidateReviews(productSlug?: string | null) {
  try {
    revalidatePath('/products', 'page');
    revalidatePath('/products/health-goals', 'page');
    if (productSlug) {
      revalidatePath(`/products/${productSlug}`, 'page');
    }
    revalidatePath('/products/[slug]', 'page');
  } catch (err) {
    console.warn('revalidateReviews error:', err);
  }
}

/**
 * Revalidates public pages when carousel changes.
 */
export function revalidateCarousel() {
  try {
    revalidatePath('/', 'page');
  } catch (err) {
    console.warn('revalidateCarousel error:', err);
  }
}

/**
 * Revalidates public pages when health goals content changes.
 */
export function revalidateHealthGoals() {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/products/health-goals', 'page');
  } catch (err) {
    console.warn('revalidateHealthGoals error:', err);
  }
}

/**
 * Revalidates public pages when partner logos change.
 */
export function revalidatePartnerLogos() {
  try {
    revalidatePath('/', 'page');
  } catch (err) {
    console.warn('revalidatePartnerLogos error:', err);
  }
}

/**
 * Revalidates public pages when site settings or content blocks change.
 */
export function revalidateSiteContent(page?: string | null) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    if (page === 'products' || page === 'product-listing') {
      revalidatePath('/products', 'page');
      revalidatePath('/products/health-goals', 'page');
    } else if (page === 'product-detail') {
      revalidatePath('/products/[slug]', 'page');
    } else if (page === 'our-story') {
      revalidatePath('/our-story', 'page');
    } else if (page === 'pathshala') {
      revalidatePath('/pathshala', 'page');
    } else if (page === 'recipes') {
      revalidatePath('/recipes', 'page');
    } else if (page === 'bulk-order') {
      revalidatePath('/bulk-order', 'page');
    } else if (page === 'contact-us') {
      revalidatePath('/contact-us', 'page');
    } else if (page === 'cart-drawer') {
      revalidatePath('/', 'layout');
    }
  } catch (err) {
    console.warn('revalidateSiteContent error:', err);
  }
}

export const revalidateContentBlocks = revalidateSiteContent;
