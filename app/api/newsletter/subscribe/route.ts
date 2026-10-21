import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { normalizeEmail, PROMO_BANNER_SOURCES } from '@/lib/coupons';
import { sendNewsletterWelcome } from '@/lib/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROMO_SUCCESS_MESSAGE = "Thanks! We'll email your 15% code soon.";

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 10 requests per IP per 10 minutes ──
    const rateLimited = await checkRateLimit(request, 'newsletter/subscribe', 10, 600);
    if (rateLimited) return rateLimited;

    const sql = getSQL();
    const body = await request.json();
    const { email, source, turnstileToken, website, hp_field, honeypot } = body;

    const safeSource = typeof source === 'string' ? source.slice(0, 100) : null;
    const isPromoBanner = Boolean(
      safeSource &&
        (PROMO_BANNER_SOURCES.has(safeSource) || safeSource.startsWith('health_goal_'))
    );

    // ── Require Turnstile token ──
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Turnstile verification is required.' },
        { status: 400 }
      );
    }

    // ── Verify Turnstile token server-side ──
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'CAPTCHA verification is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const secretToUse =
      process.env.NODE_ENV !== 'production' &&
      (turnstileToken === 'XXXX.DUMMY.TOKEN.XXXX' || turnstileToken === 'dev-token')
        ? '1x0000000000000000000000000000000AA'
        : turnstileSecret;

    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretToUse,
          response: turnstileToken,
        }),
      }
    );

    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 403 }
      );
    }

    // ── Validate email (syntax, length at most 254) ──
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (email.trim().length > 254) {
      return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    }

    // ── Extra rate limit for promo banner branch: 5 requests per IP per 24 hours ──
    if (isPromoBanner) {
      const promoRateLimited = await checkRateLimit(
        request,
        'newsletter/coupon-request',
        5,
        86400
      );
      if (promoRateLimited) return promoRateLimited;
    }

    // ── Anti-bot Honeypot trap ──
    if (website || hp_field || honeypot) {
      // Silently return normal success message without database insertion
      return NextResponse.json({
        message: isPromoBanner ? PROMO_SUCCESS_MESSAGE : 'Thanks for subscribing!',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Insert into newsletter_subscribers with ON CONFLICT to record/update subscriptions.
    await sql`
      INSERT INTO newsletter_subscribers (email, source)
      VALUES (${cleanEmail}, ${safeSource})
      ON CONFLICT (email) DO UPDATE
        SET source = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
            subscribed_at = now()
    `;

    // Send welcome email for non-promo newsletter signups (e.g. footer)
    // Await execution so serverless/Node environment does not terminate before delivery
    if (!isPromoBanner) {
      try {
        await sendNewsletterWelcome(cleanEmail);
      } catch (emailErr) {
        console.error('[newsletter/subscribe] Welcome email delivery error:', emailErr);
      }
    }

    // ── Banner Code Request (Step 4) ──
    if (isPromoBanner) {
      const normEmail = normalizeEmail(cleanEmail);

      await sql`
        INSERT INTO coupon_requests (email, email_normalized, source, status)
        VALUES (${cleanEmail}, ${normEmail}, ${safeSource}, 'new')
        ON CONFLICT (email_normalized) DO NOTHING
      `;

      return NextResponse.json({
        message: PROMO_SUCCESS_MESSAGE,
      });
    }

    return NextResponse.json({
      message: 'Thanks for subscribing!',
    });
  } catch (error: unknown) {
    console.error('newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
