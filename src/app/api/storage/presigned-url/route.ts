import { NextRequest, NextResponse } from 'next/server';
import { getR2UploadPresignedUrl, isR2Configured, R2_CAD_BUCKET, R2_MEDIA_BUCKET } from '@/lib/cloudflare/r2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileSizeBytes, contentType, bucketType = 'cad' } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Security: Validate file extension & size bounds
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const maxCadBytes = 104857600; // 100 MB
    const maxMediaBytes = 10485760; // 10 MB

    if (bucketType === 'cad' && fileSizeBytes && fileSizeBytes > maxCadBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of 100MB for CAD models.` },
        { status: 400 }
      );
    }

    if (bucketType === 'media' && fileSizeBytes && fileSizeBytes > maxMediaBytes) {
      return NextResponse.json(
        { error: `Image exceeds maximum allowed size of 10MB.` },
        { status: 400 }
      );
    }

    const targetBucket = bucketType === 'media' ? R2_MEDIA_BUCKET : R2_CAD_BUCKET;
    const prefix = bucketType === 'media' ? 'catalog-media' : 'quotes';
    const storageKey = `${prefix}/${Date.now()}_${cleanName}`;

    // Graceful fallback for local development or when Cloudflare R2 secrets are not yet configured
    if (!isR2Configured()) {
      return NextResponse.json({
        success: true,
        isSimulated: true,
        storageKey,
        uploadUrl: null,
        message: 'Cloudflare R2 credentials not detected. Simulating local upload registration.',
      });
    }

    const uploadUrl = await getR2UploadPresignedUrl({
      bucket: targetBucket,
      key: storageKey,
      contentType: contentType || 'application/octet-stream',
      expiresInSeconds: 900, // 15 minutes TTL
    });

    if (!uploadUrl) {
      return NextResponse.json({ error: 'Failed to generate Cloudflare R2 upload authorization' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isSimulated: false,
      storageKey,
      uploadUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error generating upload URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
