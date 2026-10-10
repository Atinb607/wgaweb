'use client';

import { useEffect, useRef, useState } from 'react';

export default function WhyMicrogreensChart() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (panelRef.current) {
      observer.observe(panelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-[#E4DDC8]"
    >
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
        <h4 className="font-serif text-lg font-semibold text-[#122A1F]">
          Nutrient density over time
        </h4>
        <span className="font-mono text-[10px] tracking-wider uppercase text-[#5C6B60]">
          Broccoli · per 100g
        </span>
      </div>

      <div className="mb-6">
        <svg
          viewBox="0 0 420 200"
          className="w-full h-auto block overflow-visible"
          role="img"
          aria-label="Nutrient density declines from day 10 to day 30"
        >
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1C3F2D" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1C3F2D" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="40" y1="164" x2="400" y2="164" stroke="#CFC7AF" strokeWidth="1" />
          <line
            x1="40"
            y1="20"
            x2="40"
            y2="164"
            stroke="#CFC7AF"
            strokeWidth="1"
            opacity="0.5"
          />

          <path
            d="M60 40 C140 46 200 94 260 124 C310 148 350 156 390 158 L390 164 L60 164 Z"
            fill="url(#cg)"
            className={`transition-opacity duration-1000 delay-1000 ${
              isInView ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <path
            d="M60 40 C140 46 200 94 260 124 C310 148 350 156 390 158"
            fill="none"
            stroke="#1C3F2D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="600"
            style={{
              strokeDashoffset: isInView ? 0 : 600,
              transition: 'stroke-dashoffset 1.8s cubic-bezier(0.2, 1, 0.3, 1) 0.2s',
            }}
          />

          <circle
            cx="60"
            cy="40"
            r="6.5"
            fill="#CFFA57"
            stroke="#1C3F2D"
            strokeWidth="2.5"
            className={`transition-opacity duration-500 delay-[1300ms] ${
              isInView ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <circle
            cx="390"
            cy="158"
            r="6"
            fill="#FFFDF8"
            stroke="#B7AF95"
            strokeWidth="2.5"
            className={`transition-opacity duration-500 delay-[1500ms] ${
              isInView ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <text
            x="60"
            y="26"
            textAnchor="middle"
            className="font-display text-[17px] fill-[#122A1F]"
          >
            PEAK
          </text>
          <text
            x="60"
            y="182"
            textAnchor="middle"
            className="font-mono text-[9px] tracking-wide uppercase fill-[#5C6B60]"
          >
            Day 10 · harvest
          </text>
          <text
            x="384"
            y="146"
            textAnchor="end"
            className="font-display text-[17px] fill-[#A79E86]"
          >
            FADED
          </text>
          <text
            x="390"
            y="182"
            textAnchor="end"
            className="font-mono text-[9px] tracking-wide uppercase fill-[#5C6B60]"
          >
            Day 30 · shelf
          </text>
        </svg>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-[1px] bg-[#E4DDC8] rounded-[14px] overflow-hidden">
        <div className="bg-[#FFFDF8] p-4 text-center">
          <strong className="block font-display text-2xl text-[#1C3F2D] leading-none mb-1">
            10
          </strong>
          <span className="font-mono text-[9px] tracking-wide uppercase text-[#5C6B60] leading-tight block">
            Days from
            <br />
            seed to cut
          </span>
        </div>
        <div className="bg-[#FFFDF8] p-4 text-center">
          <strong className="block font-display text-2xl text-[#1C3F2D] leading-none mb-1">
            0
          </strong>
          <span className="font-mono text-[9px] tracking-wide uppercase text-[#5C6B60] leading-tight block">
            Pesticides
            <br />
            ever used
          </span>
        </div>
        <div className="bg-[#FFFDF8] p-4 text-center">
          <strong className="block font-display text-2xl text-[#1C3F2D] leading-none mb-1">
            40X*
          </strong>
          <span className="font-mono text-[9px] tracking-wide uppercase text-[#5C6B60] leading-tight block">
            Nutrient density
            <br />
            vs mature
          </span>
        </div>
      </div>
    </div>
  );
}
