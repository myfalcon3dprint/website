import { NextRequest, NextResponse } from 'next/server';
import { AdminDataService } from '@/lib/adminDataStore';
import { verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    if (includeAll) {
      const auth = await verifyStaffSession(['owner', 'catalog_editor', 'order_manager']);
      if (auth.authorized) {
        return NextResponse.json({ announcements: AdminDataService.getAllAnnouncements() });
      }
    }

    const announcements = AdminDataService.getAnnouncements();
    return NextResponse.json({ announcements });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve announcements';
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
    const { text, linkUrl, linkLabel, isActive, displayOrder, startDate, endDate } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Announcement text is required' }, { status: 400 });
    }

    const newAnnouncement = AdminDataService.addAnnouncement({
      text: text.trim(),
      linkUrl: linkUrl ? String(linkUrl).trim() : undefined,
      linkLabel: linkLabel ? String(linkLabel).trim() : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 10,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'ANNOUNCEMENT_CREATE',
        entityType: 'system',
        entityId: newAnnouncement.id,
        newState: newAnnouncement as unknown as Record<string, unknown>,
        notes: `Created announcement: "${newAnnouncement.text.slice(0, 50)}..."`,
      });
    } catch {
      // Non-critical audit fallback
    }

    return NextResponse.json({ success: true, announcement: newAnnouncement }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create announcement';
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
      return NextResponse.json({ error: 'Announcement id and updates are required' }, { status: 400 });
    }

    const updated = AdminDataService.updateAnnouncement(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, announcement: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update announcement';
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
      return NextResponse.json({ error: 'Announcement id is required' }, { status: 400 });
    }

    AdminDataService.deleteAnnouncement(id);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete announcement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
