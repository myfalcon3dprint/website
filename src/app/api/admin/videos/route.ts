import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET() {
  const auth = await verifyStaffSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const videos = AdminDataService.getProductVideos();
    return NextResponse.json({ videos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve videos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { title, caption, videoUrl, thumbnailUrl, durationSeconds, aspectRatio, linkedProductIds } = body;

    if (!title || !videoUrl) {
      return NextResponse.json({ error: 'Title and video URL are required' }, { status: 400 });
    }

    const newVideo = AdminDataService.addProductVideo({
      title,
      caption: caption || '',
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      durationSeconds: durationSeconds || 30,
      aspectRatio: aspectRatio || '9:16',
      linkedProductIds: linkedProductIds || [],
      displayOrder: 10,
      isActive: true,
    });

    return NextResponse.json({ success: true, video: newVideo });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, updates } = body;
    if (!id || !updates) {
      return NextResponse.json({ error: 'Video ID and updates are required' }, { status: 400 });
    }

    const updated = AdminDataService.updateProductVideo(id, updates);
    return NextResponse.json({ success: true, video: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    AdminDataService.deleteProductVideo(id);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
