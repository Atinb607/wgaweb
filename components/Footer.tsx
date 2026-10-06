'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { isAdminPath } from '@/lib/adminAuth';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleTurnstileScriptReady = useCallback(() => {
    setTurnstileReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.turnstile) {
        setTurnstileReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const renderTurnstile = useCallback(() => {
    if (!turnstileReady || !siteKey || !window.turnstile || !turnstileContainerRef.current) return;
    if (turnstileWidgetId.current) {
      try { window.turnstile.remove(turnstileWidgetId.current); } catch { /* ignore */ }
    }
    turnstileContainerRef.current.innerHTML = '';
    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      'error-callback': () => setTurnstileToken(null),
      theme: 'dark',
    });
  }, [turnstileReady, siteKey]);

  useEffect(() => {
    renderTurnstile();
  }, [renderTurnstile]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!turnstileToken) {
      setStatus('error');
      setMessage('Security check in progress. Please try again in a moment.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'footer',
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Thanks for subscribing! 🌱');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to connect. Please try again.');
    } finally {
      // Reset Turnstile for next submission
      setTurnstileToken(null);
      renderTurnstile();
    }
  };

  if (isAdminPath(pathname)) {
    return null;
  }

  return (
    <>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={handleTurnstileScriptReady}
        />
      )}
      <footer className="bg-[#151F19] text-[#FFFDF8]/70 pt-16 pb-8 border-t border-white/10 mt-auto">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10 pb-12 border-b border-white/10">
            {/* Brand Info */}
            <div>
              <Link
                href="/"
                className="inline-block mb-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CFFA57] rounded-lg"
                aria-label="Wild About Greens Home"
              >
                <Image
                  src="/logo-picture-bg.png"
                  alt="Wild About Greens"
                  width={188}
                  height={42}
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </Link>
              <p className="text-sm leading-relaxed text-[#FFFDF8]/60 max-w-[290px] mb-4">
                Fresh microgreens, cut to order, grown on vertical indoor racks.
              </p>
            </div>

            {/* Shop column */}
            <div className="space-y-3">
              <h5 className="font-mono text-[11.5px] tracking-wider uppercase text-[#FFFDF8]/40 mb-4 font-semibold">
                Shop
              </h5>
              <Link href="/products" className="block text-[14.5px] text-[#FFFDF8]/75 hover:text-[#CFFA57] transition-colors">
                All Microgreens
              </Link>
              <Link href="/products?category=bundle" className="block text-[14.5px] text-[#FFFDF8]/75 hover:text-[#CFFA57] transition-colors">
                Subscriptions &amp; Bundles
              </Link>
              <Link href="/cart" className="block text-[14.5px] text-[#FFFDF8]/75 hover:text-[#CFFA57] transition-colors">
                Your Cart
              </Link>
            </div>

            {/* Learn & Explore column */}
            <div className="space-y-3">
              <h5 className="font-mono text-[11.5px] tracking-wider uppercase text-[#FFFDF8]/40 mb-4 font-semibold">
                Explore
              </h5>
              <Link href="/our-story" className="block text-[14.5px] text-[#FFFDF8]/75 hover:text-[#CFFA57] transition-colors">
                Our Story
              </Link>
              <Link href="/pathshala" className="block text-[14.5px] text-[#FFFDF8]/75 hover:text-[#CFFA57] transition-colors">
                Pathshala
              </Link>
              <Link href="/recipes" className="block text-[14.5px] text-[#FFFDF8]/75 hover:text-[#CFFA57] transition-colors">
                Recipe Khazana
              </Link>
            </div>

            {/* Stay Rooted Newsletter */}
            <div>
              <h5 className="font-mono text-[11.5px] tracking-wider uppercase text-[#FFFDF8]/40 mb-3 font-semibold">
                Stay Rooted
              </h5>
              <p className="text-[#FFFDF8]/50 text-[13.5px] leading-relaxed mb-3">
                Growing tips, harvest drops, and kitchen pairing ideas. Zero spam.
              </p>
              <form onSubmit={handleSubscribe} className="flex border-b border-white/25 pb-2.5 mt-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-transparent border-none text-white text-sm flex-1 outline-none placeholder:text-white/40"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="text-[#CFFA57] font-semibold text-sm hover:underline pl-2 disabled:opacity-50"
                >
                  {status === 'loading' ? '...' : 'Join →'}
                </button>
              </form>
              {/* Invisible Turnstile container positioned off-screen to preserve exact layout */}
              <div
                ref={turnstileContainerRef}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                aria-hidden="true"
              />
              {message && (
                <p
                  className={`text-xs mt-2.5 ${
                    status === 'success' ? 'text-[#CFFA57] font-medium' : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 text-[12.5px] text-[#FFFDF8]/40 gap-3">
            <div>© Wild About Greens · Fresh harvest</div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Link href="/privacy-policy" className="text-[#FFFDF8]/60 hover:text-[#CFFA57] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="text-[#FFFDF8]/60 hover:text-[#CFFA57] transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/shipping-and-returns" className="text-[#FFFDF8]/60 hover:text-[#CFFA57] transition-colors">
                Shipping &amp; Returns
              </Link>
              <Link href="/contact-us" className="text-[#FFFDF8]/60 hover:text-[#CFFA57] transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
