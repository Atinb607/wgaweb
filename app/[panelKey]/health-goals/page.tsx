'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import ImageField from '@/components/admin/ImageField';
import { Target, AlertTriangle, Sprout } from '@/components/icons';

export interface HealthGoalContentItem {
  id: string;
  slug: string;
  title: string;
  tag: string;
  icon: string | null;
  subtitle: string;
  popup_title: string;
  popup_description: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  health_goals: string[];
}

export default function AdminHealthGoalsPage() {
  const [goals, setGoals] = useState<HealthGoalContentItem[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [editing, setEditing] = useState<HealthGoalContentItem | null>(null);
  const [form, setForm] = useState<HealthGoalContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [savingGoalsOrder, setSavingGoalsOrder] = useState(false);
  const [goalsOrderSaved, setGoalsOrderSaved] = useState(false);

  const handleGoalMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= goals.length) return;
    const next = [...goals];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    const updated = next.map((g, idx) => ({
      ...g,
      display_order: idx + 1,
    }));
    setGoals(updated);
  };

  const handleGoalOrderInput = (index: number, val: string) => {
    const parsed = parseInt(val, 10);
    setGoals((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        display_order: isNaN(parsed) ? 0 : parsed,
      };
      return next;
    });
  };

  const handleToggleGoalVisibility = (index: number) => {
    setGoals((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        is_active: !next[index].is_active,
      };
      return next;
    });
  };

  const handleSaveGoalsOrder = async () => {
    setSavingGoalsOrder(true);
    try {
      const res = await adminFetch('/api/admin/health-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.goals) {
          setGoals(data.goals);
        }
        setGoalsOrderSaved(true);
        setTimeout(() => setGoalsOrderSaved(false), 3000);
      } else {
        alert('Failed to update health goal order.');
      }
    } catch {
      alert('Network error while saving health goals order.');
    } finally {
      setSavingGoalsOrder(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, prodsRes] = await Promise.all([
        adminFetch('/api/admin/health-goals'),
        adminFetch('/api/admin/products'),
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }
      if (prodsRes.ok) {
        const prodsData = await prodsRes.json();
        setProducts(
          prodsData.map((p: { id: string; name: string; slug: string; health_goals: string[] }) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            health_goals: Array.isArray(p.health_goals) ? p.health_goals : [],
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (goal: HealthGoalContentItem) => {
    setEditing(goal);
    setForm({ ...goal });
    setSuccessMsg('');
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await adminFetch(`/api/admin/health-goals/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setEditing(updated);
        setForm(updated);
        setSuccessMsg('Changes saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        alert('Failed to save health goal content.');
      }
    } catch {
      alert('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const getMappedProductsForGoal = (goalId: string, goalSlug: string) => {
    if (goalId === 'all-trays' || goalSlug === 'all-trays') {
      return products;
    }
    return products.filter((p) =>
      p.health_goals?.some((g) => g === goalId || g === goalSlug)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
              TARGETED CELLULAR NUTRITION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-800" />
            <span>Health Goals &amp; Storefront Sequencing</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Customize the card text, tag badge, display sequence order, and visibility for each health goal on the storefront (<code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono text-[11px]">/products/health-goals</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/products/health-goals"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:text-emerald-800 hover:border-emerald-300 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>↗ View Shop Page</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading health goals...</div>
      ) : editing && form ? (
        /* Edit Mode */
        <div className="space-y-6">
          <button
            onClick={() => {
              setEditing(null);
              setForm(null);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium"
          >
            ← Back to all goals
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Edit: {editing.title}
                  </h2>
                  <span className="font-mono text-xs text-gray-400">
                    Slug ID: {editing.slug}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Active on Homepage
                  </label>
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-lg font-medium">
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Card Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    placeholder="e.g. Boost Immunity"
                  />
                </div>

                {/* Tag Badge */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Card Badge Tag
                  </label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white uppercase font-mono font-semibold"
                    placeholder="e.g. IMMUNITY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Icon Emoji */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Icon Symbol / Key
                  </label>
                  <input
                    type="text"
                    value={form.icon || ''}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-center font-mono text-sm"
                    placeholder="e.g. shield"
                  />
                </div>

                {/* Card Subtitle */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Card Subtitle (Shown on Homepage Card)
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    placeholder="e.g. Broccoli & radish blends"
                  />
                </div>
              </div>

              {/* Popup Headline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Popup Headline (Shown inside the Popup)
                </label>
                <input
                  type="text"
                  value={form.popup_title}
                  onChange={(e) => setForm({ ...form, popup_title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  placeholder="e.g. Strengthen natural defenses with pure sulforaphane & vitamin C."
                />
              </div>

              {/* Popup Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Popup Detailed Description
                </label>
                <textarea
                  rows={4}
                  value={form.popup_description}
                  onChange={(e) => setForm({ ...form, popup_description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white leading-relaxed"
                  placeholder="Explain the health benefits, key vitamins, and science behind this health goal..."
                />
              </div>

              {/* Card / Popup Image */}
              <div>
                <ImageField
                  label="Goal Photo (Shown on Homepage Card and in Popup)"
                  value={form.image_url || ''}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="wga/goals"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                  className="w-28 px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Sidebar Preview Column */}
            <div className="space-y-6">
              {/* Homepage Card Preview */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Card Preview on Homepage
                </h3>
                <div className="max-w-[240px] mx-auto">
                  <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#DCF5A8] shadow-sm border border-black/5 flex items-center justify-center">
                    {form.tag && (
                      <span className="absolute top-3 left-3 z-10 bg-[#FFFDF8]/95 text-[#122A1F] font-mono text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                        {form.tag}
                      </span>
                    )}
                    {form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.image_url}
                        alt={form.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                        <Sprout className="w-10 h-10 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="pt-3 px-1">
                    <h4 className="font-serif text-base font-semibold text-[#122A1F] mb-1">
                      {form.title}
                    </h4>
                    <p className="text-xs text-[#5C6B60]">{form.subtitle}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#1C3F2D]">
                      Shop →
                    </span>
                  </div>
                </div>
              </div>

              {/* Mapped Products Box */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Mapped Products
                  </h3>
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    {getMappedProductsForGoal(form.id, form.slug).length} Products
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  These microgreens are assigned to this goal and will appear when visitors click this card:
                </p>
                <div className="space-y-1.5">
                  {getMappedProductsForGoal(form.id, form.slug).length > 0 ? (
                    getMappedProductsForGoal(form.id, form.slug).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs text-gray-800 border border-gray-100"
                      >
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-gray-400 text-[10px] font-mono">Mapped</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>No products currently have this health goal selected. Go to Products → Edit to map products to this goal.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {/* ── Health Goal Display Order & Visibility Manager Card ── */}
          <div id="goal-sequencer" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                    STOREFRONT GOAL SEQUENCING &amp; VISIBILITY
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {goals.filter((g) => g.is_active).length} of {goals.length} active on shop
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  Goal Display Order &amp; Visibility on Shop
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Control the display order of health goals in the sticky pills bar and carousels on <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono text-[11px]">/products/health-goals</code>. Toggle visibility or use ▲ / ▼ to reorder.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleSaveGoalsOrder}
                  disabled={savingGoalsOrder}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    goalsOrderSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1C3F2D] hover:bg-[#122A1F] text-white'
                  } disabled:opacity-50`}
                >
                  {savingGoalsOrder ? 'Saving…' : goalsOrderSaved ? '✓ Saved!' : 'Save Goal Order'}
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {goals.map((g, idx) => {
                const mappedProds = getMappedProductsForGoal(g.id, g.slug);
                return (
                  <div
                    key={g.id}
                    className={`py-3 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg transition-colors ${
                      g.is_active ? 'hover:bg-gray-50/80' : 'bg-gray-50/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Left: Reorder controls + Goal info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleGoalMove(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up in sequence"
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGoalMove(idx, 'down')}
                          disabled={idx === goals.length - 1}
                          title="Move Down in sequence"
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-medium text-gray-400">#</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={g.display_order}
                          onChange={(e) => handleGoalOrderInput(idx, e.target.value)}
                          className="w-14 px-2 py-1 text-center font-mono font-bold text-xs text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          title="Sequence order number on storefront"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                            {g.icon && <span>{g.icon}</span>}
                            <span>{g.title}</span>
                          </span>
                          <span className="font-mono text-[10.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {g.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {mappedProds.length} {mappedProds.length === 1 ? 'product' : 'products'} mapped
                          </span>
                          <span className="text-gray-400 truncate max-w-[200px] sm:max-w-sm">
                            {g.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Visibility toggle + Edit */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleToggleGoalVisibility(idx)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          g.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 border border-gray-300'
                        }`}
                        title={g.is_active ? 'Click to hide goal from shop' : 'Click to show goal on shop'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            g.is_active ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        />
                        <span>{g.is_active ? 'Visible on Shop' : 'Hidden from Shop'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(g)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Individual Goal Cards &amp; Content
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {goals.map((g) => {
            const mappedProds = getMappedProductsForGoal(g.id, g.slug);
            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo & Badge */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {g.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.image_url}
                        alt={g.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                        <Sprout className="w-12 h-12 text-emerald-600" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 z-10 bg-[#FFFDF8]/95 text-[#122A1F] font-mono text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                      {g.tag}
                    </span>
                    <span
                      className={`absolute top-3 right-3 z-10 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs ${
                        g.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                      }`}
                    >
                      {g.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  {/* Body Copy */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-serif font-bold text-base text-gray-900 truncate">
                        {g.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{g.subtitle}</p>

                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-950 mb-3 space-y-1">
                      <div className="font-semibold truncate">
                        &ldquo;{g.popup_title}&rdquo;
                      </div>
                      <div className="text-gray-600 line-clamp-2 leading-relaxed">
                        {g.popup_description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">
                    {mappedProds.length} {mappedProds.length === 1 ? 'Product' : 'Products'}
                  </span>
                  <button
                    onClick={() => handleEdit(g)}
                    className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                  >
                    Edit Content
                  </button>
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
