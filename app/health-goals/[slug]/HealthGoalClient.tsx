'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/cartStore';
import { formatPrice } from '@/lib/format';
import { cldUrl } from '@/lib/cloudinary';
import type { HealthGoal } from '@/lib/healthGoals';
import type { Product, WhyChoosePin, Review } from '@/app/products/page';
import { LeafFavicon, Target, Sprout, Zap } from '@/components/icons';
import { useInvisibleTurnstile } from '@/lib/useTurnstile';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

interface ProductMeta {
  photo: string;
  benefit: string;
  badge: { text: string; bg: string; color: string };
  sleeveDesc: string;
}

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

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    product_id: null,
    reviewer_name: 'Siddhant Tewari',
    reviewer_location: null,
    review_text:
      "It's <strong>very light</strong> like almost drinking water and <strong>no heaviness</strong> on stomach. Fresh microgreens cut right on morning of delivery.",
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
      '<strong>Clean and easy on gut.</strong> I love snipping fresh shoots every morning for breakfast. There is nothing like fresh greens!',
    rating: 5,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'rev-3',
    product_id: null,
    reviewer_name: 'Dr Thanvi',
    reviewer_location: null,
    review_text: "Best quality microgreens I've ever tasted. <strong>Super fresh, non-bloating</strong>, incredible cellular vitality.",
    rating: 5,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'rev-4',
    product_id: null,
    reviewer_name: 'Meera Kapoor',
    reviewer_location: null,
    review_text:
      "No jitters, no crash. Just <strong>steady energy</strong> through my whole workday. Didn't expect such potent vitality from greens.",
    rating: 5,
    display_order: 4,
    is_active: true,
  },
];

const DEFAULT_FAQS = [
  {
    qKey: 'faq_q1',
    aKey: 'faq_a1',
    defaultQ: 'How fresh are the greens when they arrive?',
    defaultA:
      'Every tray is cut after you place your order, not pulled from cold storage. Most orders reach you within a few hours of harvest, freshly packed for peak vitality.',
  },
  {
    qKey: 'faq_q2',
    aKey: 'faq_a2',
    defaultQ: 'How long do they stay fresh at home?',
    defaultA:
      "Refrigerated and unwashed, most varieties hold up well for 5–7 days. We'll include specific care instructions with every order.",
  },
  {
    qKey: 'faq_q3',
    aKey: 'faq_a3',
    defaultQ: 'Are these actually pesticide-free?',
    defaultA:
      "Yes, grown indoors on soil-free racks, with nothing sprayed at any stage. 100% mineral RO water grown.",
  },
  {
    qKey: 'faq_q4',
    aKey: 'faq_a4',
    defaultQ: 'How is delivery handled?',
    defaultA:
      'We harvest on schedule so every fresh tray reaches your doorstep fresh within hours of harvest.',
  },
  {
    qKey: 'faq_q5',
    aKey: 'faq_a5',
    defaultQ: 'How do I choose the right health goal?',
    defaultA:
      'Each microgreen variety concentrates specific phytonutrients. Sulforaphane in broccoli supports immunity & aging, complete proteins in sunflower power fitness recovery, and low GI greens support metabolic balance.',
  },
];

const PRODUCT_METAS: Record<string, ProductMeta> = {
  'broccoli-microgreens': {
    photo: 'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: '40x sulforaphane vs mature head',
    badge: { text: 'BESTSELLER', bg: '#9C4A5C', color: '#FFFDF8' },
    sleeveDesc: 'Sulforaphane dense fresh shoots',
  },
  'sunflower-microgreens': {
    photo: 'https://images.unsplash.com/photo-1613769049987-b31b641f25b1?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: 'Complete plant protein & zinc',
    badge: { text: 'CUSTOMER FAVORITE', bg: '#9C4A5C', color: '#FFFDF8' },
    sleeveDesc: 'Crunchy, nutty protein shoots',
  },
  'radish-microgreens': {
    photo: 'https://images.unsplash.com/photo-1647613233075-e0d5546b0f22?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: 'Vitamins A, C & peppery kick',
    badge: { text: 'PEAK FLAVOUR', bg: '#FF9F5A', color: '#122A1F' },
    sleeveDesc: 'Zesty, spicy fresh garnish',
  },
  'classic-trio-bundle': {
    photo: 'https://plus.unsplash.com/premium_photo-1703258064295-71c77cc0720f?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: '3 fresh trays · all varieties',
    badge: { text: 'VALUE BUNDLE', bg: '#9C4A5C', color: '#FFFDF8' },
    sleeveDesc: 'Broccoli, Radish & Sunflower trio',
  },
  'carrot-microgreens': {
    photo: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: 'Beta carotene & gentle sweetness',
    badge: { text: 'FRESH HARVEST', bg: '#E07A5F', color: '#FFFDF8' },
    sleeveDesc: 'Sweet carrot fresh shoots',
  },
};

