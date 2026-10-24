'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCartStore } from '@/lib/cartStore';
import { formatPrice, cloudinaryImage } from '@/lib/format';
import { cldSrcSet } from '@/lib/cloudinary';
import { LeafFavicon, Sprout, Shield, Sparkles, CheckCircle, Clock, Utensils, Zap, Droplet, Scissors } from '@/components/icons';
import { Product, Variant, RelatedProduct, Review, HighlightBadge, WhyChoosePin, ProductFAQ, DetailAccordion, HatTrickVariantData } from './page';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

const DEFAULT_HAT_TRICK_VARIANT: HatTrickVariantData = {
  variantId: 'ef7b23d7-1f12-4794-8bef-a4eccbdeb037',
  productSlug: 'hat-trick-pack',
  productName: 'Hat Trick Pack',
  variantLabel: 'Bundle of 3 Live Trays',
  pricePaise: 450,
  maxStock: 11,
  thumbnailUrl: 'https://res.cloudinary.com/qjoihkpr/image/upload/v1791807917/products/hat-trick-pack/thumbnail/thumbnail.png',
};

const DEFAULT_DETAIL_ACCORDIONS: DetailAccordion[] = [
  {
    title: 'How to Eat & Store',
    content:
      'Keep your tray on the kitchen counter away from direct scorching sun. Add 50ml of water to the bottom drip tray once a day.\n\nWhen ready to eat, simply snip what you need with kitchen scissors right above the root line. Your tray stays crisp and fresh for 7 to 10 days!',
  },
  {
    title: 'Nutrient Profile & Science',
    content:
      'USDA and university studies have confirmed that day 10 microgreens contain between 10x and 40x the vital micronutrients of their full grown counterparts.\n\nHarvested young at the peak of cellular vitality to deliver bioavailable antioxidants straight to your plate.',
  },
  {
    title: 'Growing Method & Purity',
    content:
      'We operate vertical indoor climate racks. No soil, no organic compost pathogens, and absolutely zero pesticide or fertilizer residues.\n\nGrown on sterilized coco peat with 100% reverse osmosis mineral drinking water.',
  },
  {
    title: 'Delivery & Packaging',
    content:
      'Delivered in our reusable food-grade fresh trays. We dispatch orders within hours of the final quality check directly to your doorstep.',
  },
];

const DEFAULT_PRODUCT_FAQS: ProductFAQ[] = [
  {
    question: 'How fresh are the greens when they arrive?',
    answer:
      'Every tray is cut after you place your order, not pulled from cold storage. Most orders reach you within a few hours of harvest, freshly packed for peak vitality.',
  },
  {
    question: 'How long do they stay fresh at home?',
    answer:
      'Refrigerated and unwashed, most varieties hold up well for 5–7 days. We include specific care instructions with every order.',
  },
  {
    question: 'Are these actually pesticide-free?',
    answer:
      "Yes, grown indoors on soil-free racks, with nothing sprayed at any stage. We're working toward publishing third-party lab results as we scale.",
  },
  {
    question: 'How is delivery handled?',
    answer:
      'We harvest on schedule so every fresh tray reaches your doorstep fresh within hours of harvest.',
  },
  {
    question: 'Can restaurants order in bulk?',
    answer:
      'Yes, reach out via our restaurants page for standing orders and bulk pricing.',
  },
  {
    question: 'What if a tray shows up wilted or damaged?',
    answer:
      "Send us a quick photo on WhatsApp within 12 hours of delivery, and we'll replace the tray on our next delivery run or refund it immediately, no questions asked.",
  },
];

const WHY_CHOOSE_COLORS = ['#F3DFE4', '#D6E6EF', '#E4DDC8', '#F6C7B3'];

const DEFAULT_WHY_CHOOSE_BLOCKS = [
  {
    title: 'Grown,\nnot made.',
    description: 'seed → sprout · 7-10 days',
    image_url: CLOUDINARY_ASSETS.whyChoose.grownNotMade,
  },
  {
    title: 'RO water as\nprimary source.',
    description: 'no heaviness · easy on your gut',
    image_url: CLOUDINARY_ASSETS.whyChoose.roWater,
  },
  {
    title: 'Coco-Peat is\nwhere it starts.',
    description: 'soil-free · sustainable',
    image_url: CLOUDINARY_ASSETS.whyChoose.cocoPeat,
  },
  {
    title: 'No Pesticides:\nnever ever.',
    description: 'zero spray · zero residue',
    image_url: CLOUDINARY_ASSETS.whyChoose.noPest,
  },
];

function renderHighlightedText(text: string) {
  if (!text) return null;
  const parts = text.split(/(<u>.*?<\/u>|__.*?__)/g);
  return parts.map((part, i) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return (
        <u
          key={i}
          className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-medium text-[#122A1F]"
        >
          {part.slice(3, -4)}
        </u>
      );
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return (
        <u
          key={i}
          className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-medium text-[#122A1F]"
        >
          {part.slice(2, -2)}
        </u>
      );
    }
    return part;
  });
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    product_id: null,
    reviewer_name: 'Siddhant Tewari',
    reviewer_location: null,
    review_text:
      "It's <strong>very light</strong> like almost drinking water and <strong>no heaviness</strong> on stomach. It's very light to drink with almost no taste because sweetness is negligible. It cocoa taste which is good",
    rating: 5,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'rev-2',
    product_id: null,
    reviewer_name: 'Avi Dayal',
    reviewer_location: null,
    review_text:
      '<strong>Clean and easy on gut.</strong> I love you guys added dates and monk fruit for sweetness and also it <strong>felt light</strong> after consuming it. There were no burps and protein farts.',
    rating: 5,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'rev-3',
    product_id: null,
    reviewer_name: 'Abhishek Nair',
    reviewer_location: null,
    review_text: 'Perfect. The taste which was very neutral is what I liked.',
    rating: 4,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'rev-4',
    product_id: null,
    reviewer_name: 'Hrishikesh',
    reviewer_location: null,
    review_text: 'Perfect Mixability',
    rating: 5,
    display_order: 4,
    is_active: true,
  },
  {
    id: 'rev-5',
    product_id: null,
    reviewer_name: 'Synthia Nathan',
    reviewer_location: null,
    review_text:
      'This is a <strong>good protein powder.</strong> From a taste perspective it is tasteless and that is ok because you are using <strong>all natural ingredients.</strong> It keeps me filling for a long time and I did not feel any discomfort after...',
    rating: 4,
    display_order: 5,
    is_active: true,
  },
  {
    id: 'rev-6',
    product_id: null,
    reviewer_name: 'Dr Thanvi',
    reviewer_location: null,
    review_text: "Best till date that I've tried. Taste, <strong>non-bloating</strong>",
    rating: 5,
    display_order: 6,
    is_active: true,
  },
  {
    id: 'rev-7',
    product_id: null,
    reviewer_name: 'Dinesh Choithani',
    reviewer_location: null,
    review_text: 'Light on stomach. It is not unnecessarily sweet',
    rating: 4,
    display_order: 7,
    is_active: true,
  },
  {
    id: 'rev-8',
    product_id: null,
    reviewer_name: 'Meera Kapoor',
    reviewer_location: null,
    review_text:
      "No jitters, no crash. Just <strong>steady energy</strong> through my whole workday. Didn't expect that from a greens mix.",
    rating: 5,
    display_order: 8,
    is_active: true,
  },
];

