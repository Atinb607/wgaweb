'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/cartStore';
import { formatPrice } from '@/lib/format';
import type { HealthGoalContentItem } from '@/app/[panelKey]/health-goals/page';
import type { Product } from '@/app/products/page';
import { LeafFavicon, Sprout, Zap } from '@/components/icons';

interface HealthGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: HealthGoalContentItem | null;
  allGoals: HealthGoalContentItem[];
  onSelectGoal: (goalId: string) => void;
  allProducts: (Product & { health_goals?: string[] })[];
}

interface ProductMeta {
  photo: string;
  benefit: string;
  badge: { text: string; bg: string; color: string };
  sleeveDesc: string;
}

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
  'carrot-microgreens': {
    photo: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?fm=jpg&q=80&w=800&auto=format&fit=crop',
    benefit: 'Beta carotene & gentle sweetness',
    badge: { text: 'FRESH HARVEST', bg: '#E07A5F', color: '#FFFDF8' },
    sleeveDesc: 'Sweet carrot fresh shoots',
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

export default function HealthGoalModal({
  isOpen,
  onClose,
  currentGoal,
  allGoals,
  onSelectGoal,
  allProducts,
}: HealthGoalModalProps) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [cachedGoal, setCachedGoal] = useState<HealthGoalContentItem | null>(currentGoal);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (currentGoal) {
      setCachedGoal(currentGoal);
    }
  }, [currentGoal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const activeGoal = currentGoal || cachedGoal;

  // Filter mapped products for this goal
  const isAll = activeGoal ? activeGoal.id === 'all-trays' || activeGoal.slug === 'all-trays' : false;
  const mappedProducts = !activeGoal
    ? []
    : isAll
    ? allProducts
    : allProducts.filter((p) => {
        const goals = p.health_goals || [];
        return (
          goals.includes(activeGoal.id) ||
          goals.includes(activeGoal.slug) ||
          (activeGoal.id === 'boost-immunity' && goals.includes('immunity')) ||
          (activeGoal.id === 'weight-management' && goals.includes('weight')) ||
          (activeGoal.id === 'kids-nutrition' && goals.includes('kids')) ||
          (activeGoal.id === 'fitness-recovery' && goals.includes('fitness')) ||
          (activeGoal.id === 'diabetes-friendly' && (goals.includes('low-gi') || goals.includes('diabetes'))) ||
          (activeGoal.id === 'heart-health' && goals.includes('heart')) ||
          (activeGoal.id === 'healthy-aging' && goals.includes('aging'))
        );
      });

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

  return (
    <AnimatePresence>
      {isOpen && activeGoal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A160F]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            key="modal-container"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative bg-[#F8F5EC] max-w-[1020px] w-full max-h-[92vh] sm:max-h-[88vh] overflow-hidden rounded-[20px] sm:rounded-[28px] shadow-2xl border border-[#E4DDC8] flex flex-col z-10"
          >
            {/* Modal Header */}
            <div className="relative bg-[#1C3F2D] text-[#FFFDF8] p-4 sm:p-6 md:p-8 pr-12 sm:pr-16 shrink-0">
              {/* Top Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-[#CFFA57] hover:text-[#122A1F] text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-20 group hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                aria-label="Close dialog"
              >
                <svg
                  className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[9.5px] sm:text-[11px] font-bold tracking-wider uppercase bg-[#CFFA57] text-[#122A1F] px-2.5 py-0.5 rounded-full shadow-xs">
                    {activeGoal.tag}
                  </span>
                  <span className="font-mono text-[10.5px] sm:text-[11px] text-white/70">
                    {activeGoal.subtitle}
                  </span>
                </div>

                <h2 className="font-serif font-medium text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight mb-1.5 sm:mb-2">
                  {activeGoal.title}
                </h2>

                <p className="font-serif italic text-sm sm:text-base md:text-lg text-[#CFFA57] mb-1.5 sm:mb-2 leading-snug">
                  {activeGoal.popup_title}
                </p>

                <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {activeGoal.popup_description}
                </p>
              </div>

              {/* In-Modal Goal Tabs */}
              <div
                className="mt-3.5 sm:mt-5 pt-3 sm:pt-4 border-t border-white/15 flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden items-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {allGoals.map((g) => {
                  const isActive = g.id === activeGoal.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => onSelectGoal(g.id)}
                      className={`flex-shrink-0 font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider font-semibold px-2.5 sm:px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#CFFA57] text-[#122A1F] font-bold shadow-xs scale-105'
                          : 'bg-white/10 text-white/85 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <span>{g.icon && !/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(g.icon) ? g.icon : <Sprout className="w-3.5 h-3.5 inline" />}</span>
                      <span>{g.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body: Mapped Products */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-center justify-between border-b border-[#E4DDC8] pb-3">
                <div className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[#5C6B60] font-semibold flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Available Trays ({mappedProducts.length})</span>
                </div>
              </div>

              {mappedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
                  {mappedProducts.map((product) => {
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
                    const cardImage =
                      product.thumbnail_url ||
                      product.images?.[0]?.image_url ||
                      meta.photo;

                    return (
                      <div
                        key={product.id}
                        className="bg-[#FFFDF8] rounded-2xl p-3 sm:p-3.5 border border-[#E4DDC8] shadow-xs flex flex-col justify-between group hover:shadow-md transition-all"
                      >
                        <div>
                          {/* Vertical Clamshell Visual */}
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={onClose}
                            className="block relative rounded-[16px] aspect-[1/1.2] sm:aspect-[1/1.25] overflow-hidden mb-3 border border-[#E4DDC8] shadow-xs bg-gradient-to-br from-[#EEF1EE] to-[#DFE4DF] transition-all duration-300 group-hover:-translate-y-1 cursor-pointer"
                          >
                            {/* Product Badge */}
                            <span
                              style={{
                                backgroundColor: meta.badge.bg,
                                color: meta.badge.color,
                              }}
                              className="absolute top-2.5 left-2.5 z-20 font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1.5"
                            >
                              <LeafFavicon className="w-3 h-3" />
                              <span>{product.badge_label || meta.badge.text}</span>
                            </span>

                            {/* Background Photo */}
                            {cardImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cardImage}
                                alt={product.thumbnail_alt_text || product.name}
                                className="absolute inset-0 w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#E6EBE4] to-[#D5DDD2] flex flex-col items-center justify-center p-4">
                                <Sprout className="w-10 h-10 text-emerald-800/40 mb-1" />
                                <span className="font-mono text-[9px] uppercase tracking-wider text-[#5C6B60]">
                                  Fresh Greens
                                </span>
                              </div>
                            )}

                            {/* Sheen effect */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_6px_rgba(255,255,255,0.45),inset_0_0_15px_rgba(255,255,255,0.3)]">
                              <div className="absolute top-2 left-2 right-1/2 bottom-3/5 rounded-md bg-gradient-to-br from-white/35 to-transparent -rotate-6" />
                            </div>

                            {/* Branded sleeve */}
                            <div className="absolute top-[8%] bottom-[8%] left-[8%] w-[52%] rounded-xl overflow-hidden flex flex-col bg-white/95 backdrop-blur-sm shadow-xl z-10 border border-black/5">
                              <div className="h-[28%] overflow-hidden relative bg-[#EDE7D6]">
                                {cardImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={cardImage}
                                    alt={product.thumbnail_alt_text || product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs opacity-50 text-emerald-800">
                                    <Sprout className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 p-2 flex flex-col justify-between">
                                <div>
                                  <div className="font-serif font-bold text-[7.5px] tracking-wide text-[#1C3F2D] flex items-center gap-1 mb-0.5">
                                    <Sprout className="w-2.5 h-2.5" /> WAG
                                  </div>
                                  <h5 className="font-serif font-bold text-[10.5px] leading-tight text-[#151F19] mb-1 line-clamp-2">
                                    {product.name}
                                  </h5>
                                  <p className="text-[7.5px] text-[#33402F] leading-tight line-clamp-2">
                                    {meta.sleeveDesc}
                                  </p>
                                </div>
                                <div className="font-mono text-[5.5px] uppercase tracking-wider text-[#5C6B60] pt-1 border-t border-black/10">
                                  {isBundle ? 'HARVEST BUNDLE · DAY 10' : '100G FRESH TRAY · DAY 10'}
                                </div>
                              </div>
                            </div>
                          </Link>

                          {/* Product Title */}
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={onClose}
                          >
                            <h4 className="font-serif font-semibold text-sm sm:text-[15px] text-[#151F19] mb-1 hover:text-[#1C3F2D] transition-colors leading-snug line-clamp-1">
                              {product.name}
                            </h4>
                          </Link>

                          {/* Highlights */}
                          <div className="border-t border-b border-[#E4DDC8] py-1.5 sm:py-2 mb-2.5 sm:mb-3 space-y-1 text-[11px] sm:text-xs text-[#5C6B60]">
                            <div className="flex items-center gap-1.5 truncate">
                              <Zap className="w-3.5 h-3.5 text-[#1C3F2D] shrink-0" />
                              <span className="truncate">{product.highlight_1 || meta.benefit}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Sprout className="w-3.5 h-3.5 text-[#3E8F52] shrink-0" />
                              <span className="truncate">
                                {product.highlight_2 || (isBundle ? 'Fresh bundle · 7-10 days fresh' : 'Fresh tray · 7-10 days fresh')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Add Button */}
                        <div>
                          <div className="font-mono font-bold text-[13px] sm:text-[14px] text-[#122A1F] mb-2 sm:mb-2.5">
                            {formatPrice(pricePaise)}{' '}
                            <span className="font-normal text-[10px] sm:text-[10.5px] text-[#5C6B60] uppercase">
                              / {isBundle ? 'bundle' : 'tray'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={onClose}
                              className="flex-1 text-center font-mono text-[10px] font-bold tracking-wider uppercase py-2 rounded-full border border-[#1C3F2D] text-[#1C3F2D] hover:bg-[#1C3F2D] hover:text-[#FFFDF8] transition-all flex items-center justify-center cursor-pointer"
                            >
                              Details
                            </Link>

                            <button
                              onClick={() => handleAddToCart(product)}
                              className="px-3.5 sm:px-4 py-2 rounded-full bg-[#122A1F] hover:bg-[#1C3F2D] text-[#FFFDF8] font-mono text-[10px] font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center min-w-[72px] cursor-pointer"
                              title="Add to cart"
                            >
                              {isAdded ? (
                                <span className="text-[#CFFA57]">✓ Added</span>
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
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#E4DDC8]">
                  <div className="w-12 h-12 rounded-full bg-[#EBF5EE] text-[#1C3F2D] flex items-center justify-center mx-auto mb-2">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-[#151F19] mb-1">
                    No microgreens currently mapped to {activeGoal.title}
                  </h4>
                  <p className="text-xs text-[#5C6B60] mb-4 max-w-sm mx-auto">
                    Browse our full variety lineup or assign products under this health goal in the admin panel.
                  </p>
                  <button
                    onClick={() => onSelectGoal('all-trays')}
                    className="px-4 py-2 bg-[#1C3F2D] text-white text-xs font-mono font-bold uppercase rounded-full hover:bg-[#122A1F] cursor-pointer"
                  >
                    View All Trays
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F1EDE3] px-4 sm:px-6 py-2.5 sm:py-3.5 border-t border-[#E4DDC8]/60 flex flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[#5C6B60]">
              <span className="truncate sm:overflow-visible">Grown pure with 100% mineral RO water &amp; zero pesticides.</span>
              <button
                onClick={onClose}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C3F2D] text-[#FFFDF8] hover:bg-[#122A1F] hover:text-[#CFFA57] font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
                aria-label="Close modal"
              >
                <span>Close</span>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
