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

    let active = true;

    // Ensure Turnstile script is loaded if not already injected
    if (!window.turnstile && !document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.appendChild(script);
    }

    const checkAndInit = () => {
      if (!active) return;
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        initWidget();
      }
    };

    checkAndInit();

    const interval = setInterval(() => {
      if (widgetIdRef.current) {
        clearInterval(interval);
        return;
      }
      checkAndInit();
    }, 150);

    const safetyTimeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(safetyTimeout);
      if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [initWidget]);

  /**
   * Acquire a fresh token right before submitting the request to backend.
   * If a token is already generated in the background, returns it instantly.
   * Otherwise, attempts to execute/wait up to 3 seconds.
   */
  const getTokenBeforeSubmit = useCallback(async (): Promise<string | null> => {
    if (!siteKey) {
      return process.env.NODE_ENV !== 'production' ? 'dev-token' : null;
    }

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
