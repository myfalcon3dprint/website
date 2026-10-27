import { NextResponse } from 'next/server';
import { AdminDataService } from '@/lib/adminDataStore';
import { INITIAL_PRODUCT_VIDEOS } from '@/lib/mock-data';

export async function GET() {
  try {
    const videos = AdminDataService.getProductVideos().filter((v) => v.isActive);
    if (videos && videos.length > 0) {
      return NextResponse.json({ videos });
    }
    return NextResponse.json({ videos: INITIAL_PRODUCT_VIDEOS.filter((v) => v.isActive) });
  } catch (err: unknown) {
    console.error('Failed to retrieve product videos:', err);
    return NextResponse.json({ videos: INITIAL_PRODUCT_VIDEOS.filter((v) => v.isActive) });
  }
}