const REASONS = [
  {
    iconType: 'sprout',
    title: 'Nutrient Density',
    desc: 'Microgreens can carry several times the vitamins and antioxidants of the mature vegetable, gram for gram¹. A small daily habit with an outsized return.',
  },
  {
    iconType: 'shield',
    title: 'Everyday Antioxidants',
    desc: 'Compounds like sulforaphane and vitamin C help your body stand up to daily free-radical wear and tear², especially when the rest of your plate is processed.',
  },
  {
    iconType: 'sparkles',
    title: 'Better Digestion',
    desc: 'A quiet dose of fibre in every handful, most adults fall short here³, keeps digestion moving without any extra effort.',
  },
  {
    iconType: 'check',
    title: 'Genuinely Clean',
    desc: 'Grown indoors on soil-free racks with mineral RO water. Nothing sprayed, ever. Food you can actually trust for the whole family.',
  },
  {
    iconType: 'clock',
    title: 'Peak Freshness',
    desc: 'Cut to order and delivered within hours, so nutrients reach your table instead of fading in a warehouse for a week.',
  },
  {
    iconType: 'utensils',
    title: 'Effortlessly Good',
    desc: 'One handful upgrades a toast, poha, salad or smoothie. No cooking, no fuss — just sprinkle and eat.',
  },
];

function renderReasonIcon(type: string) {
  switch (type) {
    case 'sprout':
      return <Sprout className="w-5 h-5 text-emerald-800" />;
    case 'shield':
      return <Shield className="w-5 h-5 text-emerald-800" />;
    case 'sparkles':
      return <Sparkles className="w-5 h-5 text-emerald-800" />;
    case 'check':
      return <CheckCircle className="w-5 h-5 text-emerald-800" />;
    case 'clock':
      return <Clock className="w-5 h-5 text-emerald-800" />;
    case 'utensils':
      return <Utensils className="w-5 h-5 text-emerald-800" />;
    default:
      return <Sprout className="w-5 h-5 text-emerald-800" />;
  }
}

function renderBadgeIcon(icon: string, label: string) {
  const norm = (icon + ' ' + label).toLowerCase();
  const iconLower = (icon || '').toLowerCase();
  if (
    iconLower === 'zap' ||
    iconLower === 'bolt' ||
    icon === '⚡' ||
    norm.includes('sulforaphane') ||
    norm.includes('energy')
  ) {
    return <Zap className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  }
  if (
    iconLower === 'shield' ||
    icon === '🛡️' ||
    norm.includes('pesticide') ||
    norm.includes('clean')
  ) {
    return <Shield className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  }
  if (
    iconLower === 'droplet' ||
    iconLower === 'water' ||
    iconLower === 'drop' ||
    icon === '💧' ||
    norm.includes('ro') ||
    norm.includes('mineral')
  ) {
    return <Droplet className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  }
  if (
    iconLower === 'scissors' ||
    iconLower === 'cut' ||
    icon === '✂️' ||
    norm.includes('harvest') ||
    norm.includes('order')
  ) {
    return <Scissors className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  }
  if (icon && !/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(icon) && icon !== 'sprout') {
    return <span>{icon}</span>;
  }
  return <Sprout className="w-3.5 h-3.5 text-[#1C3F2D]" />;
}

const RELATED_FALLBACKS: Record<string, { photo: string; subtitle: string }> = {
  'radish-microgreens': {
    photo: 'https://images.unsplash.com/photo-1647613233075-e0d5546b0f22?fm=jpg&q=80&w=600&auto=format&fit=crop',
    subtitle: 'Peppery bite · purple stems',
  },
  'sunflower-microgreens': {
    photo: 'https://images.unsplash.com/photo-1613769049987-b31b641f25b1?fm=jpg&q=80&w=600&auto=format&fit=crop',
    subtitle: 'Nutty · protein-forward crunch',
  },
  'pea-shoots': {
    photo: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?fm=jpg&q=80&w=600&auto=format&fit=crop',
    subtitle: 'Sweet & mild · great for kids',
  },
  'carrot-microgreens': {
    photo: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?fm=jpg&q=80&w=600&auto=format&fit=crop',
    subtitle: 'Sweet & mild · great for kids',
  },
  'broccoli-microgreens': {
    photo: 'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=jpg&q=80&w=600&auto=format&fit=crop',
    subtitle: 'Sulforaphane dense · rich crunch',
  },
  'classic-trio-bundle': {
    photo: 'https://plus.unsplash.com/premium_photo-1703258064295-71c77cc0720f?fm=jpg&q=80&w=600&auto=format&fit=crop',
    subtitle: 'Broccoli, Radish & Sunflower trio',
  },
};

function formatCleanPrice(paise: number): string {
  const rupees = paise / 100;
  return `₹${paise % 100 === 0 ? rupees : rupees.toFixed(2)}`;
}

