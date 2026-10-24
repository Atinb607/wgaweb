'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import StoryModal from '@/components/StoryModal';
import WhyMicrogreensChart from '@/components/WhyMicrogreensChart';
import { Instagram, ShoppingBag, PackageBox, Sprout, Flask, Target, Utensils } from '@/components/icons';
import { HEALTH_GOALS } from '@/lib/healthGoals';
import { getOptimizedLogoUrl } from '@/lib/format';
import { cldUrl, cldSrcSet } from '@/lib/cloudinary';
import type { HealthGoalContentItem } from '@/app/[panelKey]/health-goals/page';
import type { Product } from '@/app/products/page';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

function cldVideoUrl(url: string | null | undefined, width = 1280): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/video/upload/')) {
    return trimmed;
  }
  const idx = trimmed.indexOf('/video/upload/');
  const after = trimmed.slice(idx + '/video/upload/'.length);
  if (/^(?:[a-z]{1,2}_|q_|f_|w_|c_)/.test(after)) {
    return trimmed;
  }
  return trimmed.slice(0, idx + '/video/upload/'.length) + `q_auto,f_auto,w_${width}/` + after;
}

export interface ContentPin {
  id: string;
  icon: string | null;
  title: string;
  description: string | null;
  display_order: number;
}

export interface FeaturedRecipe {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
}

export interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active: boolean;
}

interface HomePageClientProps {
  content: Record<string, string>;
  dbPins: ContentPin[];
  recipeCount?: number;
  featuredRecipes?: FeaturedRecipe[];
  initialHealthGoals?: HealthGoalContentItem[];
  allProducts?: (Product & { health_goals?: string[] })[];
  partnerLogos?: PartnerLogo[];
}

const DEFAULT_HEALTH_GOALS: HealthGoalContentItem[] = HEALTH_GOALS.map((g, idx) => ({
  id: g.id,
  slug: g.slug,
  title: g.title,
  tag: g.tag,
  icon: g.icon,
  subtitle: g.subtitle,
  popup_title: g.heroTitle,
  popup_description: g.heroSubtitle,
  image_url: g.heroImage,
  display_order: idx + 1,
  is_active: true,
}));

const GOAL_BG_COLORS = [
  'bg-[#DCF5A8]',
  'bg-[#FFE0B2]',
  'bg-[#FFC9C0]',
  'bg-[#BEE3F5]',
  'bg-[#E9D8F2]',
  'bg-[#F7D9D3]',
  'bg-[#D6EDD9]',
  'bg-[#EDE1C7]',
];

function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.includes('/video/upload/') ||
    clean.includes('/video/') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(clean)
  );
}

