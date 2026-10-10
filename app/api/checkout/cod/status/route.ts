import { NextResponse } from 'next/server';
import { isCodEnabled, getCodMaxOrderPaise } from '@/lib/codConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  const enabled = isCodEnabled();
  const maxOrderPaise = getCodMaxOrderPaise();

  return NextResponse.json({
    enabled,
    maxOrderPaise,
  });
}
