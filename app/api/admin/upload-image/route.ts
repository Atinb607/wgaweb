import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinaryServer';
import type { UploadApiOptions } from 'cloudinary';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB Netlify payload safety limit

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string | null)?.trim() || 'wga-products';
    const publicId = (formData.get('publicId') as string | null)?.trim() || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (image or video) by mime type or file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv', 'avi'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'];

    const isVideo = file.type.startsWith('video/') || videoExtensions.includes(ext);
    const isImage = file.type.startsWith('image/') || imageExtensions.includes(ext);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'File must be an image or video' },
        { status: 400 }
      );
    }

    // Enforce payload size limit
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `File is too large (${sizeMB} MB). Maximum allowed upload size is 4.5 MB.`,
        },
        { status: 413 }
      );
    }

    // Resolve mime type for base64 data URI
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (isVideo) {
        mimeType =
          ext === 'webm'
            ? 'video/webm'
            : ext === 'ogg'
            ? 'video/ogg'
            : ext === 'mov'
            ? 'video/quicktime'
            : 'video/mp4';
      } else {
        mimeType =
          ext === 'png'
            ? 'image/png'
            : ext === 'webp'
            ? 'image/webp'
            : ext === 'svg'
            ? 'image/svg+xml'
            : ext === 'gif'
            ? 'image/gif'
            : 'image/jpeg';
      }
    }

    // Convert to base64 data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: isVideo ? 'video' : 'image',
    };

    if (isVideo) {
      uploadOptions.format = 'mp4';
    }

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
      uploadOptions.invalidate = true;
    }

    const result = await cloudinary.uploader.upload(base64, uploadOptions);

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type || (isVideo ? 'video' : 'image'),
    });
  } catch (error: unknown) {
    console.error('upload-image error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
