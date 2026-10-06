'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cartStore';
import { formatPrice } from '@/lib/format';
import { calculateDeliveryFee } from '@/lib/delivery';
import { Truck } from '@/components/icons';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function isServiceablePincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
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
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && items.length === 0 && !loading) {
      router.replace('/cart');
    }
  }, [mounted, items.length, loading, router]);

  // Real-time delivery fee calculation based on entered pincode and subtotal
  const deliveryCalc = useMemo(() => {
    return calculateDeliveryFee(form.pincode, subtotal);
  }, [form.pincode, subtotal]);

  const grandTotal = subtotal + deliveryCalc.deliveryFeePaise;
  const hasSubscription = items.some((i) => i.isSubscription);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!isServiceablePincode(form.pincode)) {
      setError('Please enter a valid 6-digit delivery pincode.');
      return;
    }

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
                    subtotalPaise: verifyData.subtotalPaise ?? subtotal,
                    deliveryFeePaise: verifyData.deliveryFeePaise ?? deliveryCalc.deliveryFeePaise,
                    totalPaise: verifyData.totalPaise || data.amount || grandTotal,
                    purchaseType: hasSubscription ? 'subscription' : 'one_time',
                    subscriptionFrequency: hasSubscription ? 'weekly' : null,
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

  const isPincodeEntered = form.pincode.length === 6;

  return (
    <main className="min-h-screen bg-[#FAF7EE] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
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
            <span className="text-lg shrink-0">⚠️</span>
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
                    className="w-full px-4 py-3 bg-[#FAF7EE]/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
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
                        className="w-full pl-12 pr-4 py-3 bg-[#FAF7EE]/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
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
                      className="w-full px-4 py-3 bg-[#FAF7EE]/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
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
                    className="w-full px-4 py-3 bg-[#FAF7EE]/50 border border-[#DCD6C5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none resize-none transition-all"
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
                      className="w-full px-4 py-3 bg-[#FAF7EE]/50 border border-[#DCD6C5] rounded-xl text-sm font-mono tracking-wider text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#1C3F2D] focus:ring-1 focus:ring-[#1C3F2D] outline-none transition-all"
                      placeholder="6-digit pincode"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {isPincodeEntered ? (
                        deliveryCalc.isFreeDelivery ? (
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

                  {/* Real-Time Delivery Banner */}
                  <div className="mt-2.5">
                    {isPincodeEntered ? (
                      deliveryCalc.isUnder4Km ? null : deliveryCalc.isFreeDelivery ? (
                        <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-fadeIn">
                          <span className="text-base shrink-0">🎉</span>
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

              {/* Submit CTA (Mobile and Desktop) */}
              <div className="pt-4 border-t border-[#F0EBE0] space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#1C3F2D] hover:bg-[#122A1F] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Preparing Secure Payment...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      <span>Pay {formatPrice(isPincodeEntered ? grandTotal : subtotal)} Securely</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-600 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    <span>Razorpay 256-Bit SSL Secure</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 15h4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>UPI, Cards, NetBanking</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0V12m0 0a3 3 0 1 0-3-3m3 3a3 3 0 1 1 3-3" />
                    </svg>
                    <span>100% Fresh Daily Delivery</span>
                  </span>
                </div>
              </div>
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
                          <div className="w-12 h-12 rounded-lg bg-[#FAF7EE] border border-[#E8E2D2] overflow-hidden shrink-0 relative">
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.productName}
                              fill
                              className="object-contain p-0.5"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0">
                            🌱
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
                  <span>🌿</span>
                  <span>
                    <strong>Subscription Plan:</strong> Live trays delivered weekly to your doorstep.
                  </span>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="pt-3 border-t border-[#F0EBE0] space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600">Farm Direct Delivery</span>
                    {deliveryCalc.isUnder4Km && isPincodeEntered && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                        Local
                      </span>
                    )}
                  </div>
                  <div>
                    {!isPincodeEntered ? (
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
                    <span className="text-base font-bold text-[#151F19] block">Total Payable</span>
                    <span className="text-[11px] text-[#5C6B60]">
                      {isPincodeEntered ? 'Inclusive of all taxes & delivery' : 'Delivery calculated on pincode'}
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-[#1C3F2D]">
                    {formatPrice(isPincodeEntered ? grandTotal : subtotal)}
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
    </main>
  );
}
