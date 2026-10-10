import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 3 requests per IP per 10 minutes ──
    const rateLimited = await checkRateLimit(request, 'newsletter/subscribe', 3, 600);
    if (rateLimited) return rateLimited;

    const sql = getSQL();
    const body = await request.json();
    const { email, source, turnstileToken, website, hp_field } = body;

    // ── Anti-bot Honeypot trap ──
    if (website || hp_field) {
      // Silently return success to bot without database insertion
      return NextResponse.json({ message: 'Thanks for subscribing!' });
    }

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

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    }

    const safeSource = typeof source === 'string' ? source.slice(0, 100) : null;

    // Insert with ON CONFLICT to silently handle re-subscriptions.
    // Use RETURNING to detect if this was a new signup (for welcome email).
    // Don't reveal whether the email was already subscribed (privacy).
    const result = await sql`
      INSERT INTO newsletter_subscribers (email, source)
      VALUES (${email.toLowerCase().trim()}, ${safeSource})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    // Send welcome email only for genuinely new signups, fire-and-forget
    if (result.length > 0) {
      // Import at top of file
      const { sendNewsletterWelcome } = await import('@/lib/email');
      sendNewsletterWelcome(email.toLowerCase().trim()).catch(() => {
        // Silently ignore: email failure shouldn't affect the signup response
      });
    }

    // TODO: The design mentions "15% off" for signing up, but there's no
    // coupon/discount system built yet. When a discount code mechanism is
    // implemented (likely a `discount_codes` table + checkout integration),
    // this endpoint should generate and return a unique code, or trigger
    // an email with the code. For now we just capture the email.

    return NextResponse.json({
      message: 'Thanks for subscribing!',
    });
  } catch (error: unknown) {
    console.error('newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
