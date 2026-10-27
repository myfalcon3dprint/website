import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET() {
  const auth = await verifyStaffSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = getSupabaseAdminClient();
    let slides = AdminDataService.getHeroSlides();
    let sections = AdminDataService.getHomepageSections();

    if (supabase) {
      const { data: dbSections } = await supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true });
      if (dbSections && dbSections.length > 0) {
        sections = dbSections.map((s) => ({
          id: s.id,
          sectionKey: s.section_key,
          title: s.title,
          contentDraft: s.content_draft,
          contentPublished: s.content_published,
          isPublished: s.is_published,
          sortOrder: s.sort_order,
          version: s.version,
          publishedAt: s.published_at,
          updatedAt: s.updated_at,
        }));
      }
    }

    return NextResponse.json({
      slides,
      sections,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve homepage data';
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
    const { action } = body;

    // Action A: Add new hero slide
    if (action === 'create_slide') {
      const {
        title,
        headline,
        subheadline,
        category,
        desktopImageUrl,
        mobileImageUrl,
        desktopFocalPoint,
        mobileFocalPoint,
        textAlignment,
        overlayOpacity,
        transitionPreset,
        transitionDurationMs,
        primaryButtonText,
        primaryButtonLink,
        secondaryButtonText,
        secondaryButtonLink,
        accentTag,
        badge,
        displayOrder,
        isActive,
      } = body;
      const newSlide = AdminDataService.addHeroSlide({
        title: title || 'New Hero Slide',
        headline: headline || 'Precision 3D Manufacturing',
        subheadline: subheadline || 'Custom engineered parts and collector prints.',
        category: category || 'Planters & Decor',
        desktopImageUrl: desktopImageUrl || '/products/planter-obsidian-black.jpg',
        mobileImageUrl: mobileImageUrl || '/products/planter-orange-variant.jpg',
        desktopFocalPoint: desktopFocalPoint || 'center center',
        mobileFocalPoint: mobileFocalPoint || 'center center',
        textAlignment: textAlignment || 'left',
        overlayOpacity: typeof overlayOpacity === 'number' ? overlayOpacity : 0.45,
        transitionPreset: transitionPreset || 'crossfade',
        transitionDurationMs: Number(transitionDurationMs) || 500,
        primaryButtonText: primaryButtonText || 'Order Custom Print',
        primaryButtonLink: primaryButtonLink || '/quote',
        secondaryButtonText: secondaryButtonText || 'Explore Catalog',
        secondaryButtonLink: secondaryButtonLink || '/catalog',
        accentTag: accentTag || 'Nashik Studio',
        badge: badge || '',
        displayOrder: Number(displayOrder) || 10,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });

      return NextResponse.json({ success: true, slide: newSlide });
    }

    // Action B: Publish draft section to live storefront
    if (action === 'publish_section') {
      const { sectionId } = body;
      const sections = AdminDataService.getHomepageSections();
      const target = sections.find((s) => s.id === sectionId);
      if (!target) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      const updated = AdminDataService.updateHomepageSection(sectionId, {
        contentPublished: { ...target.contentDraft },
        isPublished: true,
        version: target.version + 1,
        publishedAt: new Date().toISOString(),
      });

      try {
        await recordAuditLog({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'PUBLISH_HOMEPAGE_SECTION',
          entityType: 'system',
          entityId: sectionId,
          newState: updated as unknown as Record<string, unknown>,
          notes: `Published version ${target.version + 1} of section ${target.title} to live storefront`,
        });
      } catch {
        AdminDataService.recordAudit({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'PUBLISH_HOMEPAGE_SECTION',
          entityType: 'system',
          entityId: sectionId,
          newState: updated as unknown as Record<string, unknown>,
          notes: `Published version ${target.version + 1} of section ${target.title} to live storefront`,
        });
      }

      return NextResponse.json({ success: true, section: updated });
    }

    return NextResponse.json({ error: 'Unknown homepage action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to execute homepage action';
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
    const { slideId, slideUpdates, sectionId, sectionUpdates } = body;

    if (slideId && slideUpdates) {
      const updatedSlide = AdminDataService.updateHeroSlide(slideId, slideUpdates);
      return NextResponse.json({ success: true, slide: updatedSlide });
    }

    if (sectionId && sectionUpdates) {
      const updatedSection = AdminDataService.updateHomepageSection(sectionId, sectionUpdates);
      return NextResponse.json({ success: true, section: updatedSection });
    }

    return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update homepage item';
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
    const slideId = searchParams.get('slideId');
    if (!slideId) {
      return NextResponse.json({ error: 'slideId is required' }, { status: 400 });
    }

    AdminDataService.deleteHeroSlide(slideId);
    return NextResponse.json({ success: true, slideId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete slide';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
