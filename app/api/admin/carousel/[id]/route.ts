import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { extractPublicIdFromUrl } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinaryServer';
import { revalidateCarousel } from '@/lib/revalidate';

// PUT /api/admin/carousel/[id]: update a slide
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json();
    const { image_url, link_url, display_order, is_active, carousel_key, cloudinary_public_id, alt_text } = body;

    const existing = await sql`SELECT * FROM carousel_slides WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    // If replacing an image, destroy the old Cloudinary asset
    if (image_url && image_url !== existing[0].image_url) {
      const oldPublicId = existing[0].cloudinary_public_id || extractPublicIdFromUrl(existing[0].image_url);
      if (oldPublicId && oldPublicId !== cloudinary_public_id) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (destroyErr) {
          console.error('Failed to destroy old Cloudinary asset on slide update:', destroyErr);
        }
      }
    }

    const result = await sql`
      UPDATE carousel_slides
      SET
        image_url            = COALESCE(${image_url ?? null}, image_url),
        link_url             = COALESCE(${link_url ?? null}, link_url),
        display_order        = COALESCE(${display_order ?? null}, display_order),
        is_active            = COALESCE(${is_active ?? null}, is_active),
        carousel_key         = COALESCE(${carousel_key ?? null}, carousel_key),
        cloudinary_public_id = COALESCE(${cloudinary_public_id ?? null}, cloudinary_public_id),
        alt_text             = CASE WHEN ${alt_text !== undefined} THEN ${alt_text ?? null} ELSE alt_text END
      WHERE id = ${id}
      RETURNING *
    `;

    revalidateCarousel();
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update carousel slide error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/carousel/[id]: delete a slide
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const result = await sql`
      DELETE FROM carousel_slides
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    const deletedSlide = result[0];
    const publicId = deletedSlide.cloudinary_public_id || extractPublicIdFromUrl(deletedSlide.image_url);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error('Failed to destroy Cloudinary asset on carousel slide delete:', cloudErr);
      }
    }

    revalidateCarousel();
    return NextResponse.json({ message: 'Slide deleted' });
  } catch (error: unknown) {
    console.error('admin delete carousel slide error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
