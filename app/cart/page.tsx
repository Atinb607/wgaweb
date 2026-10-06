'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useCartStore, getProductThumbnail } from '@/lib/cartStore';
import { formatPrice } from '@/lib/format';
import { Plus, Minus, Scissors, Droplet, Zap, Truck } from '@/components/icons';
import CartMascot from '@/components/CartMascot';
import {
  CartRecommendationProduct,
  CartProductItem,
  DEFAULT_BESTSELLERS,
  mapBestsellersFromContent,
  getPairedUpsellProducts,
} from '@/lib/cartRecommendations';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, totalPaise, addItem } = useCartStore();
  const [cartContent, setCartContent] = useState<Record<string, string>>({
    cart_empty_title: 'This cart is empty inside!',
    cart_empty_subtitle:
      'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.',
    cart_mascot_variant: 'pleading',
  });
  const [allProducts, setAllProducts] = useState<CartProductItem[]>([]);
  const [bestsellers, setBestsellers] = useState<CartRecommendationProduct[]>(DEFAULT_BESTSELLERS);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/content/cart-drawer')
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({})),
      fetch('/api/products')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ]).then(([rawContent, rawProducts]) => {
      const contentData = (rawContent || {}) as Record<string, string>;
      const productsData = (rawProducts || []) as CartProductItem[];

      if (contentData && typeof contentData === 'object' && Object.keys(contentData).length > 0) {
        setCartContent((prev) => ({ ...prev, ...contentData }));
      }

      if (Array.isArray(productsData) && productsData.length > 0) {
        setAllProducts(productsData);
        const mapped = mapBestsellersFromContent(productsData, contentData);
        if (mapped.length > 0) {
          setBestsellers(mapped);
        }
      }
    });
  }, []);

  // Dynamic companion products based on admin panel's "Pairs Well With" setting for items in cart
  const pairedUpsellProducts = useMemo(() => {
    return getPairedUpsellProducts(items, allProducts, bestsellers, 6);
  }, [items, allProducts, bestsellers]);

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const total = totalPaise();

  const handleAddAddon = (prod: CartRecommendationProduct) => {
    addItem({
      variantId: prod.variantId,
      productSlug: prod.slug,
      productName: prod.name,
      variantLabel: prod.variantLabel,
      pricePaise: prod.pricePaise,
      maxStock: prod.maxStock,
      thumbnailUrl: prod.photo,
    });
    setAddedIds((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [prod.id]: false }));
    }, 1600);
  };

  if (!mounted) {
    return (
      <div className="bg-[#F3EEE0] text-[#151F19] min-h-screen pt-32 pb-24 text-center">
        <main className="max-w-2xl mx-auto px-4">
          <div className="bg-[#FFFDF8] border border-[#E4DDC8] rounded-3xl p-10 sm:p-14 shadow-sm">
            <span className="text-6xl mb-5 block">🌱</span>
            <p className="font-mono text-sm text-[#5C6B60]">Loading cart...</p>
          </div>
        </main>
      </div>
    );
  }

  /* ================= EMPTY STATE ================= */
  if (items.length === 0) {
    return (
      <div className="relative bg-[#F3EEE0] text-[#151F19] min-h-screen pt-32 pb-24 overflow-hidden">
        <main className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <div className="bg-[#FFFDF8] border border-[#E4DDC8] rounded-3xl p-8 sm:p-14 shadow-sm">
            <CartMascot
              variant={cartContent.cart_mascot_variant || 'pleading'}
              className="w-36 h-36 mx-auto mb-4"
            />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#151F19] mb-2">
              {cartContent.cart_empty_title || 'This cart is empty inside!'}
            </h1>
            <p className="font-handwriting text-2xl text-[#2D7A4D] font-bold mb-8 max-w-md mx-auto leading-snug">
              {cartContent.cart_empty_subtitle ||
                'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.'}
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#122A1F] hover:bg-[#1C3F2D] text-[#FFFDF8] font-mono text-xs font-bold uppercase tracking-[0.14em] px-8 py-4 rounded-full transition-all shadow-md hover:-translate-y-0.5"
            >
              Explore All Trays →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative bg-[#F3EEE0] text-[#151F19] min-h-screen pt-28 pb-24 overflow-hidden">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Breadcrumb */}
        <nav className="font-mono text-[11px] tracking-wider uppercase text-[#5C6B60] mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-[#1C3F2D] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#1C3F2D] transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-[#122A1F] font-bold">Cart</span>
        </nav>

        {/* Heading & Harvest Reassurance */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#151F19] tracking-tight">
            Shopping Cart
          </h1>
          <p className="font-mono text-xs text-[#5C6B60] uppercase tracking-wider mt-1">
            Fresh Greens · Delivered to Your Doorstep
          </p>
        </div>

        {/* Item List */}
        <div className="space-y-4">
          {items.map((item) => {
            const itemKey = item.id || item.variantId;
            return (
              <div
                key={itemKey}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl shadow-xs hover:border-[#1C3F2D]/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                  {/* Product Thumbnail - fixed compact square */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border border-[#E4DDC8] bg-[#F3EEE0] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductThumbnail(item.productSlug, item.thumbnailUrl)}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {item.isSubscription && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[9.5px] uppercase font-bold text-[#1C3F2D] bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#C5DEC9]">
                          Subscription
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-serif font-bold text-base sm:text-lg text-[#151F19] hover:text-[#1C3F2D] transition-colors block truncate"
                    >
                      {item.productName}
                    </Link>
                    <p className="font-mono text-xs text-[#5C6B60] uppercase tracking-wide mt-0.5">
                      {item.variantLabel}
                    </p>
                    {item.isSubscription && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#2D7A4D] bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#C5DEC9] font-medium">
                          <span>🔁</span>
                          <span>Weekly: {item.subscriptionTrays} {item.subscriptionTrays === 1 ? 'tray' : 'trays'}/wk · {item.subscriptionWeeks} wks plan</span>
                        </span>
                      </div>
                    )}
                    <p className="font-mono text-xs text-[#1C3F2D] font-bold mt-1">
                      {formatPrice(item.pricePaise)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E4DDC8]/60">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#E4DDC8] rounded-xl bg-[#F3EEE0]/50 overflow-hidden shadow-2xs">
                    <button
                      onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#151F19] hover:bg-[#E4DDC8] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-[#122A1F]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#151F19] hover:bg-[#E4DDC8] transition-colors disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus />
                    </button>
                  </div>

                  {/* Item Total & Remove */}
                  <div className="text-right min-w-[90px]">
                    <p className="font-mono font-bold text-base text-[#122A1F]">
                      {formatPrice(item.pricePaise * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(itemKey)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#5C6B60] hover:text-red-600 transition-colors mt-1"
                    >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.7}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>

        {/* ================= CROSS-SELL / PAIRS WELL RECOMMENDATIONS ================= */}
        {pairedUpsellProducts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#E4DDC8]">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[#5C6B60] block">
                  PAIR WITH YOUR ORDER
                </span>
                <h3 className="font-serif font-bold text-xl text-[#151F19]">
                  Pairs Well With
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10.5px] text-[#2D7A4D] font-bold">
                  Zero pesticides
                </span>
                {pairedUpsellProducts.length > 2 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleScroll('left')}
                      className="w-7 h-7 rounded-full border border-[#E4DDC8] bg-[#FFFDF8] hover:bg-[#E4DDC8]/60 flex items-center justify-center text-xs text-[#151F19] transition-colors cursor-pointer"
                      aria-label="Scroll left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScroll('right')}
                      className="w-7 h-7 rounded-full border border-[#E4DDC8] bg-[#FFFDF8] hover:bg-[#E4DDC8]/60 flex items-center justify-center text-xs text-[#151F19] transition-colors cursor-pointer"
                      aria-label="Scroll right"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2 pt-0.5 scroll-smooth"
            >
              {pairedUpsellProducts.map((addon) => {
                const isAdded = !!addedIds[addon.id];
                const badgeText = addon.badge?.text || '★ POPULAR';
                return (
                  <div
                    key={addon.id}
                    className="w-[280px] sm:w-[320px] shrink-0 flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl shadow-xs hover:border-[#1C3F2D]/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E4DDC8] bg-[#F3EEE0]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={addon.photo}
                          alt={addon.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] font-bold text-[#1C3F2D] uppercase tracking-wider block truncate">
                          {badgeText}
                        </span>
                        <Link
                          href={`/products/${addon.slug}`}
                          className="font-serif font-bold text-sm text-[#151F19] truncate block hover:text-[#1C3F2D] transition-colors"
                        >
                          {addon.name}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-xs text-[#1C3F2D]">
                            {formatPrice(addon.pricePaise)}
                          </span>
                          <span className="font-mono text-[10px] text-[#5C6B60] line-through">
                            {formatPrice(addon.mrpPaise)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddAddon(addon)}
                      className={`font-mono text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl shrink-0 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                        isAdded
                          ? 'bg-[#2D7A4D] text-[#FFFDF8]'
                          : 'bg-[#1C3F2D] hover:bg-[#122A1F] text-[#FFFDF8]'
                      }`}
                    >
                      {isAdded ? 'Added ✓' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= ORDER SUMMARY CARD ================= */}
        <div className="mt-8 p-6 sm:p-7 bg-[#FFFDF8] border border-[#E4DDC8] rounded-3xl shadow-sm">
          <div className="pb-4 border-b border-[#E4DDC8]">
            <div className="flex justify-between text-sm text-[#5C6B60]">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-[#151F19]">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline py-4 mb-6">
            <div>
              <span className="font-serif font-bold text-xl text-[#151F19] block">Total</span>
              <span className="font-mono text-[11px] text-[#5C6B60]">
                Delivery calculated at checkout
              </span>
            </div>
            <span className="font-mono font-bold text-2xl sm:text-3xl text-[#122A1F]">
              {formatPrice(total)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/products"
              className="flex-1 text-center font-mono text-xs font-bold uppercase tracking-[0.14em] py-4 px-6 rounded-full border border-[#1C3F2D] text-[#1C3F2D] hover:bg-[#1C3F2D] hover:text-[#FFFDF8] transition-all"
            >
              Continue Shopping
            </Link>
            <Link
              href="/checkout"
              className="flex-1 text-center font-mono text-xs font-bold uppercase tracking-[0.14em] py-4 px-6 rounded-full bg-[#122A1F] hover:bg-[#1C3F2D] text-[#FFFDF8] transition-all shadow-md hover:-translate-y-0.5"
            >
              Proceed to Checkout →
            </Link>
          </div>

          <p className="font-mono text-[11.5px] text-[#5C6B60] text-center mt-5 flex items-center justify-center gap-2">
            <span>🔒</span>
            <span>Safe &amp; Secure Checkout via Razorpay · UPI, Cards &amp; NetBanking</span>
          </p>
        </div>

        {/* ================= TRUST / BRAND PILLARS ================= */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl text-center">
            <div className="w-8 h-8 rounded-full bg-[#EBF5EE] text-[#1C3F2D] flex items-center justify-center mx-auto mb-2">
              <Scissors className="w-4 h-4" />
            </div>
            <p className="font-serif font-bold text-xs text-[#151F19]">Cut to Order</p>
            <p className="font-mono text-[10px] text-[#5C6B60] mt-0.5">Never cold stored</p>
          </div>
          <div className="p-3.5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl text-center">
            <div className="w-8 h-8 rounded-full bg-[#EBF5EE] text-[#1C3F2D] flex items-center justify-center mx-auto mb-2">
              <Droplet className="w-4 h-4" />
            </div>
            <p className="font-serif font-bold text-xs text-[#151F19]">Pure Mineral Water</p>
            <p className="font-mono text-[10px] text-[#5C6B60] mt-0.5">Zero pesticides</p>
          </div>
          <div className="p-3.5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl text-center">
            <div className="w-8 h-8 rounded-full bg-[#EBF5EE] text-[#1C3F2D] flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <p className="font-serif font-bold text-xs text-[#151F19]">40x Density</p>
            <p className="font-mono text-[10px] text-[#5C6B60] mt-0.5">Peak micronutrients</p>
          </div>
          <div className="p-3.5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl text-center">
            <div className="w-8 h-8 rounded-full bg-[#EBF5EE] text-[#1C3F2D] flex items-center justify-center mx-auto mb-2">
              <Truck className="w-4 h-4" />
            </div>
            <p className="font-serif font-bold text-xs text-[#151F19]">Fast Delivery</p>
            <p className="font-mono text-[10px] text-[#5C6B60] mt-0.5">Fresh to your door</p>
          </div>
        </div>
      </main>
    </div>
  );
}
