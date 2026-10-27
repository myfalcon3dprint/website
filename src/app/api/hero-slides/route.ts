import { NextResponse } from 'next/server';
import { AdminDataService } from '@/lib/adminDataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allSlides = AdminDataService.getHeroSlides();
    const activeSlides = allSlides
      .filter((s) => s.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return NextResponse.json({
      slides: activeSlides,
      count: activeSlides.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve hero slides';
    return NextResponse.json({ error: message, slides: [] }, { status: 500 });
  }
}
