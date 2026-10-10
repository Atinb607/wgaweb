import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isCodEnabled } from '@/lib/codConfig';
import { generateCodChallenge } from '@/lib/codCaptcha';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ── Rate Limit: 20 per IP per 10 minutes (600s) ──
    const rateLimited = await checkRateLimit(request, 'checkout/cod/challenge', 20, 600);
    if (rateLimited) return rateLimited;

    // Check if COD is enabled and properly configured
    if (!isCodEnabled()) {
      return NextResponse.json(
        { error: 'Cash on delivery is currently disabled.' },
        { status: 403 }
      );
    }

    const challenge = generateCodChallenge();
    return NextResponse.json(challenge);
  } catch (err: unknown) {
    console.error('Error generating COD challenge:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate challenge';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
