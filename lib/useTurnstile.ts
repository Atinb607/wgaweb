'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'invisible' | 'normal' | 'compact' | 'flexible';
          execution?: 'render' | 'execute';
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (container?: string | HTMLElement | null, options?: unknown) => void;
    };
  }
}

export interface TurnstileOptions {
  size?: 'invisible' | 'normal' | 'compact' | 'flexible';
  theme?: 'light' | 'dark' | 'auto';
  execution?: 'render' | 'execute';
}

let turnstileScriptPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve) => {
    const existing = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => resolve(), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

/**
 * Displays a clean, focused verification popup modal with Cloudflare Turnstile.
 * Automatically pops up when verification is pending or required so users never have to leave the page.
 * Resolves with the acquired token or null if dismissed.
 */
export function showTurnstileModal(
  siteKey: string,
  options: {
    title?: string;
    subtitle?: string;
  } = {}
): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    // Clean up any existing modal instance
    const existing = document.getElementById('wag-turnstile-modal-root');
    if (existing) {
      existing.remove();
    }

    const {
      title = 'Security Verification',
      subtitle = 'Please verify that you are human below so we can complete your request.',
    } = options;

    let widgetId: string | null = null;
    let resolved = false;

    // Inject modal styles once
    if (!document.getElementById('wag-turnstile-modal-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'wag-turnstile-modal-styles';
      styleTag.textContent = `
        @keyframes wagTurnstileFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wagTurnstileScaleUp {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      document.head.appendChild(styleTag);
    }

    const overlay = document.createElement('div');
    overlay.id = 'wag-turnstile-modal-root';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '16px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
    overlay.style.backdropFilter = 'blur(4px)';
    // @ts-expect-error - vendor prefix
    overlay.style.webkitBackdropFilter = 'blur(4px)';
    overlay.style.animation = 'wagTurnstileFadeIn 0.2s ease-out forwards';

    const card = document.createElement('div');
    card.style.backgroundColor = '#FFFFFF';
    card.style.borderRadius = '24px';
    card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.06)';
    card.style.width = '100%';
    card.style.maxWidth = '380px';
    card.style.padding = '28px 22px 20px 22px';
    card.style.textAlign = 'center';
    card.style.position = 'relative';
    card.style.boxSizing = 'border-box';
    card.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    card.style.animation = 'wagTurnstileScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* ignore */
        }
        widgetId = null;
      }
      overlay.style.transition = 'opacity 0.15s ease-out';
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 150);
    };

    const handleSuccess = (token: string) => {
      statusEl.innerHTML = `
        <div style="display:inline-flex;align-items:center;gap:6px;color:#15803d;font-weight:700;font-size:13px;">
          <svg style="width:18px;height:18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Verified! Proceeding...</span>
        </div>
      `;
      setTimeout(() => {
        cleanup();
        resolve(token);
      }, 350);
    };

    const handleDismiss = () => {
      cleanup();
      resolve(null);
    };

    // Close Button (X)
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close verification');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '14px';
    closeBtn.style.right = '14px';
    closeBtn.style.width = '32px';
    closeBtn.style.height = '32px';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.border = 'none';
    closeBtn.style.backgroundColor = '#F3F4F6';
    closeBtn.style.color = '#4B5563';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.lineHeight = '1';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = handleDismiss;

    // Green Shield Icon
    const iconCircle = document.createElement('div');
    iconCircle.style.width = '52px';
    iconCircle.style.height = '52px';
    iconCircle.style.borderRadius = '50%';
    iconCircle.style.backgroundColor = '#ECFDF5';
    iconCircle.style.color = '#065F46';
    iconCircle.style.display = 'flex';
    iconCircle.style.alignItems = 'center';
    iconCircle.style.justifyContent = 'center';
    iconCircle.style.margin = '0 auto 14px auto';
    iconCircle.innerHTML = `
      <svg style="width:28px;height:28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    `;

    // Title
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.fontSize = '18px';
    titleEl.style.fontWeight = '700';
    titleEl.style.color = '#111827';
    titleEl.style.margin = '0 0 6px 0';

    // Subtitle
    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = subtitle;
    subtitleEl.style.fontSize = '13px';
    subtitleEl.style.lineHeight = '1.45';
    subtitleEl.style.color = '#4B5563';
    subtitleEl.style.margin = '0 0 16px 0';

    // Slot for Turnstile widget
    const slot = document.createElement('div');
    slot.id = 'wag-turnstile-modal-slot';
    slot.style.display = 'flex';
    slot.style.justifyContent = 'center';
    slot.style.alignItems = 'center';
    slot.style.minHeight = '70px';
    slot.style.margin = '8px 0';

    // Status message
    const statusEl = document.createElement('div');
    statusEl.style.fontSize = '12px';
    statusEl.style.minHeight = '20px';
    statusEl.style.color = '#6B7280';
    statusEl.style.marginTop = '6px';

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.background = 'none';
    cancelBtn.style.border = 'none';
    cancelBtn.style.color = '#9CA3AF';
    cancelBtn.style.fontSize = '12px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.marginTop = '10px';
    cancelBtn.style.textDecoration = 'underline';
    cancelBtn.onclick = handleDismiss;

    // Assemble Card
    card.appendChild(closeBtn);
    card.appendChild(iconCircle);
    card.appendChild(titleEl);
    card.appendChild(subtitleEl);
    card.appendChild(slot);
    card.appendChild(statusEl);
    card.appendChild(cancelBtn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        handleDismiss();
      }
    });

    // Render Turnstile
    loadTurnstileScript().then(() => {
      if (!window.turnstile || resolved) return;
      try {
        widgetId = window.turnstile.render(slot, {
          sitekey: siteKey,
          size: 'normal',
          theme: 'light',
          callback: (newToken: string) => {
            handleSuccess(newToken);
          },
          'expired-callback': () => {
            statusEl.innerHTML = '<span style="color:#DC2626;font-size:12px;">Verification expired. Please check the box again.</span>';
          },
          'error-callback': () => {
            statusEl.innerHTML = '<span style="color:#DC2626;font-size:12px;">Verification challenge failed. Please retry.</span>';
          },
        });
      } catch (err) {
        console.error('Failed to render Turnstile inside modal:', err);
        statusEl.innerHTML = '<span style="color:#DC2626;font-size:12px;">Unable to load verification widget. Please try again.</span>';
      }
    });
  });
}

