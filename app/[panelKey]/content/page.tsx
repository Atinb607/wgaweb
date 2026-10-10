'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import ImageField from '@/components/admin/ImageField';
import CartMascot from '@/components/CartMascot';
import { formatPrice } from '@/lib/format';
import { CONTENT_REGISTRY } from '@/lib/contentRegistry';
import { ShoppingBag, FileText, Sprout } from '@/components/icons';

interface ContentBlock {
  id: string;
  page: string;
  key: string;
  value_type: string;
  value: string;
  updated_at: string;
}

interface ProductVariant {
  id: string;
  label: string;
  price_paise: number;
  stock_qty: number;
  is_active: boolean;
}

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  badge_label?: string;
  thumbnail_url?: string;
  images?: { image_url: string }[];
  variants?: ProductVariant[];
}

const PAGES = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'product-listing', label: 'Product Listing' },
  { value: 'product-detail', label: 'Product Detail' },
  { value: 'cart-drawer', label: 'Cart Slider & Recommendations' },
  { value: 'recipe', label: 'Recipe' },
  { value: 'pathshala', label: 'Pathshala' },
  { value: 'our-story', label: 'Our Story' },
  { value: 'track-order', label: 'Track Order' },
  { value: 'terms-and-conditions', label: 'Terms & Conditions' },
  { value: 'privacy-policy', label: 'Privacy Policy' },
  { value: 'shipping-and-returns', label: 'Shipping & Returns' },
];

