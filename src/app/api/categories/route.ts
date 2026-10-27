import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeAll) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const visualMeta = AdminDataService.getCategoryVisuals();
    const enriched = (categories || []).map((cat) => {
      const visual = visualMeta[cat.id] || visualMeta[cat.slug] || visualMeta[cat.name] || {};
      return {
        ...cat,
        updated_at: cat.updated_at || cat.created_at || new Date().toISOString(),
        image_url: visual.imageUrl || null,
        icon: visual.icon || 'Layers',
      };
    });

    return NextResponse.json({ categories: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { name, slug, description, sortOrder, imageUrl, icon } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();

    // Check for existing category by slug or exact name (idempotent creation and safe retries)
    const { data: existingCat } = await supabase
      .from('categories')
      .select('*')
      .or(`slug.eq.${cleanSlug},name.ilike.${name.trim()}`)
      .limit(1)
      .maybeSingle();

    if (existingCat) {
      if (!existingCat.is_active) {
        await supabase.from('categories').update({ is_active: true }).eq('id', existingCat.id);
        existingCat.is_active = true;
      }
      if (imageUrl || icon) {
        AdminDataService.setCategoryVisual(existingCat.id, { imageUrl, icon });
        AdminDataService.setCategoryVisual(existingCat.slug, { imageUrl, icon });
      }
      return NextResponse.json({ 
        success: true, 
        category: {
          ...existingCat,
          image_url: imageUrl || null,
          icon: icon || 'Layers',
        }, 
        isExisting: true 
      }, { status: 200 });
    }

    const { data: newCat, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        sort_order: typeof sortOrder === 'number' ? sortOrder : 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (imageUrl || icon) {
      AdminDataService.setCategoryVisual(newCat.id, { imageUrl, icon });
      AdminDataService.setCategoryVisual(newCat.slug, { imageUrl, icon });
    }

    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'CATEGORY_CREATE',
      entityType: 'category',
      entityId: newCat.id,
      newState: newCat,
      notes: `Created category '${newCat.name}'`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ 
      success: true, 
      category: {
        ...newCat,
        image_url: imageUrl || null,
        icon: icon || 'Layers',
      }
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
