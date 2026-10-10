import { getProductThumbnail } from '@/lib/cartStore';

export interface ProductVariant {
  id: string;
  label?: string;
  price_paise: number;
  stock_qty?: number;
  is_active?: boolean;
}

export interface ProductImage {
  image_url: string;
}

export interface CartProductItem {
  id: string;
  slug: string;
  name: string;
  badge_label?: string | null;
  thumbnail_url?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  pairs_well_with?: string[] | string | null;
  is_active?: boolean;
}

export interface CartRecommendationProduct {
  id: string;
  slug: string;
  name: string;
  variantId: string;
  variantLabel: string;
  pricePaise: number;
  mrpPaise: number;
  discountOff: string;
  badge: {
    text: string;
    bg: string;
    color: string;
  };
  cardBg: string;
  photo: string;
  maxStock: number;
}

// BestsellerProduct is an alias for backward compatibility
export type BestsellerProduct = CartRecommendationProduct;

export const DEFAULT_BESTSELLERS: CartRecommendationProduct[] = [
  {
    id: 'broccoli-microgreens',
    slug: 'broccoli-microgreens',
    name: 'Broccoli Microgreens',
    variantId: 'var-broccoli-50g',
    variantLabel: '50g tray',
    pricePaise: 9900,
    mrpPaise: 12000,
    discountOff: '₹21 OFF',
    badge: { text: '★ BESTSELLER', bg: '#1C3F2D', color: '#FFFDF8' },
    cardBg: '#EEF5EF',
    photo: 'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=jpg&q=80&w=800&auto=format&fit=crop',
    maxStock: 25,
  },
  {
    id: 'sunflower-microgreens',
    slug: 'sunflower-microgreens',
    name: 'Sunflower Microgreens',
    variantId: 'var-sunflower-50g',
    variantLabel: '50g tray',
    pricePaise: 8900,
    mrpPaise: 11000,
    discountOff: '₹21 OFF',
    badge: { text: '☀ FAVORITE', bg: '#8C5815', color: '#FFFDF8' },
    cardBg: '#FAF4EB',
    photo: 'https://images.unsplash.com/photo-1613769049987-b31b641f25b1?fm=jpg&q=80&w=800&auto=format&fit=crop',
    maxStock: 30,
  },
  {
    id: 'radish-microgreens',
    slug: 'radish-microgreens',
    name: 'Radish Microgreens',
    variantId: 'var-radish-50g',
    variantLabel: '50g tray',
    pricePaise: 7900,
    mrpPaise: 9900,
    discountOff: '₹20 OFF',
    badge: { text: 'PEAK FLAVOUR', bg: '#2D7A4D', color: '#FFFDF8' },
    cardBg: '#F0F6F1',
    photo: 'https://images.unsplash.com/photo-1647613233075-e0d5546b0f22?fm=jpg&q=80&w=800&auto=format&fit=crop',
    maxStock: 35,
  },
  {
    id: 'classic-trio-bundle',
    slug: 'classic-trio-bundle',
    name: 'Classic Trio Bundle',
    variantId: 'var-trio-bundle',
    variantLabel: '3 trays bundle',
    pricePaise: 24900,
    mrpPaise: 29900,
    discountOff: '₹50 OFF',
    badge: { text: '✦ VALUE PACK', bg: '#122A1F', color: '#CFFA57' },
    cardBg: '#EEF2EE',
    photo: 'https://plus.unsplash.com/premium_photo-1703258064295-71c77cc0720f?fm=jpg&q=80&w=800&auto=format&fit=crop',
    maxStock: 15,
  },
];

export function formatProductForCart(
  found: CartProductItem,
  badgeText?: string,
  bg: string = '#EEF5EF',
  badgeBg: string = '#1C3F2D',
  badgeColor: string = '#FFFDF8'
): CartRecommendationProduct {
  const activeVar =
    (Array.isArray(found.variants) && found.variants.find((v: ProductVariant) => v.is_active)) ||
    (Array.isArray(found.variants) && found.variants[0]) ||
    {
      id: found.id,
      label: '100g tray',
      price_paise: 9900,
      stock_qty: 25,
    };
  const price = activeVar.price_paise || 9900;
  const approxMrp = Math.round(price * 1.25);
  const discountPaise = approxMrp - price;
  const customBadge = badgeText?.trim();
  const rawBadge = customBadge || found.badge_label || '★ POPULAR';
  const badgeLabel =
    rawBadge.startsWith('★') ||
    rawBadge.startsWith('☀') ||
    rawBadge.startsWith('✦')
      ? rawBadge
      : `★ ${rawBadge.toUpperCase()}`;

  const photo =
    found.thumbnail_url ||
    found.images?.[0]?.image_url ||
    getProductThumbnail(found.slug, null);

  return {
    id: found.id,
    slug: found.slug,
    name: found.name,
    variantId: activeVar.id,
    variantLabel: activeVar.label || '100g tray',
    pricePaise: price,
    mrpPaise: approxMrp,
    discountOff: `₹${Math.round(discountPaise / 100)} OFF`,
    badge: {
      text: badgeLabel,
      bg: badgeBg,
      color: badgeColor,
    },
    cardBg: bg,
    photo,
    maxStock: activeVar.stock_qty || 25,
  };
}

