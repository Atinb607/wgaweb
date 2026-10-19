import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCategoriesWithCounts,
  updateCategoriesOrderAndVisibility,
  addCategory,
  deleteCategory,
} from '@/lib/categoryServer';
import { revalidateProducts } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/categories
 * Returns all categories with active product counts and display order.
 */
export async function GET() {
  try {
    const categories = await getAllCategoriesWithCounts();
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error: unknown) {
    console.error('admin get categories error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/categories
 * Batch updates category display order and visibility.
 * Body: { categories: Array<{ name: string; display_order: number; is_active: boolean }> }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.categories)) {
      return NextResponse.json(
        { error: 'Invalid request body. "categories" array is required.' },
        { status: 400 }
      );
    }

    const updates = body.categories.map((c: { name: string; display_order?: number; is_active?: boolean }) => ({
      name: String(c.name).trim().toLowerCase(),
      display_order: typeof c.display_order === 'number' ? c.display_order : 0,
      is_active: Boolean(c.is_active),
    }));

    await updateCategoriesOrderAndVisibility(updates);
    const refreshed = await getAllCategoriesWithCounts();
    revalidateProducts();

    return NextResponse.json({
      success: true,
      categories: refreshed,
      message: 'Category order and visibility updated successfully.',
    });
  } catch (error: unknown) {
    console.error('admin put categories error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/categories
 * Creates or activates a category.
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawName = body?.name;
    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const created = await addCategory(rawName);
    const refreshed = await getAllCategoriesWithCounts();
    revalidateProducts();

    return NextResponse.json({
      success: true,
      category: created,
      categories: refreshed,
      message: `Category "${created.name}" created successfully.`,
    });
  } catch (error: unknown) {
    console.error('admin post categories error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/categories
 * Deletes a category configuration.
 * Body: { name: string } or ?name=...
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let name = searchParams.get('name');

    if (!name) {
      try {
        const body = await request.json();
        name = body?.name;
      } catch {
        // no body
      }
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required to delete' }, { status: 400 });
    }

    await deleteCategory(name.trim().toLowerCase());
    const refreshed = await getAllCategoriesWithCounts();
    revalidateProducts();

    return NextResponse.json({
      success: true,
      categories: refreshed,
      message: `Category "${name}" removed.`,
    });
  } catch (error: unknown) {
    console.error('admin delete category error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
