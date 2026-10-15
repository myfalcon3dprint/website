import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { isR2Configured, getR2UploadPresignedUrl, R2_MEDIA_BUCKET } from '@/lib/cloudflare/r2';

function validateImageMagicBytes(buffer: Buffer): { valid: boolean; detectedType?: string } {
  if (buffer.length < 4) return { valid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, detectedType: 'image/png' };
  }

  // WebP: RIFF .... WEBP
  if (buffer.length >= 12) {
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    if (isRiff && isWebp) {
      return { valid: true, detectedType: 'image/webp' };
    }
  }

  // GIF: GIF87a or GIF89a
  if (buffer.length >= 6) {
    const gifHeader = buffer.toString('ascii', 0, 6);
    if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
      return { valid: true, detectedType: 'image/gif' };
    }
  }

  // SVG: text containing <svg
  const textPrefix = buffer.slice(0, 512).toString('utf8').trim().toLowerCase();
  if (textPrefix.includes('<svg') || (textPrefix.includes('<?xml') && textPrefix.includes('<svg'))) {
    return { valid: true, detectedType: 'image/svg+xml' };
  }

  return { valid: false };
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No media file provided' }, { status: 400 });
    }

    const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit. Please upload a compressed or optimized image.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Strict Image Binary Magic Byte Validation
    const magicCheck = validateImageMagicBytes(buffer);
    if (!magicCheck.valid) {
      return NextResponse.json(
        { error: 'File content does not match genuine image binary signature (JPEG, PNG, WebP, GIF, or SVG).' },
        { status: 400 }
      );
    }

    const detectedMime = magicCheck.detectedType || file.type || 'image/jpeg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const storageKey = `${category}/${timestamp}_${cleanFileName}`;

    // 1. Cloudflare R2: If genuine non-URL credentials are configured
    if (isR2Configured()) {
      const presignedUrl = await getR2UploadPresignedUrl({
        bucket: R2_MEDIA_BUCKET,
        key: storageKey,
        contentType: detectedMime,
      });

      if (presignedUrl) {
        return NextResponse.json({
          success: true,
          storageProvider: 'cloudflare_r2',
          storageKey: `r2://${storageKey}`,
          uploadUrl: presignedUrl,
          publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://media.falcon3dprints.com'}/${storageKey}`,
        });
      }
    }

    // 2. Supabase Storage: Use provisioned public bucket 'product-images'
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const bucketName = process.env.SUPABASE_MEDIA_BUCKET || 'product-images';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storageKey, buffer, {
          contentType: detectedMime,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storageKey);

        await recordAuditLog({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'MEDIA_UPLOAD',
          entityType: 'media',
          entityId: storageKey,
          newState: { path: data.path, sizeBytes: file.size, mimeType: detectedMime },
          notes: `Uploaded media asset '${cleanFileName}' (${(file.size / 1024).toFixed(1)} KB)`,
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
        });

        return NextResponse.json({
          success: true,
          storageProvider: 'supabase_storage',
          storageKey: data.path,
          publicUrl: publicUrlData.publicUrl,
        });
      }

      console.error('Persistent Supabase Storage upload error:', error);
    }

    // 3. Explicit Development Mode Local Disk Fallback
    const isExplicitDevFallback =
      process.env.NODE_ENV === 'development' &&
      process.env.ALLOW_LOCAL_STORAGE_FALLBACK === 'true';

    if (isExplicitDevFallback) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadDir, `${timestamp}_${cleanFileName}`), buffer);

        return NextResponse.json({
          success: true,
          storageProvider: 'local_disk_dev',
          storageKey: `local://${timestamp}_${cleanFileName}`,
          publicUrl: `/uploads/${timestamp}_${cleanFileName}`,
          warning: 'Asset saved to local disk for development only. Not persisted to cloud storage.',
        });
      } catch (fsErr) {
        console.error('Local disk write error:', fsErr);
      }
    }

    // 4. Fail closed when persistent cloud storage is unavailable
    return NextResponse.json(
      { error: 'Persistent object storage unavailable. Media was not saved to durable cloud storage.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    console.error('Media upload error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process media upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
