'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { renderNewsletterTitle } from '@/lib/newsletterBanner';
import { useInvisibleTurnstile } from '@/lib/useTurnstile';
import { cldUrl } from '@/lib/cloudinary';
import type { SamplerVariantData } from './page';

export default function OurStoryClient({
  content = {},
  samplerVariant = null,
}: {
  content?: Record<string, string>;
  samplerVariant?: SamplerVariantData | null;
}) {
  const shouldReduceMotion = useReducedMotion();

  // Newsletter form state
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { containerRef, getTokenBeforeSubmit, reset: resetCaptcha } = useInvisibleTurnstile();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');
    try {
      // 1. Obtain captcha token before sending request to backend
      const captchaToken = await getTokenBeforeSubmit({
        title: 'Join Our Community',
        subtitle: 'Please complete the quick verification below so we can add you to our community list.',
      });
      if (!captchaToken) {
        setStatus('error');
        setMessage('Please complete the security check to continue.');
        return;
      }

      // 2. Send request to backend
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'our_story',
          turnstileToken: captchaToken,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || "Thanks! We'll email your 15% code soon.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to connect. Please check your internet connection.');
    } finally {
      // Reset Turnstile for next submission
      resetCaptcha();
    }
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="bg-white text-[#151F19] min-h-screen pt-[64px] sm:pt-[72px]">
      {/* ============ ANCHOR NAV ============ */}
      <nav
        className="sticky top-[58px] sm:top-[64px] z-40 bg-white/95 backdrop-blur-md border-b border-[#151F19]/10 transition-all duration-300"
        aria-label="On this page"
      >
        <div className="wrap flex gap-8 sm:gap-10 h-12 sm:h-[52px] items-center font-mono text-[11px] sm:text-[11.5px] tracking-[0.08em] uppercase overflow-x-auto whitespace-nowrap scrollbar-none">
          <a
            href="#mission"
            onClick={(e) => handleAnchorClick(e, 'mission')}
            className="text-[#5C6B60] hover:text-[#1C3F2D] transition-colors"
          >
            Our Mission
          </a>
          <a
            href="#story"
            onClick={(e) => handleAnchorClick(e, 'story')}
            className="text-[#5C6B60] hover:text-[#1C3F2D] transition-colors"
          >
            Our Story
          </a>
          <a
            href="#belief"
            onClick={(e) => handleAnchorClick(e, 'belief')}
            className="text-[#5C6B60] hover:text-[#1C3F2D] transition-colors"
          >
            Our Belief
          </a>
        </div>
      </nav>

      <main id="main">
        {/* ===== HERO SPLIT ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[560px] lg:min-h-[calc(100vh-130px)] bg-white">
          {/* Left Text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col justify-center py-12 lg:py-16 px-6 sm:px-12 lg:pl-16 lg:pr-12 xl:pl-28"
          >
            <div
              id="mission"
              className="scroll-mt-36 font-sans text-xs font-semibold tracking-[0.16em] uppercase text-[#2B5138] mb-5 sm:mb-6"
            >
              {content.hero_eyebrow || 'Our Mission'}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl xl:text-[4.2rem] text-[#122A1F] leading-[1.06] tracking-[-0.015em] font-normal max-w-md lg:max-w-[12ch]">
              {content.hero_title || 'Helping India rediscover the power of fresh food'}
            </h1>
            <div className="mt-8 sm:mt-10">
              <Link
                href="/pathshala"
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold tracking-wide bg-[#122A1F] text-[#FFFDF8] px-7 py-3.5 rounded-full hover:bg-[#1C3F2D] transition-all hover:-translate-y-0.5 hover:shadow-xl duration-200"
              >
                {content.hero_cta_text || 'Know More →'}
              </Link>
            </div>
          </motion.div>

          {/* Right Collage Grid */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative bg-white flex items-center justify-center p-6 sm:p-10 lg:p-12"
            aria-label="Photo collage of our microgreens, from tray to table"
          >
            <div className="w-full max-w-[480px] aspect-square grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3.5">
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/3296644/pexels-photo-3296644.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Top-down view of a tray of thriving green microgreens"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/15874889/pexels-photo-15874889.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Close-up macro shot of beetroot microgreens, pink and red stems"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1593629718347-283811841101?q=80&w=400&auto=format&fit=crop"
                  alt="Microgreens falling into a white ceramic bowl"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/30270630/pexels-photo-30270630.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Open-faced avocado toast topped with fresh microgreens and radishes"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/29168411/pexels-photo-29168411.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Gourmet salad with microgreens and edible flowers in a rustic ceramic bowl"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/32095425/pexels-photo-32095425.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Open-faced multigrain sandwich topped with fresh microgreens and cucumber"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/27969848/pexels-photo-27969848.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Colorful salad with beets, pecans, goat cheese and microgreen sprouts"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/8515766/pexels-photo-8515766.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Gourmet salad plated with edible flowers, radish, herbs and microgreens"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden bg-[#F1EDE3] rounded-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/29122091/pexels-photo-29122091.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Vibrant gourmet dish topped with colorful microgreens and an edible flower"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ===== MOVEMENT STRIP ===== */}
        <section className="bg-[#A9C1A9]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="wrap py-14 sm:py-18 lg:py-20"
          >
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1B3A28] leading-[1.08] max-w-2xl font-normal">
              {content.movement_title || "We're leading a movement to reimagine healthier living"}
            </h2>
            <p className="mt-7 max-w-xl text-lg sm:text-xl font-editorial text-[#1F271E] leading-relaxed">
              {content.movement_body ||
                "Every tray we grow represents a simple belief: healthy food shouldn't be complicated. It shouldn't be expensive. And it certainly shouldn't feel like a luxury. Our goal is to help families make one small decision every day that leads to a healthier tomorrow."}
            </p>
          </motion.div>
        </section>

        {/* ===== OUR STORY SPLIT (House Blend collage + statement) ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[58.5vh]">
          {/* Left Skew Media */}
          <div className="skew-media relative overflow-hidden bg-[#122A1F] min-h-[340px] sm:min-h-[400px] lg:min-h-full" aria-hidden="true">
            <div className="skew-row">
              <div className="skew-slice">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('${
                      content.story_image_1 ||
                      'https://images.pexels.com/photos/29122091/pexels-photo-29122091.jpeg?auto=compress&cs=tinysrgb&w=1600'
                    }')`,
                  }}
                />
              </div>
              <div className="skew-slice">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('${
                      content.story_image_2 ||
                      'https://images.pexels.com/photos/30297034/pexels-photo-30297034.png?auto=compress&cs=tinysrgb&w=1600'
                    }')`,
                  }}
                />
              </div>
              <div className="skew-slice">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('${
                      content.story_image_3 ||
                      'https://images.pexels.com/photos/27400770/pexels-photo-27400770.jpeg?auto=compress&cs=tinysrgb&w=1600'
                    }')`,
                  }}
                />
              </div>
            </div>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 62% at 50% 50%, rgba(18,26,17,.5), rgba(18,26,17,0) 72%)',
              }}
            />
          </div>

          {/* Right Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="flex flex-col justify-center bg-white py-14 px-6 sm:px-12 lg:p-20"
          >
            <div
              id="story"
              className="scroll-mt-36 font-sans text-xs font-semibold tracking-[0.16em] uppercase text-[#2B5138] mb-4"
            >
              {content.story_eyebrow || 'Our Story'}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#122A1F] leading-[1.08] tracking-[-0.015em] font-normal max-w-md">
              {content.story_title || "We have a different relationship with food and we're out to change yours"}
            </h2>
          </motion.div>
        </section>

        {/* ===== JOURNEY STRIP ===== */}
        <section className="bg-[#F1EDE3]" id="journey">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="wrap py-14 sm:py-18 lg:py-20"
          >
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1B3A28] leading-[1.2] mb-6 font-normal">
              {content.journey_title ||
                'Our journey began with a simple question: why has eating healthy become so difficult?'}
            </p>
            <p className="font-editorial text-lg sm:text-xl text-[#1F271E] leading-relaxed max-w-2xl">
              {content.journey_body ||
                "And then we discovered the extraordinary nutritional power of microgreens, and we realized something surprising. Nature had already created one of the most nutrient-rich foods. Most people had simply never experienced it. That realization became our purpose. Sometimes the smallest ingredients can create the biggest impact. Adding one handful of fresh greens to today's meal is enough to begin."}
            </p>
          </motion.div>
        </section>

        {/* ===== FOOD ALIVE SPLIT (Text Left, Photo Right) ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[58.5vh]">
          {/* Text Left */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="order-2 lg:order-1 flex flex-col justify-center bg-white py-14 px-6 sm:px-12 lg:p-20"
          >
            <div
              id="belief"
              className="scroll-mt-36 font-sans text-xs font-semibold tracking-[0.16em] uppercase text-[#2B5138] mb-4"
            >
              {content.belief_eyebrow || 'Our Belief'}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#122A1F] leading-[1.08] tracking-[-0.015em] font-normal max-w-md">
              {content.belief_title || 'We believe food should look alive, taste alive, and nourish life.'}
            </h2>
          </motion.div>

          {/* Photo Right */}
          <div className="order-1 lg:order-2 relative overflow-hidden min-h-[340px] sm:min-h-[400px] lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                cldUrl(content.belief_image, 1200) ||
                'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1600&auto=format&fit=crop'
              }
              alt={content.belief_image_alt?.trim() || 'Poached egg with vegetables and tomatoes on a blue plate'}
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover block"
            />
          </div>
        </section>

        {/* ===== PRINCIPLES ===== */}
        <section className="bg-[#F1EDE3]" id="principles">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="wrap py-14 sm:py-18 lg:py-20"
          >
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1B3A28] leading-[1.15] mb-10 font-normal">
              <strong className="font-medium text-[#122A1F]">
                {content.principles_title || 'Every tray we harvest is a reminder of why we began.'}
              </strong>{' '}
              We uphold the following principles:
            </p>
            <ul className="list-none m-0 p-0 max-w-3xl space-y-3.5 font-editorial text-lg sm:text-xl text-[#1F271E]">
              <li className="grid grid-cols-[2.2rem_1fr] gap-2 items-baseline">
                <span className="font-serif text-2xl text-[#2B5138] leading-none">+</span>
                <span>We grow real food, not processed food.</span>
              </li>
              <li className="grid grid-cols-[2.2rem_1fr] gap-2 items-baseline">
                <span className="font-serif text-2xl text-[#2B5138] leading-none">+</span>
                <span>We believe freshness has an expiry.</span>
              </li>
              <li className="grid grid-cols-[2.2rem_1fr] gap-2 items-baseline">
                <span className="font-serif text-2xl text-[#2B5138] leading-none">+</span>
                <span>We never compromise on purity. We deliver just honest food.</span>
              </li>
              <li className="grid grid-cols-[2.2rem_1fr] gap-2 items-baseline">
                <span className="font-serif text-2xl text-[#2B5138] leading-none">+</span>
                <span>
                  <strong className="font-medium text-[#122A1F]">We believe transparency builds trust.</strong> We want you to know what you&apos;re eating, where it comes from, and why it matters.
                </span>
              </li>
              <li className="grid grid-cols-[2.2rem_1fr] gap-2 items-baseline">
                <span className="font-serif text-2xl text-[#2B5138] leading-none">+</span>
                <span>
                  <strong className="font-medium text-[#122A1F]">We grow responsibly.</strong> Healthy soil, healthy growing practices, and respect for the environment.
                </span>
              </li>
            </ul>
          </motion.div>
        </section>

        {/* ===== NEW TO MICROGREENS (Mid-CTA) ===== */}
        <section className="bg-[#F1EDE3] p-0 overflow-hidden">
          <div className="mband">
            <div className="row">
              <div className="slice">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('https://images.pexels.com/photos/8515766/pexels-photo-8515766.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
                  }}
                />
              </div>
              <div className="slice">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('https://images.pexels.com/photos/30270630/pexels-photo-30270630.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
                  }}
                />
              </div>
              <div className="slice wide">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('https://images.pexels.com/photos/27400770/pexels-photo-27400770.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
                  }}
                />
              </div>
              <div className="slice">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=1600&auto=format&fit=crop')`,
                  }}
                />
              </div>
              <div className="slice tight">
                <div
                  className="cimg"
                  style={{
                    backgroundImage: `url('https://images.pexels.com/photos/27969848/pexels-photo-27969848.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
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

        {/* ===== WANT 15% OFF ===== */}
        <section className="bg-[#122A1F] py-16 text-[#FFFDF8]">
          <div className="wrap grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
            >
              <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-[1.15] mb-3">
                {renderNewsletterTitle(content.newsletter_title)}
              </h2>
              <p className="text-[#FFFDF8]/65 text-sm sm:text-base max-w-md">
                {content.newsletter_subtitle ||
                  'Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops.'}
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
            >
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={content.newsletter_placeholder || 'your@email.com'}
                  required
                  disabled={status === 'loading'}
                  className="flex-1 min-w-[200px] bg-[#FFFDF8]/10 border border-[#FFFDF8]/25 rounded-full px-5 py-3.5 text-[#FFFDF8] text-sm outline-none placeholder:text-[#FFFDF8]/45 focus:border-[#CFFA57] transition-colors"
                />
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
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
                  disabled={status === 'loading'}
                  className="bg-[#CFFA57] text-[#122A1F] font-bold text-sm px-7 py-3.5 rounded-full whitespace-nowrap hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                >
                  {status === 'loading' ? 'Signing Up...' : (content.newsletter_button_text || 'Sign Up')}
                </button>
              </form>
              {message && (
                <p
                  className={`text-xs mt-2.5 ${
                    status === 'success' ? 'text-[#CFFA57]' : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              )}
              <p className="text-[11px] text-[#FFFDF8]/40 mt-2.5">
                {content.newsletter_disclaimer || 'No spam. Unsubscribe anytime.'}
              </p>

              {/* Invisible Turnstile container — offscreen to preserve exact layout without dimension failures */}
              <div
                ref={containerRef}
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
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
