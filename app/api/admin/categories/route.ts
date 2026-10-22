import { NextRequest } from 'next/server';
import {
  getAllCategoriesWithCounts,
  updateCategoriesOrderAndVisibility,
  addCategory,
  deleteCategory,
} from '@/lib/categoryServer';
import { revalidateProducts } from '@/lib/revalidate';
import { adminJsonResponse } from '@/lib/adminResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/categories
 * Returns all categories with active product counts and display order.
 */
export async function GET() {
  try {
    const categories = await getAllCategoriesWithCounts();
    return adminJsonResponse(categories);
  } catch (error: unknown) {
    console.error('admin get categories error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    return adminJsonResponse({ error: message }, { status: 500 });
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
      return adminJsonResponse(
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

    return adminJsonResponse({
      success: true,
      categories: refreshed,
      message: 'Category order and visibility updated successfully.',
    });
  } catch (error: unknown) {
    console.error('admin put categories error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update categories';
    return adminJsonResponse({ error: message }, { status: 500 });
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
      return adminJsonResponse({ error: 'Category name is required' }, { status: 400 });
    }

    const created = await addCategory(rawName);
    const refreshed = await getAllCategoriesWithCounts();
    revalidateProducts();

    return adminJsonResponse({
      success: true,
      category: created,
      categories: refreshed,
      message: `Category "${created.name}" created successfully.`,
    });
  } catch (error: unknown) {
    console.error('admin post categories error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/categories
 * Deletes a category configuration.
 * Body: { name: string } or ?name=...
 */
export async function DELETE(request: NextRequest) {
  try {
    let name: string | null = null;

    // Check query params
    const queryName = request.nextUrl.searchParams.get('name');
    if (queryName && queryName.trim()) {
      name = queryName.trim();
    } else {
      // Check body
      try {
        const body = await request.json();
        if (body?.name && typeof body.name === 'string' && body.name.trim()) {
          name = body.name.trim();
        }
      } catch {
        // No body provided, ignore
      }
    }

    if (!name) {
      return adminJsonResponse({ error: 'Category name is required' }, { status: 400 });
    }

    await deleteCategory(name);
    const refreshed = await getAllCategoriesWithCounts();
    revalidateProducts();

    return adminJsonResponse({
      success: true,
      categories: refreshed,
      message: `Category "${name}" removed from settings.`,
    });
  } catch (error: unknown) {
    console.error('admin delete category error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return adminJsonResponse({ error: message }, { status: 500 });
  }
}