export function useTurnstile(options: TurnstileOptions = {}) {
  const { size = 'normal', theme = 'dark', execution = 'render' } = options;
  const [token, setToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const initWidget = useCallback(() => {
    if (!siteKey || typeof window === 'undefined' || !window.turnstile || !containerRef.current) {
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* ignore */
      }
      widgetIdRef.current = null;
    }

    try {
      containerRef.current.innerHTML = '';
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size,
        theme,
        execution,
        callback: (newToken: string) => {
          tokenRef.current = newToken;
          setToken(newToken);
        },
        'expired-callback': () => {
          tokenRef.current = null;
          setToken(null);
        },
        'error-callback': () => {
          tokenRef.current = null;
          setToken(null);
        },
      });
    } catch (e) {
      console.warn('Turnstile initialization error:', e);
    }
  }, [siteKey, size, theme, execution]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!siteKey) return;

    let active = true;
    let observer: IntersectionObserver | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

    const startLoadingAndInit = () => {
      if (!active) return;
      loadTurnstileScript().then(() => {
        if (!active) return;
        const checkAndInit = () => {
          if (!active) return;
          if (window.turnstile && containerRef.current && !widgetIdRef.current) {
            initWidget();
          }
        };

        checkAndInit();

        interval = setInterval(() => {
          if (widgetIdRef.current) {
            if (interval) clearInterval(interval);
            return;
          }
          checkAndInit();
        }, 150);

        safetyTimeout = setTimeout(() => {
          if (interval) clearInterval(interval);
        }, 10000);
      });
    };

    const el = containerRef.current;
    // If container is positioned offscreen (e.g. fixed left -9999px), observe parent element or form
    const triggerTarget = el?.closest('form') || el?.parentElement || el;

    if (triggerTarget) {
      triggerTarget.addEventListener('focusin', startLoadingAndInit, { once: true, passive: true });
      triggerTarget.addEventListener('pointerdown', startLoadingAndInit, { once: true, passive: true });

      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              startLoadingAndInit();
              if (observer && triggerTarget) {
                observer.unobserve(triggerTarget);
              }
            }
          },
          { rootMargin: '300px' }
        );
        observer.observe(triggerTarget);
      } else {
        startLoadingAndInit();
      }
    }

    return () => {
      active = false;
      if (observer) observer.disconnect();
      if (triggerTarget) {
        triggerTarget.removeEventListener('focusin', startLoadingAndInit);
        triggerTarget.removeEventListener('pointerdown', startLoadingAndInit);
      }
      if (interval) clearInterval(interval);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [initWidget, siteKey]);

  /**
   * Acquire a fresh token right before submitting the request to backend.
   * If a token is already generated in the background, returns it instantly.
   * If verification is pending or requires user interaction, pops up the verification modal.
   */
  const getTokenBeforeSubmit = useCallback(async (modalOptions?: { title?: string; subtitle?: string }): Promise<string | null> => {
    if (!siteKey) {
      return process.env.NODE_ENV !== 'production' ? 'dev-token' : null;
    }

    await loadTurnstileScript();

    if (!widgetIdRef.current && containerRef.current && window.turnstile) {
      initWidget();
    }

    const isLocalDev =
      process.env.NODE_ENV !== 'production' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // 1. If background token is already ready, use it immediately
    if (tokenRef.current) {
      const consumed = tokenRef.current;
      tokenRef.current = null;
      setToken(null);
      return consumed;
    }

    // 2. Trigger execution if available
    if (window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.execute(widgetIdRef.current);
      } catch {
        /* ignore */
      }
    }

    // 3. Wait up to 600ms to see if silent invisible verification completes
    const maxWaitMs = 600;
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (tokenRef.current) {
        const consumed = tokenRef.current;
        tokenRef.current = null;
        setToken(null);
        return consumed;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    // 4. If token is still missing/pending, pop up the Turnstile verification modal right here!
    const modalToken = await showTurnstileModal(siteKey, modalOptions);
    if (modalToken) {
      tokenRef.current = null;
      setToken(null);
      return modalToken;
    }

    if (isLocalDev) {
      return 'dev-token';
    }

    return null;
  }, [siteKey, initWidget]);

  const reset = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        initWidget();
      }
    }
  }, [initWidget]);

  return {
    containerRef,
    token,
    isVerified: !!token,
    getTokenBeforeSubmit,
    reset,
    siteKey,
  };
}

export function useInvisibleTurnstile() {
  return useTurnstile({ size: 'invisible' });
}

export function useMinimalTurnstile(options?: { theme?: 'light' | 'dark' | 'auto' }) {
  return useTurnstile({ size: 'normal', theme: options?.theme ?? 'dark' });
}