export default function AdminContentPage() {
  const [activePage, setActivePage] = useState(PAGES[0].value);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<{ id: string; slug: string; title: string; is_published: boolean }[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Check URL query parameters for default tab (e.g. ?tab=cart-drawer)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const tab = search.get('tab') || search.get('page');
      if (tab && PAGES.some((p) => p.value === tab)) {
        setActivePage(tab);
      }
    }
  }, []);

  useEffect(() => {
    adminFetch('/api/admin/blog/pinned-recipes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.recipes) setRecipes(data.recipes);
      })
      .catch((err) => console.error('Failed to load recipes for dropdown:', err));

    adminFetch('/api/admin/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error('Failed to load products for content dropdown:', err));
  }, []);

  const fields = CONTENT_REGISTRY[activePage] || [];

  const loadBlocks = async (page: string) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/content/${page}`, {
        cache: 'no-store',
      });
      const pageFields = CONTENT_REGISTRY[page] || [];
      const formData: Record<string, string> = {};

      if (res.ok) {
        const data: ContentBlock[] = await res.json();
        const dataMap = new Map<string, string>();
        for (const b of data) {
          dataMap.set(b.key, b.value);
        }

        for (const f of pageFields) {
          formData[f.key] = dataMap.has(f.key) ? dataMap.get(f.key)! : f.defaultValue;
          if (f.type === 'image_url') {
            const altKey = `${f.key}_alt`;
            formData[altKey] = dataMap.has(altKey) ? dataMap.get(altKey)! : '';
          }
        }
      } else {
        for (const f of pageFields) {
          formData[f.key] = f.defaultValue;
          if (f.type === 'image_url') {
            formData[`${f.key}_alt`] = '';
          }
        }
      }
      setForm(formData);
    } catch (err) {
      console.error('Failed to load content blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks(activePage);
    setSaved(false);
  }, [activePage]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const blockArray: { key: string; value: string; value_type: string }[] = [];
      for (const field of fields) {
        blockArray.push({
          key: field.key,
          value: form[field.key] ?? '',
          value_type: field.type,
        });
        if (field.type === 'image_url') {
          blockArray.push({
            key: `${field.key}_alt`,
            value: form[`${field.key}_alt`] ?? '',
            value_type: 'text',
          });
        }
      }

      const res = await adminFetch(`/api/admin/content/${activePage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: blockArray }),
      });

      if (res.ok) {
        const data: ContentBlock[] = await res.json();
        setSaved(true);
        if (Array.isArray(data)) {
          setForm((prev) => {
            const next = { ...prev };
            for (const b of data) {
              next[b.key] = b.value;
            }
            return next;
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Blocks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit live site copy, images, and recommendation settings across key customer touchpoints. Changes go live immediately upon saving.
        </p>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PAGES.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePage(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePage === p.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cart Drawer Banner if active */}
      {activePage === 'cart-drawer' && (
        <div className="bg-[#FAF8F2] border border-[#E4DDC8] rounded-xl p-4 mb-6 flex items-start gap-3 shadow-xs">
          <ShoppingBag className="w-6 h-6 text-[#1C3F2D] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1C3F2D]">
              Cart Slider &amp; Recommendation Management
            </h4>
            <p className="text-xs text-[#5C6B60] mt-0.5 leading-relaxed">
              Customize the empty cart headline, humor text, and mascot character variation. Pick up to 4 recommendation products via dropdowns — product prices, packaging labels, and packshot imagery automatically sync with the live database!
            </p>
          </div>
        </div>
      )}

      {/* Legal Policies Banner if active */}
      {['terms-and-conditions', 'privacy-policy', 'shipping-and-returns'].includes(activePage) && (
        <div className="bg-[#FAF8F2] border border-[#E4DDC8] rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-[#1C3F2D] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#1C3F2D]">
                Legal Policy Editor
              </h4>
              <p className="text-xs text-[#5C6B60] mt-0.5 leading-relaxed">
                Simple, clean document layout with no fancy fonts. All-caps lines (or lines starting with ##) automatically become bold uppercase underlined section headers. Lines starting with &quot;-&quot; or &quot;*&quot; become bullet points.
              </p>
            </div>
          </div>
          <a
            href={`/${activePage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3 py-1.5 rounded-lg border border-[#1C3F2D] text-[#1C3F2D] hover:bg-[#1C3F2D] hover:text-white text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <span>View Live Page</span>
            <span>↗</span>
          </a>
        </div>
      )}

      {/* Content Fields List */}
      <div className="bg-white rounded-xl border p-6 space-y-6 mb-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading fields...</div>
        ) : (
          fields.map((field) => (
            <div key={field.key} className="pt-4 first:pt-0 border-t first:border-0 border-gray-100">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label className="text-sm font-semibold text-gray-800">{field.label}</label>
                <span className="text-[11px] font-mono text-gray-400 select-none">
                  {field.key}
                </span>
              </div>
              {field.description && (
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{field.description}</p>
              )}

              {/* PRODUCT SELECT (FOR CART RECOMMENDATIONS) */}
              {field.type === 'product_select' ? (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <select
                      value={form[field.key] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-700/20 focus:border-green-700 outline-none"
                    >
                      <option value="">-- None (Hide this recommendation slot) --</option>
                      {products.map((p) => {
                        const activeVar = p.variants?.find((v) => v.is_active) || p.variants?.[0];
                        const price = activeVar ? formatPrice(activeVar.price_paise) : '';
                        return (
                          <option key={p.id} value={p.slug}>
                            {p.name} {price ? `(${price})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {form[field.key] && (
                      <a
                        href={`/products/${form[field.key]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition-colors"
                      >
                        <span>View</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>

                  {/* Synced Details Card Preview */}
                  {(() => {
                    const selectedSlug = form[field.key];
                    const selectedProd = products.find((p) => p.slug === selectedSlug);
                    if (!selectedProd) return null;
                    const activeVar = selectedProd.variants?.find((v) => v.is_active) || selectedProd.variants?.[0];
                    const thumb = selectedProd.thumbnail_url || selectedProd.images?.[0]?.image_url;

                    return (
                      <div className="bg-[#FAF8F2] border border-[#E4DDC8] rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={selectedProd.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sprout className="w-8 h-8 text-emerald-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h5 className="font-semibold text-sm text-[#151F19] truncate">{selectedProd.name}</h5>
                            {selectedProd.badge_label && (
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#1C3F2D] text-[#FFFDF8] px-2 py-0.5 rounded shadow-xs">
                                ★ {selectedProd.badge_label}
                              </span>
                            )}
                            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                              ✓ Synced from Products Page
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#5C6B60] font-mono flex-wrap">
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E4DDC8] font-medium text-[#1C3F2D]">
                              Tray: {activeVar?.label || '50g tray'}
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E4DDC8] font-bold text-[#1C3F2D]">
                              {activeVar ? formatPrice(activeVar.price_paise) : '—'}
                            </span>
                            <span className="text-gray-500">
                              Stock: {activeVar?.stock_qty ?? '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : field.type === 'mascot_select' ? (
                /* MASCOT SELECT (FOR CART DRAWER) */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 w-full space-y-2">
                      <select
                        value={form[field.key] || 'pleading'}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-700/20 focus:border-green-700 outline-none font-medium"
                      >
                        <option value="pleading">Variation 1: Pleading Sprout (Hungry, puppy-dog eyes, clutching tummy)</option>
                        <option value="dramatic">Variation 2: Melodramatic Sprout (Fainting, dramatic composting sigh)</option>
                        <option value="angry">Variation 3: Frantic Stress Cart (Classic original with lightning bolts)</option>
                      </select>
                      <p className="text-xs text-gray-500">
                        Select which cartoon character personality greets customers when their cart slider is empty.
                      </p>
                    </div>
                    <div className="shrink-0 p-3 bg-[#FAF8F2] border border-[#E4DDC8] rounded-xl flex flex-col items-center justify-center">
                      <CartMascot variant={form[field.key] || 'pleading'} className="w-28 h-28" />
                      <span className="font-mono text-[9.5px] text-gray-500 uppercase tracking-wider mt-1">Live Mascot Preview</span>
                    </div>
                  </div>
                </div>
              ) : field.type === 'recipe_select' ? (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={form[field.key] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-700/20 focus:border-green-700 outline-none"
                    >
                      <option value="">-- Select Recipe from Backend --</option>
                      {form[field.key] && !recipes.some((r) => r.slug === form[field.key]) && (
                        <option value={form[field.key]}>
                          {form[field.key]} (Current / Custom)
                        </option>
                      )}
                      {recipes.map((r) => (
                        <option key={r.id} value={r.slug}>
                          {r.title} {!r.is_published ? '(Draft)' : ''}
                        </option>
                      ))}
                    </select>
                    {form[field.key] && (
                      <a
                        href={`/recipes/${form[field.key]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition-colors"
                      >
                        <span>Preview</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                  {form[field.key] && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-gray-400">Selected:</span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                        {recipes.find((r) => r.slug === form[field.key])?.title || form[field.key]}
                      </span>
                    </div>
                  )}
                </div>
              ) : field.type === 'textarea' ? (
                <div className="space-y-2">
                  <textarea
                    value={form[field.key] ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    rows={field.key === 'body_content' ? 16 : field.key === 'preamble' ? 4 : 4}
                    className={`w-full px-3 py-2 border rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-green-700/20 focus:border-green-700 outline-none ${
                      field.key === 'body_content' ? 'font-mono text-xs leading-5' : ''
                    }`}
                  />
                  {/* Quick-insert variation chips for cart_empty_subtitle */}
                  {field.key === 'cart_empty_subtitle' && (
                    <div className="mt-2 space-y-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold block">
                        Quick Variation Presets (Click to insert):
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.',
                          "Don't leave it starving — this little cart is one empty moment away from composting itself.",
                          'A cart without fresh greens is an existential crisis on wheels. Feed it!',
                          "Fill it, before the cart takes a drastic step it'll regret the rest of its life.",
                        ].map((textOption, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, [field.key]: textOption }))}
                            className="text-left text-xs bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors leading-snug cursor-pointer"
                          >
                            &ldquo;{textOption}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : field.type === 'image_url' ? (
                <ImageField
                  value={form[field.key] || null}
                  onChange={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      [field.key]: url,
                    }))
                  }
                  onRemove={() =>
                    setForm((prev) => ({
                      ...prev,
                      [field.key]: '',
                      [`${field.key}_alt`]: '',
                    }))
                  }
                  aspectRatio="16/9"
                  folder={`content/${activePage}`}
                  publicId={field.key}
                  acceptVideo={field.key.includes('video') || field.key === 'hero_image_url'}
                  altText={form[`${field.key}_alt`] || ''}
                  onAltTextChange={(alt) =>
                    setForm((prev) => ({
                      ...prev,
                      [`${field.key}_alt`]: alt,
                    }))
                  }
                />
              ) : field.key === 'homepage_partner_logos_enabled' || field.key.endsWith('_enabled') ? (
                <div className="flex items-center gap-3 py-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form[field.key] !== 'false'}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: prev[field.key] === 'false' ? 'true' : 'false',
                      }))
                    }
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                      form[field.key] !== 'false' ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        form[field.key] !== 'false' ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      form[field.key] !== 'false'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {form[field.key] !== 'false' ? 'Enabled (Section Shown on Homepage)' : 'Disabled (Section Hidden from Homepage)'}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={form[field.key] ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-700/20 focus:border-green-700 outline-none"
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center gap-3 sticky bottom-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border shadow-md">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
        {saved && (
          <span className="text-sm text-green-700 font-semibold flex items-center gap-1">
            <span>✓</span> Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
