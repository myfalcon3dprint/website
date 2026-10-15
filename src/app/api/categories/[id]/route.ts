import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, sortOrder, isActive, lastKnownUpdatedAt } = body;

    if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: lastKnownUpdatedAt is mandatory for category updates.' },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (new Date(existing.updated_at).getTime() !== new Date(lastKnownUpdatedAt).getTime()) {
      return NextResponse.json(
        {
          error: 'Concurrency conflict: Category was modified by another session. Please refresh.',
          currentUpdatedAt: existing.updated_at,
          lastKnownUpdatedAt,
        },
        { status: 409 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = String(name).trim();
    if (slug !== undefined) updates.slug = String(slug).trim().toLowerCase();
    if (description !== undefined) updates.description = description ? String(description).trim() : null;
    if (sortOrder !== undefined) updates.sort_order = Number(sortOrder) || 0;
    if (isActive !== undefined) updates.is_active = Boolean(isActive);

    const { data: updatedCat, error: updateErr } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('updated_at', existing.updated_at)
      .select()
      .single();

    if (updateErr || !updatedCat) {
      return NextResponse.json(
        { error: 'Failed to update category or concurrency conflict encountered.' },
        { status: 409 }
      );
    }

    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'CATEGORY_UPDATE',
        entityType: 'category',
        entityId: id,
        oldState: existing,
        newState: updatedCat,
        notes: `Updated category '${updatedCat.name}'`,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });
    } catch (auditErr) {
      // Revert if audit fails
      await supabase.from('categories').update(existing).eq('id', id);
      return NextResponse.json(
        { error: 'Audit log write failed. Category update rolled back.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, category: updatedCat });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