export function mapBestsellersFromContent(
  productsData: CartProductItem[],
  contentData?: Record<string, string>
): CartRecommendationProduct[] {
  const slotKeys = [
    { prodKey: 'cart_rec_product_1', badgeKey: 'cart_rec_badge_1', defaultSlug: 'broccoli-microgreens', defaultBadge: '★ BESTSELLER', bg: '#EEF5EF', badgeBg: '#1C3F2D', badgeColor: '#FFFDF8' },
    { prodKey: 'cart_rec_product_2', badgeKey: 'cart_rec_badge_2', defaultSlug: 'sunflower-microgreens', defaultBadge: '☀ FAVORITE', bg: '#FAF4EB', badgeBg: '#8C5815', badgeColor: '#FFFDF8' },
    { prodKey: 'cart_rec_product_3', badgeKey: 'cart_rec_badge_3', defaultSlug: 'radish-microgreens', defaultBadge: 'PEAK FLAVOUR', bg: '#F0F6F1', badgeBg: '#2D7A4D', badgeColor: '#FFFDF8' },
    { prodKey: 'cart_rec_product_4', badgeKey: 'cart_rec_badge_4', defaultSlug: 'classic-trio-bundle', defaultBadge: '✦ VALUE PACK', bg: '#EEF2EE', badgeBg: '#122A1F', badgeColor: '#CFFA57' },
  ];

  const mapped: CartRecommendationProduct[] = [];
  slotKeys.forEach((slot) => {
    const chosenSlug = contentData?.[slot.prodKey] !== undefined ? contentData[slot.prodKey] : slot.defaultSlug;
    if (!chosenSlug) return;

    const found = productsData.find((p) => p.slug === chosenSlug);
    if (found && found.variants && found.variants.length > 0) {
      mapped.push(
        formatProductForCart(
          found,
          contentData?.[slot.badgeKey],
          slot.bg,
          slot.badgeBg,
          slot.badgeColor
        )
      );
    }
  });

  return mapped.length > 0 ? mapped : DEFAULT_BESTSELLERS;
}

export function getPairedUpsellProducts(
  cartItems: { id?: string; variantId?: string; productSlug: string }[],
  allProducts: CartProductItem[],
  bestsellers: CartRecommendationProduct[],
  maxCount: number = 3
): CartRecommendationProduct[] {
  if (cartItems.length === 0) return [];

  const cartSlugSet = new Set(cartItems.map((i) => i.productSlug));
  const matchedProducts: CartRecommendationProduct[] = [];
  const addedProductIds = new Set<string>();

  if (allProducts.length > 0) {
    // Prioritize companion products of cart items (most recently added item first)
    for (let i = cartItems.length - 1; i >= 0; i--) {
      const cartItem = cartItems[i];
      const prodInDb = allProducts.find(
        (p) => p.slug === cartItem.productSlug || p.id === cartItem.id
      );

      if (prodInDb && prodInDb.pairs_well_with) {
        let pairedIds: string[] = [];
        if (Array.isArray(prodInDb.pairs_well_with)) {
          pairedIds = prodInDb.pairs_well_with;
        } else if (typeof prodInDb.pairs_well_with === 'string') {
          try {
            pairedIds = JSON.parse(prodInDb.pairs_well_with);
          } catch {}
        }

        for (const pid of pairedIds) {
          if (!pid) continue;
          const companion = allProducts.find(
            (p) => (p.id === pid || p.slug === pid) && p.is_active !== false
          );
          if (
            companion &&
            !cartSlugSet.has(companion.slug) &&
            !addedProductIds.has(companion.id)
          ) {
            addedProductIds.add(companion.id);
            matchedProducts.push(formatProductForCart(companion));
          }
        }
      }
    }
  }

  // If fewer than maxCount paired products found, supplement with bestsellers that aren't already in cart
  if (matchedProducts.length < maxCount) {
    for (const b of bestsellers) {
      if (!cartSlugSet.has(b.slug) && !addedProductIds.has(b.id)) {
        addedProductIds.add(b.id);
        matchedProducts.push(b);
        if (matchedProducts.length >= maxCount) break;
      }
    }
  }

  return matchedProducts.slice(0, maxCount);
}
