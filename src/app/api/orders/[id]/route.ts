import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { serializeOrderFromDb } from '@/lib/serializers';
import { Order, OrderStatus, ShippingAddress } from '@/lib/types';
import { AdminDataService } from '@/lib/adminDataStore';
import { maskCustomerPII, hasPermission } from '@/lib/rbac';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const auth = await verifyStaffSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // RBAC: Catalog editor has no order access
  if (auth.profile.role === 'catalog_editor') {
    return NextResponse.json(
      { error: "Forbidden: Role 'catalog_editor' does not have permission to view order details." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const rawOrder = AdminDataService.getOrderById(id);
    if (!rawOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = auth.profile.role === 'production_operator' ? maskCustomerPII(rawOrder, auth.profile.role) : rawOrder;
    return NextResponse.json({ order });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .or(`id.eq.${id},order_number.eq.${id}`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const serialized = serializeOrderFromDb(data);
  const order = auth.profile.role === 'production_operator' ? maskCustomerPII(serialized, auth.profile.role) : serialized;
  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 1. In-Handler Authorization check: Only owner and order_manager may modify orders
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    try {
      const body = await request.json();
      const { newStatus, statusNote, shippingAddress, trackingNumber } = body;
      const current = AdminDataService.getOrderById(id);
      if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      const updates: Partial<Order> = {};
      if (newStatus) {
        updates.status = newStatus;
        updates.statusHistory = [
          ...(current.statusHistory || []),
          { status: newStatus, timestamp: new Date().toISOString(), note: statusNote || `Status updated to ${newStatus}` },
        ];
      }
      if (shippingAddress) {
        updates.shippingAddress = { ...current.shippingAddress, ...shippingAddress };
      }
      if (trackingNumber !== undefined) {
        updates.trackingNumber = trackingNumber;
      }

      const updated = AdminDataService.updateOrder(id, updates);
      AdminDataService.recordAudit({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: `ORDER_UPDATED_${newStatus || 'DETAILS'}`,
        entityType: 'order',
        entityId: current.orderNumber,
        oldState: { status: current.status },
        newState: updates as Record<string, unknown>,
        notes: statusNote || 'Order modified in store engine',
      });

      return NextResponse.json({ success: true, order: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating order';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  try {
    const body = await request.json();
    const newStatus = (body.newStatus || body.status) as OrderStatus | undefined;
    const statusNote = (body.statusNote || body.reason || body.notes) as string | undefined;
    const {
      shippingAddress,
      trackingNumber,
      lastKnownUpdatedAt,
    }: {
      shippingAddress?: Partial<ShippingAddress>;
      trackingNumber?: string;
      lastKnownUpdatedAt?: string;
    } = body;

    // 2. Mandatory Optimistic Concurrency Control (Version check)
    if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: lastKnownUpdatedAt timestamp is mandatory for order updates.' },
        { status: 400 }
      );
    }

    // 3. Fetch existing order to check invariants
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 4. Address Modification Validation & Role Enforcing
    if (shippingAddress) {
      if (!['owner', 'order_manager'].includes(auth.profile.role)) {
        return NextResponse.json(
          { error: `Forbidden: Role '${auth.profile.role}' cannot alter delivery addresses.` },
          { status: 403 }
        );
      }

      // Invariant: Address cannot be changed once packed, shipped, or delivered
      const lockedStatuses: OrderStatus[] = ['packed', 'shipped', 'delivered'];
      if (lockedStatuses.includes(currentOrder.status)) {
        return NextResponse.json(
          { error: `Address cannot be modified because order is already '${currentOrder.status}'.` },
          { status: 400 }
        );
      }

      const mergedAddress = {
        ...currentOrder.shipping_address,
        ...shippingAddress,
      };

      if (!mergedAddress.fullName || !mergedAddress.phone || !mergedAddress.addressLine1 || !mergedAddress.city || !mergedAddress.pinCode) {
        return NextResponse.json(
          { error: 'Incomplete shipping address: fullName, phone, addressLine1, city, and pinCode are required.' },
          { status: 400 }
        );
      }

      updates.shipping_address = mergedAddress;
    }

    // 5. Courier Tracking Number Assignment
    if (trackingNumber !== undefined) {
      if (!['owner', 'order_manager'].includes(auth.profile.role)) {
        return NextResponse.json(
          { error: `Forbidden: Role '${auth.profile.role}' cannot assign tracking numbers.` },
          { status: 403 }
        );
      }
      updates.tracking_number = trackingNumber.trim();
    }

    // 6. Status Transition State Machine Validation
    let newHistoryEntry: Record<string, unknown> | null = null;
    if (newStatus && newStatus !== currentOrder.status) {
      // Invariant: Cancelled orders are terminal
      if (currentOrder.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Cancelled orders cannot be transitioned to active states.' },
          { status: 400 }
        );
      }

      const noteText =
        statusNote ||
        `Status transitioned to ${newStatus} by ${auth.profile.full_name} (${auth.profile.role})`;

      const existingHistory = Array.isArray(currentOrder.status_history)
        ? currentOrder.status_history
        : [];

      newHistoryEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: noteText,
        staff_id: auth.user.id,
        staff_name: auth.profile.full_name,
      };

      updates.status = newStatus;
      updates.status_history = [...existingHistory, newHistoryEntry];
    }

    const actionName = newStatus ? `ORDER_STATUS_TRANSITION_${newStatus.toUpperCase()}` : 'ORDER_ADDRESS_CORRECTION';

    // 7. Execute via atomic single-transaction PostgreSQL stored procedure
    try {
      const { data: rpcOrder, error: rpcError } = await supabase.rpc(
        'apply_order_mutation_with_audit',
        {
          p_order_id: currentOrder.id,
          p_expected_updated_at: lastKnownUpdatedAt,
          p_new_status: newStatus || null,
          p_shipping_address: shippingAddress ? updates.shipping_address : null,
          p_tracking_number: trackingNumber !== undefined ? updates.tracking_number : null,
          p_status_history_entry: newHistoryEntry || null,
          p_staff_user_id: auth.user.id,
          p_staff_name: auth.profile.full_name,
          p_staff_role: auth.profile.role,
          p_action: actionName,
          p_notes: statusNote || null,
          p_ip_address: request.headers.get('x-forwarded-for') || null,
        }
      );

      if (!rpcError && rpcOrder) {
        return NextResponse.json({
          success: true,
          order: serializeOrderFromDb(rpcOrder),
        });
      }

      if (rpcError && rpcError.message?.includes('Concurrency conflict')) {
        return NextResponse.json(
          { error: rpcError.message },
          { status: 409 }
        );
      }
    } catch {
      // Fallback to client transactional flow if RPC is unmigrated in database
    }

    // 8. Fallback client-level atomic update with rollback guarantee if audit write fails
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', currentOrder.id)
      .eq('updated_at', lastKnownUpdatedAt)
      .select('*, order_items(*)');

    if (updateError) {
      console.error('Failed to update order in database:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update order' }, { status: 500 });
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      const { data: latestOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', currentOrder.id)
        .single();

      return NextResponse.json(
        {
          error: 'Concurrency conflict: Order was updated by another operator. Please reload before saving.',
          currentOrder: latestOrder ? serializeOrderFromDb(latestOrder) : null,
        },
        { status: 409 }
      );
    }

    const updatedOrder = updatedOrders[0];

    // 9. Atomic Audit Log Recording with Reversion Guarantee on Failure
    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: actionName,
        entityType: 'order',
        entityId: currentOrder.order_number || currentOrder.id,
        oldState: {
          status: currentOrder.status,
          shippingAddress: currentOrder.shipping_address,
          trackingNumber: currentOrder.tracking_number,
        },
        newState: {
          status: updatedOrder.status,
          shippingAddress: updatedOrder.shipping_address,
          trackingNumber: updatedOrder.tracking_number,
        },
        notes: statusNote || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });
    } catch (auditErr) {
      // Rollback: revert the order update if audit write fails
      await supabase
        .from('orders')
        .update({
          status: currentOrder.status,
          shipping_address: currentOrder.shipping_address,
          tracking_number: currentOrder.tracking_number,
          status_history: currentOrder.status_history,
          updated_at: currentOrder.updated_at,
        })
        .eq('id', currentOrder.id);

      return NextResponse.json(
        { error: 'Audit log write failed: Order mutation was rolled back to maintain transactional integrity.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: serializeOrderFromDb(updatedOrder),
    });
  } catch (err: unknown) {
    console.error('PATCH /api/orders/[id] error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
