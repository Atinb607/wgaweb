import { NextRequest, NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';
import { extractPublicIdFromUrl } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinaryServer';
import { revalidateProducts } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;
    const body = await request.json();

    const { display_order, image_url, cloudinary_public_id, alt_text } = body;

    const existing = await sql`SELECT * FROM product_images WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // If replacing an image, destroy the old Cloudinary asset
    if (image_url && image_url !== existing[0].image_url) {
      const oldPublicId = existing[0].cloudinary_public_id || extractPublicIdFromUrl(existing[0].image_url);
      if (oldPublicId && oldPublicId !== cloudinary_public_id) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (destroyErr) {
          console.error('Failed to destroy old Cloudinary asset on image update:', destroyErr);
        }
      }
    }

    const result = await sql`
      UPDATE product_images
      SET
        display_order = COALESCE(${typeof display_order === 'number' ? display_order : null}, display_order),
        image_url = COALESCE(${image_url ?? null}, image_url),
        cloudinary_public_id = COALESCE(${cloudinary_public_id ?? null}, cloudinary_public_id),
        alt_text = CASE WHEN ${alt_text !== undefined} THEN ${alt_text ?? null} ELSE alt_text END
      WHERE id = ${id}
      RETURNING *
    `;

    revalidateProducts();
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('admin update image error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSQL();
    const { id } = params;

    const result = await sql`
      DELETE FROM product_images
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const deletedImage = result[0];
    const publicId = deletedImage.cloudinary_public_id || extractPublicIdFromUrl(deletedImage.image_url);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error('Failed to destroy Cloudinary asset on product image delete:', cloudErr);
      }
    }

    revalidateProducts();
    return NextResponse.json({ message: 'Image deleted', image: deletedImage });
  } catch (error: unknown) {
    console.error('admin delete image error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}