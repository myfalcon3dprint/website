import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { serializeOrderFromDb } from '@/lib/serializers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 1. RBAC: Only owner or order_manager may alter items on existing orders
  const auth = await verifyStaffSession(['owner', 'order_manager']);
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
      action, // 'add' | 'update_quantity' | 'remove'
      itemId,
      variantId,
      quantity,
      newQuantity,
      reason,
      lastKnownUpdatedAt,
    }: {
      action: 'add' | 'update_quantity' | 'remove';
      itemId?: string;
      variantId?: string;
      quantity?: number;
      newQuantity?: number;
      reason?: string;
      lastKnownUpdatedAt: string;
    } = body;

    // 2. Mandatory Optimistic Version Lock
    if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: lastKnownUpdatedAt timestamp is mandatory.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Reason for order item correction is required (minimum 5 characters).' },
        { status: 400 }
      );
    }

    const effectiveQty = action === 'update_quantity' 
      ? Number(newQuantity) 
      : Number(quantity || 1);

    if (action !== 'remove' && (!Number.isInteger(effectiveQty) || effectiveQty <= 0)) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer.' },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auth.user?.id || '');

    // 3. Execute Transactional RPC in PostgreSQL
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('reconcile_order_item_transactional', {
      p_order_id: id,
      p_action: action,
      p_item_id: itemId || null,
      p_variant_id: variantId || null,
      p_quantity: effectiveQty,
      p_reason: reason.trim(),
      p_expected_updated_at: lastKnownUpdatedAt,
      p_staff_user_id: isUuid ? auth.user.id : null,
      p_staff_name: auth.profile.full_name,
    });

    if (rpcErr) {
      if (rpcErr.message.includes('Concurrency conflict')) {
        return NextResponse.json({ error: rpcErr.message }, { status: 409 });
      }
      return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    }

    // 4. Retrieve refreshed order with all items
    const { data: updatedOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !updatedOrder) {
      return NextResponse.json({ error: 'Failed to retrieve reconciled order' }, { status: 500 });
    }

    // 5. Record Audit Log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'ORDER_ITEM_RECONCILIATION',
      entityType: 'order',
      entityId: updatedOrder.order_number || id,
      oldState: { totalPaise: rpcResult.oldTotalPaise },
      newState: { 
        totalPaise: rpcResult.newTotalPaise, 
        paymentStatus: rpcResult.paymentStatus,
        itemCount: (updatedOrder.order_items || []).length,
      },
      notes: `Action: ${action}; Reason: ${reason}; ${rpcResult.inventoryAdjustmentNote}; ${rpcResult.financialAdjustmentNote}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Order items and financial reconciliation recorded successfully.',
      reconciliation: {
        inventoryAdjustmentNote: rpcResult.inventoryAdjustmentNote,
        financialAdjustmentNote: rpcResult.financialAdjustmentNote,
        oldTotalPaise: rpcResult.oldTotalPaise,
        newTotalPaise: rpcResult.newTotalPaise,
        paymentStatus: rpcResult.paymentStatus,
      },
      order: serializeOrderFromDb(updatedOrder),
    });
  } catch (err: unknown) {
    console.error('Order item correction error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
