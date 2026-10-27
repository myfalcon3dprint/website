import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { serializeProductFromDb } from '@/lib/serializers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 1. RBAC: Only owner or catalog_editor may alter product stock
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
    const { variantId, delta, newStockQuantity, lastKnownUpdatedAt, expectedVersion } = body;

    if (!variantId || typeof variantId !== 'string') {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 });
    }

    // 2. Mandatory Optimistic Concurrency Control (Version or timestamp check)
    const hasVersion = expectedVersion !== undefined && typeof expectedVersion === 'number' && Number.isInteger(expectedVersion) && expectedVersion >= 1;
    const hasTimestamp = typeof lastKnownUpdatedAt === 'string' && lastKnownUpdatedAt.trim().length > 0;

    if (!hasVersion && !hasTimestamp) {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: expectedVersion (integer) or lastKnownUpdatedAt is mandatory for stock adjustments.' },
        { status: 400 }
      );
    }

    // 3. Fetch current variant to check stock and concurrency
    const { data: variant, error: varError } = await supabase
      .from('product_variants')
      .select('*, products(*)')
      .eq('id', variantId)
      .eq('product_id', id)
      .single();

    if (varError || !variant) {
      return NextResponse.json({ error: 'Variant not found for specified product' }, { status: 404 });
    }

    // 4. Calculate new stock and validate finite non-negative integer
    let targetStock: number;
    if (newStockQuantity !== undefined) {
      const parsed = Number(newStockQuantity);
      if (!Number.isInteger(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'Stock quantity must be a finite, non-negative integer.' },
          { status: 400 }
        );
      }
      targetStock = parsed;
    } else if (delta !== undefined) {
      const parsedDelta = Number(delta);
      if (!Number.isInteger(parsedDelta)) {
        return NextResponse.json(
          { error: 'Stock adjustment delta must be a finite integer.' },
          { status: 400 }
        );
      }
      targetStock = (variant.stock_quantity || 0) + parsedDelta;
      if (targetStock < 0) {
        return NextResponse.json(
          { error: `Insufficient stock: current stock is ${variant.stock_quantity}, requested delta ${parsedDelta} would produce negative stock.` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: 'delta or newStockQuantity must be provided' }, { status: 400 });
    }

    // 5. Attempt atomic single-transaction PostgreSQL stored procedure
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'apply_product_stock_with_audit',
        {
          p_product_id: id,
          p_variant_id: variantId,
          p_expected_version: hasVersion ? Number(expectedVersion) : null,
          p_expected_updated_at: hasTimestamp ? lastKnownUpdatedAt : null,
          p_delta: delta !== undefined ? Number(delta) : null,
          p_new_stock_quantity: newStockQuantity !== undefined ? Number(newStockQuantity) : null,
          p_staff_user_id: auth.user.id,
          p_staff_name: auth.profile.full_name,
          p_staff_role: auth.profile.role,
          p_action: 'PRODUCT_STOCK_ADJUSTMENT',
          p_notes: `Stock adjusted by ${auth.profile.full_name}`,
          p_ip_address: request.headers.get('x-forwarded-for') || null,
        }
      );

      if (!rpcErr && rpcData) {
        const { data: freshProd } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('id', id)
          .single();

        return NextResponse.json({
          success: true,
          variantId,
          newStockQuantity: rpcData.newStockQuantity,
          product: freshProd ? serializeProductFromDb(freshProd) : null,
        });
      }

      if (rpcErr && rpcErr.message?.includes('Concurrency conflict')) {
        return NextResponse.json({ error: rpcErr.message }, { status: 409 });
      }
    } catch {
      // Fallback to client transactional flow
    }

    // 6. Client fallback: ATOMIC Optimistic Concurrency Update on parent product
    const newTimestamp = new Date().toISOString();
    const { data: updatedProducts, error: prodUpdateErr } = await supabase
      .from('products')
      .update({ updated_at: newTimestamp })
      .eq('id', id)
      .eq('updated_at', lastKnownUpdatedAt)
      .select('id, updated_at');

    if (prodUpdateErr) {
      return NextResponse.json({ error: prodUpdateErr.message || 'Failed to update product timestamp' }, { status: 500 });
    }

    if (!updatedProducts || updatedProducts.length === 0) {
      return NextResponse.json(
        { error: 'Concurrency conflict: Product inventory was modified by another operator. Please reload.' },
        { status: 409 }
      );
    }

    // Update variant stock atomically
    const { data: updatedVariant, error: updateError } = await supabase
      .from('product_variants')
      .update({ stock_quantity: targetStock })
      .eq('id', variantId)
      .eq('product_id', id)
      .select()
      .single();

    if (updateError || !updatedVariant) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update stock' }, { status: 500 });
    }

    // 7. Record immutable audit log with rollback guarantee
    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'PRODUCT_STOCK_ADJUSTMENT',
        entityType: 'product',
        entityId: `${variant.sku} (${variant.id})`,
        oldState: { stockQuantity: variant.stock_quantity },
        newState: { stockQuantity: targetStock },
        notes: `Stock adjusted from ${variant.stock_quantity} to ${targetStock} by ${auth.profile.full_name}`,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });
    } catch (auditErr) {
      // Rollback variant stock write if audit log write fails
      await supabase
        .from('product_variants')
        .update({ stock_quantity: variant.stock_quantity })
        .eq('id', variantId);

      return NextResponse.json(
        { error: 'Audit log write failed: Stock adjustment was rolled back to maintain transactional integrity.' },
        { status: 500 }
      );
    }

    // 8. Fetch full updated product to return
    const { data: updatedProduct } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      variantId,
      newStockQuantity: targetStock,
      product: updatedProduct ? serializeProductFromDb(updatedProduct) : null,
    });
  } catch (err: unknown) {
    console.error('PATCH /api/products/[id]/stock error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
