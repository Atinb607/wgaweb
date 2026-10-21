'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { WhatsApp, Check, Clipboard, Banknote, Subscription, Mail, Sprout } from '@/components/icons';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

interface StoredOrderItem {
  productName: string;
  variantLabel: string;
  quantity: number;
  pricePaise: number;
  image?: string;
}

interface StoredOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryPincode: string;
  subtotalPaise?: number;
  deliveryFeePaise?: number;
  discountPaise?: number;
  couponCode?: string | null;
  totalPaise: number;
  purchaseType?: string;
  subscriptionFrequency?: string | null;
  paymentMethod?: string;
  items?: StoredOrderItem[];
  createdAt?: string;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber') || '';
  const emailParam = searchParams.get('email') || '';

  const [storedOrder, setStoredOrder] = useState<StoredOrder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wga_last_order');
      if (raw) {
        const parsed = JSON.parse(raw) as StoredOrder;
        // If order number matches or if param wasn't provided, use stored order
        if (!orderNumberParam || parsed.orderNumber === orderNumberParam) {
          setStoredOrder(parsed);
        }
      }
    } catch {
      // Storage access failure
    }
  }, [orderNumberParam]);

  const activeOrderNumber = orderNumberParam || storedOrder?.orderNumber || 'WAG-ORDER';
  const customerEmail = emailParam || storedOrder?.customerEmail || '';
  const customerName = storedOrder?.customerName || '';
  const totalAmountFormatted = storedOrder
    ? `₹${(storedOrder.totalPaise / 100).toFixed(2)}`
    : null;

  const handleCopyOrderNumber = () => {
    if (activeOrderNumber) {
      navigator.clipboard.writeText(activeOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Wild About Greens, I just placed order #${activeOrderNumber} and have a quick question.`
  );

  return (
    <main className="min-h-screen bg-white pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Celebration / Thank You Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm border border-[#E8E2D2] p-3.5">
            <Image
              src={CLOUDINARY_ASSETS.faviconPng}
              alt="Wild About Greens Logo"
              width={52}
              height={52}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold text-[#5C6B60] block">
              {storedOrder?.paymentMethod === 'cod'
                ? 'Order Placed · Cash on Delivery'
                : 'Order Confirmed & Payment Received'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#151F19] leading-tight">
              Thank You for Your Order{customerName ? `, ${customerName}` : ''}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              {storedOrder?.paymentMethod === 'cod'
                ? "We've received your order! Our urban farm team will harvest and prepare your microgreens fresh. Please keep the exact cash amount ready at doorstep delivery."
                : "We've received your order and payment successfully. Thank you for shopping with us! We are preparing your order and will share tracking updates shortly."}
            </p>
          </div>
        </div>

        {/* Primary Order Number Badge Box */}
        <div className="bg-white rounded-2xl border border-[#E8E2D2] p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1C3F2D] via-[#CFFA57] to-[#1C3F2D]" />

          <p className="text-xs font-bold uppercase tracking-widest text-[#5C6B60] mb-2">
            Your Official Order Number
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 my-2">
            <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1C3F2D] tracking-wider select-all">
              #{activeOrderNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Copy Order Number"
            >
              <span>{copied ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : <Clipboard className="w-3.5 h-3.5 text-gray-500 inline" />}</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4 text-xs font-medium">
            {storedOrder?.paymentMethod === 'cod' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                <Banknote className="w-4 h-4 text-amber-800" />
                <span>Pay on Delivery: {totalAmountFormatted || 'Cash'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Payment Confirmed
              </span>
            )}
            {storedOrder?.purchaseType === 'subscription' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                <Subscription className="w-3.5 h-3.5 text-amber-800" />
                <span>{storedOrder.subscriptionFrequency || 'Weekly'} Subscription</span>
              </span>
            )}
          </div>
        </div>

        {/* Email Confirmation Notice Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="space-y-1 text-sm text-emerald-950">
            <h3 className="font-bold text-emerald-900">
              We&apos;ve Mailed You
            </h3>
            <p className="text-emerald-800/90 leading-relaxed text-xs sm:text-sm">
              We&apos;ve sent an order confirmation email to{' '}
              {customerEmail ? (
                <strong className="font-semibold underline decoration-emerald-400">{customerEmail}</strong>
              ) : (
                'your registered email address'
              )}{' '}
              with complete product details, itemized invoice, and dispatch schedule.
            </p>
            <p className="text-[11px] text-emerald-700/80 pt-0.5">
              Please check your inbox (and spam or promotions folder if you don&apos;t see it within a couple minutes).
            </p>
          </div>
        </div>

        {/* Order Details & Summary (if storedOrder exists) */}
        {storedOrder && storedOrder.items && storedOrder.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8E2D2] p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#151F19] pb-4 border-b border-[#E8E2D2]">
              Order Summary
            </h2>

            {/* Items List */}
            <div className="divide-y divide-gray-100">
              {storedOrder.items.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {item.image ? (
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-[#E8E2D2] overflow-hidden shrink-0 relative">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Sprout className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-[#5C6B60]">
                        {item.variantLabel} • Qty: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-semibold text-gray-900 text-sm">
                      ₹{((item.pricePaise * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>
                  {storedOrder.subtotalPaise !== undefined
                    ? `₹${(storedOrder.subtotalPaise / 100).toFixed(2)}`
                    : totalAmountFormatted}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Direct Urban Farm Delivery</span>
                <span
                  className={
                    storedOrder.deliveryFeePaise && storedOrder.deliveryFeePaise > 0
                      ? 'text-gray-900 font-semibold'
                      : 'text-emerald-700 font-semibold'
                  }
                >
                  {storedOrder.deliveryFeePaise && storedOrder.deliveryFeePaise > 0
                    ? `₹${(storedOrder.deliveryFeePaise / 100).toFixed(2)}`
                    : 'Free'}
                </span>
              </div>
              {storedOrder.discountPaise && storedOrder.discountPaise > 0 ? (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Coupon Discount ({storedOrder.couponCode || '15% OFF'})</span>
                  <span>-₹{(storedOrder.discountPaise / 100).toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base sm:text-lg font-bold text-[#151F19]">
                <span>{storedOrder.paymentMethod === 'cod' ? 'Total Payable (COD)' : 'Total Paid'}</span>
                <span className="text-[#1C3F2D]">{totalAmountFormatted}</span>
              </div>
            </div>

            {/* Delivery Address Details */}
            {storedOrder.deliveryAddress && (
              <div className="mt-6 pt-6 border-t border-gray-100 bg-gray-50 rounded-xl p-4 sm:p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B60] block mb-1">
                  Delivery Destination
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {storedOrder.customerName}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Phone: {storedOrder.customerPhone}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {storedOrder.deliveryAddress}
                  {storedOrder.deliveryPincode ? ` · PIN: ${storedOrder.deliveryPincode}` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <Link
            href={`/track-order?order_number=${encodeURIComponent(activeOrderNumber)}`}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#1C3F2D] text-white rounded-full font-semibold text-sm hover:bg-[#122A1F] transition-all text-center shadow-sm"
          >
            Track Your Order →
          </Link>

          <a
            href={`https://wa.me/918427254445?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#25D366] text-white rounded-full font-semibold text-sm hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <WhatsApp className="w-4 h-4 fill-white" />
            <span>Questions? WhatsApp Us</span>
          </a>

          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#E8E2D2] text-[#151F19] rounded-full font-semibold text-sm hover:bg-gray-100 transition-all text-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Simple Note & Link Back to Home */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-800 underline transition-colors"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#1C3F2D] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-500">Loading your order confirmation...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
