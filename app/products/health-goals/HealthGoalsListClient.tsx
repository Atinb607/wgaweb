'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/cartStore';
import { formatPrice, cloudinaryImage } from '@/lib/format';
import { cldSrcSet } from '@/lib/cloudinary';
import { LeafFavicon, Sprout, Zap, Target } from '@/components/icons';
import { renderNewsletterTitle } from '@/lib/newsletterBanner';
import { useInvisibleTurnstile } from '@/lib/useTurnstile';
import type { Product, WhyChoosePin, Review, SamplerVariantData } from '@/app/products/page';
import type { HealthGoalContentItem } from '@/app/[panelKey]/health-goals/page';
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
      "Yes, grown indoors on soil-free racks, with nothing sprayed at any stage. We're working toward publishing third-party lab results as we scale.",
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
    defaultQ: 'Can restaurants order in bulk?',
    defaultA:
      'Yes, we supply top restaurants in Tricity with weekly recurring fresh harvests. Drop us an inquiry through our contact form.',
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

export default function HealthGoalsListClient({
  initialProducts,
  initialGoals,
  content = {},
  initialWhyChoosePins = [],
  reviews = [],
  samplerVariant = null,
}: {
  initialProducts: Product[];
  initialGoals: HealthGoalContentItem[];
  content?: Record<string, string>;
  initialWhyChoosePins?: WhyChoosePin[];
  reviews?: Review[];
  samplerVariant?: SamplerVariantData | null;
}) {
  const searchParams = useSearchParams();
  const goalQueryParam = searchParams.get('goal');

  // Active goals list memoized so array reference remains stable across re-renders
  const activeGoals = useMemo(
    () => initialGoals.filter((g) => g.is_active),
    [initialGoals]
  );

  // Initialize selectedGoal from query param on first render without flash
  const [selectedGoal, setSelectedGoal] = useState<string | null>(() => {
    if (!goalQueryParam) return null;
    const match = initialGoals.find(
      (g) => g.is_active && (g.slug === goalQueryParam || g.id === goalQueryParam || g.slug.includes(goalQueryParam))
    );
    return match ? match.slug : null;
  });

  const lastSyncedGoalRef = useRef<string | null>(goalQueryParam);
  const initialScrollDoneRef = useRef(false);

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [whyChoosePins, setWhyChoosePins] = useState<WhyChoosePin[]>(initialWhyChoosePins);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterHoneypot, setNewsletterHoneypot] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    containerRef: newsletterCaptchaRef,
    getTokenBeforeSubmit: getNewsletterCaptchaToken,
    reset: resetNewsletterCaptcha,
  } = useInvisibleTurnstile();

  // Initial scroll to catalog when arriving with a goal param
  useEffect(() => {
    if (goalQueryParam && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      const el = document.getElementById('goals-catalog');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }
  }, [goalQueryParam]);

  // Sync if goalQueryParam changes via external router navigation
  useEffect(() => {
    if (goalQueryParam !== lastSyncedGoalRef.current) {
      lastSyncedGoalRef.current = goalQueryParam;
      if (goalQueryParam) {
        const match = activeGoals.find(
          (g) => g.slug === goalQueryParam || g.id === goalQueryParam || g.slug.includes(goalQueryParam)
        );
        if (match) {
          setSelectedGoal(match.slug);
        }
      } else {
        setSelectedGoal(null);
      }
    }
  }, [goalQueryParam, activeGoals]);

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const current = params.get('goal');
      lastSyncedGoalRef.current = current;
      if (current) {
        const match = activeGoals.find(
          (g) => g.slug === current || g.id === current || g.slug.includes(current)
        );
        setSelectedGoal(match ? match.slug : null);
      } else {
        setSelectedGoal(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeGoals]);

  const handleSelectGoal = (slug: string | null) => {
    setSelectedGoal(slug);
    lastSyncedGoalRef.current = slug;

    try {
      const url = new URL(window.location.href);
      if (slug) {
        url.searchParams.set('goal', slug);
      } else {
        url.searchParams.delete('goal');
      }
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {
      // ignore
    }
  };

  // Load pins if empty
  useEffect(() => {
    if (initialWhyChoosePins.length === 0) {
      fetch('/api/pins?group=product_listing_why_choose')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setWhyChoosePins(data);
          }
        })
        .catch(() => {});
    }
  }, [initialWhyChoosePins.length]);

  const effectiveReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;
  const addItem = useCartStore((s) => s.addItem);

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

  const scrollTrack = (goalKey: string, dir: 'left' | 'right') => {
    const el = carouselRefs.current[goalKey];
    if (!el) return;
    const offset = dir === 'left' ? -280 : 280;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('goals-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterStatus('loading');
    setNewsletterMessage('');
    try {
      const captchaToken = await getNewsletterCaptchaToken({
        title: 'Claim Your 15% Discount',
        subtitle: 'Please complete the quick verification below so we can email your 15% discount code.',
      });
      if (!captchaToken) {
        setNewsletterStatus('error');
        setNewsletterMessage('Please complete the security check to continue.');
        return;
      }

      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          source: 'health-goals-plp',
          honeypot: newsletterHoneypot,
          turnstileToken: captchaToken,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterMessage(data.message || "Thanks! We'll email your 15% code soon.");
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.error || 'Failed to subscribe. Please try again.');
        resetNewsletterCaptcha();
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('Network error. Please try again later.');
      resetNewsletterCaptcha();
    }
  };

  // Helper to get products mapped to a goal
  const getProductsForGoal = (goal: HealthGoalContentItem) => {
    if (goal.id === 'all-trays' || goal.slug === 'all-trays') {
      return initialProducts;
    }
    return initialProducts.filter((p) =>
      p.health_goals?.some((g: string) => g === goal.id || g === goal.slug)
    );
  };

  return (
    <div className="bg-white text-[#151F19] min-h-screen">
      {/* ================= SECTION 1: HEALTH GOALS HERO ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
        {/* Left Column: Forest Copy */}
        <div className="bg-[#1C3F2D] text-[#FFFDF8] flex flex-col justify-center pt-36 pb-20 px-8 sm:px-14 lg:px-20">
          <div className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-[#B7E23F] mb-5 font-semibold flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[#CFFA57]" />
            <span>
              {content.health_goals_eyebrow
                ? content.health_goals_eyebrow.replace(/^[^\w\s]+\s*/, '')
                : 'TARGETED NUTRITION · LIVING HARVEST'}
            </span>
          </div>

          <h1 className="font-serif font-medium text-4xl sm:text-5xl lg:text-6xl leading-[1.06] tracking-tight max-w-lg mb-6">
            {content.health_goals_hero_title ? (
              content.health_goals_hero_title.includes('*') ? (
                <>
                  {content.health_goals_hero_title.split('*')[0]}
                  <em className="italic text-[#CFFA57] font-normal">
                    {content.health_goals_hero_title.split('*')[1]}
                  </em>
                  {content.health_goals_hero_title.split('*')[2] || ''}
                </>
              ) : (
                content.health_goals_hero_title
              )
            ) : (
              <>
                Shop microgreens by{' '}
                <em className="italic text-[#CFFA57] font-normal">health goal.</em>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-white/80 max-w-md leading-relaxed mb-8">
            {content.health_goals_hero_subtitle || (
              <>
                Living microgreen varieties curated for specific physiological goals. Cut fresh to order on harvest morning for maximum cellular potency.
              </>
            )}
          </p>

          <button
            onClick={scrollToCatalog}
            className="w-10 h-10 rounded-full border border-white/35 flex items-center justify-center text-white hover:bg-white/10 hover:border-white transition-all animate-bounce cursor-pointer"
            aria-label="Scroll to catalog"
          >
            ↓
          </button>
        </div>

        {/* Right Column: High-Res Greens Photo */}
        <div className="relative min-h-[320px] md:min-h-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cloudinaryImage(
              content.health_goals_hero_image_url ||
                'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=webp&q=80&w=1080&auto=format&fit=crop',
              960
            )}
            srcSet={cldSrcSet(
              content.health_goals_hero_image_url ||
                'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=webp&q=80&w=1080&auto=format&fit=crop',
              [480, 768, 960, 1280]
            )}
            sizes="(max-width: 768px) 100vw, 50vw"
            alt={content.health_goals_hero_image_url_alt?.trim() || 'Shop microgreens by health goal'}
            width={1200}
            height={900}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/10 md:bg-transparent" />
        </div>
      </section>

      {/* ================= SECTION 2: STICKY GOALS PILLS BAR ================= */}
      <nav
        id="goals-catalog"
        className="sticky top-16 z-30 bg-[#FFFDF8] border-b border-[#E4DDC8] py-4 px-4 sm:px-8 shadow-sm backdrop-blur-md"
      >
        <div className="max-w-[1180px] mx-auto flex gap-2.5 overflow-x-auto scrollbar-none items-center">
          <button
            onClick={() => handleSelectGoal(null)}
            className={`flex-shrink-0 font-mono text-xs tracking-wider uppercase font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer ${
              selectedGoal === null
                ? 'bg-[#CFFA57] text-[#122A1F] border-[#CFFA57] font-bold shadow-sm'
                : 'border-[#E4DDC8] text-[#5C6B60] hover:border-[#1C3F2D] hover:text-[#1C3F2D]'
            }`}
          >
            All Goals
          </button>

          {activeGoals.map((goal) => {
            const isSelected = selectedGoal === goal.slug;
            const prodsCount = getProductsForGoal(goal).length;

            return (
              <button
                key={goal.id}
                onClick={() => handleSelectGoal(selectedGoal === goal.slug ? null : goal.slug)}
                className={`flex-shrink-0 font-mono text-xs tracking-wider uppercase font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1C3F2D] text-[#FFFDF8] border-[#1C3F2D] shadow-sm'
                    : 'border-[#E4DDC8] text-[#5C6B60] hover:border-[#1C3F2D] hover:text-[#1C3F2D]'
                }`}
              >
                {goal.icon && (
                  <span className="text-xs">{goal.icon}</span>
                )}
                <span>{goal.title}</span>
                <span className={`text-[10px] font-mono ml-0.5 px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-[#CFFA57]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {prodsCount}
                </span>
              </button>
            );
          })}

          {/* Reciprocal link to main products page (All Greens by Category) */}
          <Link
            href="/products"
            className="flex-shrink-0 font-mono text-xs tracking-wider uppercase font-bold px-4 py-2 rounded-full bg-[#1C3F2D] text-[#CFFA57] border border-[#1C3F2D] hover:bg-[#122A1F] transition-all ml-auto flex items-center gap-1.5 shadow-sm"
          >
            <Sprout className="w-3.5 h-3.5 text-[#CFFA57]" />
            <span>All Greens (By Category)</span>
          </Link>
        </div>
      </nav>

      {/* ================= SECTION 3: PRODUCT CATALOG CAROUSELS / GRIDS ================= */}
      <div className="py-14 space-y-16">
        {selectedGoal !== null && (
          <div className="max-w-[1180px] mx-auto px-4 sm:px-8 -mt-6 mb-8 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs sm:text-sm text-[#5C6B60]">
              Showing filtered goal: <span className="font-semibold text-[#1C3F2D]">{activeGoals.find((g) => g.slug === selectedGoal)?.title || selectedGoal}</span>
            </p>
            <button
              onClick={() => handleSelectGoal(null)}
              className="text-xs font-mono uppercase tracking-wider font-bold text-[#1C3F2D] hover:underline flex items-center gap-1 cursor-pointer bg-[#CFFA57]/30 hover:bg-[#CFFA57]/50 px-3 py-1.5 rounded-full border border-[#CFFA57]"
            >
              <span>✕ Show All Health Goals</span>
            </button>
          </div>
        )}
        {activeGoals
          .filter((goal) => selectedGoal === null || selectedGoal === goal.slug)
          .map((goal) => {
            const prods = getProductsForGoal(goal);
            if (prods.length === 0 && selectedGoal === null) return null;

            return (
              <section key={goal.id} className="max-w-[1180px] mx-auto px-4 sm:px-8">
                {/* Goal Header */}
                <div className="max-w-2xl mb-8">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#CFFA57]/40 text-[#1C3F2D] border border-[#CFFA57]">
                      {goal.tag || 'HEALTH GOAL'}
                    </span>
                    {goal.subtitle && (
                      <span className="text-xs text-[#5C6B60] font-medium">
                        · {goal.subtitle}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display uppercase text-2xl sm:text-3xl tracking-wide text-[#151F19] mb-2">
                    {goal.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C6B60] leading-relaxed">
                    {goal.popup_title || goal.popup_description || 'Living greens providing natural bioavailability.'}
                  </p>
                  {goal.popup_description && goal.popup_title && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      {goal.popup_description}
                    </p>
                  )}
                </div>

                {prods.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500">
                    {content.empty_goal_message || 'No products currently assigned to this health goal. Check back soon!'}
                  </div>
                ) : (
                  /* Carousel Container */
                  <div className="relative">
                    {/* Arrow Left (only show if more than 4 products) */}
                    {prods.length > 4 && (
                      <button
                        onClick={() => scrollTrack(goal.slug, 'left')}
                        className="hidden sm:flex absolute left-[-16px] top-[32%] z-10 w-10 h-10 rounded-full bg-[#FFFDF8] border border-[#E4DDC8] items-center justify-center text-[#122A1F] hover:bg-[#1C3F2D] hover:text-[#FFFDF8] hover:border-[#1C3F2D] transition-all shadow-md cursor-pointer"
                        aria-label="Previous products"
                      >
                        ‹
                      </button>
                    )}

                    {/* Track */}
                    <div
                      ref={(el) => {
                        carouselRefs.current[goal.slug] = el;
                      }}
                      className="flex gap-6 overflow-x-auto scroll-snap-x mandatory scrollbar-none pb-4 pt-1 px-1"
                    >
                      {prods.map((product) => {
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
                        const cardImage = cloudinaryImage(rawCardImage, 600);
                        const cardAlt =
                          product.thumbnail_alt_text?.trim() ||
                          `${product.name} fresh microgreens`;

                        return (
                          <div
                            key={product.id}
                            className="flex-shrink-0 w-64 sm:w-64 scroll-snap-start flex flex-col justify-between group"
                          >
                            <div>
                              {/* ================= VERTICAL CLAMSHELL CARD ================= */}
                              <Link
                                href={`/products/${product.slug}`}
                                className="block relative rounded-[18px] aspect-[1/1.34] overflow-hidden mb-3.5 border border-[#E4DDC8] shadow-sm bg-gradient-to-br from-[#EEF1EE] to-[#DFE4DF] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg cursor-pointer"
                              >
                                {/* Product Tag Badge */}
                                <span
                                  style={{
                                    backgroundColor: meta.badge.bg,
                                    color: meta.badge.color,
                                  }}
                                  className="absolute top-3 left-3 z-20 font-mono text-[9.5px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5"
                                >
                                  <LeafFavicon className="w-3.5 h-3.5" />
                                  <span>{product.badge_label || meta.badge.text}</span>
                                </span>

                                {/* Background Living Greens Photo */}
                                {cardImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={cardImage}
                                    alt={cardAlt}
                                    width={500}
                                    height={670}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#E6EBE4] to-[#D5DDD2] flex flex-col items-center justify-center p-4">
                                    <Sprout className="w-10 h-10 text-emerald-800/40 mb-1" />
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#5C6B60] opacity-75">Fresh Greens</span>
                                  </div>
                                )}

                                {/* Clamshell Lid Inset Sheen */}
                                <div className="absolute inset-0 pointer-events-none rounded-[18px] shadow-[inset_0_0_0_8px_rgba(255,255,255,0.45),inset_0_0_20px_rgba(255,255,255,0.3)]">
                                  <div className="absolute top-2 left-2 right-1/2 bottom-3/5 rounded-md bg-gradient-to-br from-white/35 to-transparent -rotate-6" />
                                </div>

                                {/* Vertical Branded Sleeve Down Left Portion */}
                                <div className="absolute top-[14%] left-[7.5%] w-[49%] rounded-2xl border-2 border-white/80 overflow-hidden flex flex-col shadow-lg z-10">
                                  {/* Sleeve Top Photo Thumbnail */}
                                  <div className="aspect-[16/10] overflow-hidden relative bg-[#EDE7D6]">
                                    {cardImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={cardImage}
                                        alt=""
                                        width={240}
                                        height={150}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-sm opacity-50 text-emerald-800">
                                        <Sprout className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Sleeve Body */}
                                  <div className="bg-white p-2.5 sm:p-3 pt-3 sm:pt-3.5 pb-3 sm:pb-4 flex flex-col items-center text-center">
                                    {/* Circular Company Logo */}
                                    <div className="w-[62%] aspect-square max-w-[68px] relative mb-2 shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={CLOUDINARY_ASSETS.circleLogo}
                                        alt=""
                                        width={68}
                                        height={68}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-contain rounded-full"
                                      />
                                    </div>

                                    {/* Product Name */}
                                    <h5 className="font-serif font-bold text-[11px] sm:text-[12.5px] leading-tight text-[#151F19] text-center mb-1 line-clamp-2">
                                      {product.name}
                                    </h5>

                                    {/* 1 Product Highlight (fetched from admin panel or meta) */}
                                    {(product.highlight_1 || meta.benefit || meta.sleeveDesc) && (
                                      <p className="text-[8px] sm:text-[9px] text-[#33402F] text-center leading-tight font-medium line-clamp-2">
                                        {product.highlight_1 || meta.benefit || meta.sleeveDesc}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>

                              {/* Product Title */}
                              <Link href={`/products/${product.slug}`}>
                                <h4 className="font-serif font-semibold text-[17px] text-[#151F19] mb-2 hover:text-[#1C3F2D] transition-colors leading-snug">
                                  {product.name}
                                </h4>
                              </Link>

                              {/* Info Rows */}
                              <div className="border-t border-b border-[#E4DDC8] py-2.5 mb-3 space-y-1.5 text-xs text-[#5C6B60]">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5 text-[#1C3F2D] shrink-0" />
                                  <span className="truncate">{product.highlight_1 || meta.benefit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Sprout className="w-3.5 h-3.5 text-[#3E8F52] shrink-0" />
                                  <span>{product.highlight_2 || (isBundle ? 'Bundle · 7 to 10 days fresh' : 'Fresh tray · 7 to 10 days fresh')}</span>
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
                                  className="px-4 py-2.5 rounded-full bg-[#122A1F] hover:bg-[#1C3F2D] text-[#FFFDF8] font-mono text-[10.5px] font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
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

                    {/* Arrow Right (only show if more than 4 products) */}
                    {prods.length > 4 && (
                      <button
                        onClick={() => scrollTrack(goal.slug, 'right')}
                        className="hidden sm:flex absolute right-[-16px] top-[32%] z-10 w-10 h-10 rounded-full bg-[#FFFDF8] border border-[#E4DDC8] items-center justify-center text-[#122A1F] hover:bg-[#1C3F2D] hover:text-[#FFFDF8] hover:border-[#1C3F2D] transition-all shadow-md cursor-pointer"
                        aria-label="Next products"
                      >
                        ›
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
      </div>

      {/* ================= SECTION 4: TRUST HERO ================= */}
      <section className="relative overflow-hidden bg-[#0F1C12] text-[#FFFDF8] min-h-[340px] flex items-center">
        {/* Background Photo with Scrim */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${cloudinaryImage(
              content.trust_background_image ||
                'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=webp&q=80&w=1200&auto=format&fit=crop',
              1200
            )}')`,
          }}
        />
        <div
          className="absolute inset-0 z-1"
          style={{
            background:
              'linear-gradient(100deg, rgba(10,20,13,.74) 0%, rgba(10,20,13,.5) 42%, rgba(10,20,13,.14) 70%, rgba(10,20,13,0) 100%)',
          }}
        />

        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-8 w-full py-[54px]">
          <div className="max-w-2xl">
            <h2 className="font-serif font-medium text-[clamp(30px,4.5vw,52px)] leading-[1.06] tracking-tight mb-4 text-[#FFFDF8]">
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
                  Each tray harvested,
                  <br />
                  <em className="italic text-[#CFFA57] font-normal">near you.</em>
                </>
              )}
            </h2>

            {/* Handwritten Caveat Accent Line */}
            <div className="flex items-center gap-3 mb-7">
              <svg
                className="w-[34px] h-[26px] text-[#CFFA57] flex-shrink-0"
                fill="none"
                viewBox="0 0 34 26"
              >
                <path
                  d="M4 3C4 12 6 21 15 21c7 0 11-7 15-9"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M26 9l4 3-2 5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-handwriting font-bold text-[25px] text-[#CFFA57] leading-none">
                {content.trust_tagline || 'Grown 10 min away. Cut to order.'}
              </span>
            </div>

            {/* 5 Bullets Grid */}
            <ul className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-x-[26px] gap-y-[14px] text-[14px] text-white/[0.92]">
              <li className="flex items-start gap-2.5">
                <span className="text-[#CFFA57] text-base leading-none mt-0.5 select-none">✦</span>
                <span>{content.trust_bullet_1 || 'Harvested the day you order, never pulled from cold storage.'}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#CFFA57] text-base leading-none mt-0.5 select-none">✦</span>
                <span>{content.trust_bullet_2 || 'Zero pesticides, ever. Grown indoors on soil-free racks.'}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#CFFA57] text-base leading-none mt-0.5 select-none">✦</span>
                <span>{content.trust_bullet_3 || 'Non-GMO seeds only, sourced and verified before sowing.'}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#CFFA57] text-base leading-none mt-0.5 select-none">✦</span>
                <span>{content.trust_bullet_4 || 'Zero days in transit, harvested fresh on the morning of delivery.'}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#CFFA57] text-base leading-none mt-0.5 select-none">✦</span>
                <span>{content.trust_bullet_5 || 'You can come see the racks your greens grew on.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>


      {/* ================= SECTION 5: WHY CHOOSE US (4 COLOR BLOCKS) ================= */}
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

      {/* ================= SECTION 6: REVIEWS ("STRAIGHT FROM THE GUT") ================= */}
      <section className="bg-[#F1EDE3] pt-6 sm:pt-[36px] pb-8 sm:pb-[80px]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="font-serif font-medium text-[22px] min-[380px]:text-[24px] sm:text-[clamp(28px,4vw,40px)] text-[#151F19] leading-tight">
                {content.reviews_title || 'Straight from the gut.'}
              </h2>
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

      {/* ================= SECTION 7: NEW TO MICROGREENS? (TRY SAMPLER PACK BANNER) ================= */}
      <section className="bg-[#F1EDE3] p-0 overflow-hidden">
        <div className="mband">
          <div className="row">
            <div className="slice">
              <div
                className="cimg"
                style={{
                  backgroundImage: `url('${
                    content.sampler_slice_image_1 ||
                    'https://images.pexels.com/photos/8515766/pexels-photo-8515766.jpeg?auto=compress&cs=tinysrgb&w=1600'
                  }')`,
                }}
              />
            </div>
            <div className="slice">
              <div
                className="cimg"
                style={{
                  backgroundImage: `url('${
                    content.sampler_slice_image_2 ||
                    'https://images.pexels.com/photos/30270630/pexels-photo-30270630.jpeg?auto=compress&cs=tinysrgb&w=1600'
                  }')`,
                }}
              />
            </div>
            <div className="slice wide">
              <div
                className="cimg"
                style={{
                  backgroundImage: `url('${
                    content.sampler_slice_image_3 ||
                    'https://images.pexels.com/photos/27400770/pexels-photo-27400770.jpeg?auto=compress&cs=tinysrgb&w=1600'
                  }')`,
                }}
              />
            </div>
            <div className="slice">
              <div
                className="cimg"
                style={{
                  backgroundImage: `url('${
                    content.sampler_slice_image_4 ||
                    'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=1600&auto=format&fit=crop'
                  }')`,
                }}
              />
            </div>
            <div className="slice tight">
              <div
                className="cimg"
                style={{
                  backgroundImage: `url('${
                    content.sampler_slice_image_5 ||
                    'https://images.pexels.com/photos/27969848/pexels-photo-27969848.jpeg?auto=compress&cs=tinysrgb&w=1600'
                  }')`,
                }}
              />
            </div>
          </div>
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background:
                'linear-gradient(100deg, rgba(18,26,17,.75) 0%, rgba(18,26,17,.45) 38%, rgba(18,26,17,0) 68%)',
            }}
          />
          <div className="relative z-[2] flex flex-col justify-center h-full px-6 sm:px-12 md:px-16 max-w-xl text-[#FFFDF8]">
            <h2 className="font-serif font-medium text-3xl sm:text-4xl md:text-5xl leading-[1.06] mb-2 sm:mb-3">
              {content.sampler_banner_title ? (
                content.sampler_banner_title
              ) : (
                <>
                  New to<br />microgreens?
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm md:text-[15px] text-[#FFFDF8]/90 mb-5 sm:mb-6 max-w-xs sm:max-w-sm leading-relaxed">
              {content.sampler_banner_subtitle ||
                'Start small. One sampler tray, different ways to use it, zero commitment.'}
            </p>
            <div>
              <Link
                href={
                  content.sampler_banner_link ||
                  (samplerVariant?.productSlug
                    ? `/products/${samplerVariant.productSlug}`
                    : '/products/classic-trio-bundle')
                }
                className="inline-flex items-center gap-2 bg-[#151F19] text-[#FFFDF8] font-bold text-xs sm:text-[13.5px] tracking-wider uppercase px-5 py-3 sm:px-6 sm:py-3.5 rounded-full hover:-translate-y-1 transition-transform shadow-lg cursor-pointer"
              >
                {content.sampler_banner_cta_text || 'Try the sampler pack →'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 8: FAQ ACCORDION ================= */}
      <section className="bg-white py-20 sm:py-24">
        <div className="max-w-[940px] mx-auto px-4 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="font-serif font-bold text-[clamp(32px,4vw,40px)] text-center text-[#151F19] mb-12"
          >
            {content.faq_title || 'Frequently Asked Questions'}
          </motion.h2>

          <div className="divide-y divide-[#151F19]/15 border-y border-[#151F19]/15">
            {DEFAULT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              const question = content[faq.qKey] || faq.defaultQ;
              const answer = content[faq.aKey] || faq.defaultA;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.06, 0.3), ease: 'easeOut' }}
                  className="transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-5 sm:py-6 flex items-center justify-between text-left gap-4 focus:outline-none cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif font-bold text-[17px] sm:text-[18px] text-[#151F19] group-hover:text-[#1C3F2D] transition-colors leading-snug">
                      {question}
                    </span>
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isOpen
                          ? 'bg-[#151F19] text-[#CFFA57] border-[#151F19] rotate-45 shadow-sm'
                          : 'border-[#151F19]/25 bg-transparent text-[#151F19] group-hover:border-[#151F19]'
                      }`}
                    >
                      <svg
                        className="w-3.5 h-3.5 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 text-[14.5px] sm:text-[15px] text-[#5C6B60] leading-relaxed font-sans pr-8 whitespace-pre-line">
                          {answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 9: WANT 15% OFF & INSIDE SCOOP (NEWSLETTER) ================= */}
      <section className="bg-[#122A1F] py-16 sm:py-20 text-[#FFFDF8]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-[1.15] mb-3 text-[#FFFDF8]">
              {renderNewsletterTitle(content.newsletter_title)}
            </h2>
            <p className="text-[#FFFDF8]/65 text-sm sm:text-base max-w-md leading-relaxed">
              {content.newsletter_subtitle ||
                'Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops.'}
            </p>
          </div>

          <div>
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={content.newsletter_placeholder || 'your@email.com'}
                required
                disabled={newsletterStatus === 'loading'}
                className="flex-1 min-w-[200px] bg-[#FFFDF8]/10 border border-[#FFFDF8]/25 rounded-full px-5 py-3.5 text-[#FFFDF8] text-sm outline-none placeholder:text-[#FFFDF8]/45 focus:border-[#CFFA57] transition-colors"
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
                className="bg-[#CFFA57] text-[#122A1F] font-bold text-sm px-7 py-3.5 rounded-full whitespace-nowrap hover:-translate-y-0.5 transition-transform disabled:opacity-50 shadow-md cursor-pointer"
              >
                {newsletterStatus === 'loading'
                  ? 'Signing Up...'
                  : (content.newsletter_button_text || 'Sign Up')}
              </button>
            </form>
            {newsletterMessage && (
              <p
                className={`text-xs mt-2.5 ${
                  newsletterStatus === 'success' ? 'text-[#CFFA57]' : 'text-red-400'
                }`}
              >
                {newsletterMessage}
              </p>
            )}
            <p className="text-[11px] text-[#FFFDF8]/40 mt-2.5">
              {content.newsletter_disclaimer || 'No spam. Unsubscribe anytime.'}
            </p>

            {/* Invisible Turnstile container — offscreen to preserve exact layout without dimension failures */}
            <div
              ref={newsletterCaptchaRef}
              style={{
                position: 'fixed',
                left: -9999,
                top: -9999,
                width: 300,
                height: 65,
                opacity: 0,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
