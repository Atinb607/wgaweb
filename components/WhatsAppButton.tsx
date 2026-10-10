'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isAdminPath } from '@/lib/adminAuth';
import { WhatsApp } from '@/components/icons';

const DEFAULT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918427974445';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP_NUMBER);

  useEffect(() => {
    fetch('/api/content/homepage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Record<string, string> | null) => {
        if (data?.whatsapp_number) {
          let num = data.whatsapp_number.replace(/\D/g, '');
          if (num.length === 10) num = `91${num}`;
          setWhatsappNumber(num);
        }
      })
      .catch(() => {
        // Fallback to default
      });
  }, []);

  // Do not show floating WhatsApp button on admin panel routes
  if (isAdminPath(pathname)) {
    return null;
  }

  let cleanNumber = whatsappNumber.replace(/\D/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  }

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      <a
        href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(
          'Hello! I would like to inquire about Wild About Greens microgreens.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.65)] hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
      >
        {/* Tooltip on desktop hover */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#122A1F] text-white text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 hidden sm:inline-block border border-white/10">
          Chat on WhatsApp
        </span>
        <WhatsApp className="w-8 h-8 fill-white" />
      </a>
    </div>
  );
}
