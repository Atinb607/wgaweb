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
   * Otherwise, attempts to execute/wait up to 3 seconds.
   */
  const getTokenBeforeSubmit = useCallback(async (): Promise<string | null> => {
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

    if (tokenRef.current) {
      const consumed = tokenRef.current;
      tokenRef.current = null;
      setToken(null);
      return consumed;
    }

    if (window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.execute(widgetIdRef.current);
      } catch {
        /* ignore */
      }
    }

    const maxWaitMs = isLocalDev ? 600 : 3000;
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

    if (process.env.NODE_ENV !== 'production') {
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
