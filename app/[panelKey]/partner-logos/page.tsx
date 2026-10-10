'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import ImageField from '@/components/admin/ImageField';
import { getOptimizedLogoUrl } from '@/lib/format';
import { Building } from '@/components/icons';

export interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SectionSettings {
  homepage_partner_logos_enabled: string;
  homepage_partner_logos_eyebrow: string;
  homepage_partner_logos_title: string;
  homepage_partner_logos_card_style?: string;
  homepage_partner_logos_size?: string;
}

const emptyLogo = {
  name: '',
  logo_url: '',
  website_url: '',
  display_order: 0,
  is_active: true,
};

export default function AdminPartnerLogosPage() {
  const [logos, setLogos] = useState<PartnerLogo[]>([]);
  const [settings, setSettings] = useState<SectionSettings>({
    homepage_partner_logos_enabled: 'true',
    homepage_partner_logos_eyebrow: 'TRUSTED BY',
    homepage_partner_logos_title: 'Leading organizations choose wild about greens.',
    homepage_partner_logos_card_style: 'cards',
    homepage_partner_logos_size: 'standard',
  });
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLogo);
  const [savingLogo, setSavingLogo] = useState(false);

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    eyebrow: 'TRUSTED BY',
    title: 'Leading organizations choose wild about greens.',
    card_style: 'cards',
    logo_size: 'standard',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);
  const [togglingSection, setTogglingSection] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/partner-logos');
      if (res.ok) {
        const data = await res.json();
        setLogos(data.logos || []);
        if (data.settings) {
          setSettings(data.settings);
          setSettingsForm({
            eyebrow: data.settings.homepage_partner_logos_eyebrow || 'TRUSTED BY',
            title: data.settings.homepage_partner_logos_title || 'Leading organizations choose wild about greens.',
            card_style: data.settings.homepage_partner_logos_card_style || 'cards',
            logo_size: data.settings.homepage_partner_logos_size || 'standard',
          });
        }
      }
    } catch (err) {
      console.error('Error loading partner logos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isSectionEnabled = settings.homepage_partner_logos_enabled !== 'false';

  const handleToggleSection = async () => {
    setTogglingSection(true);
    setToggleFeedback(null);
    const newStatus = !isSectionEnabled;
    try {
      const res = await adminFetch('/api/admin/partner-logos/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus }),
      });
      if (res.ok) {
        setSettings((prev) => ({
          ...prev,
          homepage_partner_logos_enabled: newStatus ? 'true' : 'false',
        }));
        setToggleFeedback(
          newStatus
            ? 'Section is now ENABLED and visible on the homepage.'
            : 'Section is now DISABLED and hidden from the homepage.'
        );
        setTimeout(() => setToggleFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Failed to toggle section:', err);
    } finally {
      setTogglingSection(false);
    }
  };

  const handleSaveSettingsText = async () => {
    setSavingSettings(true);
    try {
      const res = await adminFetch('/api/admin/partner-logos/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eyebrow: settingsForm.eyebrow,
          title: settingsForm.title,
          card_style: settingsForm.card_style,
          logo_size: settingsForm.logo_size,
        }),
      });
      if (res.ok) {
        setSettings((prev) => ({
          ...prev,
          homepage_partner_logos_eyebrow: settingsForm.eyebrow,
          homepage_partner_logos_title: settingsForm.title,
          homepage_partner_logos_card_style: settingsForm.card_style,
          homepage_partner_logos_size: settingsForm.logo_size,
        }));
        setSettingsSavedFeedback(true);
        setTimeout(() => setSettingsSavedFeedback(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save settings text:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyLogo,
      display_order: logos.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (logo: PartnerLogo) => {
    setEditingId(logo.id);
    setForm({
      name: logo.name,
      logo_url: logo.logo_url,
      website_url: logo.website_url || '',
      display_order: logo.display_order,
      is_active: logo.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.logo_url.trim()) {
      alert('Please provide a company name and upload/enter a logo image.');
      return;
    }

    setSavingLogo(true);
    try {
      if (editingId) {
        const res = await adminFetch(`/api/admin/partner-logos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setIsModalOpen(false);
          loadData();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update logo');
        }
      } else {
        const res = await adminFetch('/api/admin/partner-logos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setIsModalOpen(false);
          loadData();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create logo');
        }
      }
    } catch (err) {
      console.error('Error saving logo:', err);
    } finally {
      setSavingLogo(false);
    }
  };

  const handleToggleLogoActive = async (logo: PartnerLogo) => {
    try {
      const res = await adminFetch(`/api/admin/partner-logos/${logo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !logo.is_active }),
      });
      if (res.ok) {
        setLogos((prev) =>
          prev.map((l) => (l.id === logo.id ? { ...l, is_active: !logo.is_active } : l))
        );
      }
    } catch (err) {
      console.error('Failed to toggle logo active status:', err);
    }
  };

  const handleDeleteLogo = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the logo for "${name}"?`)) return;
    try {
      const res = await adminFetch(`/api/admin/partner-logos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLogos((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete logo:', err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner &amp; Company Logos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the company partner logos showcased directly above the &ldquo;Join the revolution&rdquo; section on the homepage.
        </p>
      </div>

      {/* 1. Master Section Enable/Disable Banner */}
      <div
        className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${
          isSectionEnabled
            ? 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white border-emerald-300'
            : 'bg-gradient-to-r from-gray-50 via-amber-50/30 to-white border-gray-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Interactive Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isSectionEnabled}
              onClick={handleToggleSection}
              disabled={togglingSection}
              className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner mt-0.5 ${
                isSectionEnabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              title={isSectionEnabled ? 'Click to disable section from homepage' : 'Click to enable section on homepage'}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isSectionEnabled ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">
                  Homepage Section Status:
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${
                    isSectionEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSectionEnabled ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`} />
                  {isSectionEnabled ? 'Enabled & Visible on Homepage' : 'Disabled & Hidden from Homepage'}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                {isSectionEnabled
                  ? 'This section is currently live and displayed on the homepage with your partner logos marquee.'
                  : 'This section is currently turned off. It will not show up anywhere on the homepage.'}
              </p>
              {toggleFeedback && (
                <p className="text-xs font-semibold text-emerald-700 animate-fade-in flex items-center gap-1 pt-1">
                  <span>✓</span> {toggleFeedback}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleSection}
              disabled={togglingSection}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                isSectionEnabled
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
              }`}
            >
              {togglingSection ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : isSectionEnabled ? (
                <>
                  <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                  <span>Disable Section on Homepage</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Enable Section on Homepage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Section Heading Customization */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900">Section Text &amp; Headings</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Customize the eyebrow label and main title displayed above the logos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Eyebrow Label
            </label>
            <input
              type="text"
              value={settingsForm.eyebrow}
              onChange={(e) => setSettingsForm({ ...settingsForm, eyebrow: e.target.value })}
              placeholder="TRUSTED BY"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Small uppercase badge above title (default: &ldquo;TRUSTED BY&rdquo;)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Main Headline
            </label>
            <input
              type="text"
              value={settingsForm.title}
              onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
              placeholder="Leading organizations choose wild about greens."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Main heading displayed in serif typography
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Logo Card Style
            </label>
            <select
              value={settingsForm.card_style}
              onChange={(e) => setSettingsForm({ ...settingsForm, card_style: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="cards">White Cards (Recommended — uniform tiles for all logos)</option>
              <option value="seamless">Seamless (No card border)</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              White cards guarantee all logos look clean and balanced, even with JPG white backgrounds.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Fixed Logo Size
            </label>
            <select
              value={settingsForm.logo_size}
              onChange={(e) => setSettingsForm({ ...settingsForm, logo_size: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="standard">Standard (Fixed 220 × 96px — Recommended)</option>
              <option value="large">Large (Fixed 260 × 112px)</option>
              <option value="compact">Compact (Fixed 180 × 82px)</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Guarantees every logo has the exact same fixed dimension on the homepage.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {settingsSavedFeedback && (
            <span className="text-xs text-emerald-600 font-semibold animate-fade-in">
              ✓ Settings saved!
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveSettingsText}
            disabled={savingSettings}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* 3. Logos List & Management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">Uploaded Partner Logos</h3>
              <span className="bg-gray-100 text-gray-700 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                {logos.length} {logos.length === 1 ? 'logo' : 'logos'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload as many company logos as you want. They will be displayed in clean grayscale with full color hover effects.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#122A1F] hover:bg-[#1C3F2D] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>Add Partner Logo</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading partner logos...</div>
        ) : logos.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Building className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <h4 className="text-sm font-bold text-gray-800">No partner logos uploaded yet</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Click &ldquo;Add Partner Logo&rdquo; above to upload company partner logos that have partnered with you.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              + Upload First Logo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  logo.is_active
                    ? 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                    : 'bg-gray-50/80 border-gray-200 opacity-60'
                }`}
              >
                <div>
                  {/* Logo Preview Container */}
                  <div className="aspect-[3/2] w-full rounded-lg bg-white border border-[#E8E2D2] flex items-center justify-center p-3 mb-3 relative overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getOptimizedLogoUrl(logo.logo_url)}
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-all duration-300"
                    />
                    <span className="absolute top-1.5 right-1.5 font-mono text-[10px] bg-white/90 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-semibold">
                      #{logo.display_order}
                    </span>
                  </div>

                  {/* Company Info */}
                  <h4 className="font-bold text-sm text-gray-900 truncate" title={logo.name}>
                    {logo.name}
                  </h4>
                  {logo.website_url ? (
                    <a
                      href={logo.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline truncate block mt-0.5"
                      title={logo.website_url}
                    >
                      {logo.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 block mt-0.5 italic">
                      No link provided
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleToggleLogoActive(logo)}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                      logo.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {logo.is_active ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(logo)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 p-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLogo(logo.id, logo.name)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 p-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? 'Edit Partner Logo' : 'Add Partner Logo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLogo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Roots Analysis, iCuerious, Nexus Select"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Logo Image *
                </label>
                <ImageField
                  value={form.logo_url}
                  onChange={(url) => setForm({ ...form, logo_url: url })}
                  folder="wga/partner-logos"
                  aspectRatio="16/9"
                  objectFit="contain"
                  label="Upload Company Logo (PNG, SVG, or JPG with transparent/clean background recommended)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  If provided, clicking the logo on the homepage will open their website in a new tab.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Lower numbers appear first</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.is_active ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLogo}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {savingLogo ? 'Saving...' : editingId ? 'Update Logo' : 'Add Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
