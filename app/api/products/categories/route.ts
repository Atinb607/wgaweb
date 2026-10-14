import { NextResponse } from 'next/server';
import { getOrderedActiveCategories } from '@/lib/categoryServer';

export const dynamic = 'force-dynamic';

// GET /api/products/categories: returns active categories in admin-configured display order
export async function GET() {
  try {
    const categories = await getOrderedActiveCategories();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error('categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
