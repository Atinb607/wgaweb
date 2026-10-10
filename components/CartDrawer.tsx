'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, getProductThumbnail } from '@/lib/cartStore';
import { isAdminPath } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/format';
import { X, Plus, Minus, Subscription } from './icons';
import CartMascot from './CartMascot';
import {
  BestsellerProduct,
  CartProductItem,
  DEFAULT_BESTSELLERS,
  mapBestsellersFromContent,
  getPairedUpsellProducts,
} from '@/lib/cartRecommendations';

export default function CartDrawer() {
  const pathname = usePathname();
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPaise, addItem, totalItems } =
    useCartStore();
  const total = totalPaise();
  const itemCount = totalItems();

  const [cartContent, setCartContent] = useState<Record<string, string>>({
    cart_empty_title: 'This cart is empty inside!',
    cart_empty_subtitle:
      'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.',
    cart_mascot_variant: 'pleading',
    cart_rec_eyebrow: 'START WITH',
    cart_rec_title: 'Our Bestsellers',
  });
  const [bestsellers, setBestsellers] = useState<BestsellerProduct[]>(DEFAULT_BESTSELLERS);
  const [allProducts, setAllProducts] = useState<CartProductItem[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // Pre-fetch on mount so products and paired products are immediately ready
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((productsData) => {
        if (Array.isArray(productsData) && productsData.length > 0) {
          setAllProducts(productsData);
        }
      })
      .catch(() => {});
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch live cart-drawer content and products from DB
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  // Dynamic companion products based on admin panel's "Pairs Well With" setting for items in cart
  const pairedUpsellProducts: BestsellerProduct[] = useMemo(() => {
    return getPairedUpsellProducts(items, allProducts, bestsellers, 3);
  }, [items, allProducts, bestsellers]);

  const handleQuickAdd = (product: BestsellerProduct) => {
    addItem({
      variantId: product.variantId,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: product.variantLabel,
      pricePaise: product.pricePaise,
      maxStock: product.maxStock,
      thumbnailUrl: product.photo,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1600);
  };

  if (isAdminPath(pathname)) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#122A1F]/50 backdrop-blur-[2px] z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-[430px] bg-[#FFFDF8] border-l border-[#E4DDC8] shadow-2xl z-[70] flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4DDC8] bg-[#FFFDF8] sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-[#151F19]">
                  Your items
                </h2>
                <span className="font-mono text-xs font-bold text-[#1C3F2D] bg-[#EBF5EE] px-2 py-0.5 rounded-full border border-[#C5DEC9]">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#5C6B60] hover:text-[#151F19] hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X />
              </button>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              /* ================= EMPTY STATE ================= */
              <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Quirky Hero */}
                <div className="pt-6 pb-5 px-6 text-center bg-[#FFFDF8] flex flex-col items-center">
                  <h3 className="font-serif font-semibold text-2xl text-[#151F19] tracking-tight">
                    {cartContent.cart_empty_title || 'This cart is empty inside!'}
                  </h3>

                  <div className="my-2">
                    <CartMascot
                      variant={cartContent.cart_mascot_variant || 'pleading'}
                      className="w-36 h-36"
                    />
                  </div>

                  <p className="font-handwriting text-xl sm:text-[22px] text-[#2D7A4D] font-bold leading-snug max-w-[280px] mx-auto">
                    {cartContent.cart_empty_subtitle ||
                      'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.'}
                  </p>
                </div>

                {/* Bestsellers Section in Signature Warm White */}
                <div className="bg-white border-t border-[#E4DDC8] pt-5 pb-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Eyebrow & Fraunces Heading */}
                    <div className="text-center mb-4">
                      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#5C6B60] font-semibold block mb-1">
                        {cartContent.cart_rec_eyebrow || 'start with'}
                      </span>
                      <div className="inline-block relative">
                        <h4 className="font-serif font-bold text-2xl text-[#151F19] tracking-tight">
                          {cartContent.cart_rec_title || 'Our Bestsellers'}
                        </h4>
                        <div className="w-12 h-0.5 bg-[#1C3F2D] mx-auto mt-1.5 rounded-full" />
                      </div>
                    </div>

                    {/* Horizontal Carousel (Scrollbar Hidden) */}
                    <div
                      ref={carouselRef}
                      className="flex gap-3 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 pt-1 pb-2 scroll-smooth"
                    >
                      {bestsellers.map((prod) => {
                        const isAdded = !!addedIds[prod.id];
                        return (
                          <div
                            key={prod.id}
                            className="w-[210px] shrink-0 flex flex-col justify-between bg-[#FFFDF8] rounded-2xl p-3 border border-[#E4DDC8] shadow-sm hover:shadow-md hover:border-[#1C3F2D]/40 transition-all group"
                          >
                            <div>
                              {/* Organic tinted packshot image container */}
                              <div
                                style={{ backgroundColor: prod.cardBg }}
                                className="relative aspect-square rounded-xl overflow-hidden mb-2.5 flex items-center justify-center p-2 border border-[#E4DDC8]/60"
                              >
                                {/* Badge */}
                                <div className="absolute top-2 left-2 z-10">
                                  <span
                                    style={{
                                      backgroundColor: prod.badge.bg,
                                      color: prod.badge.color,
                                    }}
                                    className="inline-flex items-center font-mono text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs"
                                  >
                                    {prod.badge.text}
                                  </span>
                                </div>

                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={prod.photo}
                                  alt={prod.name}
                                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>

                              {/* Title */}
                              <Link
                                href={`/products/${prod.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="font-serif font-bold text-sm text-[#151F19] line-clamp-1 hover:text-[#1C3F2D] transition-colors"
                              >
                                {prod.name}
                              </Link>
                              <p className="font-mono text-[11px] text-[#5C6B60] mt-0.5">
                                {prod.variantLabel}
                              </p>

                              {/* Price Row */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                <span className="font-bold text-sm text-[#151F19]">
                                  {formatPrice(prod.pricePaise)}
                                </span>
                                <span className="font-mono text-xs text-[#5C6B60] line-through">
                                  {formatPrice(prod.mrpPaise)}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-[#1C3F2D] bg-[#EBF5EE] px-1.5 py-0.5 rounded border border-[#C5DEC9]">
                                  {prod.discountOff}
                                </span>
                              </div>
                            </div>

                            {/* Full-width ADD Button in Website Forest Green */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(prod)}
                              className={`w-full mt-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-[0.98] ${
                                isAdded
                                  ? 'bg-[#2D7A4D] text-[#FFFDF8]'
                                  : 'bg-[#1C3F2D] hover:bg-[#122A1F] text-[#FFFDF8]'
                              }`}
                            >
                              {isAdded ? 'ADDED ✓' : 'ADD TO CART'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= FILLED STATE ================= */
              <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Delivery announcement banner */}
                <div className="bg-[#EBF5EE] text-[#1C3F2D] font-mono text-xs font-medium px-4 py-2.5 border-b border-[#C5DEC9] flex items-center justify-center gap-1.5 shrink-0">
                  <span>Fresh Greens, delivered directly to your doorstep</span>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3">
                  {items.map((item) => {
                    const thumb = getProductThumbnail(item.productSlug, item.thumbnailUrl);
                    const itemKey = item.id || item.variantId;
                    return (
                      <div
                        key={itemKey}
                        className="flex gap-3.5 p-3.5 bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl shadow-xs hover:border-[#1C3F2D]/40 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-[#E4DDC8] relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info & Controls */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <Link
                                href={`/products/${item.productSlug}`}
                                onClick={() => setIsOpen(false)}
                                className="font-serif font-bold text-[#151F19] text-sm sm:text-base hover:text-[#1C3F2D] transition-colors line-clamp-1"
                              >
                                {item.productName}
                              </Link>
                              <button
                                onClick={() => removeItem(itemKey)}
                                className="text-[#5C6B60] hover:text-red-600 transition-colors p-0.5 text-xs font-mono shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                            <p className="font-mono text-xs text-[#5C6B60] mt-0.5">
                              {item.variantLabel}
                            </p>
                            {item.isSubscription && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#2D7A4D] bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#C5DEC9] font-medium">
                                  <Subscription className="w-3 h-3 text-[#2D7A4D] shrink-0" />
                                  <span>Weekly: {item.subscriptionTrays} {item.subscriptionTrays === 1 ? 'tray' : 'trays'}/wk · {item.subscriptionWeeks} wks</span>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#E4DDC8]/60">
                            <span className="font-mono text-sm font-bold text-[#1C3F2D]">
                              {formatPrice(item.pricePaise * item.quantity)}
                            </span>

                            {/* Stepper */}
                            <div className="flex items-center border border-[#E4DDC8] rounded-lg bg-gray-50 overflow-hidden shadow-2xs">
                              <button
                                onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                className="p-1 hover:bg-[#E4DDC8] text-[#151F19] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus />
                              </button>
                              <span className="font-mono text-xs font-bold w-6 text-center text-[#151F19]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                disabled={item.quantity >= item.maxStock}
                                className="p-1 hover:bg-[#E4DDC8] text-[#151F19] transition-colors disabled:opacity-30"
                                aria-label="Increase quantity"
                              >
                                <Plus />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Upsell strip inside filled cart */}
                {pairedUpsellProducts.length > 0 && (
                  <div className="bg-white border-t border-[#E4DDC8] p-4 mt-auto">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C3F2D]">
                        Pair with your order
                      </p>
                      <span className="font-mono text-[10.5px] text-[#2D7A4D] font-bold">
                        Zero pesticides
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
                      {pairedUpsellProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="w-52 shrink-0 bg-[#FFFDF8] rounded-xl p-2.5 border border-[#E4DDC8] shadow-2xs flex items-center gap-2.5"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E4DDC8] bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prod.photo}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${prod.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="font-serif text-xs font-bold text-[#151F19] truncate block hover:text-[#1C3F2D] transition-colors"
                            >
                              {prod.name}
                            </Link>
                            <p className="font-mono text-xs font-bold text-[#1C3F2D]">
                              {formatPrice(prod.pricePaise)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(prod)}
                            className="bg-[#1C3F2D] hover:bg-[#122A1F] text-[#FFFDF8] font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
                          >
                            {addedIds[prod.id] ? 'ADDED ✓' : '+ ADD'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sticky Bottom Actions */}
            {items.length === 0 ? (
              /* Sticky ALL PRODUCTS button when empty */
              <div className="p-4 bg-[#FFFDF8] border-t border-[#E4DDC8] shadow-md sticky bottom-0 z-20">
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#122A1F] hover:bg-[#1C3F2D] active:scale-[0.99] text-[#FFFDF8] font-mono text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] rounded-full shadow-md transition-all text-center"
                >
                  <span>Explore All Trays</span>
                  <span>→</span>
                </Link>
              </div>
            ) : (
              /* Sticky Checkout button when filled */
              <div className="border-t border-[#E4DDC8] p-4 bg-[#FFFDF8] space-y-3 sticky bottom-0 z-20 shadow-md">
                <div className="flex items-center justify-between text-base font-bold text-[#151F19]">
                  <div>
                    <span className="font-serif">Subtotal</span>
                    <p className="font-mono text-[10.5px] text-[#5C6B60] font-normal">
                      Delivery calculated at checkout
                    </p>
                  </div>
                  <span className="font-mono text-[#1C3F2D] text-lg font-bold">
                    {formatPrice(total)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center block py-3.5 bg-[#122A1F] hover:bg-[#1C3F2D] active:scale-[0.99] text-[#FFFDF8] font-mono text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] rounded-full shadow-md transition-all"
                >
                  Proceed to Checkout · {formatPrice(total)}
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="block text-center font-mono text-xs font-semibold text-[#5C6B60] hover:text-[#151F19] transition-colors"
                >
                  View full cart →
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
