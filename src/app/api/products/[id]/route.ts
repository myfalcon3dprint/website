import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { serializeProductFromDb } from '@/lib/serializers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product: serializeProductFromDb(product) });
}

export async function PUT(request: NextRequest, context: RouteContext) {
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
    const {
      name,
      slug,
      categoryId,
      shortDescription,
      description,
      basePricePaise,
      availability,
      images,
      features,
      specs,
      isPublished,
      lastKnownUpdatedAt,
      expectedVersion,
    } = body;

    // 1. Mandatory Optimistic Concurrency Version Check
    const hasVersion = expectedVersion !== undefined && typeof expectedVersion === 'number' && Number.isInteger(expectedVersion) && expectedVersion >= 1;
    const hasTimestamp = typeof lastKnownUpdatedAt === 'string' && lastKnownUpdatedAt.trim().length > 0;

    if (!hasVersion && !hasTimestamp) {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: expectedVersion (integer) or lastKnownUpdatedAt is mandatory for updating a product.' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = String(name).trim();
    if (slug !== undefined) updates.slug = String(slug).trim();
    if (categoryId !== undefined) updates.category_id = categoryId || null;
    if (shortDescription !== undefined) updates.short_description = String(shortDescription).trim();
    if (description !== undefined) updates.description = String(description).trim();
    if (basePricePaise !== undefined) {
      const p = Number(basePricePaise);
      if (!Number.isInteger(p) || p < 0) {
        return NextResponse.json({ error: 'basePricePaise must be a non-negative integer' }, { status: 400 });
      }
      updates.base_price_paise = p;
    }
    if (availability !== undefined) updates.availability = availability;
    if (images !== undefined && Array.isArray(images)) updates.images = images;
    if (features !== undefined && Array.isArray(features)) updates.features = features;
    if (specs !== undefined && typeof specs === 'object') updates.specs = specs;
    if (isPublished !== undefined) updates.is_published = Boolean(isPublished);

    // 3. Atomic UPDATE with optimistic concurrency checking
    let updateQuery = supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (hasVersion) {
      updateQuery = updateQuery.eq('version', expectedVersion);
    } else {
      updateQuery = updateQuery.eq('updated_at', lastKnownUpdatedAt);
    }

    const { data: updatedProducts, error: updateErr } = await updateQuery.select('*, product_variants(*)');

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message || 'Failed to update product' }, { status: 500 });
    }

    if (!updatedProducts || updatedProducts.length === 0) {
      // Differentiate missing product (404) from concurrency version conflict (409)
      const { data: currentRecord } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', id)
        .single();

      if (!currentRecord) {
        return NextResponse.json({ error: 'Product not found or was removed' }, { status: 404 });
      }

      return NextResponse.json(
        {
          error: 'Concurrency conflict: Product was updated by another operator.',
          code: 'CONCURRENCY_CONFLICT',
          currentProduct: serializeProductFromDb(currentRecord),
        },
        { status: 409 }
      );
    }

    const updatedProduct = updatedProducts[0];

    // 4. Record Audit Log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'PRODUCT_UPDATE',
      entityType: 'product',
      entityId: id,
      oldState: { lastKnownUpdatedAt },
      newState: { name: updatedProduct.name, basePricePaise: updatedProduct.base_price_paise, updatedAt: updatedProduct.updated_at },
      notes: `Updated product '${updatedProduct.name}'`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, product: serializeProductFromDb(updatedProduct) });
  } catch (err: unknown) {
    console.error('PUT /api/products/[id] error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft-delete: unpublish product
    const { error: delErr } = await supabase
      .from('products')
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'PRODUCT_ARCHIVE',
      entityType: 'product',
      entityId: id,
      oldState: { isPublished: true },
      newState: { isPublished: false },
      notes: `Archived product '${existing.name}'`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, message: `Product '${existing.name}' unpublished.` });
  } catch (err: unknown) {
    console.error('DELETE /api/products/[id] error:', err);
    const message = err instanceof Error ? err.message : 'Failed to archive product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
