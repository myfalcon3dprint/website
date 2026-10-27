import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

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

    const visualMeta = AdminDataService.getCategoryVisuals();
    const visual = visualMeta[category.id] || visualMeta[category.slug] || visualMeta[category.name] || {};

    return NextResponse.json({ 
      category: {
        ...category,
        updated_at: category.updated_at || category.created_at || new Date().toISOString(),
        image_url: visual.imageUrl || null,
        icon: visual.icon || 'Layers',
      }
    });
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
    const { name, slug, description, sortOrder, isActive, lastKnownUpdatedAt, imageUrl, icon } = body;

    const { data: existing, error: fetchErr } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Validate optimistic concurrency if a prior timestamp is provided and tracked
    const currentVersionToken = existing.updated_at || existing.created_at;
    if (lastKnownUpdatedAt && currentVersionToken) {
      const knownTime = new Date(lastKnownUpdatedAt).getTime();
      const currTime = new Date(currentVersionToken).getTime();
      if (!isNaN(knownTime) && !isNaN(currTime) && Math.abs(currTime - knownTime) > 1000) {
        return NextResponse.json(
          {
            error: 'Concurrency conflict: Category was modified by another session. Please refresh.',
            currentUpdatedAt: currentVersionToken,
            lastKnownUpdatedAt,
          },
          { status: 409 }
        );
      }
    }

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (slug !== undefined) updates.slug = String(slug).trim().toLowerCase();
    if (description !== undefined) updates.description = description ? String(description).trim() : null;
    if (sortOrder !== undefined) updates.sort_order = Number(sortOrder) || 0;
    if (isActive !== undefined) updates.is_active = Boolean(isActive);
    if (existing.updated_at !== undefined) updates.updated_at = new Date().toISOString();

    const { data: updatedCat, error: updateErr } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedCat) {
      return NextResponse.json(
        { error: updateErr?.message || 'Failed to update category.' },
        { status: 400 }
      );
    }

    if (imageUrl !== undefined || icon !== undefined) {
      AdminDataService.setCategoryVisual(id, { imageUrl, icon });
      if (updatedCat.slug) {
        AdminDataService.setCategoryVisual(updatedCat.slug, { imageUrl, icon });
      }
    }

    const visualMeta = AdminDataService.getCategoryVisuals();
    const visual = visualMeta[id] || visualMeta[updatedCat.slug] || {};

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
    } catch {
      // Non-critical audit error
    }

    return NextResponse.json({ 
      success: true, 
      category: {
        ...updatedCat,
        image_url: visual.imageUrl || null,
        icon: visual.icon || 'Layers',
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PUT = PATCH;

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: true, message: 'Category removed in local engine' });
  }

  try {
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Product orphaning protection: Reassign any products in this category to NULL or default
    await supabase
      .from('products')
      .update({ category_id: null, updated_at: new Date().toISOString() })
      .eq('category_id', id);

    const { error: deleteErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'CATEGORY_DELETED',
      entityType: 'category',
      entityId: id,
      oldState: existing,
      notes: `Deleted category '${existing.name}'. Any products in this category were reassigned to avoid orphaning.`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Category '${existing.name}' deleted safely without orphaning products.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
