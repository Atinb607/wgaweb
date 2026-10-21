'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { CONTENT_REGISTRY } from '@/lib/contentRegistry';
import { Mail, Save, Check, AlertTriangle, PackageBox } from '@/components/icons';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

interface ContentBlock {
  id?: string;
  page: string;
  key: string;
  value_type: string;
  value: string;
}

const DEFAULT_TEMPLATES = {
  // Order Confirmation
  order_confirmation_subject: 'Wild About Greens: Order #{order_number} Confirmed!',
  order_confirmation_heading: 'Thanks for your order, {customer_name}!',
  order_confirmation_intro: "We've received your order and payment. Our urban farm team will harvest and prepare your microgreens fresh for delivery.",
  order_confirmation_footer: 'Questions about your delivery? Reply directly to this email or reach us on WhatsApp. Thank you for supporting sustainable urban farming!',

  // Newsletter
  newsletter_thankyou_subject: 'Welcome to Wild About Greens!',
  newsletter_thankyou_heading: 'Welcome to the Wild About Greens Family!',
  newsletter_thankyou_body: "Hi there!\n\nWelcome to Wild About Greens, we're thrilled to have you with us.\n\nHere is your exclusive 15% discount for your first order: USE CODE: WELCOME15\n\nStay fresh,\nThe Wild About Greens Team",
  newsletter_thankyou_footer: 'Fresh harvest delivered straight from our indoor farm to your doorstep.',
};