function getProductMeta(product: Product): ProductMeta {
  if (PRODUCT_METAS[product.slug]) {
    return PRODUCT_METAS[product.slug];
  }
  return {
    photo: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: 'Fresh greens · peak density',
    badge: { text: 'FRESH HARVEST', bg: '#3E8F52', color: '#FFFDF8' },
    sleeveDesc: 'Locally grown fresh microgreens',
  };
}

export default function HealthGoalClient({
  currentGoal,
  allGoals,
  products,
  content = {},
  whyChoosePins = [],
  reviews = [],
}: {
  currentGoal: HealthGoal;
  allGoals: HealthGoal[];
  products: Product[];
  content?: Record<string, string>;
  whyChoosePins?: WhyChoosePin[];
  reviews?: Review[];
}) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [whyChooseBlocks, setWhyChooseBlocks] = useState<WhyChoosePin[]>(whyChoosePins);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterHoneypot, setNewsletterHoneypot] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const {
    containerRef: newsletterCaptchaRef,
    getTokenBeforeSubmit: getNewsletterCaptchaToken,
    reset: resetNewsletterCaptcha,
  } = useInvisibleTurnstile();

  const addItem = useCartStore((s) => s.addItem);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterStatus('loading');
    setNewsletterMessage('');
    try {
      const captchaToken = await getNewsletterCaptchaToken();
      if (!captchaToken) {
        setNewsletterStatus('error');
        setNewsletterMessage('Security check in progress. Please try again in a moment.');
        return;
      }

      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          source: `health_goal_${currentGoal.slug}`,
          turnstileToken: captchaToken,
          website: newsletterHoneypot,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterMessage(data.message || "Thanks! We'll email your 15% code soon.");
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('Failed to connect. Please check your internet connection.');
    } finally {
      resetNewsletterCaptcha();
    }
  };

  useEffect(() => {
    fetch('/api/pins/product_listing_why_choose')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWhyChooseBlocks(data);
        }
      })
      .catch(() => {});
  }, []);

  const effectiveReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  const handleAddToCart = (product: Product) => {
    const activeVar = product.variants.find((v) => v.is_active) || product.variants[0];
    const price = activeVar ? activeVar.price_paise : 9900;
    const variantId = activeVar ? activeVar.id : product.id;
    const label = activeVar ? activeVar.label : '100g tray';
    const meta = getProductMeta(product);
    const thumb = product.thumbnail_url || product.images?.[0]?.image_url || meta.photo;

    addItem({
      variantId,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: label,
      pricePaise: price,
      maxStock: activeVar?.stock_qty || 20,
      thumbnailUrl: thumb,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('goal-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white text-[#151F19] min-h-screen">
        {/* ================= SECTION 1: GOAL HERO BANNER ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 min-h-[82vh]">
          {/* Left Column: Forest Copy */}
          <div className="bg-[#1C3F2D] text-[#FFFDF8] flex flex-col justify-center pt-36 pb-20 px-8 sm:px-14 lg:px-20">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#B7E23F] font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/15">
                {currentGoal.heroEyebrow}
              </span>
              <span className="font-mono text-[10px] tracking-wider uppercase bg-[#CFFA57] text-[#122A1F] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                {currentGoal.tag}
              </span>
            </div>

            <h1 className="font-serif font-medium text-4xl sm:text-5xl lg:text-6xl leading-[1.06] tracking-tight max-w-lg mb-6">
              Shop for{' '}
              <em className="italic text-[#CFFA57] font-normal">{currentGoal.title}.</em>
            </h1>

            <p className="text-base sm:text-lg text-white/90 font-serif italic mb-3">
              {currentGoal.heroTitle}
            </p>

            <p className="text-sm sm:text-base text-white/80 max-w-md leading-relaxed mb-8">
              {currentGoal.heroSubtitle}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#CFFA57] hover:bg-[#bde848] text-[#122A1F] font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:-translate-y-0.5"
              >
                <span>View Trays ({products.length})</span>
                <span>↓</span>
              </button>
              <Link
                href="/#goals"
                className="font-mono text-xs text-white/70 hover:text-white underline transition-colors"
              >
                All 8 Goals
              </Link>
            </div>
          </div>

          {/* Right Column: High-Res Photo for this Goal */}
          <div
            className="relative min-h-[340px] md:min-h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${currentGoal.heroImage}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 md:bg-black/10" />
            <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 z-10">
              <span className="inline-flex items-center gap-1.5 bg-[#122A1F]/90 backdrop-blur-md text-[#FFFDF8] font-mono text-[11px] tracking-wide px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
                <Target className="w-3.5 h-3.5 text-[#CFFA57] shrink-0" />
                <span>{currentGoal.title} · {currentGoal.subtitle}</span>
              </span>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: 8 HEALTH GOALS STICKY PILLS BAR ================= */}
        <nav
          id="goal-catalog"
          className="sticky top-16 z-30 bg-[#FFFDF8] border-b border-[#E4DDC8] py-4 px-4 sm:px-8 shadow-sm backdrop-blur-md"
        >
          <div className="max-w-[1180px] mx-auto flex gap-2 overflow-x-auto scrollbar-none items-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C6B60] font-semibold pr-2 border-r border-[#E4DDC8] hidden sm:inline-flex items-center gap-1.5 flex-shrink-0">
              <Target className="w-3.5 h-3.5 text-[#1C3F2D] shrink-0" />
              <span>Goals:</span>
            </span>

            {allGoals.map((goal) => {
              const isActive = goal.id === currentGoal.id || goal.slug === currentGoal.slug;
              return (
                <Link
                  key={goal.id}
                  href={`/health-goals/${goal.slug}`}
                  className={`flex-shrink-0 font-mono text-xs tracking-wider uppercase font-semibold px-4 py-2 rounded-full border transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1C3F2D] text-[#FFFDF8] border-[#1C3F2D] font-bold shadow-sm'
                      : 'border-[#E4DDC8] text-[#5C6B60] bg-[#FFFDF8] hover:border-[#1C3F2D] hover:text-[#1C3F2D]'
                  }`}
                >
                  <span>{goal.icon}</span>
                  <span>{goal.title}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CFFA57] ml-0.5 inline-block" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ================= SECTION 3: PRODUCT CATALOG GRID / CAROUSEL ================= */}
        <div className="py-14 max-w-[1180px] mx-auto px-4 sm:px-8">
          {/* Header Info */}
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#1C3F2D] bg-[#CFFA57]/30 px-2.5 py-1 rounded-full">
                {currentGoal.tag} · {products.length} {products.length === 1 ? 'Variety' : 'Varieties'}
              </span>
            </div>
            <h2 className="font-display uppercase text-3xl sm:text-4xl tracking-wide text-[#151F19] mb-3">
              {currentGoal.title} Selection
            </h2>
            <p className="text-sm sm:text-base text-[#5C6B60] leading-relaxed">
              Fresh microgreen varieties specifically mapped for {currentGoal.title.toLowerCase()}. Cut fresh to order on harvest morning for maximum cellular potency.
            </p>
          </div>

          {/* Product Cards Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
              {products.map((product) => {
                const meta = getProductMeta(product);
                const isBundle = Boolean(
                  product.is_bundle ||
                  product.categories?.some((c) => c.toLowerCase().includes('bundle')) ||
                  product.slug.toLowerCase().includes('bundle') ||
                  product.name.toLowerCase().includes('bundle')
                );
                const activeVar =
                  product.variants.find((v) => v.is_active) || product.variants[0];
                const pricePaise = activeVar ? activeVar.price_paise : 9900;
                const isAdded = !!addedIds[product.id];

                const rawCardImage =
                  product.thumbnail_url ||
                  product.images?.[0]?.image_url ||
                  meta.photo;
                const cardImage = cldUrl(rawCardImage, 500);

                return (
                  <div
                    key={product.id}
                    className="flex flex-col justify-between group bg-[#FFFDF8] rounded-2xl p-3.5 border border-[#E4DDC8] shadow-xs hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Vertical Clamshell Card */}
                      <Link
                        href={`/products/${product.slug}`}
                        className="block relative rounded-[16px] aspect-[1/1.3] overflow-hidden mb-3.5 border border-[#E4DDC8] shadow-xs bg-gradient-to-br from-[#EEF1EE] to-[#DFE4DF] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md cursor-pointer"
                      >
                        {/* Product Tag Badge */}
                        <span
                          style={{
                            backgroundColor: meta.badge.bg,
                            color: meta.badge.color,
                          }}
                          className="absolute top-2.5 left-2.5 z-20 font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1.5"
                        >
                          <LeafFavicon className="w-3 h-3" />
                          <span>{product.badge_label || meta.badge.text}</span>
                        </span>

                        {/* Background Living Greens Photo */}
                        {cardImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cardImage}
                            alt={product.thumbnail_alt_text || product.name}
                            width={400}
                            height={520}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#E6EBE4] to-[#D5DDD2] flex flex-col items-center justify-center p-4">
                            <Sprout className="w-10 h-10 text-emerald-800/40 mb-1" />
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#5C6B60] opacity-75">
                              Fresh Greens
                            </span>
                          </div>
                        )}

                        {/* Clamshell Lid Inset Sheen */}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_6px_rgba(255,255,255,0.45),inset_0_0_15px_rgba(255,255,255,0.3)]">
                          <div className="absolute top-2 left-2 right-1/2 bottom-3/5 rounded-md bg-gradient-to-br from-white/35 to-transparent -rotate-6" />
                        </div>

                        {/* Vertical Branded Sleeve Down Left Portion */}
                        <div className="absolute top-[8%] bottom-[8%] left-[8%] w-[50%] rounded-xl overflow-hidden flex flex-col bg-white/95 backdrop-blur-sm shadow-xl z-10 border border-black/5">
                          {/* Sleeve Top Photo Thumbnail */}
                          <div className="h-[28%] overflow-hidden relative bg-[#EDE7D6]">
                            {cardImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cardImage}
                                alt={product.thumbnail_alt_text || product.name}
                                width={200}
                                height={140}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs opacity-50 text-emerald-800">
                                <Sprout className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          {/* Sleeve Body */}
                          <div className="flex-1 p-2 flex flex-col justify-between">
                            <div>
                              <div className="font-serif font-bold text-[8px] tracking-wide text-[#1C3F2D] flex items-center gap-1 mb-1">
                                <Sprout className="w-2.5 h-2.5" /> WAG
                              </div>
                              <h5 className="font-serif font-bold text-[11px] leading-tight text-[#151F19] mb-1 line-clamp-2">
                                {product.name}
                              </h5>
                              <p className="text-[7.5px] text-[#33402F] leading-tight line-clamp-3">
                                {meta.sleeveDesc}
                              </p>
                            </div>

                            <div className="font-mono text-[5.5px] uppercase tracking-wider text-[#5C6B60] pt-1 border-t border-black/10">
                              {isBundle ? 'HARVEST BUNDLE · DAY 10' : '100G FRESH TRAY · DAY 10'}
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Product Title */}
                      <Link href={`/products/${product.slug}`}>
                        <h4 className="font-serif font-semibold text-[17px] text-[#151F19] mb-2 hover:text-[#1C3F2D] transition-colors leading-snug line-clamp-1">
                          {product.name}
                        </h4>
                      </Link>

                      {/* Info Rows */}
                      <div className="border-t border-b border-[#E4DDC8] py-2 mb-3 space-y-1.5 text-xs text-[#5C6B60]">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-[#1C3F2D] shrink-0" />
                          <span className="truncate">{product.highlight_1 || meta.benefit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sprout className="w-3.5 h-3.5 text-[#3E8F52] shrink-0" />
                          <span className="truncate">
                            {product.highlight_2 || (isBundle ? 'Fresh bundle · 7-10 days fresh' : 'Fresh tray · 7-10 days fresh')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action Row */}
                    <div>
                      <div className="font-mono font-bold text-[15px] text-[#122A1F] mb-3">
                        {formatPrice(pricePaise)}{' '}
                        <span className="font-normal text-[11px] text-[#5C6B60] uppercase">
                          / {isBundle ? 'bundle' : 'tray'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 text-center font-mono text-[10.5px] font-bold tracking-wider uppercase py-2.5 rounded-full border border-[#1C3F2D] text-[#1C3F2D] hover:bg-[#1C3F2D] hover:text-[#FFFDF8] transition-all"
                        >
                          Details
                        </Link>

                        <button
                          onClick={() => handleAddToCart(product)}
                          className="px-4 py-2.5 rounded-full bg-[#122A1F] hover:bg-[#1C3F2D] text-[#FFFDF8] font-mono text-[10.5px] font-bold tracking-wider uppercase transition-all shadow-sm"
                          title="Add to cart"
                        >
                          {isAdded ? (
                            <span className="text-[#CFFA57]">✓</span>
                          ) : (
                            <span>+ Add</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#FFFDF8] border border-dashed border-[#E4DDC8] rounded-2xl p-10 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#EBF5EE] text-[#1C3F2D] flex items-center justify-center mx-auto mb-3">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#151F19] mb-2">
                No trays currently mapped to {currentGoal.title}
              </h3>
              <p className="text-sm text-[#5C6B60] mb-6">
                Our farm harvests fresh trays across all varieties weekly. You can browse our complete tray catalogue or assign products in the admin panel.
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/health-goals/all-trays"
                  className="px-5 py-2.5 rounded-full bg-[#1C3F2D] text-[#FFFDF8] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#122A1F] transition-all"
                >
                  Browse All Trays
                </Link>
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-full border border-[#1C3F2D] text-[#1C3F2D] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#1C3F2D] hover:text-[#FFFDF8] transition-all"
                >
                  Full Store
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 4: TRUST HERO BANNER ================= */}
        <section className="relative overflow-hidden bg-[#0F1C12] text-[#FFFDF8] min-h-[320px] flex items-center my-12">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${currentGoal.heroImage}')`,
            }}
          />
          <div
            className="absolute inset-0 z-1"
            style={{
              background:
                'linear-gradient(100deg, rgba(10,20,13,.82) 0%, rgba(10,20,13,.65) 45%, rgba(10,20,13,.25) 75%, rgba(10,20,13,0) 100%)',
            }}
          />

          <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-8 w-full py-14">
            <div className="max-w-2xl">
              <h2 className="font-serif font-medium text-[clamp(28px,4vw,48px)] leading-[1.08] tracking-tight mb-4 text-[#FFFDF8]">
                {content.trust_title ? (
                  content.trust_title.includes('\n') ? (
                    <>
                      {content.trust_title.split('\n')[0]}
                      <br />
                      <em className="italic text-[#CFFA57] font-normal">
                        {content.trust_title.split('\n').slice(1).join('\n')}
                      </em>
                    </>
                  ) : (
                    content.trust_title
                  )
                ) : (
                  <>
                    Every tray harvested,
                    <br />
                    <em className="italic text-[#CFFA57] font-normal">
                      never pulled from cold storage.
                    </em>
                  </>
                )}
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-lg mb-6 leading-relaxed">
                {content.trust_subtitle ||
                  'Fresh microgreens cut on delivery morning for optimal cellular density. Snip fresh daily into your meals.'}
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFFDF8] text-[#122A1F] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#CFFA57] transition-all shadow-md"
              >
                <span>Shop All Microgreens</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: WHY CHOOSE WGA ================= */}
        <section className="py-16 max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[#1C3F2D] font-bold bg-[#CFFA57]/40 px-3.5 py-1 rounded-full">
              Purity &amp; Quality
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-[#151F19] mt-3">
              Why Choose Wild About Greens?
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(whyChooseBlocks.length > 0 ? whyChooseBlocks : DEFAULT_WHY_CHOOSE_BLOCKS).map((item, idx) => (
              <div
                key={idx}
                style={{ backgroundColor: WHY_CHOOSE_COLORS[idx % WHY_CHOOSE_COLORS.length] }}
                className="rounded-2xl p-6 flex flex-col justify-between border border-black/5 shadow-xs hover:-translate-y-1 transition-transform"
              >
                <div className="mb-6">
                  {item.image_url && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/70 p-2 mb-4 border border-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cldUrl(item.image_url, 120)}
                        alt={item.title}
                        width={56}
                        height={56}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <h4 className="font-serif font-bold text-xl text-[#122A1F] whitespace-pre-line mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#33402F] leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#1C3F2D]/60 font-semibold">
                  Standard #0{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SECTION 6: REVIEWS ================= */}
        <section className="py-16 bg-[#F1EDE3] border-t border-[#E4DDC8]/60">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#1C3F2D] font-bold">
                  Verified Reviews
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl text-[#151F19] mt-1">
                  What Our Customers Say
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[#F59E0B] text-lg font-bold">
                <span>★★★★★</span>
                <span className="text-xs font-mono text-[#5C6B60] ml-2">4.9 / 5.0 Average</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {effectiveReviews.slice(0, 4).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#E4DDC8] shadow-xs flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <div className="text-amber-500 text-xs mb-2">
                      {'★'.repeat(rev.rating)}
                    </div>
                    <p
                      className="text-xs text-[#33402F] leading-relaxed italic"
                      dangerouslySetInnerHTML={{ __html: rev.review_text }}
                    />
                  </div>
                  <div className="pt-3 border-t border-[#E4DDC8] flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-[#122A1F]">
                      {rev.reviewer_name}
                    </span>
                    <span className="text-[10px] font-mono text-[#3E8F52] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= SECTION 7: FAQS ACCORDION ================= */}
        <section className="py-16 max-w-[800px] mx-auto px-4 sm:px-8">
          <div className="text-center mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-[#1C3F2D] font-bold bg-[#CFFA57]/40 px-3.5 py-1 rounded-full">
              Got Questions?
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-[#151F19] mt-3">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {DEFAULT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#FFFDF8] rounded-xl border border-[#E4DDC8] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-serif font-semibold text-base text-[#122A1F] hover:text-[#1C3F2D] transition-colors"
                  >
                    <span>{faq.defaultQ}</span>
                    <span className="text-sm font-mono text-[#5C6B60]">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-sm text-[#5C6B60] leading-relaxed border-t border-gray-100">
                          {faq.defaultA}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= SECTION 8: NEWSLETTER ================= */}
        <section className="bg-[#1C3F2D] text-[#FFFDF8] py-16 px-4 sm:px-8">
          <div className="max-w-[700px] mx-auto text-center">
            <span className="font-mono text-[11px] tracking-widest uppercase text-[#CFFA57] font-semibold">
              Join The Harvest Circle
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl mt-2 mb-3">
              Get 15% off your first order.
            </h3>
            <p className="text-sm text-white/80 max-w-md mx-auto mb-6">
              Subscribe for harvest drops, microgreen care tips, and exclusive seasonal variety discounts.
            </p>

            <form onSubmit={handleNewsletterSubscribe} className="max-w-md mx-auto space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white placeholder-white/50 border border-white/20 text-sm focus:outline-none focus:border-[#CFFA57] transition-all"
                />
                <input
                  type="text"
                  name="website"
                  value={newsletterHoneypot}
                  onChange={(e) => setNewsletterHoneypot(e.target.value)}
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    width: 0,
                    height: 0,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'loading'}
                  className="px-6 py-3 rounded-full bg-[#CFFA57] hover:bg-[#bde848] text-[#122A1F] font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md"
                >
                  {newsletterStatus === 'loading' ? 'Joining...' : 'Subscribe'}
                </button>
              </div>

              {/* Invisible Captcha container — zero visual footprint to preserve exact design */}
              <div
                ref={newsletterCaptchaRef}
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  overflow: 'hidden',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />

              {newsletterMessage && (
                <p
                  className={`text-xs ${
                    newsletterStatus === 'success' ? 'text-[#CFFA57]' : 'text-red-300'
                  }`}
                >
                  {newsletterMessage}
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
  );
}
