'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { loadTurnstileScript } from '@/lib/useTurnstile';
import { useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/format';
import { Truck, Sprout, PackageBox, Clipboard, Sparkles, AlertTriangle, Lock, Subscription } from '@/components/icons';
import JoinRevolutionSection from '@/components/JoinRevolutionSection';



interface OrderItem {
  id: string;
  quantity: number;
  unit_price_paise: number;
  variant_label: string;
  net_weight_grams: number;
  product_name: string;
  product_slug: string;
  subscription_trays?: number | null;
  subscription_weeks?: number | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  delivery_pincode: string;
  subtotal_paise: number;
  delivery_fee_paise?: number;
  discount_paise?: number;
  coupon_code?: string | null;
  total_paise: number;
  purchase_type: string;
  subscription_frequency: string | null;
  payment_status: string;
  payment_method?: string;
  fulfillment_status: string;
  created_at: string;
  items: OrderItem[];
}

const fulfillmentBadgeStyles: Record<string, { label: string; bg: string; text: string; border: string }> = {
  unfulfilled: {
    label: 'Morning Harvest In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  fulfilled: {
    label: 'Harvested & Packed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  shipped: {
    label: 'Out for Delivery',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  delivered: {
    label: 'Delivered Fresh',
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  cancelled: {
    label: 'Order Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
};

const TIMELINE_STEPS = [
  {
    key: 'placed',
    title: 'Order Confirmed',
    desc: 'Payment received & verified',
    iconType: 'clipboard',
  },
  {
    key: 'harvest',
    title: 'Morning Harvest',
    desc: 'Selected & harvested fresh at our indoor vertical farm',
    iconType: 'sprout',
  },
  {
    key: 'packed',
    title: 'Packed & Chilled',
    desc: 'Prepared in breathable eco-trays',
    iconType: 'package',
  },
  {
    key: 'shipped',
    title: 'Out for Delivery',
    desc: 'In transit with our fresh delivery partner',
    iconType: 'truck',
  },
  {
    key: 'delivered',
    title: 'Delivered Fresh',
    desc: 'Delivered fresh to your doorstep',
    iconType: 'sparkles',
  },
];

function renderStepIcon(type: string, className = 'w-4 h-4') {
  switch (type) {
    case 'clipboard':
      return <Clipboard className={className} />;
    case 'sprout':
      return <Sprout className={className} />;
    case 'package':
      return <PackageBox className={className} />;
    case 'truck':
      return <Truck className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return null;
  }
}

function getActiveStepIndex(status: string): number {
  switch (status) {
    case 'unfulfilled':
      return 1; // Morning harvest in progress
    case 'fulfilled':
      return 2; // Packed & Chilled
    case 'shipped':
      return 3; // Out for Delivery
    case 'delivered':
      return 4; // Delivered
    default:
      return 1;
  }
}

function getWhatsAppUrl(phoneStr?: string): string {
  const digits = (phoneStr || '').replace(/\D/g, '');
  const cleanNumber = digits.length === 10 ? `91${digits}` : (digits || '918427254445');
  return `https://wa.me/${cleanNumber}`;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic content blocks from admin
  const [content, setContent] = useState<Record<string, string>>({
    track_eyebrow: 'Real-Time Harvest & Delivery Tracking',
    track_title: 'Track Your Order',
    track_subtitle:
      'Enter your order number along with your phone number and email address to view the live harvest and delivery status.',
    track_support_phone: '+91 84272 54445',
    track_support_email: 'info@wildaboutgreens.com',
    track_harvest_note:
      'Grown with mineral water & clean air · Harvested morning of delivery',
  });

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Pre-fill fields from query params if available
  useEffect(() => {
    const qOrder = searchParams.get('order_number') || searchParams.get('orderNumber');
    const qPhone = searchParams.get('phone');
    const qEmail = searchParams.get('email');
    if (qOrder) setOrderNumber(qOrder);
    if (qPhone) setPhone(qPhone);
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  // Load content blocks for track-order page
  useEffect(() => {
    fetch('/api/content/track-order', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') {
          setContent((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Failed to load track-order content:', err));
  }, []);

  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    let observer: IntersectionObserver | null = null;

    const startLoading = () => {
      if (!active) return;
      loadTurnstileScript().then(() => {
        if (active) {
          setTurnstileReady(true);
        }
      });
    };

    const container = turnstileContainerRef.current;
    const form = container?.closest('form') || container;

    if (form) {
      form.addEventListener('focusin', startLoading, { once: true, passive: true });
      form.addEventListener('pointerdown', startLoading, { once: true, passive: true });

      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              startLoading();
              if (observer && form) observer.unobserve(form);
            }
          },
          { rootMargin: '200px' }
        );
        observer.observe(form);
      } else {
        startLoading();
      }
    } else {
      startLoading();
    }

    return () => {
      active = false;
      if (observer) observer.disconnect();
      if (form) {
        form.removeEventListener('focusin', startLoading);
        form.removeEventListener('pointerdown', startLoading);
      }
    };
  }, [siteKey]);

  const renderTurnstile = useCallback(() => {
    if (!turnstileReady || !siteKey || !window.turnstile || !turnstileContainerRef.current) return;
    if (turnstileWidgetId.current) {
      try {
        window.turnstile.remove(turnstileWidgetId.current);
      } catch {
        /* ignore */
      }
    }
    turnstileContainerRef.current.innerHTML = '';
    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      'error-callback': () => setTurnstileToken(null),
      theme: 'light',
    });
  }, [turnstileReady, siteKey]);

  useEffect(() => {
    renderTurnstile();
  }, [renderTurnstile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanOrderNumber) {
      setError('Please enter your order number.');
      return;
    }

    if (!cleanPhone || !cleanEmail) {
      setError('Both phone number and email address are required to track your order.');
      return;
    }

    if (siteKey && !turnstileToken) {
      setError('Please complete the verification check.');
      return;
    }

    setLoading(true);
    setSearched(false);

    try {
      const query = new URLSearchParams({
        order_number: cleanOrderNumber,
        phone: cleanPhone,
        email: cleanEmail,
        turnstileToken: turnstileToken || 'dev-token',
      });
      const res = await fetch(`/api/orders/lookup?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Unable to look up order. Please verify your details.');
        setOrders([]);
      } else {
        setOrders(data);
        setSearched(true);
      }
    } catch {
      setError('Failed to connect to the server. Please check your internet connection.');
      setOrders([]);
    } finally {
      setLoading(false);
      setTurnstileToken(null);
      renderTurnstile();
    }
  };

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Automatically scroll down to the order status section when an order is fetched
  useEffect(() => {
    if (searched && resultsRef.current) {
      const timer = setTimeout(() => {
        if (!resultsRef.current || typeof window === 'undefined') return;
        const rect = resultsRef.current.getBoundingClientRect();
        const headerOffset = 96; // Offset for fixed navigation header + spacing
        const targetY = window.pageYOffset + rect.top - headerOffset;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searched, orders]);

  return (
    <>
      {/* Main Container with ample top padding to avoid fixed navbar overlap */}
      <div className="bg-white min-h-screen text-[#151F19] pt-32 sm:pt-40 pb-20">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C3F2D]/5 border border-[#1C3F2D]/15 text-[#1C3F2D] text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
              <Truck className="w-3.5 h-3.5" />
              <span>{(content.track_eyebrow || 'Real-Time Harvest & Delivery Tracking').replace(/^🚚\s*/, '')}</span>
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#122A1F] tracking-tight mb-4">
              {content.track_title || 'Track Your Order'}
            </h1>

            <p className="text-[#151F19]/75 text-sm sm:text-base leading-relaxed">
              {content.track_subtitle ||
                'Enter your order number along with your phone number and email address to view the live harvest and delivery status.'}
            </p>
          </div>

          {/* Lookup Form Card */}
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E4DDC8] shadow-[0_12px_40px_rgba(21,31,25,0.06)] p-6 sm:p-10 mb-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="orderNumber"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                >
                  Order Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. WAG-XXXXXXXX"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm font-mono uppercase tracking-wider text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                  required
                  maxLength={30}
                />
                <p className="text-[11.5px] text-[#151F19]/55 mt-1">
                  Sent via email confirmation receipt (e.g. WAG-XXXXXXXX)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98XXXXXXXX"
                    required
                    className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                  />
                  <p className="text-[11px] text-[#151F19]/55 mt-1">Mobile number used at checkout</p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    required
                    className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                  />
                  <p className="text-[11px] text-[#151F19]/55 mt-1">Email address used at checkout</p>
                </div>
              </div>

              {/* Turnstile Container */}
              {siteKey && (
                <div className="flex justify-center pt-2">
                  <div ref={turnstileContainerRef} />
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-red-50/90 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!!siteKey && !turnstileToken)}
                className="w-full bg-[#1C3F2D] hover:bg-[#122A1F] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Looking up harvest status...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Track Harvest &amp; Delivery</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[#E4DDC8]/60 text-center">
              <p className="text-xs text-[#151F19]/55 inline-flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#151F19]/60 shrink-0" />
                <span>For privacy, order details require matching your order number and contact info.</span>
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div ref={resultsRef} className="scroll-mt-24 sm:scroll-mt-28" id="order-status-section">
            {searched && (
              <div className="space-y-8 animate-fadeIn">
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-[#E4DDC8] p-8 max-w-xl mx-auto shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-[#122A1F] mb-2">No Matching Orders Found</h2>
                  <p className="text-sm text-[#151F19]/70 max-w-md mx-auto mb-6 leading-relaxed">
                    We couldn&apos;t locate a paid order with those credentials. Please check for typos in your order
                    number, phone number, or email address.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/products"
                      className="px-5 py-2.5 rounded-full bg-[#1C3F2D] text-white text-xs font-semibold hover:bg-[#122A1F] transition-colors"
                    >
                      Shop Fresh Microgreens
                    </Link>
                    <a
                      href={getWhatsAppUrl(content.track_support_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-full border border-[#1C3F2D] text-[#1C3F2D] text-xs font-semibold hover:bg-[#1C3F2D]/5 transition-colors"
                    >
                      Contact Harvest Team
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {orders.map((order) => {
                    const statusConfig =
                      fulfillmentBadgeStyles[order.fulfillment_status] || fulfillmentBadgeStyles.unfulfilled;
                    const activeStepIndex = getActiveStepIndex(order.fulfillment_status);
                    const isCancelled = order.fulfillment_status === 'cancelled';

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl border border-[#E4DDC8] shadow-[0_12px_40px_rgba(21,31,25,0.06)] overflow-hidden"
                      >
                        {/* Top Banner / Order Summary Header */}
                        <div className="bg-gray-50/80 px-6 sm:px-8 py-5 border-b border-[#E4DDC8] flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-[11px] font-bold text-[#1C3F2D] uppercase tracking-wider">
                              Order Number
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-base sm:text-lg font-bold text-[#122A1F] tracking-wide">
                                {order.order_number}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyOrderNumber(order.order_number)}
                                className="text-xs bg-white text-[#1C3F2D] border border-[#E4DDC8] hover:border-[#1C3F2D] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                                title="Copy Order Number"
                              >
                                {copiedId === order.order_number ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                            <div>
                              <p className="text-[11px] text-[#151F19]/55 uppercase tracking-wide">Placed On</p>
                              <p className="font-medium text-[#151F19]">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] text-[#151F19]/55 uppercase tracking-wide">
                                {order.payment_method === 'cod' && order.payment_status === 'cod_pending'
                                  ? 'Pay on Delivery'
                                  : 'Total Paid'}
                              </p>
                              <p className="font-bold text-[#1C3F2D]">{formatPrice(order.total_paise)}</p>
                            </div>

                            <div>
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded-full border inline-block ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Visual Tracking Stepper */}
                        {!isCancelled && (
                          <div className="p-6 sm:p-8 bg-white border-b border-[#E4DDC8]/60">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-6 sm:mb-8">
                              Live Harvest &amp; Delivery Progress
                            </h3>

                            {/* Stepper Timeline */}
                            <div className="relative">
                              {/* Horizontal connector line for md+ screens */}
                              <div className="hidden md:block absolute top-5 left-10 right-10 h-1 bg-[#E4DDC8] -z-0">
                                <div
                                  className="h-full bg-[#1C3F2D] transition-all duration-700 ease-in-out"
                                  style={{
                                    width: `${(activeStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2 relative z-10">
                                {TIMELINE_STEPS.map((step, idx) => {
                                  const isCompleted = idx < activeStepIndex || order.fulfillment_status === 'delivered';
                                  const isCurrent = idx === activeStepIndex && order.fulfillment_status !== 'delivered';

                                  return (
                                    <div
                                      key={step.key}
                                      className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2"
                                    >
                                      {/* Circle indicator */}
                                      <div className="relative shrink-0">
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                            isCompleted
                                              ? 'bg-[#1C3F2D] text-white shadow-sm'
                                              : isCurrent
                                              ? 'bg-[#CFFA57] text-[#122A1F] border-2 border-[#1C3F2D] shadow-md ring-4 ring-[#CFFA57]/30'
                                              : 'bg-gray-50 text-[#151F19]/40 border border-[#E4DDC8]'
                                          }`}
                                        >
                                          {isCompleted ? (
                                            <span className="text-white text-xs">✓</span>
                                          ) : isCurrent ? (
                                            <span className="animate-pulse">{renderStepIcon(step.iconType, 'w-4 h-4 text-[#122A1F]')}</span>
                                          ) : (
                                            <span className="text-xs opacity-60">{renderStepIcon(step.iconType, 'w-3.5 h-3.5 text-[#151F19]/40')}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Label & Description */}
                                      <div>
                                        <p
                                          className={`text-xs sm:text-[13px] font-bold ${
                                            isCompleted || isCurrent ? 'text-[#122A1F]' : 'text-[#151F19]/50'
                                          }`}
                                        >
                                          {step.title}
                                        </p>
                                        <p className="text-[11px] text-[#151F19]/60 leading-tight mt-0.5">
                                          {step.desc}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {isCancelled && (
                          <div className="p-6 bg-rose-50/60 border-b border-rose-200 text-sm text-rose-800 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                            <div>
                              <p className="font-semibold">This order has been cancelled.</p>
                              <p className="text-xs text-rose-700/80">
                                If you have questions or require a refund update, please contact our support team.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Order Content & Itemized Breakdown */}
                        <div className="p-6 sm:p-8">
                          {/* Destination & Delivery Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50/50 border border-[#E4DDC8]/60 mb-6 text-xs sm:text-sm">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C3F2D] block mb-1">
                                Delivery Address
                              </span>
                              <p className="font-medium text-[#151F19]">
                                {order.customer_name} · {order.customer_phone}
                              </p>
                              <p className="text-[#151F19]/75 mt-0.5">
                                {order.delivery_address}, PIN {order.delivery_pincode}
                              </p>
                            </div>

                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C3F2D] block mb-1">
                                Harvest Guarantee
                              </span>
                              <p className="text-[#151F19]/80 leading-relaxed">
                                {content.track_harvest_note ||
                                  'Grown with mineral water & clean air · Harvested morning of delivery'}
                              </p>
                              {order.subscription_frequency && (
                                <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                                  <Subscription className="w-3.5 h-3.5 text-emerald-800" />
                                  <span>Active {order.subscription_frequency} Subscription</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="divide-y divide-[#E4DDC8]/60">
                            {order.items.map((item) => (
                              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-[#E4DDC8] flex items-center justify-center shrink-0 text-[#1C3F2D]">
                                    <Sprout className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <Link
                                      href={`/products/${item.product_slug}`}
                                      className="font-semibold text-sm text-[#122A1F] hover:text-[#1C3F2D] hover:underline transition-colors"
                                    >
                                      {item.product_name}
                                    </Link>
                                    <p className="text-xs text-[#151F19]/65">
                                      {item.variant_label} ({item.net_weight_grams}g) &times; {item.quantity}
                                    </p>
                                    {item.subscription_trays && item.subscription_weeks && (
                                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        <Subscription className="w-3 h-3 text-emerald-700" />
                                        <span>Subscription: {item.subscription_trays} trays/wk · {item.subscription_weeks} wks</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-[#122A1F] shrink-0">
                                  {formatPrice(item.unit_price_paise * item.quantity)}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Price Breakdown */}
                          <div className="mt-4 pt-4 border-t border-[#E4DDC8]/60 space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between text-[#151F19]/70">
                              <span>Items Subtotal</span>
                              <span className="font-medium text-[#151F19]">
                                {formatPrice(order.subtotal_paise ?? (order.total_paise - (order.delivery_fee_paise || 0)))}
                              </span>
                            </div>
                            <div className="flex justify-between text-[#151F19]/70">
                              <span>Farm Direct Delivery</span>
                              <span
                                className={
                                  order.delivery_fee_paise && order.delivery_fee_paise > 0
                                    ? 'font-medium text-[#151F19]'
                                    : 'font-semibold text-emerald-700'
                                }
                              >
                                {order.delivery_fee_paise && order.delivery_fee_paise > 0
                                  ? formatPrice(order.delivery_fee_paise)
                                  : 'Free'}
                              </span>
                            </div>
                            {typeof order.discount_paise === 'number' && order.discount_paise > 0 && (
                              <div className="flex justify-between text-[#151F19]/70 text-emerald-700 font-medium">
                                <span>Coupon Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                                <span>-{formatPrice(order.discount_paise)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm sm:text-base font-bold text-[#122A1F] pt-2 border-t border-[#E4DDC8]/60">
                              <span>
                                {order.payment_method === 'cod' && order.payment_status === 'cod_pending'
                                  ? `Cash on delivery: pay ${formatPrice(order.total_paise)} on delivery`
                                  : 'Paid'}
                              </span>
                              <span className="text-[#1C3F2D]">{formatPrice(order.total_paise)}</span>
                            </div>
                          </div>

                          {/* Farm Support Assistance Callout */}
                          <div className="mt-8 pt-6 border-t border-[#E4DDC8]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#151F19]/70">
                            <div>
                              <p className="font-semibold text-[#122A1F]">Questions about your harvest or delivery?</p>
                              <p>Our team is available every morning to assist you with fresh orders.</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {content.track_support_phone && (
                                <a
                                  href={getWhatsAppUrl(content.track_support_phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-1.5 rounded-full bg-[#1C3F2D] text-white font-medium hover:bg-[#122A1F] transition-colors inline-flex items-center gap-1.5"
                                >
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              {content.track_support_email && (
                                <a
                                  href={`mailto:${content.track_support_email}`}
                                  className="px-3.5 py-1.5 rounded-full border border-[#1C3F2D] text-[#1C3F2D] font-medium hover:bg-[#1C3F2D]/5 transition-colors"
                                >
                                  <span>Email Support</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        </main>
      </div>

      {/* Join The Revolution Section */}
      <JoinRevolutionSection />
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white pt-40 text-center text-sm text-[#151F19]/60">
          Loading tracking...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
