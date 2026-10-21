'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cartStore';
import { formatPrice } from '@/lib/format';
import {
  calculateDeliveryFee,
  FREE_DELIVERY_PINCODES,
  CHECKOUT_CITY_OPTIONS,
  isDeliverableCity,
} from '@/lib/delivery';
import { Truck, AlertTriangle, Sprout, Sparkles, Banknote, RotateCcw, WhatsApp } from '@/components/icons';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import { useInvisibleTurnstile } from '@/lib/useTurnstile';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPaise, clearCart } = useCartStore();
  const subtotal = totalPaise();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    pincode: '',
    city: 'Chandigarh',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // ── Payment Method State ──
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [codConfig, setCodConfig] = useState<{ enabled: boolean; maxOrderPaise: number }>({
    enabled: process.env.NEXT_PUBLIC_COD_ENABLED !== 'false',
    maxOrderPaise: 500000,
  });

  // ── Cash on Delivery Modal & Captcha State ──
  const [showCodModal, setShowCodModal] = useState(false);
  const [challenge, setChallenge] = useState<{ question: string; token: string } | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [codAnswer, setCodAnswer] = useState('');
  const [codError, setCodError] = useState<string | null>(null);
  const [codSubmitting, setCodSubmitting] = useState(false);
  const codSubmittingRef = useRef(false);
  const [sliderResetKey, setSliderResetKey] = useState(0);

  const [orderCompleted, setOrderCompleted] = useState(false);

  // ── Coupon State (Step 6) ──
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percentOff: number; discountPaise: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMessage, setCouponSuccessMessage] = useState<string | null>(null);

  // ── Invisible Turnstile Hook ──
  const {
    containerRef: turnstileContainerRef,
    getTokenBeforeSubmit: getTurnstileToken,
    reset: resetTurnstile,
  } = useInvisibleTurnstile();

  // Load Razorpay Checkout.js
  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Check COD status dynamically from server
  useEffect(() => {
    let active = true;
    fetch('/api/checkout/cod/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.enabled === 'boolean') {
          setCodConfig({
            enabled: data.enabled,
            maxOrderPaise: data.maxOrderPaise || 500000,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && items.length === 0 && !loading && !codSubmitting && !orderCompleted) {
      router.replace('/cart');
    }
  }, [mounted, items.length, loading, codSubmitting, orderCompleted, router]);

  const [freePincodes, setFreePincodes] = useState<Set<string>>(FREE_DELIVERY_PINCODES);

  useEffect(() => {
    let active = true;
    fetch('/api/delivery-pincodes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.freePincodes)) {
          setFreePincodes(new Set(data.freePincodes));
        } else if (Array.isArray(data.pincodes)) {
          setFreePincodes(new Set(data.pincodes));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const isPincodeEntered = form.pincode.trim().length === 6;
  const isDeliverable = useMemo(() => {
    return isDeliverableCity(form.city);
  }, [form.city]);

  // Real-time delivery fee calculation based on entered pincode, subtotal, and dynamic free delivery pincodes
  const deliveryCalc = useMemo(() => {
    return calculateDeliveryFee(form.pincode, subtotal, freePincodes);
  }, [form.pincode, subtotal, freePincodes]);

  // Real-time discount calculation: 15% of items subtotal only (not delivery fee), rounded down
  const discountPaise = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.floor((subtotal * appliedCoupon.percentOff) / 100);
  }, [appliedCoupon, subtotal]);

  const grandTotal = Math.max(0, subtotal + deliveryCalc.deliveryFeePaise - discountPaise);
  const hasSubscription = items.some((i) => i.isSubscription);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccessMessage(null);
    try {
      const res = await fetch('/api/checkout/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            isSubscription: Boolean(i.isSubscription),
            subscriptionTrays: i.subscriptionTrays,
            subscriptionWeeks: i.subscriptionWeeks,
          })),
          subtotalPaise: subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          percentOff: data.percentOff,
          discountPaise: data.discountPaise,
        });
        setCouponSuccessMessage(`${data.percentOff}% off coupon applied!`);
        setCouponError(null);
      } else {
        setCouponError(data.error || 'Invalid or inactive code');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Failed to validate code. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    setCouponSuccessMessage(null);
  };

  // WhatsApp pre-filled delivery request link
  const whatsappDeliveryUrl = useMemo(() => {
    const phone = '918427254445';
    const customerName = form.name.trim() || 'Valued Customer';
    const customerPhone = form.phone.trim() || 'Not specified';
    const customerAddress = form.address.trim() || 'Address not specified';
    const pin = form.pincode.trim() || 'Not specified';
    const cityLabel = form.city || 'Others';

    const itemsSummary = items
      .map((item) => `• ${item.productName} (${item.variantLabel}) x ${item.quantity}`)
      .join('\n');

    const message = `Hi Wild About Greens Team! 🌱\n\nI would like to request delivery to my location:\n• City: ${cityLabel}\n• Pincode: ${pin}\n• Name: ${customerName}\n• Phone: ${customerPhone}\n• Delivery Address: ${customerAddress}\n\n🛒 Order Items:\n${itemsSummary}\n• Cart Subtotal: ${formatPrice(subtotal)}\n\nCould you please check if delivery is possible to my address? Thank you!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [form.name, form.phone, form.address, form.pincode, form.city, items, subtotal]);

  // Fetch COD Math Challenge
  const fetchCodChallenge = useCallback(async () => {
    setLoadingChallenge(true);
    setCodError(null);
    try {
      const res = await fetch('/api/checkout/cod/challenge');
      const data = await res.json();
      if (res.ok && data.question && data.token) {
        setChallenge(data);
      } else {
        setCodError(data.error || 'Failed to load verification challenge. Please try again.');
      }
    } catch {
      setCodError('Unable to connect to the server for challenge. Please retry.');
    } finally {
      setLoadingChallenge(false);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // For pincode, only allow digits up to 6 chars
    if (name === 'pincode') {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      setForm((f) => ({ ...f, pincode: sanitized }));
    } else if (name === 'phone') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      setForm((f) => ({ ...f, phone: sanitized }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setError(null);
  };

  // Select Cash on Delivery Payment Method
  const handleSelectCod = () => {
    setPaymentMethod('cod');
    setError(null);
  };

  // Handle COD Order Confirmation from Slider
  const handleCodConfirm = async () => {
    if (codSubmittingRef.current || codSubmitting) return;

    if (!codAnswer.trim()) {
      setCodError('Please answer the math question first.');
      setSliderResetKey((k) => k + 1);
      return;
    }
    if (!challenge) {
      setCodError('Verification challenge expired. Loading a fresh question...');
      setSliderResetKey((k) => k + 1);
      fetchCodChallenge();
      return;
    }

    codSubmittingRef.current = true;
    setCodSubmitting(true);
    setCodError(null);

    try {
      // Step 5: Acquire invisible Turnstile token
      const acquiredTurnstileToken = await getTurnstileToken({
        title: 'Order Security Check',
        subtitle: 'Please complete the quick verification below to place your Cash on Delivery order.',
      });

      if (!acquiredTurnstileToken) {
        setCodError('Verification was cancelled. Please complete the security check to place your order.');
        setSliderResetKey((k) => k + 1);
        codSubmittingRef.current = false;
        setCodSubmitting(false);
        return;
      }

      const res = await fetch('/api/checkout/cod/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            isSubscription: Boolean(item.isSubscription),
            subscriptionTrays: item.subscriptionTrays,
            subscriptionWeeks: item.subscriptionWeeks,
          })),
          purchaseType: hasSubscription ? 'subscription' : 'one_time',
          subscriptionFrequency: hasSubscription ? 'weekly' : undefined,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          deliveryAddress: form.address.trim(),
          deliveryPincode: form.pincode.trim(),
          deliveryCity: form.city,
          challengeToken: challenge.token,
          challengeAnswer: codAnswer.trim(),
          turnstileToken: acquiredTurnstileToken,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Verification failed. Please try again.';
        setCodError(errorMsg);
        setSliderResetKey((k) => k + 1);
        resetTurnstile();

        // Only wipe answer and re-fetch math challenge if it was actually a math captcha / expired error
        const isMathCaptchaError =
          res.status === 400 &&
          (errorMsg.toLowerCase().includes('answer') ||
            errorMsg.toLowerCase().includes('math') ||
            errorMsg.toLowerCase().includes('challenge') ||
            errorMsg.toLowerCase().includes('expired') ||
            errorMsg.toLowerCase().includes('captcha'));

        if (isMathCaptchaError) {
          setCodAnswer('');
          fetchCodChallenge();
        }

        codSubmittingRef.current = false;
        setCodSubmitting(false);
        return;
      }

      // Step 7: On success, redirect to the existing order-confirmation page.
      const confirmNumber = data.orderNumber || data.order_number;
      const customerEmail = data.customerEmail || form.email.trim();

      try {
        sessionStorage.setItem(
          'wga_last_order',
          JSON.stringify({
            orderNumber: confirmNumber,
            customerName: data.customerName || form.name.trim(),
            customerEmail: customerEmail,
            customerPhone: form.phone.trim(),
            deliveryAddress: `${form.address.trim()}, ${form.city}`,
            deliveryPincode: form.pincode.trim(),
            subtotalPaise: data.subtotalPaise ?? subtotal,
            deliveryFeePaise: data.deliveryFeePaise ?? deliveryCalc.deliveryFeePaise,
            discountPaise: data.discountPaise ?? discountPaise,
            couponCode: data.couponCode ?? appliedCoupon?.code ?? null,
            totalPaise: data.totalPaise ?? grandTotal,
            purchaseType: hasSubscription ? 'subscription' : 'one_time',
            subscriptionFrequency: hasSubscription ? 'weekly' : null,
            paymentMethod: 'cod',
            items: items.map((i) => ({
              productName: i.productName,
              variantLabel: i.variantLabel,
              quantity: i.quantity,
              pricePaise: i.pricePaise,
              image: i.thumbnailUrl || undefined,
            })),
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore storage errors
      }

      setOrderCompleted(true);
      clearCart();
      router.push(
        `/order-confirmation?orderNumber=${encodeURIComponent(confirmNumber)}&email=${encodeURIComponent(customerEmail)}`
      );
    } catch {
      setCodError('Failed to connect to the server. Please check your internet connection.');
      setSliderResetKey((k) => k + 1);
      resetTurnstile();
      codSubmittingRef.current = false;
      setCodSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim() || !form.pincode.trim()) {
      setError('Please fill in all required delivery details.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError('Please enter a valid 6-digit delivery pincode.');
      return;
    }
    if (!isDeliverableCity(form.city)) {
      setError('Direct online checkout is only available for Chandigarh, Panchkula, and Mohali. Please use the WhatsApp button below to request delivery.');
      return;
    }

    // If Cash on Delivery is selected, trigger COD modal
    if (paymentMethod === 'cod') {
      setShowCodModal(true);
      setCodError(null);
      setCodAnswer('');
      fetchCodChallenge();
      return;
    }

    // Online Razorpay Payment Flow
    setLoading(true);

    try {
      // Create order with validated items and delivery pincode
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            isSubscription: Boolean(item.isSubscription),
            subscriptionTrays: item.subscriptionTrays,
            subscriptionWeeks: item.subscriptionWeeks,
          })),
          purchaseType: hasSubscription ? 'subscription' : 'one_time',
          subscriptionFrequency: hasSubscription ? 'weekly' : undefined,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          deliveryAddress: form.address.trim(),
          deliveryPincode: form.pincode.trim(),
          deliveryCity: form.city,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'Some items are out of stock. Please update your cart.');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Open Razorpay checkout
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey || !razorpayLoaded) {
        setError('Payment system is not ready. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: rzpKey,
        order_id: data.razorpayOrderId || data.razorpay_order_id,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Wild About Greens',
        description: 'Fresh Microgreens Order',
        prefill: {
          name: form.name.trim(),
          contact: form.phone.trim(),
          email: form.email.trim() || undefined,
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              const confirmNumber = verifyData.orderNumber || data.orderNumber;
              const customerEmail = verifyData.customerEmail || form.email.trim();

              try {
                sessionStorage.setItem(
                  'wga_last_order',
                  JSON.stringify({
                    orderNumber: confirmNumber,
                    customerName: verifyData.customerName || form.name.trim(),
                    customerEmail: customerEmail,
                    customerPhone: form.phone.trim(),
                    deliveryAddress: form.address.trim(),
                    deliveryPincode: form.pincode.trim(),
                    subtotalPaise: verifyData.subtotalPaise ?? data.subtotalPaise ?? subtotal,
                    deliveryFeePaise: verifyData.deliveryFeePaise ?? data.deliveryFeePaise ?? deliveryCalc.deliveryFeePaise,
                    discountPaise: verifyData.discountPaise ?? data.discountPaise ?? discountPaise,
                    couponCode: verifyData.couponCode ?? data.couponCode ?? appliedCoupon?.code ?? null,
                    totalPaise: verifyData.totalPaise || data.amount || grandTotal,
                    purchaseType: hasSubscription ? 'subscription' : 'one_time',
                    subscriptionFrequency: hasSubscription ? 'weekly' : null,
                    paymentMethod: 'online',
                    items: items.map((i) => ({
                      productName: i.productName,
                      variantLabel: i.variantLabel,
                      quantity: i.quantity,
                      pricePaise: i.pricePaise,
                      image: i.thumbnailUrl || undefined,
                    })),
                    createdAt: new Date().toISOString(),
                  })
                );
              } catch {
                // Silently ignore storage issues
              }

              setOrderCompleted(true);
              clearCart();
              router.push(
                `/order-confirmation?orderNumber=${encodeURIComponent(confirmNumber)}&email=${encodeURIComponent(customerEmail)}`
              );
            } else {
              setError('Payment verification failed. If you were charged, please contact us.');
              setLoading(false);
            }
          } catch {
            setError('Payment verification failed. If you were charged, please contact us.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your cart is still saved, you can try again anytime.');
            setLoading(false);
          },
        },
      });

      rzp.open();
    } catch {
      setError('Failed to connect to our server. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (!mounted || items.length === 0) return null;

  return (
    <main className="min-h-screen bg-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-[#5C6B60]">
            <Link href="/cart" className="hover:text-[#1C3F2D] transition-colors underline decoration-dotted">
              Shopping Cart
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#1C3F2D]">Express Checkout</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold text-[#5C6B60] block mb-1">
              Fast &amp; Secure Dispatch
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#151F19]">
              Complete Your Delivery Details
            </h1>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3 shadow-sm animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold block">Please note:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Two-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Delivery & Customer Information Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E2D2] p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Customer Contact */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F0EBE0]">
                    <span className="w-6 h-6 rounded-full bg-[#1C3F2D] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#151F19]">
                      Contact Information
                    </h2>
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#151F19] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
                      placeholder="e.g. Gurpreet Singh"
                    />
                  </div>

                  {/* Phone & Email Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#151F19] mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          maxLength={10}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
                          placeholder="10-digit mobile"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#151F19] mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
                        placeholder="For tracking & invoice"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Delivery Destination */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F0EBE0]">
                    <span className="w-6 h-6 rounded-full bg-[#1C3F2D] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#151F19]">
                      Delivery Destination
                    </h2>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-[#151F19] mb-1.5">
                      Street Address &amp; House / Flat No. <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none resize-none transition-all"
                      placeholder="House/Flat number, building name, street, locality"
                    />
                  </div>

                  {/* Pincode with Dynamic Calculation Badge */}
                  <div>
                    <div className="mb-1.5">
                      <label htmlFor="pincode" className="block text-xs font-semibold uppercase tracking-wider text-[#151F19]">
                        Delivery Pincode <span className="text-red-500">*</span>
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#DCD6C5] rounded-xl text-sm font-mono tracking-wider text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
                        placeholder="6-digit pincode"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {!isDeliverable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Outside Zone
                          </span>
                        ) : isPincodeEntered ? (
                          deliveryCalc.deliveryFeePaise === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Free Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              +₹69 Delivery
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">6 digits</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* City Dropdown (Chandigarh, Panchkula, Mohali, Others) */}
                  <div>
                    <div className="mb-1.5">
                      <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-[#151F19]">
                        Delivery City <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <select
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all cursor-pointer"
                    >
                      {CHECKOUT_CITY_OPTIONS.map((cityOption) => (
                        <option key={cityOption} value={cityOption}>
                          {cityOption}
                        </option>
                      ))}
                    </select>

                    {/* Real-Time Delivery Banner */}
                    <div className="mt-2.5">
                      {!isDeliverable ? (
                        <div className="p-3.5 bg-amber-50/95 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 animate-fadeIn">
                          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong className="font-bold text-amber-950 block">
                              Outside Standard Delivery Area (Chandigarh, Panchkula &amp; Mohali)
                            </strong>
                            <span>
                              Direct automated checkout is only available in Chandigarh, Panchkula, and Mohali. Please request custom delivery below via WhatsApp!
                            </span>
                          </div>
                        </div>
                      ) : isPincodeEntered ? (
                        deliveryCalc.isUnder4Km ? (
                          <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-fadeIn">
                            <Sprout className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <strong className="font-bold text-emerald-950 block">
                                Free Farm Delivery Area ({form.pincode})
                              </strong>
                              <span>
                                Your pincode qualifies for complimentary direct farm delivery on all orders!
                              </span>
                            </div>
                          </div>
                        ) : deliveryCalc.isFreeDelivery ? (
                          <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-fadeIn">
                            <Sparkles className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <strong className="font-bold text-emerald-950 block">
                                Free Delivery Unlocked!
                              </strong>
                              <span>
                                Your order subtotal is ₹500 or above. You enjoy complimentary farm delivery!
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-[#FAF4E5] border border-[#E8D9B5] rounded-xl text-xs text-[#7A5B18] space-y-2 animate-fadeIn">
                            <div className="flex items-start gap-2.5">
                              <Truck className="w-4 h-4 text-[#7A5B18] shrink-0 mt-0.5" />
                              <div className="leading-relaxed">
                                <strong className="font-bold text-[#5C420D] block">
                                  Standard Delivery Fee: ₹69
                                </strong>
                                <span>
                                  Add <strong>₹{Math.ceil(deliveryCalc.freeDeliveryThresholdRemainingPaise / 100)}</strong> more worth of fresh greens to unlock <strong>FREE Delivery</strong>!
                                </span>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="pt-1">
                              <div className="w-full bg-[#E8D9B5] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#1C3F2D] h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, Math.round((subtotal / 50000) * 100))}%`,
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-[11px] text-[#7A5B18] mt-1">
                                <span>Cart: {formatPrice(subtotal)}</span>
                                <span>Target: ₹500.00</span>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-[#5C6B60] mt-1.5 font-medium">
                          Enter pincode to check delivery charges
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* When City is Others (outside Chandigarh, Panchkula, Mohali): Show WhatsApp Request Button */}
                {!isDeliverable ? (
                  <div className="pt-4 border-t border-[#F0EBE0] space-y-4">
                    <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/90 via-[#FBF8EF] to-white border-2 border-[#25D366]/40 rounded-2xl shadow-sm space-y-4 animate-fadeIn">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <WhatsApp className="w-6 h-6 fill-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-base sm:text-lg text-[#151F19] leading-snug">
                              Request Delivery{form.pincode.trim() ? ` to Pincode ${form.pincode}` : ''}
                            </h3>
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              Special Request
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#4A5C50] mt-1 leading-relaxed">
                            Online checkout &amp; COD are currently available in Chandigarh, Panchkula, and Mohali. Tap below to send your order directly to our farm team via WhatsApp to arrange delivery!
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/90 p-3.5 rounded-xl border border-[#25D366]/20 text-xs text-[#2A3F32] space-y-1.5">
                        <p className="font-bold text-[#151F19] flex items-center gap-1.5">
                          <span>🌱</span>
                          <span>How It Works:</span>
                        </p>
                        <p className="leading-relaxed">
                          We will receive your delivery address{form.pincode.trim() ? `, pincode (${form.pincode}),` : ''} and cart items on WhatsApp. Our farm manager will check route feasibility and confirm delivery timing directly with you!
                        </p>
                      </div>

                      <a
                        href={whatsappDeliveryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] text-center"
                      >
                        <WhatsApp className="w-5 h-5 fill-white" />
                        <span>Request Delivery via WhatsApp</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Section 3: Payment Method Choice (Shown only when COD is enabled and area is deliverable) */}
                    {codConfig.enabled && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#F0EBE0]">
                          <span className="w-6 h-6 rounded-full bg-[#1C3F2D] text-white text-xs font-bold flex items-center justify-center">
                            3
                          </span>
                          <h2 className="font-serif text-lg font-bold text-[#151F19]">
                            Payment Method
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Option 1: Online Payment */}
                          <div
                            onClick={() => setPaymentMethod('online')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                              paymentMethod === 'online'
                                ? 'border-[#1C3F2D] bg-[#1C3F2D]/5 shadow-sm ring-1 ring-[#1C3F2D]'
                                : 'border-[#E8E2D2] hover:border-[#C4BAA3] bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="online"
                                  checked={paymentMethod === 'online'}
                                  onChange={() => setPaymentMethod('online')}
                                  className="w-4 h-4 text-[#1C3F2D] focus:ring-[#1C3F2D] cursor-pointer"
                                />
                                <span className="font-bold text-sm text-[#151F19]">Online Payment</span>
                              </div>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Fast &amp; Instant
                              </span>
                            </div>
                            <p className="text-xs text-[#5C6B60] leading-relaxed">
                              Pay securely with UPI (GPay, PhonePe, Paytm), Debit/Credit Cards &amp; NetBanking.
                            </p>
                          </div>

                          {/* Option 2: Cash on Delivery */}
                          <div
                            onClick={handleSelectCod}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                              paymentMethod === 'cod'
                                ? 'border-[#1C3F2D] bg-[#1C3F2D]/5 shadow-sm ring-1 ring-[#1C3F2D]'
                                : 'border-[#E8E2D2] hover:border-[#C4BAA3] bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="cod"
                                  checked={paymentMethod === 'cod'}
                                  onChange={handleSelectCod}
                                  className="w-4 h-4 text-[#1C3F2D] focus:ring-[#1C3F2D] cursor-pointer"
                                />
                                <span className="font-bold text-sm text-[#151F19]">Cash on Delivery</span>
                              </div>
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                                Pay at Doorstep
                              </span>
                            </div>
                            <p className="text-xs text-[#5C6B60] leading-relaxed">
                              Slide to confirm your order now. Pay in cash directly upon doorstep arrival.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit CTA (Mobile and Desktop) */}
                    <div className="pt-4 border-t border-[#F0EBE0] space-y-3">
                      <button
                        type="submit"
                        disabled={loading || codSubmitting}
                        className="w-full py-4 px-6 bg-[#1C3F2D] hover:bg-[#122A1F] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Preparing Secure Payment...</span>
                          </>
                        ) : paymentMethod === 'cod' ? (
                          <>
                            <Banknote className="w-5 h-5 shrink-0" />
                            <span>Confirm COD Order ({formatPrice(isPincodeEntered ? grandTotal : Math.max(0, subtotal - discountPaise))})</span>
                            <span>→</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <span>Pay {formatPrice(isPincodeEntered ? grandTotal : Math.max(0, subtotal - discountPaise))} Securely</span>
                            <span>→</span>
                          </>
                        )}
                      </button>

                      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-600 pt-1">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                          </svg>
                          <span>256-Bit SSL Encrypted</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 15h4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>UPI, Cards &amp; Cash Accepted</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0V12m0 0a3 3 0 1 0-3-3m3 3a3 3 0 1 1 3-3" />
                          </svg>
                          <span>100% Live Harvest Guarantee</span>
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E8E2D2] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE0]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#151F19]">
                      Order Summary
                    </h3>
                    <p className="text-xs text-[#5C6B60]">
                      {items.length} {items.length === 1 ? 'item' : 'items'} in basket
                    </p>
                  </div>
                  <Link
                    href="/cart"
                    className="text-xs font-semibold text-[#1C3F2D] hover:underline decoration-dotted"
                  >
                    Edit Cart ↗
                  </Link>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto my-3 pr-1">
                  {items.map((item) => {
                    const itemKey = item.id || item.variantId;
                    return (
                      <div key={itemKey} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.thumbnailUrl ? (
                            <div className="w-12 h-12 rounded-lg bg-gray-50 border border-[#E8E2D2] overflow-hidden shrink-0 relative">
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.productName}
                                fill
                                className="object-contain p-0.5"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                              <Sprout className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#151F19] truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-[#5C6B60]">
                              {item.variantLabel} • Qty: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-bold text-gray-900 shrink-0">
                          {formatPrice(item.pricePaise * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subscription Notice Pill */}
                {hasSubscription && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-4">
                    <Sprout className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Subscription Plan:</strong> Live trays delivered weekly to your doorstep.
                    </span>
                  </div>
                )}

                {/* Have a coupon? Section */}
                <div className="pt-3 border-t border-[#F0EBE0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#151F19]">Have a coupon?</span>
                    {appliedCoupon && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {appliedCoupon.percentOff}% OFF
                      </span>
                    )}
                  </div>

                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="Enter coupon code"
                        disabled={couponLoading}
                        className="flex-1 min-w-0 bg-[#F9FAFB] border border-[#E8E2D2] rounded-xl px-3 py-2 text-xs uppercase font-mono tracking-wider outline-none focus:border-[#1C3F2D] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 bg-[#1C3F2D] hover:bg-[#122A1F] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                      >
                        {couponLoading ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-900 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          (-{appliedCoupon.percentOff}%)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs text-rose-600 font-medium">{couponError}</p>
                  )}
                  {couponSuccessMessage && !couponError && (
                    <p className="text-xs text-emerald-700 font-medium">{couponSuccessMessage}</p>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="pt-3 border-t border-[#F0EBE0] space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                  </div>

                  {discountPaise > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold">
                      <span>Coupon Discount ({appliedCoupon?.code || '15% OFF'})</span>
                      <span>-{formatPrice(discountPaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600">Farm Direct Delivery</span>
                      {deliveryCalc.isUnder4Km && isPincodeEntered && isDeliverable && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                          Local
                        </span>
                      )}
                    </div>
                    <div>
                      {!isDeliverable ? (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          WhatsApp Request
                        </span>
                      ) : !isPincodeEntered ? (
                        <span className="text-xs text-[#5C6B60] italic">
                          Enter pincode to check delivery charges
                        </span>
                      ) : deliveryCalc.deliveryFeePaise === 0 ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <span>FREE</span>
                          <span className="text-xs text-gray-400 line-through">₹69</span>
                        </span>
                      ) : (
                        <span className="font-bold text-gray-900">
                          {formatPrice(deliveryCalc.deliveryFeePaise)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="pt-3 border-t border-[#E8E2D2] flex justify-between items-baseline">
                    <div>
                      <span className="text-base font-bold text-[#151F19] block">
                        {!isDeliverable
                          ? 'Cart Subtotal'
                          : paymentMethod === 'cod'
                          ? 'Cash Payable at Doorstep'
                          : 'Total Payable'}
                      </span>
                      <span className="text-[11px] text-[#5C6B60]">
                        {!isDeliverable
                          ? 'Delivery arranged via WhatsApp'
                          : isPincodeEntered
                          ? 'Inclusive of all taxes & delivery'
                          : 'Delivery calculated on pincode'}
                      </span>
                    </div>
                    <span className="text-2xl font-extrabold text-[#1C3F2D]">
                      {formatPrice(!isDeliverable || !isPincodeEntered ? Math.max(0, subtotal - discountPaise) : grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Back to Shopping */}
              <div className="text-center">
                <Link
                  href="/products"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline"
                >
                  ← Back to All Microgreens
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cash on Delivery Confirmation Modal ── */}
        {showCodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E8E2D2] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#F0EBE0]">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C3F2D] bg-[#1C3F2D]/10 px-2.5 py-0.5 rounded-full inline-block">
                    Doorstep Verification
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#151F19]">
                    Confirm Cash on Delivery
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCodModal(false);
                    setCodError(null);
                    codSubmittingRef.current = false;
                  }}
                  disabled={codSubmitting}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  title="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Error banner inside modal */}
              {codError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">
                    {codError}
                  </div>
                </div>
              )}

              {/* Order Summary Snapshot */}
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D2]/60">
                  <span className="text-gray-600 font-medium">Deliver to:</span>
                  <span className="font-bold text-gray-900 text-right">
                    {form.name} (+91 {form.phone})
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D2]/60">
                  <span className="text-gray-600 font-medium">Address:</span>
                  <span className="font-medium text-gray-800 text-right max-w-[240px] truncate" title={`${form.address}, ${form.city}`}>
                    {form.address}, {form.city} - {form.pincode}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D2]/60">
                  <span className="text-gray-600 font-medium">Items in basket:</span>
                  <span className="font-bold text-gray-900">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="font-bold text-sm text-[#151F19] block">Cash Due on Delivery</span>
                    <span className="text-[10px] text-[#5C6B60]">Please keep exact cash ready</span>
                  </div>
                  <span className="text-2xl font-black text-[#1C3F2D]">
                    {formatPrice(isPincodeEntered ? grandTotal : Math.max(0, subtotal - discountPaise))}
                  </span>
                </div>
              </div>

              {/* Math Captcha Challenge Box */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="codAnswerInput"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D]"
                  >
                    Solve Math Question <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={fetchCodChallenge}
                    disabled={loadingChallenge || codSubmitting}
                    className="text-[11px] text-[#5C6B60] hover:text-[#1C3F2D] flex items-center gap-1 font-semibold underline decoration-dotted cursor-pointer"
                  >
                    {loadingChallenge ? (
                      <span>Loading...</span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> New question
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Math Question Pill */}
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-mono text-lg font-extrabold text-[#1C3F2D] tracking-wider min-w-[130px] text-center shadow-inner">
                    {loadingChallenge ? '...' : challenge?.question || 'Loading...'}
                  </div>

                  <div className="flex-1">
                    <input
                      id="codAnswerInput"
                      type="number"
                      inputMode="numeric"
                      autoFocus
                      placeholder="Your answer"
                      value={codAnswer}
                      onChange={(e) => {
                        setCodAnswer(e.target.value.replace(/[^0-9-]/g, ''));
                        setCodError(null);
                      }}
                      disabled={codSubmitting || loadingChallenge}
                      className="w-full px-4 py-3 bg-white border-2 border-[#DCD6C5] focus:border-[#1C3F2D] rounded-xl text-base font-bold font-mono text-gray-900 placeholder:text-gray-400 outline-none transition-all text-center"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 text-center">
                  Answer the question to unlock the slide-to-confirm slider.
                </p>
              </div>

              {/* Slide to Confirm iPhone Style */}
              <div className="pt-2">
                <SlideToConfirm
                  onConfirm={handleCodConfirm}
                  disabled={!codAnswer.trim() || codSubmitting || loadingChallenge}
                  loading={codSubmitting}
                  resetTrigger={sliderResetKey}
                  idleText="Slide to confirm COD order →"
                  disabledText="Type answer above to unlock slider"
                  successText="Placing Order..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Invisible Turnstile Container — offscreen to prevent 0x0 dimension failures */}
        <div
          ref={turnstileContainerRef}
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
      </main>
  );
}
