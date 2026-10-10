'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle,
  Shield,
} from '@/components/icons';
import JoinRevolutionSection from '@/components/JoinRevolutionSection';



export default function ContactUsPage() {
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Turnstile state
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanPhone) {
      setError('Please provide your name and phone number.');
      return;
    }
    if (!cleanMessage || cleanMessage.length < 10) {
      setError('Please provide a message with at least 10 characters.');
      return;
    }
    if (siteKey && !turnstileToken) {
      setError('Please complete the verification check.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/inquiries/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: subject === 'b2b' ? `Culinary Partner / ${cleanName}` : `Customer Inquiry (${subject})`,
          contact_name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || null,
          message: `[Topic: ${subject.toUpperCase()}] ${cleanMessage}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send message. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network connection error. Please try calling or emailing us directly.');
    } finally {
      setSubmitting(false);
      setTurnstileToken(null);
      renderTurnstile();
    }
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

      <div className="bg-white min-h-screen text-[#151F19] pt-32 sm:pt-40 pb-20">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#1C3F2D]/5 border border-[#1C3F2D]/15 text-[#1C3F2D] text-xs font-semibold uppercase tracking-wider mb-4">
              We&apos;re Here to Help
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#122A1F] tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-[#151F19]/75 text-sm sm:text-base leading-relaxed">
              Have questions about our microgreens, subscription schedules, or custom orders? Send us a message and our harvest team will respond promptly.
            </p>
          </div>

          {/* Contact Form Card (Styled like Track Order) */}
          <div id="contact-form" className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E4DDC8] shadow-[0_12px_40px_rgba(21,31,25,0.06)] p-6 sm:p-10 mb-8 scroll-mt-28">
            {submitted ? (
              <div className="py-10 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-current" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#122A1F] mb-2">
                  Message Sent!
                </h2>
                <p className="text-sm text-[#151F19]/75 max-w-md mx-auto mb-6 leading-relaxed">
                  Thank you for reaching out. A member of our harvest team will review your inquiry and get back to you within a few business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#1C3F2D] text-white text-xs font-semibold hover:bg-[#122A1F] transition-all shadow-sm cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="contactName"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                    >
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contactName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Your Name"
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contactPhone"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contactPhone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 98XXXXXXXX"
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                      <p className="text-[11px] text-[#151F19]/55 mt-1">For WhatsApp or call updates</p>
                    </div>

                    <div>
                      <label
                        htmlFor="contactEmail"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="contactEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@example.com"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all"
                      />
                      <p className="text-[11px] text-[#151F19]/55 mt-1">For email response (optional)</p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contactSubject"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                    >
                      Inquiry Topic <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contactSubject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all cursor-pointer"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="order">Existing Order Question</option>
                      <option value="subscription">Subscription Delivery Assistance</option>
                      <option value="b2b">Chef / Restaurant Supply Partnership</option>
                      <option value="feedback">Feedback &amp; Suggestions</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contactMessage"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1C3F2D] mb-1.5"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contactMessage"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message or inquiry here..."
                      required
                      className="w-full px-4 py-3 bg-gray-50/50 border border-[#E4DDC8] rounded-xl text-sm text-[#151F19] placeholder:text-[#151F19]/40 focus:bg-white focus:border-[#1C3F2D] focus:ring-2 focus:ring-[#1C3F2D]/15 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Turnstile Container */}
                  {siteKey && (
                    <div className="flex justify-center pt-2">
                      <div ref={turnstileContainerRef} />
                    </div>
                  )}

                  {error && (
                    <div className="p-3.5 bg-red-50/90 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (!!siteKey && !turnstileToken)}
                    className="w-full bg-[#1C3F2D] hover:bg-[#122A1F] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer mt-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-[#E4DDC8]/60 text-center">
                  <p className="text-xs text-[#151F19]/55 inline-flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    <span>We typically respond within 4–6 business hours. Your information is kept strictly confidential.</span>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Direct Support Channels */}
          <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-[#E4DDC8] p-5 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1C3F2D]/10 flex items-center justify-center text-[#1C3F2D] shrink-0">
                <Phone className="w-5 h-5 text-current" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#1C3F2D]">Phone &amp; WhatsApp</span>
                <a href="tel:+918427974445" className="text-sm font-bold text-[#122A1F] hover:underline font-mono">
                  +91 84279 74445
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4DDC8] p-5 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1C3F2D]/10 flex items-center justify-center text-[#1C3F2D] shrink-0">
                <Mail className="w-5 h-5 text-current" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#1C3F2D]">Email Support</span>
                <a href="mailto:wildaboutgreens@gmail.com" className="text-sm font-semibold text-[#122A1F] hover:underline">
                  wildaboutgreens@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Self-Service Shortcuts */}
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/track-order"
              className="flex-1 flex items-center justify-between text-xs font-semibold text-[#122A1F] hover:text-[#1C3F2D] bg-white px-4 py-3 rounded-2xl border border-[#E4DDC8] shadow-sm transition-colors"
            >
              <span>Track Your Live Order</span>
              <span>→</span>
            </Link>
            <Link
              href="/shipping-and-returns"
              className="flex-1 flex items-center justify-between text-xs font-semibold text-[#122A1F] hover:text-[#1C3F2D] bg-white px-4 py-3 rounded-2xl border border-[#E4DDC8] shadow-sm transition-colors"
            >
              <span>Shipping &amp; Returns Policy</span>
              <span>→</span>
            </Link>
          </div>
        </main>
      </div>

      <JoinRevolutionSection />
    </>
  );
}
