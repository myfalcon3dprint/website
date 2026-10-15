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
      variants,
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

    // 4. Reconcile Variants if provided
    if (Array.isArray(variants)) {
      const { data: existingVars } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      const existingMap = new Map((existingVars || []).map((v) => [v.id, v]));
      const submittedVariantIds = new Set<string>();

      for (let idx = 0; idx < variants.length; idx++) {
        const v = variants[idx];
        const vPayload = {
          product_id: id,
          sku: String(v.sku || `${(updates.slug || id).toString().toUpperCase().slice(0, 8)}-${idx + 1}`).trim(),
          title: String(v.title || `${v.material || 'PLA'} / ${v.color || 'Standard'}`).trim(),
          material: String(v.material || 'PLA').trim(),
          color: String(v.color || 'Standard').trim(),
          finish: String(v.finish || 'Raw (Layered)').trim(),
          price_adjustment_paise: Number.isInteger(Number(v.priceAdjustmentPaise)) ? Number(v.priceAdjustmentPaise) : 0,
          stock_quantity: Math.max(0, parseInt(String(v.stockQuantity ?? 0), 10) || 0),
          lead_time_days: Math.max(0, parseInt(String(v.leadTimeDays ?? 0), 10) || 0),
          dimensions: v.dimensions || { length_mm: 100, width_mm: 100, height_mm: 100 },
          weight_grams: Math.max(0, Number(v.weightGrams ?? 100)),
          is_active: v.isActive !== false,
          updated_at: new Date().toISOString(),
        };

        if (v.id && existingMap.has(v.id)) {
          submittedVariantIds.add(v.id);
          await supabase
            .from('product_variants')
            .update(vPayload)
            .eq('id', v.id);
        } else {
          // Check if SKU already exists for this product
          const matchingBySku = (existingVars || []).find((ev) => ev.sku === vPayload.sku);
          if (matchingBySku) {
            submittedVariantIds.add(matchingBySku.id);
            await supabase
              .from('product_variants')
              .update(vPayload)
              .eq('id', matchingBySku.id);
          } else {
            const { data: insertedVar } = await supabase
              .from('product_variants')
              .insert(vPayload)
              .select('id')
              .single();
            if (insertedVar) submittedVariantIds.add(insertedVar.id);
          }
        }
      }

      // Remove variants no longer present in the submitted payload
      for (const existingVar of existingVars || []) {
        if (!submittedVariantIds.has(existingVar.id)) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('id', existingVar.id);
        }
      }
    }

    // Fetch refreshed product with all reconciled variants
    const { data: refreshedProduct } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .single();

    const finalProduct = refreshedProduct || updatedProducts[0];

    // 5. Record Audit Log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'PRODUCT_UPDATE',
      entityType: 'product',
      entityId: id,
      oldState: { lastKnownUpdatedAt },
      newState: { 
        name: finalProduct.name, 
        basePricePaise: finalProduct.base_price_paise, 
        updatedAt: finalProduct.updated_at,
        variantCount: (finalProduct.product_variants || []).length,
      },
      notes: `Updated product '${finalProduct.name}'`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, product: serializeProductFromDb(finalProduct) });
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
