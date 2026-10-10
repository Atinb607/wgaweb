'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Script from 'next/script';
import {
  CheckCircle,
  AlertTriangle,
  WhatsApp,
  PackageBox,
} from '@/components/icons';
import JoinRevolutionSection from '@/components/JoinRevolutionSection';

const DEFAULT_VARIETIES = [
  'Sunflower Microgreens',
  'Radish Microgreens',
  'Pea Shoots',
  'Broccoli Microgreens',
  'Carrot Microgreens',
  'Soya Microgreens',
  'Mustard Microgreens',
  'Wheatgrass',
  'Chef Custom Blend / Assorted Trays',
];

const TRAY_PRESETS = [5, 10, 20, 30, 50, 100];

interface BulkOrderClientProps {
  initialProducts?: { name: string; slug: string }[];
}

export default function BulkOrderClient({ initialProducts = [] }: BulkOrderClientProps) {
  // Available varieties merged with DB products
  const productOptions = Array.from(
    new Set([
      ...initialProducts.map((p) => p.name),
      ...DEFAULT_VARIETIES,
    ])
  );

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [traysCount, setTraysCount] = useState<number>(10);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    'Sunflower Microgreens',
    'Radish Microgreens',
  ]);
  const [customProductsText, setCustomProductsText] = useState('');
  const [frequency, setFrequency] = useState('one-time');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [notes, setNotes] = useState('');

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Turnstile State
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleTurnstileScriptReady = useCallback(() => {
    setTurnstileReady(true);
  }, []);

  const renderTurnstile = useCallback(() => {
    if (!turnstileReady || !siteKey || !window.turnstile || !turnstileContainerRef.current) return;
    if (turnstileWidgetId.current) {
      try {
        window.turnstile.remove(turnstileWidgetId.current);
      } catch {
        /* ignore */
      }
    }
    turnstileContainerRef.current.innerHTML = '';
    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      'error-callback': () => setTurnstileToken(null),
      theme: 'light',
    });
  }, [turnstileReady, siteKey]);

  useEffect(() => {
    renderTurnstile();
  }, [renderTurnstile]);

  const toggleProduct = (prod: string) => {
    setSelectedProducts((prev) =>
      prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = customerName.trim();
    const cleanEmail = customerEmail.trim();
    const cleanPhone = customerPhone.trim();

    if (!cleanName) {
      setError('Please provide your full name.');
      return;
    }
    if (!cleanEmail) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!cleanPhone) {
      setError('Please provide your phone number.');
      return;
    }
    if (!traysCount || traysCount < 1) {
      setError('Please enter a valid number of trays (at least 1).');
      return;
    }

    // Combine selected product tags with any custom notes
    const combinedProductsList = [...selectedProducts];
    if (customProductsText.trim()) {
      combinedProductsList.push(`Special: ${customProductsText.trim()}`);
    }

    if (combinedProductsList.length === 0) {
      setError('Please select or specify at least one microgreen variety you need.');
      return;
    }

    if (siteKey && !turnstileToken) {
      setError('Please complete the verification security check.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/bulk-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone,
          business_name: businessName.trim() || null,
          trays_count: traysCount,
          products: combinedProductsList.join(', '),
          frequency,
          delivery_address: deliveryAddress.trim() || null,
          delivery_pincode: deliveryPincode.trim() || null,
          notes: notes.trim() || null,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit bulk order request. Please try again.');
      } else {
        setTicketNumber(data.ticket_number || 'BOR-RECEIVED');
        setSubmitted(true);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    } catch {
      setError('Network connection error. Please try calling or messaging us on WhatsApp directly.');
    } finally {
      setSubmitting(false);
      setTurnstileToken(null);
      renderTurnstile();
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setTicketNumber('');
    setError(null);
    setTraysCount(10);
    setNotes('');
    setCustomProductsText('');
  };

  return (
    <>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={handleTurnstileScriptReady}
        />
      )}

      <div className="bg-white min-h-screen text-[#151F19] pt-28 sm:pt-36 pb-16">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C3F2D]/10 border border-[#1C3F2D]/20 text-[#1C3F2D] text-xs font-semibold uppercase tracking-wider mb-4">
              <PackageBox className="w-3.5 h-3.5" />
              Commercial &amp; Wholesale Supply
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#122A1F] tracking-tight mb-4">
              Bulk Orders &amp; Farm Trays
            </h1>
            <p className="text-[#151F19]/75 text-sm sm:text-base leading-relaxed">
              Partner with us for restaurants, cafes, hotels, catering events, or high-volume weekly kitchen deliveries.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-[#E4DDC8] shadow-[0_12px_40px_rgba(21,31,25,0.06)] p-6 sm:p-10 mb-12">
            {submitted ? (
              <div className="py-8 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-current" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#122A1F] mb-2">
                  Bulk Order Request Received!
                </h2>
                <div className="inline-block bg-gray-50 border border-[#E4DDC8] rounded-xl px-4 py-2 my-3 font-mono text-sm font-bold text-[#1C3F2D]">
                  Request Reference: {ticketNumber}
                </div>
                <p className="text-sm text-[#151F19]/75 max-w-lg mx-auto mb-6 leading-relaxed">
                  Thank you, <strong className="text-[#122A1F]">{customerName}</strong>! We have received your request for <strong className="text-[#122A1F]">{traysCount} trays</strong>. Our harvest coordinator will review seed-to-cut availability and get back to you with custom pricing and delivery slots.
                </p>

                {/* Summary Card */}
                <div className="bg-gray-50/80 border border-[#E4DDC8] rounded-2xl p-5 max-w-md mx-auto text-left text-xs text-[#151F19]/80 space-y-2 mb-8">
                  <div>
                    <span className="font-semibold text-[#1C3F2D]">Contact:</span> {customerPhone} &middot; {customerEmail}
                  </div>
                  {businessName && (
                    <div>
                      <span className="font-semibold text-[#1C3F2D]">Business:</span> {businessName}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-[#1C3F2D]">Trays:</span> {traysCount} Trays ({frequency})
                  </div>
                  <div>
                    <span className="font-semibold text-[#1C3F2D]">Varieties:</span> {selectedProducts.join(', ')}
                    {customProductsText && ` (${customProductsText})`}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/918427974445?text=${encodeURIComponent(
                      `Hello Wild About Greens, I just submitted a bulk order request #${ticketNumber} for ${traysCount} trays. Would love to discuss pricing & harvest timeline.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20b858] transition-all shadow-sm"
                  >
                    <WhatsApp className="w-4 h-4 fill-white" />
                    Quick Follow-up on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1C3F2D] text-white text-xs font-semibold hover:bg-[#122A1F] transition-all"
                  >
                    Place Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Quantity & Frequency */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#1C3F2D] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#122A1F]">
                      Number of Trays Needed
                    </h2>
                  </div>

                  <p className="text-xs text-[#151F19]/65 mb-3">
                    Choose standard tray volume or type the exact quantity of live/cut trays you require:
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {TRAY_PRESETS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTraysCount(count)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          traysCount === count
                            ? 'bg-[#1C3F2D] text-[#CFFA57] border-[#1C3F2D] shadow-sm'
                            : 'bg-gray-50 text-[#151F19]/80 border-[#E4DDC8] hover:bg-white hover:border-[#1C3F2D]/40'
                        }`}
                      >
                        {count} Trays
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 max-w-xs">
                    <div className="flex items-center border border-[#E4DDC8] rounded-xl overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-[#1C3F2D]/20 focus-within:border-[#1C3F2D]">
                      <button
                        type="button"
                        onClick={() => setTraysCount(Math.max(1, traysCount - 1))}
                        className="px-3.5 py-2.5 text-base font-bold text-[#1C3F2D] hover:bg-[#E4DDC8]/40 transition-colors"
                        aria-label="Decrease tray count"
                      >
                        &minus;
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={traysCount}
                        onChange={(e) => setTraysCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                        className="w-20 text-center font-bold text-sm bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTraysCount(traysCount + 1)}
                        className="px-3.5 py-2.5 text-base font-bold text-[#1C3F2D] hover:bg-[#E4DDC8]/40 transition-colors"
                        aria-label="Increase tray count"
                      >
                        &#43;
                      </button>
                    </div>
                    <span className="text-xs text-[#151F19]/60 font-medium">Custom Quantity</span>
                  </div>
                </div>

                <hr className="border-[#E4DDC8]/60" />

                {/* Section 2: Products & Varieties */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#1C3F2D] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#122A1F]">
                      Products &amp; Varieties Wanted
                    </h2>
                  </div>

                  <p className="text-xs text-[#151F19]/65 mb-3">
                    Select the microgreen varieties you want in this order (click to toggle):
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {productOptions.map((prod) => {
                      const isSelected = selectedProducts.includes(prod);
                      return (
                        <button
                          key={prod}
                          type="button"
                          onClick={() => toggleProduct(prod)}
                          className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-[#1C3F2D] text-white border-[#1C3F2D] shadow-sm'
                              : 'bg-white text-[#151F19]/80 border-[#E4DDC8] hover:border-[#1C3F2D]/40'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#CFFA57]' : 'bg-[#E4DDC8]'}`} />
                          {prod}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label
                      htmlFor="customVarieties"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                    >
                      Specific Varieties or Breakdown Notes (Optional)
                    </label>
                    <textarea
                      id="customVarieties"
                      rows={2}
                      value={customProductsText}
                      onChange={(e) => setCustomProductsText(e.target.value)}
                      placeholder="e.g. 5 Trays Radish, 3 Trays Sunflower, 2 Trays Pea Shoots, or any special culinary cut preference"
                      className="w-full px-4 py-2.5 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                    />
                  </div>
                </div>

                <hr className="border-[#E4DDC8]/60" />

                {/* Section 3: Contact Details */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-[#1C3F2D] text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#122A1F]">
                      Your Contact Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="customerName"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Chef Vikram Sharma"
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="businessName"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Business / Restaurant / Cafe Name <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Nomad Bistro / Hyatt / Personal Catering"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="customerPhone"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 98140XXXXX"
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="customerEmail"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. orders@restaurant.com"
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Frequency pills */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5">
                      Supply Schedule / Frequency
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'one-time', label: 'One-Time Bulk Order' },
                        { id: 'weekly', label: 'Weekly Regular Harvest' },
                        { id: 'bi-weekly', label: 'Bi-Weekly Schedule' },
                        { id: 'monthly', label: 'Monthly Contract' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFrequency(item.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            frequency === item.id
                              ? 'bg-[#1C3F2D] text-white border-[#1C3F2D]'
                              : 'bg-white text-gray-700 border-[#E4DDC8] hover:border-gray-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="deliveryAddress"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Delivery Address / Area <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="deliveryAddress"
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. Delivery address or locality"
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="deliveryPincode"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Pincode
                      </label>
                      <input
                        id="deliveryPincode"
                        type="text"
                        maxLength={6}
                        value={deliveryPincode}
                        onChange={(e) => setDeliveryPincode(e.target.value)}
                        placeholder="e.g. 160019"
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bulkNotes"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                    >
                      Special Chef Requirements / Notes (Optional)
                    </label>
                    <textarea
                      id="bulkNotes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific delivery timing, tray cutting style, packaging preference, or event date..."
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Turnstile Container */}
                {siteKey && (
                  <div className="flex justify-center my-2">
                    <div ref={turnstileContainerRef} />
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-full bg-[#1C3F2D] text-white font-bold text-sm tracking-wide uppercase hover:bg-[#122A1F] active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <PackageBox className="w-4 h-4" />
                        <span>Submit Bulk Order Request</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-[#151F19]/55 mt-2.5">
                    No upfront payment required. Our harvest team will contact you to confirm tray delivery slots and commercial pricing.
                  </p>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* Join Revolution Section at Bottom */}
      <JoinRevolutionSection />
    </>
  );
}
