import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { serializeProductFromDb } from '@/lib/serializers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase
      .from('products')
      .select('*, product_variants(*), categories(id, name, slug)');

    if (isUuid) {
      query = query.or(`id.eq.${id},slug.eq.${id}`);
    } else {
      query = query.eq('slug', id);
    }

    const { data: product, error } = await query.maybeSingle();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: serializeProductFromDb(product) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { verifyStaffSession, recordAuditLog } = await import('@/lib/supabase/server');
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
    if (body.careInstructions !== undefined) updates.care_info = String(body.careInstructions).trim();
    if (specs !== undefined || body.includedItems !== undefined || body.dispatchInfo !== undefined) {
      const existingSpecs = typeof specs === 'object' && specs ? specs : {};
      updates.specs = {
        ...existingSpecs,
        ...(body.includedItems !== undefined ? { includedItems: body.includedItems } : {}),
        ...(body.careInstructions !== undefined ? { careInstructions: body.careInstructions } : {}),
        ...(body.dispatchInfo !== undefined ? { dispatchInfo: body.dispatchInfo } : {}),
      };
    }
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

    const { data: updatedProducts, error: updateErr } = await updateQuery.select('*, product_variants(*), categories(id, name, slug)');

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message || 'Failed to update product' }, { status: 500 });
    }

    if (!updatedProducts || updatedProducts.length === 0) {
      // Differentiate missing product (404) from concurrency version conflict (409)
      const { data: currentRecord } = await supabase
        .from('products')
        .select('*, product_variants(*), categories(id, name, slug)')
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
    const tempIdMap: Record<string, string> = {};

    if (Array.isArray(variants)) {
      // Validate variants in submitted payload
      const variantSkuSet = new Set<string>();
      for (let idx = 0; idx < variants.length; idx++) {
        const v = variants[idx];
        const rawSku = String(v.sku || `${(updates.slug || id).toString().toUpperCase().slice(0, 8)}-${idx + 1}`).trim();
        if (!rawSku) {
          return NextResponse.json({ error: `Variant #${idx + 1} SKU cannot be empty` }, { status: 400 });
        }
        if (variantSkuSet.has(rawSku)) {
          return NextResponse.json({ error: `Duplicate variant SKU '${rawSku}' in submission` }, { status: 400 });
        }
        variantSkuSet.add(rawSku);

        const stock = parseInt(String(v.stockQuantity ?? 0), 10);
        if (isNaN(stock) || stock < 0) {
          return NextResponse.json({ error: `Variant '${rawSku}' stock must be a non-negative integer` }, { status: 400 });
        }

        const priceAdj = Number(v.priceAdjustmentPaise ?? 0);
        if (!Number.isInteger(priceAdj)) {
          return NextResponse.json({ error: `Variant '${rawSku}' price adjustment must be an integer paise amount` }, { status: 400 });
        }
      }

      // Check for SKU collisions with OTHER products
      const submittedSkus = Array.from(variantSkuSet);
      if (submittedSkus.length > 0) {
        const { data: collisions, error: colErr } = await supabase
          .from('product_variants')
          .select('sku, product_id')
          .in('sku', submittedSkus)
          .neq('product_id', id);

        if (colErr) {
          return NextResponse.json({ error: `Failed to check SKU uniqueness: ${colErr.message}` }, { status: 500 });
        }
        if (collisions && collisions.length > 0) {
          return NextResponse.json(
            { error: `Variant SKU '${collisions[0].sku}' is already in use by another product.` },
            { status: 400 }
          );
        }
      }

      const { data: existingVars, error: fetchVarsErr } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (fetchVarsErr) {
        return NextResponse.json({ error: `Failed to load existing variants: ${fetchVarsErr.message}` }, { status: 500 });
      }

      const existingMap = new Map((existingVars || []).map((v) => [v.id, v]));

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
          image: v.image ? String(v.image).trim() : null,
          is_active: v.isActive !== false,
        };

        const incomingTempId = v.tempId || (v.id && !existingMap.has(v.id) ? v.id : null);

        if (v.id && existingMap.has(v.id)) {
          // UPDATE existing database record
          const { error: updVarErr } = await supabase
            .from('product_variants')
            .update(vPayload)
            .eq('id', v.id);

          if (updVarErr) {
            return NextResponse.json({ error: `Failed to update variant '${vPayload.sku}': ${updVarErr.message}` }, { status: 400 });
          }
        } else {
          // Check if SKU already exists for this product (e.g. retried submission)
          const matchingBySku = (existingVars || []).find((ev) => ev.sku === vPayload.sku);
          if (matchingBySku) {
            const { error: updSkuErr } = await supabase
              .from('product_variants')
              .update(vPayload)
              .eq('id', matchingBySku.id);

            if (updSkuErr) {
              return NextResponse.json({ error: `Failed to update variant '${vPayload.sku}': ${updSkuErr.message}` }, { status: 400 });
            }
            if (incomingTempId) {
              tempIdMap[incomingTempId] = matchingBySku.id;
            }
          } else {
            // INSERT brand new variant record
            const { data: insertedVar, error: insVarErr } = await supabase
              .from('product_variants')
              .insert(vPayload)
              .select('id')
              .single();

            if (insVarErr || !insertedVar) {
              return NextResponse.json({ error: `Failed to insert variant '${vPayload.sku}': ${insVarErr?.message || 'Database insert failed'}` }, { status: 400 });
            }
            if (incomingTempId) {
              tempIdMap[incomingTempId] = insertedVar.id;
            }
          }
        }
      }
    }

    // Fetch refreshed product with all reconciled variants and joined category
    const { data: refreshedProduct, error: refreshErr } = await supabase
      .from('products')
      .select('*, product_variants(*), categories(id, name, slug)')
      .eq('id', id)
      .single();

    if (refreshErr) {
      console.warn('Refetch refreshed product notice:', refreshErr);
    }

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

    return NextResponse.json({ success: true, product: serializeProductFromDb(finalProduct), tempIdMap });
  } catch (err: unknown) {
    console.error('PUT /api/products/[id] error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { verifyStaffSession, recordAuditLog } = await import('@/lib/supabase/server');
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