export default function HomePageClient({
  content,
  dbPins,
  featuredRecipes = [],
  initialHealthGoals = [],
  partnerLogos: initialPartnerLogos = [],
}: HomePageClientProps) {
  const shouldReduceMotion = useReducedMotion();
  const [healthGoals, setHealthGoals] = useState<HealthGoalContentItem[]>(
    initialHealthGoals.length > 0 ? initialHealthGoals : []
  );
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogo[]>(
    initialPartnerLogos.length > 0 ? initialPartnerLogos : []
  );

  useEffect(() => {
    if (initialHealthGoals.length === 0) {
      fetch('/api/health-goals')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setHealthGoals(data);
          }
        })
        .catch((err) => console.error('Error fetching health goals:', err));
    }

    if (initialPartnerLogos.length === 0) {
      fetch('/api/partner-logos')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPartnerLogos(data);
          }
        })
        .catch(() => {});
    }
  }, [initialHealthGoals.length, initialPartnerLogos.length]);

  const effectiveHealthGoals = healthGoals.length > 0 ? healthGoals : DEFAULT_HEALTH_GOALS;

  // Hero background: give top preference to hero background video over hero bg image
  const rawVideo = content.hero_video_url?.trim() || '';
  const rawImage = content.hero_image_url?.trim() || '';

  // 1. If hero_video_url is provided, ALWAYS give it top preference as the background video
  // 2. If hero_video_url is empty but hero_image_url contains a video, use it as video
  const heroVideo =
    rawVideo.length > 0
      ? rawVideo
      : rawImage.length > 0 && isVideoMedia(rawImage)
      ? rawImage
      : null;

  // Background/poster image: use hero_image_url if not a video, otherwise default fallback photo
  const heroImageSource =
    rawImage.length > 0 && !isVideoMedia(rawImage)
      ? rawImage
      : 'https://plus.unsplash.com/premium_photo-1703258064295-71c77cc0720f?fm=webp&q=80&w=1280&auto=format&fit=crop';
  const heroImage = cldUrl(heroImageSource, 1280);
  const heroSrcSet = cldSrcSet(heroImageSource, [480, 768, 1280, 1920]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion || !heroVideo) return;

    let cancelled = false;
    const startPlayback = () => {
      if (cancelled) return;
      setShouldPlayVideo(true);
    };

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(startPlayback, { timeout: 2500 });
        } else {
          setTimeout(startPlayback, 1000);
        }
      } else {
        const onLoad = () => {
          if ('requestIdleCallback' in window) {
            (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(startPlayback, { timeout: 2500 });
          } else {
            setTimeout(startPlayback, 1000);
          }
        };
        window.addEventListener('load', onLoad, { once: true });
        return () => {
          cancelled = true;
          window.removeEventListener('load', onLoad);
        };
      }
    }

    return () => {
      cancelled = true;
    };
  }, [heroVideo, shouldReduceMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldPlayVideo) return;

    // React does not set DOM property video.muted = true, which triggers browser autoplay blockage.
    video.muted = true;
    video.defaultMuted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented immediate playback; start on first interaction
        const startPlay = () => {
          video.play().catch(() => {});
          window.removeEventListener('click', startPlay);
          window.removeEventListener('touchstart', startPlay);
          window.removeEventListener('scroll', startPlay);
        };
        window.addEventListener('click', startPlay, { once: true });
        window.addEventListener('touchstart', startPlay, { once: true });
        window.addEventListener('scroll', startPlay, { once: true });
      });
    }
  }, [shouldPlayVideo]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, []);

  // Part 1: Hero entrance animations (staggered on page load, opacity 1 on SSR so LCP paints immediately)
  const heroContainerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            staggerChildren: 0.08,
            delayChildren: 0.02,
          },
    },
  };

  const heroItemVariants: Variants = {
    hidden: {
      opacity: 1,
      y: shouldReduceMotion ? 0 : 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
    },
  };

  // Part 2: Below-hero scroll entrance animations (whileInView)
  const scrollContainerVariants = (stagger = 0.08, delay = 0): Variants => ({
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            staggerChildren: stagger,
            delayChildren: delay,
          },
    },
  });

  const scrollItemVariants: Variants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 22,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            duration: 0.48,
            ease: [0.22, 1, 0.36, 1],
          },
    },
  };

  // Default fallback pins if none in DB
  const defaultPins = [
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M16 3l11 4v9c0 7-4.6 11.4-11 13.9C9.6 27.4 5 23 5 16V7l11-4z" />
          <path d="M16 21c0-4 2.5-6.5 6-7-.4 4.4-2.6 6.6-6 7zM16 21c0-4-2.5-6.5-6-7 .4 4.4 2.6 6.6 6 7zM16 21v3" />
        </svg>
      ),
      label: 'Soil Free &\nChemical Free',
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M18 3L7 18h7l-2 11 11-15h-7l2-11z" />
        </svg>
      ),
      label: '40X Nutrient\nDensity*',
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M20.5 5.5c4.5 4.5 3.5 12-1.5 17s-12.5 6-17 1.5c-1.5-1.5-.5-6 2.5-11S16 1 20.5 5.5z" />
          <path d="M6 26C10 20 15 13 21 8" />
        </svg>
      ),
      label: 'Non GMO\nSeeds',
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M16 3C11 10.5 8 14.7 8 19a8 8 0 0016 0c0-4.3-3-8.5-8-16z" />
          <path d="M12 19.5a4 4 0 004 4" />
        </svg>
      ),
      label: 'Mineral\nRO Water',
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M4 12h24l-2.5 15a2 2 0 01-2 1.7H8.5a2 2 0 01-2-1.7L4 12z" />
          <path d="M9 17.5c2-1.5 4-1.5 6 0s4 1.5 6 0M9 22.5c2-1.5 4-1.5 6 0s4 1.5 6 0" />
          <path d="M16 12V8M16 8c0-2 1.5-3.5 3.5-3.5M16 8c0-2-1.5-3.5-3.5-3.5" />
        </svg>
      ),
      label: 'Coco Peat\nBed',
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M13 4h5v4h-5zM11.5 8h8l2 5v14a2 2 0 01-2 2h-8a2 2 0 01-2-2V13l2-5z" />
          <path d="M19.5 10h4.5l3-3" />
          <path d="M4 4l24 24" />
        </svg>
      ),
      label: 'Zero\nPesticide',
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="24" r="3.5" />
          <circle cx="7" cy="8" r="3.5" />
          <path d="M9.6 10.4L27 27M9.6 21.6L27 5M14 16l4.5 4.3" />
        </svg>
      ),
      label: 'Cut to\nOrder',
    },
  ];

  return (
    <main className="overflow-x-hidden">
      {/* ================= HERO ================= */}
      <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden text-[#FFFDF8] pt-28 pb-16">
        {/* Background photo or video (video takes top priority if uploaded) */}
        {/* Background poster image: Always rendered eagerly as the page LCP element */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          srcSet={heroSrcSet}
          sizes="100vw"
          alt={content.hero_image_url_alt?.trim() || 'Wild About Greens · Fresh Living Microgreens'}
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 z-0 w-full h-full object-cover object-center pointer-events-none"
        />
        {/* Background video: starts after page load/idle, preload none, respects reduced motion */}
        {heroVideo && !shouldReduceMotion && shouldPlayVideo && (
          <video
            ref={videoRef}
            key={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
            poster={heroImage}
          >
            <source src={cldVideoUrl(heroVideo, 1280)} type="video/mp4" />
            <source src={cldVideoUrl(heroVideo, 1280)} type="video/webm" />
            <source src={heroVideo} />
          </video>
        )}
        {/* Scrim overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,24,16,.62) 0%, rgba(10,24,16,.46) 45%, rgba(10,24,16,.72) 100%)',
          }}
        />

        {/* Hero Content with Staggered Entrance */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="wrap relative z-10 max-w-4xl mx-auto"
        >
          {/* 1. Badge Pill */}
          <motion.div
            variants={heroItemVariants}
            className="inline-flex items-center gap-2 font-mono text-[11.5px] tracking-[0.14em] uppercase text-[#FFFDF8] border border-[#FFFDF8]/40 px-4 py-2 rounded-full mb-7 backdrop-blur-sm shadow-sm"
          >
            <Sprout className="w-3.5 h-3.5 text-[#CFFA57]" />
            <span>
              {content.hero_eyebrow || 'Grown Locally · Delivered Fresh Daily'}
            </span>
          </motion.div>

          {/* 2. Main Headline */}
          <motion.h1
            variants={heroItemVariants}
            className="font-display uppercase text-6xl sm:text-8xl md:text-9xl lg:text-[116px] leading-[0.92] mb-6 drop-shadow-[0_6px_35px_rgba(0,0,0,0.35)]"
          >
            {content.hero_title || (
              <>
                Let&apos;s Eat
                <br />
                Well.
              </>
            )}
          </motion.h1>

          {/* 3. Subtext line */}
          <motion.p
            variants={heroItemVariants}
            className="font-mono text-xs sm:text-sm tracking-[0.06em] uppercase text-[#FFFDF8]/90 max-w-xl mx-auto mb-9 leading-relaxed font-medium"
          >
            {content.hero_subtitle || (
              <>
                Non GMO seeds. Mineral water. Coco peat. Clean air.
                <br />
                100% pesticide free. Absolutely nothing else.
              </>
            )}
          </motion.p>

          {/* 4. "The Short Story of Why We Exist" button */}
          <motion.div variants={heroItemVariants}>
            <StoryModal />
          </motion.div>

          {/* 5. Star-rating / Trust-text line */}
          <motion.div
            variants={heroItemVariants}
            className="flex flex-col items-center gap-1.5 mt-7"
          >
            <div className="text-white text-sm tracking-[3px]">★★★★★</div>
            <div className="font-mono text-[11.5px] tracking-[0.09em] uppercase text-[#FFFDF8]/85 font-medium text-center max-w-lg">
              {content.hero_trust_text ||
                'Join over 1000+ families eating fresh microgreens daily'}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator with gentle up-down looping bob */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1, y: 0 }
              : {
                  opacity: [0.5, 0.9, 0.5],
                  y: [0, 6, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.6,
                }
          }
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#FFFDF8]/60 font-mono text-[10px] tracking-[0.16em] uppercase pointer-events-none"
        >
          <span>Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#FFFDF8]/60 to-transparent" />
        </motion.div>
      </section>

      {/* ================= ICON STRIP (Scroll-triggered) ================= */}
      <section className="relative bg-white py-10 border-b border-[#E4DDC8]/60 overflow-hidden">
        <div className="wrap">
          <motion.div
            variants={scrollContainerVariants(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-wrap justify-center gap-7 sm:gap-9 text-[#1C3F2D]"
          >
            {dbPins.length > 0
              ? dbPins.map((pin) => (
                  <motion.div
                    key={pin.id}
                    variants={scrollItemVariants}
                    className="flex flex-col items-center gap-2.5 text-center w-28 group hover:-translate-y-1 transition-transform duration-300"
                  >
                    <span className="text-2xl flex items-center justify-center">
                      {pin.icon && !/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(pin.icon) ? (
                        pin.icon
                      ) : (
                        <Sprout className="w-6 h-6 text-[#1C3F2D]" />
                      )}
                    </span>
                    <span className="font-mono text-[9.5px] tracking-[0.06em] uppercase leading-tight text-[#122A1F] font-semibold">
                      {pin.title}
                    </span>
                  </motion.div>
                ))
              : defaultPins.map((pin, i) => (
                  <motion.div
                    key={i}
                    variants={scrollItemVariants}
                    className="flex flex-col items-center gap-2.5 text-center w-28 group hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="text-[#1C3F2D] group-hover:scale-110 transition-transform duration-200">
                      {pin.icon}
                    </div>
                    <span className="font-mono text-[9.5px] tracking-[0.06em] uppercase leading-tight text-[#122A1F] font-medium whitespace-pre-line">
                      {pin.label}
                    </span>
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </section>

      {/* ================= WHY MICROGREENS (Scroll-triggered) ================= */}
      <section className="relative bg-[#FFFDF8] py-20 overflow-hidden scroll-mt-14" id="why">
        <div className="wrap">
          <motion.div
            variants={scrollItemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-xl mb-10"
          >
            <span className="font-mono text-[11.5px] tracking-[0.12em] uppercase text-[#5C6B60] inline-flex items-center gap-2 bg-[#F1EDE3] px-3.5 py-1.5 rounded-full mb-3">
              <Flask className="w-3.5 h-3.5 text-[#1C3F2D]" />
              <span>{content.why_badge ? content.why_badge.replace(/^[^\w\s]+\s*/, '') : 'The Actual Data'}</span>
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium text-[#151F19] leading-tight">
              {content.why_title || (
                <>
                  Why <em className="italic text-[#1C3F2D] font-normal">microgreens?</em>
                </>
              )}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            {/* Left Copy Column with Staggered children */}
            <motion.div
              variants={scrollContainerVariants(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="text-[#3B4A40]"
            >
              <motion.h3
                variants={scrollItemVariants}
                className="text-3xl sm:text-4xl leading-tight mb-5 tracking-tight"
              >
                {content.why_headline || (
                  <>
                    <span className="font-display uppercase text-[#151F19]">Day 10</span> beats{' '}
                    <span className="font-serif italic font-normal text-[#1C3F2D]">day 30.</span>
                  </>
                )}
              </motion.h3>
              <motion.p
                variants={scrollItemVariants}
                className="text-base text-[#3B4A40] leading-relaxed mb-4"
              >
                {content.why_body_1 ||
                  "Nutrients don't wait around. The moment a vegetable is cut, its vitamin content starts to fall, sitting in trucks, warehouses, and shop shelves for days before it reaches you."}
              </motion.p>
              <motion.blockquote
                variants={scrollItemVariants}
                className="font-serif italic text-lg sm:text-xl text-[#122A1F] leading-snug my-5 pl-4 border-l-4 border-[#CFFA57]"
              >
                {content.why_quote ||
                  'We harvest at the exact peak of density, ten days in, then it comes straight to your door, still breathing.'}
              </motion.blockquote>
              <motion.p
                variants={scrollItemVariants}
                className="text-base text-[#3B4A40] leading-relaxed mb-8"
              >
                {content.why_body_2 ||
                  'A single tray of broccoli microgreens can carry many times the vitamin C and antioxidant load of the mature vegetable, by weight.*'}
              </motion.p>
              <motion.div variants={scrollItemVariants}>
                <Link
                  href="/pathshala"
                  className="btn-primary-mockup btn-amber-mockup font-bold text-sm shadow-md inline-block"
                >
                  {content.why_cta_text || 'Pathshala →'}
                </Link>
              </motion.div>
            </motion.div>

            {/* Interactive SVG Chart & Optional Visual Media */}
            <motion.div
              variants={scrollItemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-6"
            >
              {content.why_image && (
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#E4DDC8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cldUrl(content.why_image, 800)}
                    alt={content.why_image_alt?.trim() || 'Why Microgreens'}
                    width={800}
                    height={512}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                </div>
              )}
              <WhyMicrogreensChart />
            </motion.div>
          </div>

        </div>
      </section>

      {/* ================= SHOP BY HEALTH GOAL (Scroll-triggered) ================= */}
      <section className="relative bg-[#F1EDE3] py-14 sm:py-18 md:py-20 overflow-hidden scroll-mt-14" id="goals">
        <div className="wrap">
          <motion.div
            variants={scrollItemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-xl mb-7 sm:mb-10"
          >
            <span className="font-mono text-[10.5px] sm:text-[11.5px] tracking-[0.12em] uppercase text-[#5C6B60] inline-flex items-center gap-2 bg-[#FFFDF8]/70 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full mb-2.5 sm:mb-3">
              <Target className="w-3.5 h-3.5 text-[#1C3F2D]" />
              <span>{content.goals_badge ? content.goals_badge.replace(/^[^\w\s]+\s*/, '') : 'Find Your Fit'}</span>
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#151F19] leading-tight">
              {content.goals_title || (
                <>
                  Shop by <em className="italic text-[#1C3F2D] font-normal">health goal.</em>
                </>
              )}
            </h2>
          </motion.div>

          <motion.div
            variants={scrollContainerVariants(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6"
          >
            {effectiveHealthGoals.map((goal, index) => {
              const bgColor = GOAL_BG_COLORS[index % GOAL_BG_COLORS.length];

              return (
                <motion.div key={goal.id || index} variants={scrollItemVariants}>
                  <Link
                    href={`/products/health-goals?goal=${goal.slug || goal.id}`}
                    className="group block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C3F2D] rounded-xl sm:rounded-2xl"
                  >
                    <div
                      className={`relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square flex items-center justify-center border-2 border-[#D0C7B4] group-hover:border-[#1C3F2D] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-2 group-hover:shadow-[0_20px_35px_-8px_rgba(28,63,45,0.26)] ${bgColor}`}
                    >
                      {/* Light sheen swipe on hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none z-20" />

                      {/* Dark gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

                      {/* Floating Explore pill that slides up on hover */}
                      <div className="absolute inset-x-0 bottom-2.5 sm:bottom-3.5 z-20 flex justify-center pointer-events-none px-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#122A1F] font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-lg transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out border border-white/50">
                          <span>Explore Trays</span>
                          <span className="text-[#1C3F2D] text-xs">↗</span>
                        </span>
                      </div>

                      {goal.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cldUrl(goal.image_url, 600)}
                          alt={goal.title || 'Health goal'}
                          width={500}
                          height={500}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : goal.icon && !/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(goal.icon) ? (
                        <span className="text-3xl sm:text-4xl">{goal.icon}</span>
                      ) : (
                        <Sprout className="w-10 h-10 text-[#1C3F2D]/60" />
                      )}
                    </div>
                    <div className="pt-2.5 sm:pt-3.5 px-0.5 sm:px-1">
                      <h4 className="font-serif text-sm sm:text-base font-semibold text-[#122A1F] group-hover:text-[#1C3F2D] mb-0.5 sm:mb-1 line-clamp-1 transition-colors">
                        {goal.title}
                      </h4>
                      {goal.subtitle && (
                        <p className="text-[11px] sm:text-xs text-[#5C6B60] line-clamp-2 leading-tight min-h-[26px] sm:min-h-[32px]">{goal.subtitle}</p>
                      )}
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-bold text-[#1C3F2D] group-hover:text-[#122A1F] transition-colors">
                        <span>Explore Trays</span>
                        <span className="inline-block transform group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ================= FSSAI LOGO (Centered, no background, no divider, no text) ================= */}
          <div className="mt-10 sm:mt-12 md:mt-14 flex justify-center items-center">
            <a
              href={CLOUDINARY_ASSETS.fssai}
              target="_blank"
              rel="noopener noreferrer"
              title="FSSAI Registration"
              className="inline-block transition-transform hover:scale-105"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CLOUDINARY_ASSETS.fssai}
                alt="FSSAI Registration"
                width={160}
                height={80}
                className="h-14 sm:h-16 md:h-20 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        </div>
      </section>

      {/* ================= RECIPES (Scroll-triggered) ================= */}
      <section
        className="relative bg-cover bg-center py-24 text-[#FFFDF8] overflow-hidden"
        id="recipe"
        style={{
          backgroundImage: `url('${
            cldUrl(
              content.recipes_bg_image ||
                'https://images.unsplash.com/photo-1613769049987-b31b641f25b1?fm=webp&q=80&w=1280&auto=format&fit=crop',
              1280
            )
          }')`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(10,24,16,.72) 0%, rgba(10,24,16,.42) 52%, rgba(10,24,16,.08) 100%)',
          }}
        />

        <div className="wrap relative z-10">
          <motion.div
            variants={scrollItemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-lg mb-10 text-shadow"
          >
            <span className="font-mono text-[11.5px] tracking-[0.13em] uppercase text-[#CFFA57] inline-flex items-center gap-2 mb-3 font-semibold">
              <Utensils className="w-3.5 h-3.5 text-[#CFFA57]" />
              <span>{content.recipes_badge ? content.recipes_badge.replace(/^[^\w\s]+\s*/, '') : 'Recipe Khazana'}</span>
            </span>
            <p className="font-serif italic text-lg sm:text-xl text-[#FFFDF8]/95 mb-3">
              {content.recipes_subtitle || 'Good for you. Easy for you. Delicious for you.'}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium leading-tight">
              {content.recipes_title ? (
                content.recipes_title
              ) : (
                <>
                  Sneak greens
                  <br />
                  into your <em className="italic text-[#CFFA57]">meals.</em>
                </>
              )}
            </h2>
          </motion.div>

          <motion.div
            variants={scrollContainerVariants(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mb-10"
          >
            {featuredRecipes && featuredRecipes.length > 0 ? (
              featuredRecipes.slice(0, 2).map((recipe, idx) => (
                <motion.div
                  key={recipe.id}
                  variants={scrollItemVariants}
                >
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    className="group block pl-4 border-l-2 border-[#CFFA57]/60 hover:border-[#CFFA57] hover:translate-x-1 transition-all duration-300 cursor-pointer"
                  >
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#B7E23F] block mb-2 font-semibold">
                      Recipe {String(idx + 1).padStart(2, '0')} / 02
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-1.5 group-hover:text-[#CFFA57] transition-colors">
                      {recipe.title}
                    </h3>
                    {recipe.excerpt && (
                      <p className="text-sm text-[#FFFDF8]/90 leading-relaxed">
                        {recipe.excerpt}
                      </p>
                    )}
                  </Link>
                </motion.div>
              ))
            ) : (
              <>
                <motion.div variants={scrollItemVariants}>
                  <Link
                    href="/recipes"
                    className="group block pl-4 border-l-2 border-[#CFFA57]/60 hover:border-[#CFFA57] hover:translate-x-1 transition-all duration-300 cursor-pointer"
                  >
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#B7E23F] block mb-2 font-semibold">
                      Recipe 01 / 02
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-1.5 group-hover:text-[#CFFA57] transition-colors">
                      Microgreens Avocado Toast
                    </h3>
                    <div className="font-mono text-[11px] tracking-wide uppercase text-[#B7E23F] mb-3 font-medium">
                      5 mins · Easy · Serves 1
                    </div>
                    <p className="text-sm text-[#FFFDF8]/90 leading-relaxed">
                      A power packed start to your day with healthy fats, fiber and a burst of nutrition.
                      Sunflower shoots, chilled curd, roasted cumin, mint.
                    </p>
                  </Link>
                </motion.div>

                <motion.div variants={scrollItemVariants}>
                  <Link
                    href="/recipes"
                    className="group block pl-4 border-l-2 border-[#CFFA57]/60 hover:border-[#CFFA57] hover:translate-x-1 transition-all duration-300 cursor-pointer"
                  >
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#B7E23F] block mb-2 font-semibold">
                      Recipe 02 / 02
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-1.5 group-hover:text-[#CFFA57] transition-colors">
                      Microgreens Poha
                    </h3>
                    <div className="font-mono text-[11px] tracking-wide uppercase text-[#B7E23F] mb-3 font-medium">
                      15 mins · Easy · Serves 2
                    </div>
                    <p className="text-sm text-[#FFFDF8]/90 leading-relaxed">
                      The everyday breakfast you already make, quietly upgraded. Temper mustard seeds, curry
                      leaves and peanuts, fold through soaked poha with turmeric, then kill the heat and stir in
                      a fistful of radish and pea shoots so they stay raw, crunchy and intact.
                    </p>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>

          <motion.div
            variants={scrollItemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Link
              href="/recipes"
              className="btn-primary-mockup font-bold text-sm shadow-lg hover:scale-105 transition-transform inline-block"
            >
              {content.recipes_cta_text || 'The Recipe Khazana →'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================= LONG STORY (Scroll-triggered) ================= */}
      <section className="relative bg-[#F1EDE3] py-20 text-center overflow-hidden" id="story">
        <div className="wrap">
          <motion.div
            variants={scrollContainerVariants(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <motion.div
              variants={scrollItemVariants}
              className="font-display uppercase text-5xl sm:text-7xl md:text-8xl text-[#1C3F2D] mb-6 leading-none"
            >
              {content.story_eyebrow || 'The Long Story'}
            </motion.div>
            <motion.h3
              variants={scrollItemVariants}
              className="font-serif font-semibold text-2xl sm:text-3xl md:text-4xl text-[#151F19] max-w-xl mx-auto mb-6 leading-snug"
            >
              {content.story_title ? (
                content.story_title
              ) : (
                <>
                  From a small idea
                  <br />
                  to a <em className="italic text-[#1C3F2D] font-normal">healthier tomorrow.</em>
                </>
              )}
            </motion.h3>
            <motion.div
              variants={scrollItemVariants}
              className="max-w-xl mx-auto text-[#3B4A40] text-base leading-relaxed space-y-3.5 mb-8"
            >
              {content.story_body ? (
                content.story_body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <>
                  <p>
                    We started with a simple question: why is it so hard to eat truly fresh, nutrient dense
                    greens in our busy urban lives?
                  </p>
                  <p>
                    That question led us to microgreens. To science. To clean growing. To long nights
                    perfecting our system. And today, to your table.
                  </p>
                  <p>
                    We&apos;re not just growing greens. We&apos;re growing a movement for real food, real
                    nutrition, and real change.
                  </p>
                </>
              )}
            </motion.div>
            <motion.div variants={scrollItemVariants}>
              <Link
                href="/our-story"
                className="btn-primary-mockup btn-dark-mockup font-bold text-sm shadow-md hover:scale-105 transition-transform inline-block"
              >
                {content.story_cta_text || 'Our Story →'}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= PARTNER LOGOS (TRUSTED BY) - RUNNING STRIP ================= */}
      {(() => {
        if (content.homepage_partner_logos_enabled === 'false' || partnerLogos.length === 0) return null;
        const activeLogos = partnerLogos
          .filter((l) => l.is_active !== false)
          .sort((a, b) => a.display_order - b.display_order);
        if (activeLogos.length === 0) return null;

        // Repeat active logos to make sure each track is wide enough for any screen size
        const repeatCount = Math.max(2, Math.ceil(10 / activeLogos.length));
        const trackLogos = Array.from({ length: repeatCount }).flatMap(() => activeLogos);

        const cardStyle = content.homepage_partner_logos_card_style || 'cards';
        const logoSize = content.homepage_partner_logos_size || 'standard';

        let sizeBoxClass = 'w-[180px] sm:w-[220px] md:w-[240px] h-[86px] sm:h-[96px] md:h-[104px]';
        let sizeImgClass = 'max-h-[52px] sm:max-h-[62px] md:max-h-[68px] max-w-[145px] sm:max-w-[175px] md:max-w-[195px]';

        if (logoSize === 'large') {
          sizeBoxClass = 'w-[210px] sm:w-[250px] md:w-[280px] h-[100px] sm:h-[114px] md:h-[122px]';
          sizeImgClass = 'max-h-[62px] sm:max-h-[74px] md:max-h-[82px] max-w-[175px] sm:max-w-[210px] md:max-w-[235px]';
        } else if (logoSize === 'compact') {
          sizeBoxClass = 'w-[150px] sm:w-[180px] md:w-[200px] h-[72px] sm:h-[82px] md:h-[88px]';
          sizeImgClass = 'max-h-[42px] sm:max-h-[50px] md:max-h-[56px] max-w-[120px] sm:max-w-[145px] md:max-w-[165px]';
        }

        const styleBoxClass =
          cardStyle === 'seamless'
            ? 'rounded-xl hover:bg-white/40 border border-transparent hover:border-[#E8E2D2]/60 p-2 sm:p-3'
            : 'bg-white rounded-2xl border border-[#E8E2D2] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#1C3F2D]/35 p-3.5 sm:p-5';

        const renderLogoItem = (logo: PartnerLogo, uniqueKey: string) => {
          const optimizedUrl = getOptimizedLogoUrl(logo.logo_url);
          const imgElement = (
            <div
              className={`${sizeBoxClass} ${styleBoxClass} shrink-0 transition-all duration-300 flex items-center justify-center group`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizedUrl}
                alt={logo.name}
                title={logo.name}
                width={200}
                height={80}
                loading="lazy"
                decoding="async"
                className={`w-full h-full ${sizeImgClass} object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none select-none`}
                draggable={false}
              />
            </div>
          );

          if (logo.website_url) {
            return (
              <a
                key={uniqueKey}
                href={logo.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 cursor-pointer focus:outline-none transition-transform hover:-translate-y-0.5"
              >
                {imgElement}
              </a>
            );
          }

          return (
            <div key={uniqueKey} className="shrink-0 transition-transform hover:-translate-y-0.5">
              {imgElement}
            </div>
          );
        };

        return (
          <section className="bg-white py-16 sm:py-20 border-t border-[#E8E2D2] overflow-hidden">
            <div className="wrap mb-10 sm:mb-12">
              <motion.div
                variants={scrollContainerVariants(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="max-w-4xl mx-auto text-center"
              >
                {/* Eyebrow with subtle divider lines */}
                <motion.div
                  variants={scrollItemVariants}
                  className="flex items-center justify-center gap-3 mb-4"
                >
                  <span className="w-8 sm:w-12 h-px bg-[#D5CEC0]" />
                  <span className="font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#5C6B60] font-semibold">
                    {content.homepage_partner_logos_eyebrow || 'TRUSTED BY'}
                  </span>
                  <span className="w-8 sm:w-12 h-px bg-[#D5CEC0]" />
                </motion.div>

                {/* Fraunces Headline */}
                <motion.h2
                  variants={scrollItemVariants}
                  className="font-serif text-3xl sm:text-4xl md:text-[42px] font-medium text-[#151F19] leading-[1.3] sm:leading-[1.35]"
                >
                  {(() => {
                    const rawTitle = (
                      content.homepage_partner_logos_title || 'Leading organizations choose wild about greens.'
                    ).replace(/Wild About Greens/gi, 'wild about greens');

                    const chooseMatch = rawTitle.match(/choose/i);
                    if (chooseMatch && chooseMatch.index !== undefined) {
                      const firstPart = rawTitle.slice(0, chooseMatch.index).trim();
                      const secondPart = rawTitle.slice(chooseMatch.index).trim();
                      return (
                        <>
                          <span className="block mb-2 sm:mb-2.5">
                            {firstPart}
                          </span>
                          <em className="italic text-[#1C3F2D] font-normal block">
                            {secondPart}
                          </em>
                        </>
                      );
                    }

                    return rawTitle;
                  })()}
                </motion.h2>
              </motion.div>
            </div>

            {/* Continuous Running Strip / Marquee with soft edge gradient mask */}
            <div className="relative w-full overflow-hidden marquee-mask py-3">
              <div className="flex w-max animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none">
                {/* Track 1 */}
                <div className="flex shrink-0 items-center gap-4 sm:gap-6 md:gap-8 pr-4 sm:pr-6 md:pr-8">
                  {trackLogos.map((logo, idx) => renderLogoItem(logo, `track1-${logo.id}-${idx}`))}
                </div>
                {/* Track 2 (seamless infinite loop mirror) */}
                <div className="flex shrink-0 items-center gap-4 sm:gap-6 md:gap-8 pr-4 sm:pr-6 md:pr-8" aria-hidden="true">
                  {trackLogos.map((logo, idx) => renderLogoItem(logo, `track2-${logo.id}-${idx}`))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ================= FINAL CTA (Scroll-triggered) ================= */}
      <section className="relative bg-[#122A1F] py-20 text-[#FFFDF8] text-center overflow-hidden">
        <motion.div
          variants={scrollContainerVariants(0.09)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="wrap relative z-10 max-w-2xl mx-auto"
        >
          <motion.h2
            variants={scrollItemVariants}
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-4 leading-tight"
          >
            {content.final_cta_title ? (
              content.final_cta_title
            ) : (
              <>
                Join the revolution.
                <br />
                <em className="italic text-[#CFFA57] font-normal">Live healthily.</em>
              </>
            )}
          </motion.h2>
          <motion.p
            variants={scrollItemVariants}
            className="text-[#FFFDF8]/70 text-base sm:text-lg mb-8 max-w-md mx-auto"
          >
            {content.final_cta_subtitle || 'One tray at a time, grown ten minutes from your kitchen.'}
          </motion.p>
          <motion.div variants={scrollItemVariants} className="flex justify-center gap-3.5 flex-wrap">
            <a
              href="https://www.instagram.com/wild.about.greens/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#FFFDF8]/30 px-5 py-3 rounded-full text-sm font-semibold text-white hover:bg-[#CFFA57] hover:border-[#CFFA57] hover:text-[#151F19] hover:-translate-y-0.5 transition-all duration-200"
            >
              <Instagram className="w-4 h-4 shrink-0" />
              <span>Instagram</span>
            </a>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-[#FFFDF8]/30 px-5 py-3 rounded-full text-sm font-semibold text-white hover:bg-[#CFFA57] hover:border-[#CFFA57] hover:text-[#151F19] hover:-translate-y-0.5 transition-all duration-200"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Shop Products</span>
            </Link>
            <Link
              href="/bulk-order"
              className="inline-flex items-center gap-2 border border-[#FFFDF8]/30 px-5 py-3 rounded-full text-sm font-semibold text-white hover:bg-[#CFFA57] hover:border-[#CFFA57] hover:text-[#151F19] hover:-translate-y-0.5 transition-all duration-200"
            >
              <PackageBox className="w-4 h-4 shrink-0" />
              <span>Bulk Order</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
