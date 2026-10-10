'use client';

import { useState, useEffect } from 'react';

export default function StoryModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
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
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary-mockup hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg"
      >
        The Short Story of Why We Exist
      </button>

      {/* Modal Backdrop & Container */}
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 pointer-events-auto bg-[#122A1F]/60 backdrop-blur-sm'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}
      >
        <div
          className={`bg-[#FFFDF8] max-w-[940px] w-full max-h-[88vh] overflow-y-auto rounded-[26px] p-6 sm:p-12 relative shadow-2xl transition-transform duration-400 ease-out text-left ${
            isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-6'
          }`}
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-[#CFFA57] flex items-center justify-center text-base transition-colors duration-200 z-10"
            aria-label="Close dialog"
          >
            ✕
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 lg:gap-10 items-start md:items-center">
            {/* Title column */}
            <div className="w-fit flex flex-col justify-center md:self-center">
              <h2 className="font-display uppercase text-4xl sm:text-5xl lg:text-6xl text-[#151F19] leading-[1.05] tracking-tight">
                Short<br />
                Story<br />
                of Why<br />
                <span className="underline decoration-[#B7E23F] decoration-[5px] underline-offset-4">
                  We Exist
                </span>
              </h2>
            </div>

            {/* Story text columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 text-[#3B4A40] font-serif text-[14.5px] leading-[1.65] text-left">
              <div className="space-y-4">
                <p>
                  When you buy a head of broccoli or a bunch of spinach from your local vendor or a
                  quick-delivery app, you feel good about making a healthy choice. We did too.
                </p>
                <p>
                  But then we looked closer. We looked at the heavy{' '}
                  <u className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-semibold text-[#122A1F]">
                    pesticide residue
                  </u>
                  . We looked at the fields irrigated with industrial runoff water. We looked at the long
                  supply chains where greens sit in hot trucks for days, bleeding vitamins every single
                  hour until they become mostly just fiber and water.
                </p>
                <p>
                  We realized that to get actual, dense nutrition in our modern urban lives, we didn&apos;t
                  need bigger farms. We needed{' '}
                  <u className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-semibold text-[#122A1F]">
                    smarter ones
                  </u>
                  .
                </p>
              </div>

              <div className="space-y-4">
                <p>
                  So we started a micro-enterprise right here in our city. Vertical indoor racks where we
                  control everything. No soil, no pests, no chemicals. Pure mineral RO water under
                  pristine LED lights.
                </p>
                <p>
                  The result? Microgreens. Baby plants harvested at{' '}
                  <u className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-semibold text-[#122A1F]">
                    day 10
                  </u>
                  , right when their nutrient density is at its peak.
                </p>
                <p>
                  We aren&apos;t selling a fancy culinary garnish for luxury restaurants. We are selling
                  a{' '}
                  <u className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-semibold text-[#122A1F]">
                    nutritional insurance policy
                  </u>{' '}
                  for your family. No marketing gimmicks, no pseudo-science. Just the bare, honest truth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