export default function AdminEmailContentPage() {
  const [activeTab, setActiveTab] = useState<'order' | 'newsletter'>('order');
  const [form, setForm] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current email content blocks from API
  useEffect(() => {
    setLoading(true);
    adminFetch('/api/admin/content/emails', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ContentBlock[]) => {
        const loaded: Record<string, string> = { ...DEFAULT_TEMPLATES };
        if (Array.isArray(data)) {
          for (const b of data) {
            if (b.key && typeof b.value === 'string') {
              loaded[b.key] = b.value;
            }
          }
        }
        setForm(loaded);
      })
      .catch((err) => {
        console.error('Failed to load email content blocks:', err);
        setError('Failed to load email settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const emailFields = CONTENT_REGISTRY['emails'] || [];
      const blocks = Object.entries(form).map(([key, value]) => {
        const fieldMeta = emailFields.find((f) => f.key === key);
        return {
          key,
          value,
          value_type: fieldMeta?.type || (key.endsWith('body') || key.endsWith('intro') || key.endsWith('footer') ? 'textarea' : 'text'),
        };
      });

      const res = await adminFetch('/api/admin/content/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });

      if (!res.ok) {
        throw new Error('Failed to save email settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: unknown) {
      console.error('Error saving email templates:', err);
      setError(err instanceof Error ? err.message : 'Error saving email templates');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset current email templates back to system defaults?')) {
      if (activeTab === 'order') {
        setForm((prev) => ({
          ...prev,
          order_confirmation_subject: DEFAULT_TEMPLATES.order_confirmation_subject,
          order_confirmation_heading: DEFAULT_TEMPLATES.order_confirmation_heading,
          order_confirmation_intro: DEFAULT_TEMPLATES.order_confirmation_intro,
          order_confirmation_footer: DEFAULT_TEMPLATES.order_confirmation_footer,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          newsletter_thankyou_subject: DEFAULT_TEMPLATES.newsletter_thankyou_subject,
          newsletter_thankyou_heading: DEFAULT_TEMPLATES.newsletter_thankyou_heading,
          newsletter_thankyou_body: DEFAULT_TEMPLATES.newsletter_thankyou_body,
          newsletter_thankyou_footer: DEFAULT_TEMPLATES.newsletter_thankyou_footer,
        }));
      }
      setSaved(false);
    }
  };

  // Mock live preview computation
  const previewOrderData = useMemo(() => {
    const rawSubject = form.order_confirmation_subject || DEFAULT_TEMPLATES.order_confirmation_subject;
    const rawHeading = form.order_confirmation_heading || DEFAULT_TEMPLATES.order_confirmation_heading;
    const rawIntro = form.order_confirmation_intro || DEFAULT_TEMPLATES.order_confirmation_intro;
    const rawFooter = form.order_confirmation_footer || DEFAULT_TEMPLATES.order_confirmation_footer;

    const sampleOrderNumber = 'WAG-8K2N9F7X';
    const sampleCustomerName = 'Priya Sharma';

    const subject = rawSubject
      .replace(/{order_number}/gi, sampleOrderNumber)
      .replace(/{customer_name}/gi, sampleCustomerName);

    const heading = rawHeading
      .replace(/{order_number}/gi, sampleOrderNumber)
      .replace(/{customer_name}/gi, sampleCustomerName);

    const intro = rawIntro
      .replace(/{order_number}/gi, sampleOrderNumber)
      .replace(/{customer_name}/gi, sampleCustomerName);

    const footer = rawFooter
      .replace(/{order_number}/gi, sampleOrderNumber)
      .replace(/{customer_name}/gi, sampleCustomerName);

    return { subject, heading, intro, footer, sampleOrderNumber, sampleCustomerName };
  }, [form]);

  const previewNewsletterData = useMemo(() => {
    const subject = form.newsletter_thankyou_subject || DEFAULT_TEMPLATES.newsletter_thankyou_subject;
    const heading = form.newsletter_thankyou_heading || DEFAULT_TEMPLATES.newsletter_thankyou_heading;
    const body = form.newsletter_thankyou_body || DEFAULT_TEMPLATES.newsletter_thankyou_body;
    const footer = form.newsletter_thankyou_footer || DEFAULT_TEMPLATES.newsletter_thankyou_footer;

    return { subject, heading, body, footer };
  }, [form]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1C3F2D] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading email configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-7 h-7 text-[#1C3F2D]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Email Content</h1>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-300">
              Resend Powered
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure templates and copy for transactional emails dispatched through Resend.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Tab Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#1C3F2D] rounded-lg hover:bg-[#122A1F] transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Email Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-green-700" />
            <span className="font-medium text-sm">Email templates updated successfully! New emails will use this content.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* Resend Service Info Card */}
      <div className="bg-white border border-[#E8E2D2] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1C3F2D] text-[#CFFA57] flex items-center justify-center font-bold text-lg shrink-0">
            R
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#151F19]">Transactional Mail Delivery Engine</h3>
            <p className="text-xs text-[#5C6B60] mt-0.5">
              Emails are sent automatically through <strong>Resend</strong> using your verified domain sender{' '}
              <code className="bg-white/80 px-1.5 py-0.5 rounded text-[#1C3F2D] font-mono text-[11px] border border-[#D5CEC0]">
                info@wildaboutgreens.com
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#1C3F2D]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Automated Delivery Active</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'order'
              ? 'border-[#1C3F2D] text-[#1C3F2D] bg-[#1C3F2D]/5 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <PackageBox className="w-4 h-4" />
          <span>Order Confirmation Email</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'newsletter'
              ? 'border-[#1C3F2D] text-[#1C3F2D] bg-[#1C3F2D]/5 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Newsletter Welcome Email</span>
        </button>
      </div>

      {/* TAB 1: ORDER CONFIRMATION EMAIL */}
      {activeTab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Edit Form */}
          <div className="lg:col-span-6 space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Order Confirmation Template</h2>
              <p className="text-xs text-gray-500">
                Triggered automatically by Resend immediately after checkout payment verification.
              </p>
            </div>

            {/* Dynamic Placeholders Helper */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-900">
              <span className="font-semibold block">Available Dynamic Placeholders:</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="bg-white border border-blue-300 rounded px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                  {'{order_number}'}
                </span>
                <span className="bg-white border border-blue-300 rounded px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                  {'{customer_name}'}
                </span>
                <span className="bg-white border border-blue-300 rounded px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                  {'{total}'}
                </span>
                <span className="bg-white border border-blue-300 rounded px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                  {'{delivery_address}'}
                </span>
                <span className="bg-white border border-blue-300 rounded px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                  {'{customer_phone}'}
                </span>
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label htmlFor="order_confirmation_subject" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Subject Line *
              </label>
              <input
                id="order_confirmation_subject"
                type="text"
                value={form.order_confirmation_subject || ''}
                onChange={(e) => handleChange('order_confirmation_subject', e.target.value)}
                placeholder="Wild About Greens: Order #{order_number} Confirmed!"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                The subject line customer sees in their email inbox. Supports {'{order_number}'}.
              </span>
            </div>

            {/* Greeting / Heading */}
            <div>
              <label htmlFor="order_confirmation_heading" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Greeting Headline *
              </label>
              <input
                id="order_confirmation_heading"
                type="text"
                value={form.order_confirmation_heading || ''}
                onChange={(e) => handleChange('order_confirmation_heading', e.target.value)}
                placeholder="Thanks for your order, {customer_name}!"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Main greeting shown at top of email body.
              </span>
            </div>

            {/* Intro Message */}
            <div>
              <label htmlFor="order_confirmation_intro" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Introductory Body Message
              </label>
              <textarea
                id="order_confirmation_intro"
                rows={4}
                value={form.order_confirmation_intro || ''}
                onChange={(e) => handleChange('order_confirmation_intro', e.target.value)}
                placeholder="We've received your order and payment. Our urban farm team will harvest and prepare your microgreens fresh for delivery."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none resize-y"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Message paragraph explaining harvest & fulfillment process above order details.
              </span>
            </div>

            {/* Footer / Support Message */}
            <div>
              <label htmlFor="order_confirmation_footer" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Support & Help Note (Footer)
              </label>
              <textarea
                id="order_confirmation_footer"
                rows={3}
                value={form.order_confirmation_footer || ''}
                onChange={(e) => handleChange('order_confirmation_footer', e.target.value)}
                placeholder="Questions about your delivery? Reply directly to this email or reach us on WhatsApp. Thank you for supporting sustainable urban farming!"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none resize-y"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Footer support instructions and closing note.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#1C3F2D] rounded-lg hover:bg-[#122A1F] transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Saving Changes...' : 'Save Order Confirmation Email'}
              </button>
            </div>
          </div>

          {/* Interactive Live Email Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Live Email Preview (Recipient View)
              </span>
              <span className="text-xs text-gray-400">Updates live as you type</span>
            </div>

            {/* Email Client Shell */}
            <div className="bg-white rounded-2xl border border-gray-300 shadow-md overflow-hidden">
              {/* Mail client toolbar */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold w-12">From:</span>
                  <span className="text-gray-900 font-medium">Wild About Greens &lt;info@wildaboutgreens.com&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold w-12">To:</span>
                  <span className="text-gray-900">priya.sharma@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold w-12">Subject:</span>
                  <span className="text-gray-900 font-semibold">{previewOrderData.subject}</span>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="p-4 sm:p-6 bg-gray-50 max-h-[700px] overflow-y-auto">
                <div className="max-w-[560px] mx-auto bg-white rounded-xl border border-[#E8E2D2] overflow-hidden shadow-sm">
                  {/* Brand Header */}
                  <div className="bg-[#1C3F2D] p-5 text-center flex items-center justify-center">
                    <img
                      src={CLOUDINARY_ASSETS.logoPictureBg}
                      alt="Wild About Greens"
                      className="h-9 w-auto max-w-[200px] object-contain mx-auto"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-5 text-gray-800">
                    <div>
                      <h3 className="text-xl font-bold text-[#151F19] mb-2 font-serif">
                        {previewOrderData.heading}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {previewOrderData.intro}
                      </p>
                    </div>

                    {/* Order Number Box */}
                    <div className="bg-gray-50 border border-[#E4DDC8] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5C6B60] block">
                          Order Number
                        </span>
                        <span className="text-lg font-extrabold text-[#1C3F2D] font-mono tracking-wider">
                          #{previewOrderData.sampleOrderNumber}
                        </span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                        PAID
                      </span>
                    </div>

                    {/* Order Details Table */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Order Summary
                      </h4>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-400 uppercase text-[10px]">
                            <th className="py-2 font-semibold">Item</th>
                            <th className="py-2 font-semibold">Pack</th>
                            <th className="py-2 font-semibold text-center">Qty</th>
                            <th className="py-2 font-semibold text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          <tr>
                            <td className="py-2.5 font-medium text-gray-900">Broccoli Microgreens</td>
                            <td className="py-2.5 text-gray-500">50g Tray</td>
                            <td className="py-2.5 text-center">2</td>
                            <td className="py-2.5 text-right font-medium">₹398.00</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium text-gray-900">Radish Microgreens</td>
                            <td className="py-2.5 text-gray-500">50g Tray</td>
                            <td className="py-2.5 text-center">1</td>
                            <td className="py-2.5 text-right font-medium">₹199.00</td>
                          </tr>
                          <tr className="border-t-2 border-[#1C3F2D] font-bold text-sm text-gray-900">
                            <td colSpan={3} className="pt-3">Total Paid</td>
                            <td className="pt-3 text-right text-[#1C3F2D]">₹597.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      <span className="font-bold text-gray-800 block mb-1 uppercase tracking-wide text-[10px]">
                        Delivery Address
                      </span>
                      <p className="leading-snug">
                        <strong>Priya Sharma</strong> • +91 98765 43210<br />
                        Flat 402, Green Valley Apts, Indiranagar, Bengaluru, KA - 560038
                      </p>
                    </div>

                    {/* CTA Button */}
                    <div className="text-center pt-2">
                      <div className="inline-block bg-[#1C3F2D] text-[#FFFDF8] text-xs font-semibold px-6 py-3 rounded-full shadow-sm cursor-default">
                        Track Your Order →
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-500 space-y-1">
                      <p className="whitespace-pre-line">{previewOrderData.footer}</p>
                      <p className="text-[10px] text-gray-400 pt-2">
                        Wild About Greens • Urban Microgreens Farm • wildaboutgreens.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEWSLETTER CONFIRMATION EMAIL */}
      {activeTab === 'newsletter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Edit Form */}
          <div className="lg:col-span-6 space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Newsletter Welcome Email Template</h2>
              <p className="text-xs text-gray-500">
                Triggered automatically by Resend whenever a new subscriber signs up via the website newsletter form.
              </p>
            </div>

            {/* Subject Line */}
            <div>
              <label htmlFor="newsletter_thankyou_subject" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Subject Line *
              </label>
              <input
                id="newsletter_thankyou_subject"
                type="text"
                value={form.newsletter_thankyou_subject || ''}
                onChange={(e) => handleChange('newsletter_thankyou_subject', e.target.value)}
                placeholder="Welcome to Wild About Greens!"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Subject line shown in the subscriber&apos;s email inbox.
              </span>
            </div>

            {/* Greeting Headline */}
            <div>
              <label htmlFor="newsletter_thankyou_heading" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Welcome Greeting Headline *
              </label>
              <input
                id="newsletter_thankyou_heading"
                type="text"
                value={form.newsletter_thankyou_heading || ''}
                onChange={(e) => handleChange('newsletter_thankyou_heading', e.target.value)}
                placeholder="Welcome to the Wild About Greens Family!"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Headline banner inside the welcome email.
              </span>
            </div>

            {/* Email Body */}
            <div>
              <label htmlFor="newsletter_thankyou_body" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Welcome Message Body *
              </label>
              <textarea
                id="newsletter_thankyou_body"
                rows={6}
                value={form.newsletter_thankyou_body || ''}
                onChange={(e) => handleChange('newsletter_thankyou_body', e.target.value)}
                placeholder="Hi there! Welcome to Wild About Greens..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none resize-y"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Main welcome copy. Use line breaks to separate paragraphs. You can include discount codes (e.g. WELCOME15).
              </span>
            </div>

            {/* Footer Note */}
            <div>
              <label htmlFor="newsletter_thankyou_footer" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Footer Tagline / Note
              </label>
              <textarea
                id="newsletter_thankyou_footer"
                rows={2}
                value={form.newsletter_thankyou_footer || ''}
                onChange={(e) => handleChange('newsletter_thankyou_footer', e.target.value)}
                placeholder="Fresh harvest delivered straight from our indoor farm to your doorstep."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] outline-none resize-y"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Brand tagline shown at the bottom of the email.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#1C3F2D] rounded-lg hover:bg-[#122A1F] transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Saving Changes...' : 'Save Newsletter Email Template'}
              </button>
            </div>
          </div>

          {/* Interactive Live Email Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Live Email Preview (Subscriber View)
              </span>
              <span className="text-xs text-gray-400">Updates live as you type</span>
            </div>

            {/* Email Client Shell */}
            <div className="bg-white rounded-2xl border border-gray-300 shadow-md overflow-hidden">
              {/* Mail client toolbar */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold w-12">From:</span>
                  <span className="text-gray-900 font-medium">Wild About Greens &lt;info@wildaboutgreens.com&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold w-12">To:</span>
                  <span className="text-gray-900">subscriber@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold w-12">Subject:</span>
                  <span className="text-gray-900 font-semibold">{previewNewsletterData.subject}</span>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="p-4 sm:p-6 bg-gray-50 max-h-[700px] overflow-y-auto">
                <div className="max-w-[560px] mx-auto bg-white rounded-xl border border-[#E8E2D2] overflow-hidden shadow-sm">
                  {/* Brand Header */}
                  <div className="bg-[#1C3F2D] p-5 text-center flex items-center justify-center">
                    <img
                      src={CLOUDINARY_ASSETS.logoPictureBg}
                      alt="Wild About Greens"
                      className="h-9 w-auto max-w-[200px] object-contain mx-auto"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-5 text-gray-800">
                    <div>
                      <h3 className="text-xl font-bold text-[#151F19] mb-3 font-serif">
                        {previewNewsletterData.heading}
                      </h3>
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line space-y-3">
                        {previewNewsletterData.body}
                      </div>
                    </div>

                    {/* Shop Microgreens Button */}
                    <div className="text-center pt-3">
                      <div className="inline-block bg-[#1C3F2D] text-[#FFFDF8] text-xs font-semibold px-6 py-3 rounded-full shadow-sm cursor-default">
                        Explore Fresh Greens →
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-500 space-y-1">
                      <p>{previewNewsletterData.footer}</p>
                      <p className="text-[10px] text-gray-400 pt-2">
                        Wild About Greens • Urban Microgreens Farm • wildaboutgreens.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
