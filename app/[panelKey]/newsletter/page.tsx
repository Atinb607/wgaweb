'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { adminFetch } from '@/lib/adminAuth';
import { downloadCSV } from '@/lib/csvExport';
import { DEFAULT_NEWSLETTER_BANNER, renderNewsletterTitle } from '@/lib/newsletterBanner';
import { Download, Users, Palette, Search, Clipboard, Lightbulb, Save } from '@/components/icons';

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  subscribed_at: string;
}

interface BannerForm {
  newsletter_title: string;
  newsletter_subtitle: string;
  newsletter_button_text: string;
  newsletter_placeholder: string;
  newsletter_disclaimer: string;
}

export default function AdminNewsletterPage() {
  const params = useParams();
  const currentKey = (params?.panelKey as string) || 'admin';

  const [activeTab, setActiveTab] = useState<'subscribers' | 'banner'>('subscribers');

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Banner customization state
  const [bannerForm, setBannerForm] = useState<BannerForm>(DEFAULT_NEWSLETTER_BANNER);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Check URL query parameters for default tab (e.g. ?tab=banner)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const tab = search.get('tab');
      if (tab === 'banner' || tab === 'subscribers') {
        setActiveTab(tab);
      }
    }
  }, []);

  // Load subscribers
  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch('/api/admin/newsletter');
    if (res.ok) {
      setSubscribers(await res.json());
    }
    setLoading(false);
  }, []);

  // Load banner content from database
  const loadBannerContent = useCallback(async () => {
    setBannerLoading(true);
    try {
      const res = await adminFetch('/api/admin/content/product-listing', { cache: 'no-store' });
      if (res.ok) {
        const blocks: { key: string; value: string }[] = await res.json();
        const map = new Map<string, string>();
        for (const b of blocks) {
          map.set(b.key, b.value);
        }
        setBannerForm({
          newsletter_title: map.get('newsletter_title') ?? DEFAULT_NEWSLETTER_BANNER.newsletter_title,
          newsletter_subtitle: map.get('newsletter_subtitle') ?? DEFAULT_NEWSLETTER_BANNER.newsletter_subtitle,
          newsletter_button_text: map.get('newsletter_button_text') ?? DEFAULT_NEWSLETTER_BANNER.newsletter_button_text,
          newsletter_placeholder: map.get('newsletter_placeholder') ?? DEFAULT_NEWSLETTER_BANNER.newsletter_placeholder,
          newsletter_disclaimer: map.get('newsletter_disclaimer') ?? DEFAULT_NEWSLETTER_BANNER.newsletter_disclaimer,
        });
      }
    } catch (err) {
      console.error('Failed to load newsletter banner content:', err);
    } finally {
      setBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
    loadBannerContent();
  }, [loadSubscribers, loadBannerContent]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return sub.email.toLowerCase().includes(q) || sub.id.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    const headers = ['Subscriber ID', 'Email Address', 'Signup Source', 'Subscribed Date & Time'];
    const rows = filteredSubscribers.map((sub) => [
      sub.id,
      sub.email,
      sub.source || 'Website',
      new Date(sub.subscribed_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
    ]);

    downloadCSV('wga-newsletter-subscribers.csv', [headers, ...rows]);
  };

  const handleBannerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSaving(true);
    setBannerSaved(false);
    setBannerError(null);

    const payload = [
      { key: 'newsletter_title', value: bannerForm.newsletter_title, value_type: 'text' },
      { key: 'newsletter_subtitle', value: bannerForm.newsletter_subtitle, value_type: 'textarea' },
      { key: 'newsletter_button_text', value: bannerForm.newsletter_button_text, value_type: 'text' },
      { key: 'newsletter_placeholder', value: bannerForm.newsletter_placeholder, value_type: 'text' },
      { key: 'newsletter_disclaimer', value: bannerForm.newsletter_disclaimer, value_type: 'text' },
    ];

    try {
      // Sync to both product-listing and our-story pages
      const [resPLP, resStory] = await Promise.all([
        adminFetch('/api/admin/content/product-listing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: payload }),
        }),
        adminFetch('/api/admin/content/our-story', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: payload }),
        }),
      ]);

      if (resPLP.ok && resStory.ok) {
        setBannerSaved(true);
        setTimeout(() => setBannerSaved(false), 3500);
      } else {
        setBannerError('Failed to save banner settings. Please try again.');
      }
    } catch {
      setBannerError('Network error while saving banner settings.');
    } finally {
      setBannerSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset banner text back to original defaults?')) {
      setBannerForm(DEFAULT_NEWSLETTER_BANNER);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your subscribers and customize the newsletter subscription banner across your storefront.
          </p>
        </div>

        {activeTab === 'subscribers' && (
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredSubscribers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'subscribers'
              ? 'bg-[#1C3F2D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Subscribers List</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {subscribers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('banner')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'banner'
              ? 'bg-[#1C3F2D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Banner Customization</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            Live Editor
          </span>
        </button>
      </div>

      {/* TAB 1: SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div>
          {/* Search Input */}
          <div className="mb-6 relative max-w-md">
            <input
              type="text"
              placeholder="Search by Email or Subscriber ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50/80 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Subscriber ID</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Subscribed Time</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-gray-500" title={sub.id}>
                          {sub.id.slice(0, 8)}...{sub.id.slice(-4)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{sub.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(sub.email, sub.id)}
                            className="text-[10px] text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
                            title="Copy email"
                          >
                            {copiedId === sub.id ? '✓' : <Clipboard className="w-3.5 h-3.5 inline text-gray-400" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700 capitalize">
                          {sub.source || 'Website'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        <div>
                          {new Date(sub.subscribed_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {new Date(sub.subscribed_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <a
                          href={`mailto:${sub.email}`}
                          className="text-xs font-semibold text-emerald-800 hover:underline"
                        >
                          Email →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading && (
              <div className="p-8 text-center text-sm text-gray-500">
                Loading newsletter subscribers...
              </div>
            )}

            {!loading && filteredSubscribers.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                {searchQuery
                  ? `No subscribers matching "${searchQuery}"`
                  : 'No newsletter subscribers found.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BANNER CUSTOMIZATION */}
      {activeTab === 'banner' && (
        <div className="space-y-8">
          {/* Banner Live Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Live Banner Preview (Storefront View)
                </h2>
              </div>
              <span className="text-[11px] text-gray-400">
                Updates in real-time as you type below
              </span>
            </div>

            {/* The Actual Banner Replica */}
            <div className="bg-[#122A1F] rounded-2xl p-6 sm:p-10 text-[#FFFDF8] shadow-lg border border-[#1a3d2c]">
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium leading-[1.2] mb-3 text-[#FFFDF8]">
                    {renderNewsletterTitle(bannerForm.newsletter_title)}
                  </h3>
                  <p className="text-[#FFFDF8]/65 text-xs sm:text-sm max-w-md leading-relaxed">
                    {bannerForm.newsletter_subtitle || 'Get 15% off your first order...'}
                  </p>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      readOnly
                      placeholder={bannerForm.newsletter_placeholder || 'your@email.com'}
                      className="flex-1 min-w-[180px] bg-[#FFFDF8]/10 border border-[#FFFDF8]/25 rounded-full px-4 py-2.5 text-[#FFFDF8] text-xs outline-none placeholder:text-[#FFFDF8]/45 cursor-default"
                    />
                    <button
                      type="button"
                      disabled
                      className="bg-[#CFFA57] text-[#122A1F] font-bold text-xs px-6 py-2.5 rounded-full whitespace-nowrap shadow-sm cursor-default"
                    >
                      {bannerForm.newsletter_button_text || 'Sign Up'}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#FFFDF8]/40 mt-2">
                    {bannerForm.newsletter_disclaimer || 'No spam. Unsubscribe anytime.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleBannerSave} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Banner Text Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Changes made here update the newsletter banner on the Product Catalog and Our Story pages.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                Reset to default copy
              </button>
            </div>

            {bannerError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {bannerError}
              </div>
            )}

            {bannerSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span>✓</span> Banner settings saved successfully and published to storefront!
              </div>
            )}

            {/* Field 1: Headline */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="newsletter_title" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Headline / Title
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setBannerForm((prev) => ({
                      ...prev,
                      newsletter_title: prev.newsletter_title + ' *highlighted text*',
                    }));
                  }}
                  className="text-[11px] text-emerald-700 hover:underline cursor-pointer font-medium"
                >
                  + Add *highlight* format
                </button>
              </div>
              <input
                id="newsletter_title"
                type="text"
                value={bannerForm.newsletter_title}
                onChange={(e) => setBannerForm({ ...bannerForm, newsletter_title: e.target.value })}
                placeholder="Want 15% off and the *inside scoop?*"
                className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  <strong>Styling Tip:</strong> Wrap any word in <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-800">*asterisks*</code> to highlight it in lime-green italic letters (like <em>*inside scoop?*</em>).
                </span>
              </p>
            </div>

            {/* Field 2: Subtitle */}
            <div>
              <label htmlFor="newsletter_subtitle" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Subtitle / Description Text
              </label>
              <textarea
                id="newsletter_subtitle"
                rows={3}
                value={bannerForm.newsletter_subtitle}
                onChange={(e) => setBannerForm({ ...bannerForm, newsletter_subtitle: e.target.value })}
                placeholder="Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops."
                className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white leading-relaxed"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                A brief message explaining the perks of subscribing (discounts, fresh drops, tips).
              </p>
            </div>

            {/* Field 3 & 4: Button text & Placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newsletter_button_text" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Button Text
                </label>
                <input
                  id="newsletter_button_text"
                  type="text"
                  value={bannerForm.newsletter_button_text}
                  onChange={(e) => setBannerForm({ ...bannerForm, newsletter_button_text: e.target.value })}
                  placeholder="Sign Up"
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white"
                />
              </div>

              <div>
                <label htmlFor="newsletter_placeholder" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Input Placeholder
                </label>
                <input
                  id="newsletter_placeholder"
                  type="text"
                  value={bannerForm.newsletter_placeholder}
                  onChange={(e) => setBannerForm({ ...bannerForm, newsletter_placeholder: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white"
                />
              </div>
            </div>

            {/* Field 5: Disclaimer */}
            <div>
              <label htmlFor="newsletter_disclaimer" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Disclaimer / Privacy Reassurance
              </label>
              <input
                id="newsletter_disclaimer"
                type="text"
                value={bannerForm.newsletter_disclaimer}
                onChange={(e) => setBannerForm({ ...bannerForm, newsletter_disclaimer: e.target.value })}
                placeholder="No spam. Unsubscribe anytime."
                className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Short note shown beneath the input field to assure customers against spam.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={bannerSaving || bannerLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1C3F2D] hover:bg-[#122A1F] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {bannerSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Banner Settings</span>
                    </>
                  )}
                </button>

                {bannerSaved && (
                  <span className="text-xs text-emerald-700 font-semibold animate-fade-in">
                    ✓ Saved!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Link
                  href={`/${currentKey}/email-content`}
                  className="hover:text-emerald-700 underline"
                >
                  Edit Welcome Email →
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/${currentKey}/content?tab=product-listing`}
                  className="hover:text-emerald-700 underline"
                >
                  Open in Content Registry →
                </Link>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