export interface OtherGreenItem {
  id: string;
  slug: string;
  name: string;
  badge: string;
  typeNote: string;
  shelfNote: string;
  price_paise: number;
  bgColor: string;
  photo: string;
  isBundle: boolean;
  categories: string[];
  description: string;
  thumbnail_url?: string | null;
  thumbnail_alt_text?: string | null;
  variant_id?: string;
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
  pairedProducts,
  otherProducts,
  content = {},
  reviews = [],
  initialWhyChoosePins = [],
  hatTrickVariant = null,
}: {
  product: Product;
  relatedProducts?: RelatedProduct[];
  pairedProducts?: RelatedProduct[];
  otherProducts?: RelatedProduct[];
  content?: Record<string, string>;
  reviews?: Review[];
  initialWhyChoosePins?: WhyChoosePin[];
  hatTrickVariant?: HatTrickVariantData | null;
}) {
  const shouldReduceMotion = useReducedMotion();

  const effectiveBadges: HighlightBadge[] =
    Array.isArray(product.detail_highlight_badges) && product.detail_highlight_badges.length > 0
      ? product.detail_highlight_badges
      : [
          { icon: 'zap', label: '40x Sulforaphane' },
          { icon: 'shield', label: 'Zero Pesticides' },
          { icon: 'droplet', label: 'Mineral RO Grown' },
          { icon: 'scissors', label: 'Cut to Order' },
        ];

  const effectiveReviews: Review[] =
    reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;
  const activeVariants = product.variants.filter((v) => v.is_active);
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    activeVariants[0] || {
      id: 'default',
      product_id: product.id,
      label: '100g tray',
      net_weight_grams: 100,
      price_paise: 9900,
      stock_qty: 25,
      is_active: true,
    }
  );

  // Build gallery image list from product images, falling back to thumbnail
  const PRODUCT_IMAGES =
    product.images.length > 0
      ? product.images
          .sort((a, b) => a.display_order - b.display_order)
          .map((img, i) => ({
            url: img.image_url,
            alt: img.alt_text?.trim() || `${product.name} fresh microgreens - image ${i + 1}`,
          }))
      : product.thumbnail_url
        ? [{ url: product.thumbnail_url, alt: product.thumbnail_alt_text?.trim() || `${product.name} fresh microgreens` }]
        : [{ url: '/placeholder.png', alt: `${product.name} fresh microgreens` }];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [plan, setPlan] = useState<'single' | 'subscription'>('single');
  const [subTrays, setSubTrays] = useState<number>(1);
  const [subWeeks, setSubWeeks] = useState<number>(4);
  const [qty, setQty] = useState(1);
  const [openAcc, setOpenAcc] = useState<number | null>(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const buyBoxRef = useRef<HTMLDivElement>(null);
  const reasonsTrackRef = useRef<HTMLDivElement>(null);
  const [activeReasonsSet, setActiveReasonsSet] = useState(0);
  const ogTrackRef = useRef<HTMLDivElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const effectiveFaqs: ProductFAQ[] =
    Array.isArray(product.faqs) && product.faqs.length > 0
      ? product.faqs
      : DEFAULT_PRODUCT_FAQS;

  const effectiveAccordions: DetailAccordion[] =
    Array.isArray(product.detail_accordions) && product.detail_accordions.length > 0
      ? product.detail_accordions
      : DEFAULT_DETAIL_ACCORDIONS;

  const [whyChoosePins, setWhyChoosePins] = useState<WhyChoosePin[]>(initialWhyChoosePins);

  useEffect(() => {
    if (initialWhyChoosePins.length > 0) return;
    fetch('/api/pins/product_listing_why_choose')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWhyChoosePins(data);
        }
      })
      .catch(() => {});
  }, [initialWhyChoosePins.length]);

  const companionProducts = (
    pairedProducts && pairedProducts.length > 0 ? pairedProducts : relatedProducts || []
  ).slice(0, 3);

  // Build the list of actual products fetched from backend (administered via admin panel)
  const displayOtherGreens: OtherGreenItem[] = (() => {
    const currentSlug = product.slug;
    const CARD_PALETTE = ['#EBE5D8', '#F5E1E6', '#D9E4D5', '#EBE0D2', '#DDE7D4', '#EDE7DC'];

    const items = (otherProducts && otherProducts.length > 0 ? otherProducts : relatedProducts) || [];
    if (items.length === 0) return [];

    return items
      .filter((rel) => rel.slug !== currentSlug)
      .map((rel, index) => {
        const fallbackPhoto = RELATED_FALLBACKS[rel.slug]?.photo || '';
        const photoUrl = rel.thumbnail_url || fallbackPhoto || '';

        // Format category label
        const primaryCategory =
          Array.isArray(rel.categories) && rel.categories.length > 0
            ? rel.categories[0].replace(/-/g, ' ')
            : 'Fresh greens';

        // Subtitle line 1: Prefer admin panel highlight_1, else format type · category
        const typeNote =
          rel.highlight_1 && rel.highlight_1.trim().length > 0
            ? rel.highlight_1
            : `${rel.is_bundle ? 'Bundle' : 'Microgreen'} · ${primaryCategory}`;

        // Subtitle line 2: Prefer admin panel highlight_2, else fallback to description or 7-day shelf guarantee
        const shelfNote =
          rel.highlight_2 && rel.highlight_2.trim().length > 0
            ? rel.highlight_2
            : rel.is_bundle
              ? rel.description || '3 fresh trays'
              : '7-day shelf · zero pesticide';

        // Badge label: Use admin panel badge_label
        const badge = rel.badge_label
          ? rel.badge_label.toUpperCase()
          : rel.is_bundle
            ? 'BUNDLE'
            : '';

        // Media background hue
        const bgColor = rel.is_bundle
          ? '#1C372A'
          : CARD_PALETTE[index % CARD_PALETTE.length];

        return {
          id: rel.id,
          slug: rel.slug,
          name: rel.name, // Actual product name from backend / admin panel
          badge,
          typeNote,
          shelfNote,
          price_paise: rel.price_paise || 9900,
          bgColor,
          photo: photoUrl,
          thumbnail_url: rel.thumbnail_url,
          thumbnail_alt_text: rel.thumbnail_alt_text,
          isBundle: Boolean(rel.is_bundle),
          categories: rel.categories || [],
          description: rel.description || '',
          variant_id: rel.variant_id,
        };
      });
  })();

  const addItem = useCartStore((s) => s.addItem);
  const setIsOpen = useCartStore((s) => s.setIsOpen);

  // Price calculations
  const rawPrice = selectedVariant.price_paise;
  const basePriceRupees = rawPrice / 100;

  // Subscription discount percentage from admin content blocks (default 15)
  const rawDiscount = content?.subscription_discount_percent ? parseFloat(content.subscription_discount_percent) : 15;
  const [discountPercent, setDiscountPercent] = useState<number>(
    !isNaN(rawDiscount) && rawDiscount >= 0 && rawDiscount <= 100 ? rawDiscount : 15
  );

  useEffect(() => {
    if (content?.subscription_discount_percent) {
      const parsed = parseFloat(content.subscription_discount_percent);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        setDiscountPercent(parsed);
        return;
      }
    }
    fetch('/api/subscription-discount')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.discount_percent === 'number') {
          setDiscountPercent(d.discount_percent);
        }
      })
      .catch(() => {});
  }, [content?.subscription_discount_percent]);

  const discountMultiplier = Math.max(0, Math.min(100, 100 - discountPercent)) / 100;

  // Subscription calculation (Base Price * Number of trays * number of weeks * discountMultiplier, rounded off without decimals)
  const subtotalRupees = basePriceRupees * subTrays * subWeeks;
  const subPriceRupees = Math.round(subtotalRupees * discountMultiplier);
  const subPricePaise = subPriceRupees * 100;
  const subRegularPricePaise = Math.round(subtotalRupees) * 100;

  const effectivePrice = plan === 'subscription' ? subPricePaise : rawPrice;

  const hatTrickUrl =
    content.bundle_banner_link ||
    `/products/${hatTrickVariant?.productSlug || DEFAULT_HAT_TRICK_VARIANT.productSlug}`;

  // Sticky bar intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (buyBoxRef.current) {
      observer.observe(buyBoxRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock_qty === 0) return;
    const thumb = product.thumbnail_url || product.images?.[0]?.image_url || null;

    if (plan === 'subscription') {
      addItem({
        id: `${selectedVariant.id}-sub-${subTrays}t-${subWeeks}w`,
        variantId: selectedVariant.id,
        productSlug: product.slug,
        productName: product.name,
        variantLabel: `${selectedVariant.label} (${subWeeks}-Wk Plan · ${subTrays} ${subTrays === 1 ? 'tray' : 'trays'}/wk)`,
        pricePaise: subPricePaise,
        quantity: 1,
        maxStock: selectedVariant.stock_qty,
        thumbnailUrl: thumb,
        isSubscription: true,
        subscriptionTrays: subTrays,
        subscriptionWeeks: subWeeks,
      });
    } else {
      addItem({
        id: selectedVariant.id,
        variantId: selectedVariant.id,
        productSlug: product.slug,
        productName: product.name,
        variantLabel: selectedVariant.label,
        pricePaise: rawPrice,
        quantity: qty,
        maxStock: selectedVariant.stock_qty,
        thumbnailUrl: thumb,
        isSubscription: false,
      });
    }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const handleQuickAdd = (rel: RelatedProduct | OtherGreenItem) => {
    const thumb =
      ('thumbnail_url' in rel && rel.thumbnail_url)
        ? rel.thumbnail_url
        : ('photo' in rel && rel.photo)
        ? rel.photo
        : null;
    addItem({
      variantId: ('variant_id' in rel && rel.variant_id) ? rel.variant_id : rel.id,
      productSlug: rel.slug,
      productName: rel.name,
      variantLabel: 'Standard Tray',
      pricePaise: rel.price_paise,
      maxStock: 20,
      thumbnailUrl: thumb,
    });
    setIsOpen(true);
  };


  const handleReasonsScroll = () => {
    if (!reasonsTrackRef.current) return;
    const { scrollLeft, clientWidth } = reasonsTrackRef.current;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      if (page !== activeReasonsSet) {
        setActiveReasonsSet(page);
      }
    }
  };

  const scrollReasons = (dir: 'left' | 'right') => {
    if (!reasonsTrackRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = reasonsTrackRef.current;
    if (dir === 'right') {
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        reasonsTrackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        reasonsTrackRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft <= 10) {
        reasonsTrackRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        reasonsTrackRef.current.scrollBy({ left: -clientWidth, behavior: 'smooth' });
      }
    }
  };

  const scrollOtherGreens = (dir: 'left' | 'right') => {
    if (!ogTrackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ogTrackRef.current;
    if (dir === 'right') {
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        ogTrackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        ogTrackRef.current.scrollBy({ left: 280, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft <= 10) {
        ogTrackRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        ogTrackRef.current.scrollBy({ left: -280, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="bg-white text-[#151F19] min-h-screen">
      {/* ================= PDP HERO ================= */}
      <section className="pt-28 pb-16">
        <div className="wrap">
          {/* Breadcrumb */}
          <nav className="font-mono text-[11px] tracking-[0.08em] uppercase text-[#5C6B60] mb-6 flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-[#1C3F2D] transition-colors">
              Home
            </Link>
            <span className="opacity-40">/</span>
            <Link href="/products" className="hover:text-[#1C3F2D] transition-colors">
              Shop
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-[#122A1F] font-semibold">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* ================= GALLERY (sticky LHS) ================= */}
            <div className="lg:sticky lg:top-24">
              <div className="relative rounded-2xl overflow-hidden aspect-[1/1.08] bg-gradient-to-br from-[#EDE7D6] to-[#E1DAC3] p-4 sm:p-7 flex items-center justify-center border border-[#E4DDC8] shadow-sm">
                {/* Badge */}
                <span className="absolute top-4 left-4 z-10 font-mono text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full bg-[#9C4A5C] text-[#FFFDF8] shadow-sm flex items-center gap-1.5">
                  <LeafFavicon className="w-3.5 h-3.5" />
                  <span>{product.badge_label || '100% Pesticide Free'}</span>
                </span>

                {/* Image counter */}
                <span className="absolute bottom-4 right-4 z-10 font-mono text-[10px] tracking-wide text-[#122A1F] bg-[#FFFDF8]/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-black/5 shadow-sm">
                  {activeImgIdx + 1} / {PRODUCT_IMAGES.length}
                </span>

                {/* Left / Right Nav Arrows */}
                <button
                  onClick={() =>
                    setActiveImgIdx((prev) =>
                      prev === 0 ? PRODUCT_IMAGES.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#122A1F] shadow-md hover:scale-105 transition-all"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setActiveImgIdx((prev) =>
                      prev === PRODUCT_IMAGES.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#122A1F] shadow-md hover:scale-105 transition-all"
                  aria-label="Next image"
                >
                  ›
                </button>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={activeImgIdx}
                  src={cloudinaryImage(PRODUCT_IMAGES[activeImgIdx]?.url, 800)}
                  srcSet={cldSrcSet(PRODUCT_IMAGES[activeImgIdx]?.url, [420, 640, 900])}
                  sizes="(max-width: 1024px) 92vw, 48vw"
                  alt={PRODUCT_IMAGES[activeImgIdx]?.alt || `${product.name} fresh microgreens`}
                  width={800}
                  height={864}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover rounded-xl transition-all duration-300"
                />
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2.5 mt-3.5 overflow-x-auto pb-1">
                {PRODUCT_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImgIdx(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImgIdx === i
                        ? 'border-[#1C3F2D] ring-2 ring-[#CFFA57]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cloudinaryImage(img.url, 200)}
                      alt={img.alt || `${product.name} thumbnail ${i + 1}`}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* ================= DETAIL & BUY BOX (RHS) ================= */}
            <div className="max-w-lg">
              <h1 className="font-serif font-medium text-4xl sm:text-5xl text-[#151F19] leading-[1.05] tracking-tight mb-5 sm:mb-6">
                {product.name}
              </h1>

              {/* Description in Newsreader Editorial Font */}
              <div className="font-editorial text-[17.5px] leading-[1.62] text-[#33402F] mb-7 space-y-3">
                {(product.description_lead || product.description) && (
                  <p>
                    {product.description_lead && (
                      <span className="font-medium italic text-[#122A1F]">
                        {product.description_lead}{' '}
                      </span>
                    )}
                    {product.description ||
                      'Harvested at the biological apex on day 10, delivering peak cellular antioxidants straight to your door.'}
                  </p>
                )}
                {product.description_highlight && (
                  <p>
                    {renderHighlightedText(product.description_highlight)}
                  </p>
                )}
              </div>

              {/* Benefit Chips */}
              <motion.div
                className="flex flex-wrap gap-2.5 mb-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: shouldReduceMotion ? 0 : 0.06,
                    },
                  },
                  hidden: {},
                }}
              >
                {effectiveBadges.map((badge, idx) => (
                  <motion.span
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' },
                      },
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFDF8] border border-[#E4DDC8] text-xs font-semibold text-[#122A1F] shadow-sm"
                  >
                    {renderBadgeIcon(badge.icon, badge.label)}
                    <span>{badge.label}</span>
                  </motion.span>
                ))}

              </motion.div>

              {/* BUY BOX */}
              <div
                ref={buyBoxRef}
                className="bg-[#FFFDF8] border border-[#E4DDC8] rounded-[22px] p-6 sm:p-7 shadow-sm mb-9"
              >
                {/* Price Row */}
                <div className="flex flex-col mb-5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-display text-4xl text-[#122A1F] leading-none">
                      {formatPrice(effectivePrice)}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#5C6B60]">
                      {plan === 'subscription'
                        ? `/ ${subWeeks} wks`
                        : `/ ${product.is_bundle || product.slug.toLowerCase().includes('bundle') || product.name.toLowerCase().includes('bundle') ? 'bundle' : 'tray'}`}
                    </span>
                    {plan === 'subscription' && (
                      <span className="font-mono text-sm line-through text-[#5C6B60]/70 ml-1">
                        {formatPrice(subRegularPricePaise)}
                      </span>
                    )}
                  </div>
                  {plan === 'subscription' && (
                    <div className="mt-1 text-xs text-[#2D7A4D] font-medium font-mono">
                      ₹{Math.round(subPriceRupees / subWeeks)}/wk · {subTrays} {subTrays === 1 ? 'tray' : 'trays'} × {subWeeks} weeks (Save {discountPercent}%)
                    </div>
                  )}
                </div>

                {/* Plan Selector */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <button
                    onClick={() => setPlan('single')}
                    className={`relative text-left p-3.5 rounded-xl border transition-all ${
                      plan === 'single'
                        ? 'border-[#1C3F2D] bg-[#F7FAF0] ring-1 ring-[#1C3F2D]'
                        : 'border-[#E4DDC8] hover:border-[#3E8F52]'
                    }`}
                  >
                    <span className="block text-[13.5px] font-bold text-[#122A1F] mb-0.5">
                      {product.is_bundle || product.slug.toLowerCase().includes('bundle') || product.name.toLowerCase().includes('bundle') ? 'Single Bundle' : 'Single Tray'}
                    </span>
                    <span className="block font-mono text-[10px] tracking-wide uppercase text-[#5C6B60]">
                      Standard Order
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setPlan('subscription');
                      setQty(1);
                    }}
                    className={`relative text-left p-3.5 rounded-xl border transition-all ${
                      plan === 'subscription'
                        ? 'border-[#1C3F2D] bg-[#F7FAF0] ring-1 ring-[#1C3F2D]'
                        : 'border-[#E4DDC8] hover:border-[#3E8F52]'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-2 bg-[#CFFA57] text-[#122A1F] font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
                      Save {discountPercent}%
                    </span>
                    <span className="block text-[13.5px] font-bold text-[#122A1F] mb-0.5">
                      Subscribe
                    </span>
                    <span className="block font-mono text-[10px] tracking-wide uppercase text-[#5C6B60]">
                      Weekly
                    </span>
                  </button>
                </div>

                {/* Variant Selector (if more than 1) */}
                {activeVariants.length > 1 && (
                  <div className="mb-4">
                    <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5C6B60] mb-1.5 font-semibold">
                      Tray Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeVariants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            selectedVariant.id === v.id
                              ? 'border-[#1C3F2D] bg-[#1C3F2D] text-white'
                              : 'border-[#E4DDC8] text-[#122A1F] hover:border-gray-400'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscription Options: Number of Trays & Weekly Schedule */}
                {plan === 'subscription' && (
                  <div className="mb-4 bg-gray-50 p-3.5 rounded-xl border border-[#E4DDC8] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-mono text-[10px] tracking-wider uppercase text-[#5C6B60] font-semibold">
                        Delivery Schedule
                      </label>
                      <span className="font-mono text-[10px] text-[#2D7A4D] font-bold uppercase tracking-wider bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#C5DEC9]">
                        {discountPercent}% Off Included
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] text-[#5C6B60] mb-1 font-medium">
                          Number of Trays:
                        </label>
                        <select
                          value={subTrays}
                          onChange={(e) => setSubTrays(Number(e.target.value))}
                          className="w-full bg-white border border-[#E4DDC8] rounded-lg px-3 py-2 text-xs font-semibold text-[#122A1F] outline-none focus:ring-1 focus:ring-[#1C3F2D]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? 'Tray' : 'Trays'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] text-[#5C6B60] mb-1 font-medium">
                          Weekly Schedule:
                        </label>
                        <select
                          value={subWeeks}
                          onChange={(e) => setSubWeeks(Number(e.target.value))}
                          className="w-full bg-white border border-[#E4DDC8] rounded-lg px-3 py-2 text-xs font-semibold text-[#122A1F] outline-none focus:ring-1 focus:ring-[#1C3F2D]"
                        >
                          <option value={4}>4 Weeks</option>
                          <option value={8}>8 Weeks</option>
                          <option value={12}>12 Weeks</option>
                          <option value={16}>16 Weeks</option>
                          <option value={20}>20 Weeks</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#5C6B60] leading-relaxed pt-0.5 border-t border-[#E4DDC8]/60">
                      Weekly deliveries · Total <strong>{subTrays * subWeeks} {subTrays * subWeeks === 1 ? 'tray' : 'trays'}</strong> over {subWeeks} weeks.
                    </p>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="flex gap-3 items-stretch mt-4">
                  {/* Stepper: only appears while Ordering, not subscribing */}
                  {plan === 'single' && (
                    <div className="flex items-center border border-[#E4DDC8] rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-9 h-full flex items-center justify-center text-base font-bold text-[#122A1F] hover:bg-[#E4DDC8]/60 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-[#122A1F]">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((q) => q + 1)}
                        className="w-9 h-full flex items-center justify-center text-base font-bold text-[#122A1F] hover:bg-[#E4DDC8]/60 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}

                  {/* Add to Cart / Subscribe Button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#122A1F] hover:bg-[#1C3F2D] text-[#FFFDF8] font-bold text-sm tracking-wide py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {addedFeedback ? (
                      <span className="text-[#CFFA57] font-semibold">✓ Added to Cart!</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        <span>
                          {plan === 'subscription' ? 'Subscribe · ' : 'Add to Cart · '}
                          {formatPrice(effectivePrice * (plan === 'subscription' ? 1 : qty))}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Accordions */}
              <div className="border-t border-[#E4DDC8] pt-2">
                {effectiveAccordions.map((acc, idx) => {
                  const isOpen = openAcc === idx;
                  const isNutrientAcc =
                    acc.title.toLowerCase().includes('nutrient') ||
                    acc.title.toLowerCase().includes('science') ||
                    acc.title.toLowerCase().includes('profile');
                  return (
                    <div key={idx} className="border-b border-[#E4DDC8]">
                      <button
                        onClick={() => setOpenAcc(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between py-4 text-left font-serif text-[17px] font-semibold text-[#151F19] transition-colors hover:text-[#1C3F2D]"
                      >
                        <span>{acc.title}</span>
                        <span className="font-mono text-xl text-[#1C3F2D] select-none">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key={`acc-${idx}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pb-4 text-sm text-[#3B4A40] leading-relaxed space-y-2 whitespace-pre-line">
                              {acc.content}
                              {isNutrientAcc && product.nutrition_notes && product.nutrition_notes.trim() && (
                                <div className="mt-3 pt-3 border-t border-[#E4DDC8]/70 text-xs text-[#2A3B30] bg-[#F7F9F5] p-3 rounded-xl border border-[#DCE8D8]">
                                  <span className="font-bold block text-[#122A1F] mb-1">
                                    Nutrient &amp; Science Profile:
                                  </span>
                                  <p className="leading-relaxed whitespace-pre-line">{product.nutrition_notes.trim()}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Pairs Well With / Upsell */}
              {companionProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#E4DDC8]">
                  <div className="flex items-center gap-2 mb-3.5">
                    <Utensils className="w-4 h-4 text-[#1C3F2D]" />
                    <span className="font-mono text-[11px] sm:text-xs tracking-[0.14em] uppercase text-[#5C6B60] font-semibold">
                      PAIRS WELL WITH
                    </span>
                  </div>

                  <div className="space-y-3 sm:space-y-3.5">
                    {companionProducts.map((rel) => {
                      const fallback = RELATED_FALLBACKS[rel.slug];
                      const photoUrl = rel.thumbnail_url || fallback?.photo || null;
                      const subtitle =
                        rel.highlight_1 ||
                        fallback?.subtitle ||
                        rel.description ||
                        'Locally grown fresh microgreens';

                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-[#E4DDC8] hover:border-[#122A1F]/30 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] sm:rounded-2xl bg-[#E4DDC8]/60 flex-shrink-0 overflow-hidden flex items-center justify-center border border-black/5">
                            {photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cloudinaryImage(photoUrl, 240)}
                                alt={rel.thumbnail_alt_text?.trim() || `${rel.name} fresh microgreens`}
                                width={80}
                                height={80}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <span className="font-mono text-[11px] sm:text-xs text-[#5C6B60] font-semibold uppercase tracking-wider">
                                Image
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-1">
                            <Link href={`/products/${rel.slug}`} className="block">
                              <h5 className="font-serif text-[17px] sm:text-[19px] font-bold text-[#151F19] truncate leading-tight group-hover:text-[#1C3F2D] transition-colors">
                                {rel.name}
                              </h5>
                            </Link>
                            <p className="font-sans text-[12px] sm:text-[13px] text-[#5C6B60] mt-1 truncate">
                              {subtitle}
                            </p>
                          </div>

                          {/* Price & Add Button */}
                          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                            <span className="font-sans font-extrabold text-[16px] sm:text-[18px] text-[#151F19]">
                              {formatCleanPrice(rel.price_paise)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(rel)}
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 hover:bg-[#122A1F] hover:text-[#CFFA57] active:scale-95 flex items-center justify-center text-lg sm:text-xl font-bold text-[#122A1F] transition-all shadow-sm"
                              title={`Add ${rel.name} to cart`}
                              aria-label={`Add ${rel.name} to cart`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2a: FULL-BLEED "TRY THE TRIO BUNDLE" BANNER ================= */}
      <section className="w-full bg-[#00A234] text-[#FFFDF8] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 md:h-[310px] lg:h-[330px]">
          {/* Media Side */}
          <Link
            href={hatTrickUrl}
            className="block relative bg-[#1C3F2D] h-60 sm:h-72 md:h-full overflow-hidden group cursor-pointer"
            aria-label={content.bundle_banner_cta_text || 'Try the Hat Trick Pack'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryImage(content.bundle_banner_image || CLOUDINARY_ASSETS.trioBundleBanner, 900)}
              alt={content.bundle_banner_image_alt || content.bundle_banner_title || 'Classic Trio - Go For All Three'}
              width={800}
              height={450}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Copy Side */}
          <div className="flex flex-col justify-center items-center text-center px-6 py-8 sm:px-10 lg:px-12 space-y-3">
            <h2 className="font-display uppercase text-2xl sm:text-3xl lg:text-4xl tracking-wide leading-tight text-white font-black">
              {content.bundle_banner_title || 'GO FOR ALL THREE'}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-white/95 max-w-sm">
              {content.bundle_banner_subtitle ||
                'Grab the full lineup and save 25%. Three trays, one delivery, zero filler.'}
            </p>
            <Link
              href={hatTrickUrl}
              className="inline-flex items-center justify-center gap-2 bg-[#111813] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-black transition-all shadow-sm mt-1 cursor-pointer active:scale-95"
            >
              <span>{content.bundle_banner_cta_text || 'TRY THE HAT TRICK 3-PACK'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2b: SIX REASONS CAROUSEL ================= */}
      <section className="w-full bg-[#E4EFDC] py-12 sm:py-16">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center mb-10 sm:mb-12">
            <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#151F19] mb-2 leading-snug">
              {content.reasons_title || 'Six Reasons to Add Microgreens Daily'}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#4A5C50] leading-relaxed">
              {content.reasons_subtitle ||
                "Regular salad greens are fine. They're just not doing enough. Here's why thousands of health-conscious households add a spoonful to every plate."}
            </p>
          </div>

          <div className="relative flex items-center gap-3 sm:gap-6">
            {/* Prev Arrow */}
            <button
              type="button"
              onClick={() => scrollReasons('left')}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${
                activeReasonsSet === 0
                  ? 'bg-white text-stone-400 border border-stone-200/60'
                  : 'bg-white text-[#151F19] border border-stone-200 hover:bg-[#1C3F2D] hover:text-white'
              } cursor-pointer`}
              aria-label="Previous reasons"
            >
              <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Horizontal Scroll Track (2 sets of information, hidden scrollbar) */}
            <div
              ref={reasonsTrackRef}
              onScroll={handleReasonsScroll}
              className="flex-1 min-w-0 flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Set 1 */}
              <div className="w-full min-w-full flex-shrink-0 snap-start grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {REASONS.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      {renderReasonIcon(r.iconType)}
                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#151F19] tracking-tight">
                        {r.title}
                      </h3>
                    </div>
                    <p className="font-sans text-xs sm:text-[13px] text-[#4A5C50] leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Set 2 */}
              <div className="w-full min-w-full flex-shrink-0 snap-start grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {REASONS.slice(3, 6).map((r, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      {renderReasonIcon(r.iconType)}
                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#151F19] tracking-tight">
                        {r.title}
                      </h3>
                    </div>
                    <p className="font-sans text-xs sm:text-[13px] text-[#4A5C50] leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={() => scrollReasons('right')}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${
                activeReasonsSet === 1
                  ? 'bg-[#1C3F2D] text-white hover:bg-[#151F19]'
                  : 'bg-white text-[#151F19] border border-stone-200/60 hover:bg-[#1C3F2D] hover:text-white'
              } cursor-pointer`}
              aria-label="Next reasons"
            >
              <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2c: FULL-BLEED NUTRIENT STATS BANNER ================= */}
      <section className="w-full bg-white border-y border-[#E4DDC8]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] md:min-h-[385px] lg:h-[395px] xl:h-[410px]">
          {/* Copy Side */}
          <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#151F19] leading-tight mb-3">
              {content.stats_banner_title ? (
                content.stats_banner_title
              ) : (
                <>
                  Tiny leaves, <em className="italic text-[#FF9F5A] font-normal">massive impact.</em>
                </>
              )}
            </h2>
            <p className="text-sm sm:text-base text-[#5C6B60] leading-relaxed mb-6 max-w-lg">
              {content.stats_banner_subtitle ||
                'Because microgreens are harvested just after the cotyledon leaves emerge, all the energy concentrated in the seed is available right in the young shoot.'}
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-serif italic font-semibold text-3xl sm:text-4xl text-[#1C3F2D] min-w-[7.5rem] flex-shrink-0">
                  {content.stats_item_1_number || '+1500%'}
                </span>
                <span className="text-sm text-[#151F19]">
                  {content.stats_item_1_text ||
                    'Sulforaphane concentration compared to full-grown broccoli'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-serif italic font-semibold text-3xl sm:text-4xl text-[#1C3F2D] min-w-[7.5rem] flex-shrink-0">
                  {content.stats_item_2_number || '+400%'}
                </span>
                <span className="text-sm text-[#151F19]">
                  {content.stats_item_2_text ||
                    'Bioavailable Vitamin C and beta-carotene per gram of greens'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-serif italic font-semibold text-3xl sm:text-4xl text-[#1C3F2D] min-w-[7.5rem] flex-shrink-0">
                  {content.stats_item_3_number || '+600%'}
                </span>
                <span className="text-sm text-[#151F19]">
                  {content.stats_item_3_text ||
                    'Antioxidant capacity (ORAC value) protecting cells against oxidative stress'}
                </span>
              </div>
            </div>
          </div>

          {/* Media Side (Height locked to section height, photo cropped cleanly) */}
          <div className="relative bg-[#E4DDC8] min-h-[260px] lg:h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryImage(
                content.stats_banner_image ||
                  'https://plus.unsplash.com/premium_photo-1703258064295-71c77cc0720f?fm=jpg&q=85&w=1200&auto=format&fit=crop',
                900
              )}
              alt={content.stats_banner_image_alt?.trim() || 'Fresh Microgreens Harvest'}
              width={800}
              height={500}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: REVIEWS ("STRAIGHT FROM THE GUT") ================= */}
      <section className="bg-[#F1EDE3] pt-6 sm:pt-[36px] pb-8 sm:pb-[80px]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="font-serif font-medium text-[22px] min-[380px]:text-[24px] sm:text-[clamp(28px,4vw,40px)] text-[#151F19] leading-tight">
                {content.reviews_title || 'Straight from the gut.'}
              </h2>
              {content.reviews_subtitle && (
                <p className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#5C6B60] mt-1">
                  {content.reviews_subtitle}
                </p>
              )}
            </div>
            <span className="text-[11px] text-[#5C6B60] font-mono tracking-wider sm:hidden pb-0.5">
              Swipe &rarr;
            </span>
          </div>

          <div className="grid grid-rows-2 grid-flow-col auto-cols-[80vw] min-[380px]:auto-cols-[78vw] gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 px-4 pb-2 sm:grid-rows-none sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 lg:grid-cols-4 sm:gap-[22px] sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible">
            {effectiveReviews.map((rev, i) => (
              <div
                key={rev.id || i}
                className="bg-[#FFFDF8] rounded-[10px] pt-3.5 sm:pt-[22px] px-3.5 sm:px-[24px] pb-2 sm:pb-[6px] w-[80vw] min-[380px]:w-[78vw] max-w-[310px] sm:w-auto shrink-0 sm:shrink snap-start h-[126px] sm:h-[150px] flex flex-col justify-between shadow-xs border border-[#E4DDC8]/60"
              >
                <div
                  className="font-sans text-[10.5px] sm:text-[9px] leading-[1.4] sm:leading-[1.53] text-[#151F19] line-clamp-3 sm:line-clamp-5"
                  dangerouslySetInnerHTML={{ __html: rev.review_text }}
                />
                <div className="border-t border-[#E4DDC8] mt-1.5 sm:mt-[14px] mb-0 sm:mb-[4px] pt-1.5 sm:pt-1 flex items-center justify-between">
                  <span className="font-sans font-bold text-[11px] text-[#151F19] truncate pr-2">
                    {rev.reviewer_name}
                  </span>
                  <span className="text-[10px] tracking-[1.5px] sm:tracking-[3px] flex-shrink-0">
                    <span className="text-[#FF9F5A]">{'★'.repeat(rev.rating || 5)}</span>
                    <span className="text-[#D1D5DB]">
                      {'★'.repeat(Math.max(0, 5 - (rev.rating || 5)))}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 4a: COMPARISON BANNER ================= */}
      <section className="bg-[#122A1F] text-[#FFFDF8] py-16">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Title */}
            <div>
              <span className="font-mono text-[11px] tracking-widest uppercase text-[#CFFA57] block mb-2 font-semibold">
                The Real Difference
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-tight">
                Why fresh microgreens beat the <em className="italic text-[#CFFA57] font-normal">supermarket shelf.</em>
              </h2>
              <p className="text-sm text-white/70 mt-3 max-w-md leading-relaxed">
                Vegetables cut days in advance hemorrhage vitamins in freight trucks. We deliver intact
                roots that keep nourishing you until the final bite.
              </p>
            </div>

            {/* Right Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-3 px-2 font-medium text-white/60">Metric</th>
                    <th className="py-3 px-3 font-serif font-bold text-sm bg-[#CFFA57] text-[#122A1F] rounded-t-xl text-center">
                      Wild About Greens
                    </th>
                    <th className="py-3 px-2 font-medium text-white/50 text-center">
                      Grocery Store Greens
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="py-3.5 px-2 text-white/90 font-medium">Harvest Age</td>
                    <td className="py-3.5 px-3 text-center bg-[#CFFA57]/10 font-bold text-[#CFFA57]">
                      Day 10 Peak
                    </td>
                    <td className="py-3.5 px-2 text-center text-white/40">30 to 60 Days (Old)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-2 text-white/90 font-medium">Status at Delivery</td>
                    <td className="py-3.5 px-3 text-center bg-[#CFFA57]/10 font-bold text-[#CFFA57]">
                      Harvested Fresh Tray
                    </td>
                    <td className="py-3.5 px-2 text-center text-white/40">Dead / Cut Days Ago</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-2 text-white/90 font-medium">Water Purity</td>
                    <td className="py-3.5 px-3 text-center bg-[#CFFA57]/10 font-bold text-[#CFFA57]">
                      Mineral RO Water
                    </td>
                    <td className="py-3.5 px-2 text-center text-white/40">Industrial Runoff / Canal</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-2 text-white/90 font-medium">Chemical Sprays</td>
                    <td className="py-3.5 px-3 text-center bg-[#CFFA57]/10 font-bold text-[#CFFA57]">
                      0% Pesticides
                    </td>
                    <td className="py-3.5 px-2 text-center text-white/40">Heavy Residues</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-2 text-white/90 font-medium">Shelf Life in Kitchen</td>
                    <td className="py-3.5 px-3 text-center bg-[#CFFA57]/10 font-bold text-[#CFFA57]">
                      7 to 10 Days Fresh
                    </td>
                    <td className="py-3.5 px-2 text-center text-white/40">Wilts in 48 Hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4b: OTHER GREENS YOU'LL LOVE ================= */}
      {displayOtherGreens.length > 0 && (
        <section className="bg-[#FFFDF8] py-14 sm:py-16 border-b border-[#E4DDC8]">
          <div className="wrap">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#151F19] tracking-tight uppercase mb-6 sm:mb-8">
              OTHER GREENS YOU&apos;LL LOVE
            </h2>

            {/* Carousel Container */}
            <div className="relative">
              {/* Left Arrow Button (only show if more than 4 items) */}
              {displayOtherGreens.length > 4 && (
                <button
                  type="button"
                  onClick={() => scrollOtherGreens('left')}
                  className="absolute -left-3 sm:-left-5 top-[115px] sm:top-[128px] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-[#D5CEC0] shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#151F19] hover:bg-[#151F19] hover:text-white transition-all cursor-pointer"
                  aria-label="Previous greens"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Product Cards Track */}
              <div
                ref={ogTrackRef}
                className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1 px-1"
              >
                {displayOtherGreens.map((item) => {
                  return (
                    <div
                      key={item.slug || item.id}
                      className="w-[230px] sm:w-[255px] flex-shrink-0 flex flex-col justify-between group/card"
                    >
                      <div>
                        {/* Media Square */}
                        <div
                          style={{ backgroundColor: item.bgColor }}
                          className="aspect-square w-full relative overflow-hidden rounded-none sm:rounded-sm mb-3.5 select-none"
                        >
                          {/* Badge */}
                          {item.badge ? (
                            <span className="absolute top-3 left-3 bg-[#112217] text-[#FFFDF8] text-[9.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-[4px] shadow-sm pointer-events-none z-10">
                              {item.badge}
                            </span>
                          ) : null}

                          {/* Product Link / Image */}
                          <Link
                            href={`/products/${item.slug}`}
                            className="block w-full h-full cursor-pointer"
                          >
                            {item.photo || item.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cloudinaryImage(item.photo || item.thumbnail_url || '', 500)}
                                alt={item.thumbnail_alt_text?.trim() || `${item.name} fresh microgreens`}
                                width={400}
                                height={400}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <Sprout className="w-8 h-8 text-emerald-800/40 mb-1" />
                                <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 opacity-70">
                                  {item.name}
                                </span>
                              </div>
                            )}
                          </Link>
                        </div>

                        {/* Title & Subtitles */}
                        <Link href={`/products/${item.slug}`} className="block mb-1">
                          <h3 className="font-serif font-bold text-[16px] sm:text-[17px] text-[#151F19] leading-snug group-hover/card:text-[#285A35] transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="font-mono text-[10.5px] text-[#6E7B72] tracking-tight mb-0.5 leading-none">
                          {item.typeNote}
                        </p>
                        <p className="font-sans text-[11px] text-[#7E8C83] mb-3.5 leading-snug">
                          {item.shelfNote}
                        </p>
                      </div>

                      {/* Action Button */}
                      {item.isBundle ? (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item)}
                          className="w-full py-2.5 px-4 rounded-full bg-[#1C372A] hover:bg-[#12241C] text-[#FFFDF8] font-mono text-[11.5px] font-bold uppercase tracking-wider transition-all text-center cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          ADD TO CART · {formatCleanPrice(item.price_paise)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item)}
                          className="w-full py-2.5 px-4 rounded-full border border-[#151F19] bg-transparent text-[#151F19] font-mono text-[11.5px] font-bold uppercase tracking-wider hover:bg-[#151F19] hover:text-white transition-all text-center cursor-pointer active:scale-[0.98]"
                        >
                          ADD TO CART · {formatCleanPrice(item.price_paise)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Arrow Button (only show if more than 4 items) */}
              {displayOtherGreens.length > 4 && (
                <button
                  type="button"
                  onClick={() => scrollOtherGreens('right')}
                  className="absolute -right-3 sm:-right-5 top-[115px] sm:top-[128px] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-[#D5CEC0] shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#151F19] hover:bg-[#151F19] hover:text-white transition-all cursor-pointer"
                  aria-label="Next greens"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================= SECTION 5a: WHY IS THIS THE RIGHT CHOICE (4 COLOR BLOCKS) ================= */}
      <section className="bg-[#FFFDF8] py-8 sm:py-12 lg:py-16">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="mb-4 sm:mb-8">
            <h2 className="font-serif font-medium text-[22px] min-[380px]:text-[25px] sm:text-[clamp(26px,3.5vw,36px)] text-[#151F19] leading-snug">
              {content.why_choose_title ? (
                content.why_choose_title.includes('right choice') ? (
                  <>
                    {content.why_choose_title.split('right choice')[0]}
                    <span className="underline decoration-[#7BAE6E] decoration-2 underline-offset-4">
                      right choice
                    </span>
                    {content.why_choose_title.split('right choice')[1]}
                  </>
                ) : (
                  content.why_choose_title
                )
              ) : (
                <>
                  Why is this the{' '}
                  <span className="underline decoration-[#7BAE6E] decoration-2 underline-offset-4">
                    right choice
                  </span>{' '}
                  for you?
                </>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-2 min-[900px]:grid-cols-4 gap-2.5 sm:gap-[17px]">
            {[0, 1, 2, 3].map((idx) => {
              const defaultBlock = DEFAULT_WHY_CHOOSE_BLOCKS[idx];
              const pin = whyChoosePins[idx];
              const title = pin?.title || defaultBlock.title;
              const description = pin?.description || defaultBlock.description;
              const bgColor = WHY_CHOOSE_COLORS[idx % WHY_CHOOSE_COLORS.length];

              const imageUrl = pin ? pin.image_url : defaultBlock.image_url;
              const isCocoPeat = idx === 2 || title.toLowerCase().includes('coco-peat');

              const cardContent = imageUrl ? (
                <div
                  style={{ backgroundColor: bgColor }}
                  className="aspect-[1/1.22] sm:aspect-[1/1.32] rounded-xl sm:rounded-none border-0 flex flex-col justify-between overflow-hidden transition-transform duration-300 hover:-translate-y-1 relative"
                >
                  <div className="p-3.5 sm:p-[22px] pb-0 relative z-10">
                    <h3 className="font-sans font-extrabold text-[15px] min-[380px]:text-[16px] sm:text-[22px] lg:text-[24px] leading-[1.15] sm:leading-tight tracking-[-0.01em] text-[#151F19] whitespace-pre-line">
                      {title}
                    </h3>
                    {description && (
                      <p className="font-mono text-[9px] min-[380px]:text-[10px] text-[#5C6B60] tracking-[0.02em] sm:tracking-[0.03em] mt-1 sm:mt-2">
                        {description}
                      </p>
                    )}
                  </div>
                  <div className={`w-full mt-auto ${isCocoPeat ? 'overflow-visible relative' : 'overflow-hidden'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cloudinaryImage(imageUrl, 500)}
                      alt={title.replace('\n', ' ')}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      style={
                        isCocoPeat
                          ? { transform: 'translate(1.5%, -11.5%) scale(1.5)', transformOrigin: 'center' }
                          : undefined
                      }
                      className={`w-full aspect-[4/3] object-contain object-bottom block ${
                        isCocoPeat ? 'scale-[1.5] translate-x-[1.5%] -translate-y-[11.5%] origin-center' : ''
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{ backgroundColor: bgColor }}
                  className="aspect-[1/1.22] sm:aspect-[1/1.32] p-3.5 sm:p-[22px] rounded-xl sm:rounded-none border-0 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
                >
                  <h3 className="font-sans font-extrabold text-[15px] min-[380px]:text-[16px] sm:text-[22px] lg:text-[24px] leading-[1.15] sm:leading-tight tracking-[-0.01em] text-[#151F19] whitespace-pre-line">
                    {title}
                  </h3>
                  {description && (
                    <p className="font-mono text-[9px] min-[380px]:text-[10px] text-[#5C6B60] tracking-[0.02em] sm:tracking-[0.03em] mt-1 sm:mt-2">
                      {description}
                    </p>
                  )}
                </div>
              );

              return pin?.link_url ? (
                <Link key={pin?.id || idx} href={pin.link_url} className="block group h-full">
                  {cardContent}
                </Link>
              ) : (
                <div key={pin?.id || idx} className="block group h-full">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 6: PRODUCT FAQS ACCORDION ================= */}
      {effectiveFaqs.length > 0 && (
        <section className="bg-[#F1EDE3] py-16 sm:py-24 border-t border-[#E4DDC8]/60">
          <div className="max-w-[860px] mx-auto px-4 sm:px-6">
            {/* Pill Badge */}
            <div className="flex justify-center mb-4">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#CFFA57] text-[#122A1F] font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-sm">
                FAQS
              </span>
            </div>

            {/* Heading */}
            <h2 className="font-serif text-[clamp(30px,4.5vw,44px)] text-center text-[#151F19] tracking-tight mb-12 sm:mb-14">
              Got questions? <span className="italic font-normal">Let&apos;s dive in.</span>
            </h2>

            {/* Accordion List */}
            <div className="divide-y divide-[#151F19]/15 border-y border-[#151F19]/15">
              {effectiveFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="transition-colors">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full py-5 sm:py-6 flex items-center justify-between text-left gap-4 focus:outline-none cursor-pointer group"
                      aria-expanded={isOpen}
                    >
                      <span className="font-serif font-bold text-[17.5px] sm:text-[19px] text-[#151F19] group-hover:text-[#285A35] transition-colors leading-snug">
                        {faq.question}
                      </span>
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          isOpen
                            ? 'bg-[#183628] text-white shadow-sm'
                            : 'border border-[#151F19]/30 bg-transparent text-[#151F19] group-hover:border-[#151F19]'
                        }`}
                      >
                        {isOpen ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <p className="pb-6 text-[14.5px] sm:text-[15.5px] text-[#5C6B60] leading-relaxed font-sans pr-6 sm:pr-12 whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= STICKY ADD-TO-CART BAR ================= */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/10 py-3 transition-transform duration-300 shadow-2xl ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="wrap flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryImage(PRODUCT_IMAGES[0]?.url, 120)}
              alt={PRODUCT_IMAGES[0]?.alt || product.name}
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              className="w-11 h-11 rounded-lg object-cover border border-black/10 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="font-serif font-semibold text-sm sm:text-base text-[#151F19] truncate">
                {product.name}
              </div>
              <div className="font-mono text-[10px] sm:text-xs text-[#5C6B60] uppercase">
                <span className="font-bold text-[#1C3F2D]">{formatPrice(effectivePrice)}</span>
                <span className="mx-1.5 opacity-50">·</span>
                <span>
                  {plan === 'subscription'
                    ? `${subWeeks} Wks (${subTrays} ${subTrays === 1 ? 'tray' : 'trays'}/wk)`
                    : selectedVariant.label}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-[#122A1F] hover:bg-[#1C3F2D] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md flex-shrink-0"
          >
            {addedFeedback ? (
              <span className="text-[#CFFA57]">✓ Added!</span>
            ) : (
              <>
                <span>{plan === 'subscription' ? 'Subscribe' : 'Add to Cart'}</span>
                <span>·</span>
                <span>{formatPrice(effectivePrice * (plan === 'subscription' ? 1 : qty))}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
