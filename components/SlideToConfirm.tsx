'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock } from './icons';

interface SlideToConfirmProps {
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
  disabledText?: string;
  idleText?: string;
  successText?: string;
  resetTrigger?: number | string;
}

export function SlideToConfirm({
  onConfirm,
  disabled = false,
  loading = false,
  disabledText = 'Type answer above to unlock slider',
  idleText = 'Slide to confirm COD order →',
  successText = 'Placing Order...',
  resetTrigger,
}: SlideToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbPos, setThumbPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  const triggeredRef = useRef(false);

  // Reset when resetTrigger changes or if loading turns off without confirmation
  useEffect(() => {
    triggeredRef.current = false;
    setThumbPos(0);
    setIsDragging(false);
    setConfirmed(false);
  }, [resetTrigger]);

  const updateMaxDrag = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const thumbWidth = 52; // 52px thumb width
      maxDragRef.current = Math.max(0, containerWidth - thumbWidth - 8); // 4px padding each side
    }
  }, []);

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, [updateMaxDrag]);

  const handleDragStart = (clientX: number) => {
    if (disabled || loading || confirmed || triggeredRef.current) return;
    updateMaxDrag();
    setIsDragging(true);
    startXRef.current = clientX - thumbPos;
  };

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || disabled || loading || confirmed || triggeredRef.current) return;
      const newPos = Math.max(0, Math.min(clientX - startXRef.current, maxDragRef.current));
      setThumbPos(newPos);

      // Trigger confirm if dragged past 88%
      if (maxDragRef.current > 0 && newPos >= maxDragRef.current * 0.88) {
        triggeredRef.current = true;
        setIsDragging(false);
        setThumbPos(maxDragRef.current);
        setConfirmed(true);
        onConfirm();
      }
    },
    [isDragging, disabled, loading, confirmed, onConfirm]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // If not confirmed, spring back to start
    if (!confirmed && !triggeredRef.current) {
      setThumbPos(0);
    }
  }, [isDragging, confirmed]);

  // Global mouse / touch listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };
    const onMouseUp = () => {
      handleDragEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading || confirmed || triggeredRef.current) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggeredRef.current = true;
      setThumbPos(maxDragRef.current);
      setConfirmed(true);
      onConfirm();
    }
  };

  const dragPercent = maxDragRef.current > 0 ? (thumbPos / maxDragRef.current) * 100 : 0;

  return (
    <div className="w-full select-none">
      <div
        ref={containerRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(dragPercent)}
        aria-label="Slide to confirm Cash on Delivery order"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={`relative h-14 rounded-full overflow-hidden p-1 flex items-center transition-all outline-none ${
          disabled
            ? 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-75'
            : confirmed || loading
            ? 'bg-[#1C3F2D] border border-[#122A1F] cursor-wait'
            : 'bg-gray-100 border-2 border-[#1C3F2D]/20 focus:border-[#1C3F2D] shadow-inner cursor-pointer'
        }`}
      >
        {/* Dynamic green fill bar expanding behind the thumb */}
        <div
          className={`absolute left-0 top-0 bottom-0 bg-[#1C3F2D] transition-all ${
            isDragging ? 'duration-0' : 'duration-300'
          }`}
          style={{
            width: `${Math.min(100, dragPercent + 12)}%`,
            opacity: disabled ? 0 : 0.88,
          }}
        />

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14 text-center">
          <span
            className={`text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 ${
              disabled
                ? 'text-gray-500 flex items-center gap-1.5'
                : confirmed || loading
                ? 'text-white flex items-center gap-2 font-bold animate-pulse'
                : dragPercent > 45
                ? 'text-white font-bold'
                : 'text-[#1C3F2D] font-bold'
            }`}
          >
            {disabled && <Lock className="w-3.5 h-3.5 inline-block mr-1 text-gray-500" />}
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{successText}</span>
              </>
            ) : confirmed ? (
              <span>✓ Verified &amp; Placing Order...</span>
            ) : disabled ? (
              disabledText
            ) : (
              idleText
            )}
          </span>
        </div>

        {/* Draggable thumb / handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            handleDragStart(e.clientX);
          }}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleDragStart(e.touches[0].clientX);
            }
          }}
          className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform ${
            isDragging ? 'duration-0 scale-105' : 'duration-300'
          } ${
            disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : confirmed || loading
              ? 'bg-[#CFFA57] text-[#122A1F] cursor-wait ring-2 ring-white'
              : 'bg-white text-[#1C3F2D] hover:bg-gray-50 active:scale-95 cursor-grab active:cursor-grabbing border border-gray-200 ring-2 ring-[#1C3F2D]/10'
          }`}
          style={{
            transform: `translateX(${thumbPos}px)`,
          }}
        >
          {loading || confirmed ? (
            <span className="text-base font-bold">✓</span>
          ) : disabled ? (
            <Lock className="w-4 h-4 text-gray-500" />
          ) : (
            <svg
              className="w-5 h-5 text-[#1C3F2D] animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          )}
        </div>
      </div>

      {/* Accessible hint under slider */}
      {!disabled && !loading && !confirmed && (
        <p className="text-[11px] text-center text-[#5C6B60] mt-1.5 font-medium">
          Drag the circle all the way to the right or press Enter to confirm
        </p>
      )}
    </div>
  );
}
