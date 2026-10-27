import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { serializeOrderFromDb } from '@/lib/serializers';
import { AdminDataService } from '@/lib/adminDataStore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // Refunds require explicit approval by an owner
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    try {
      const body = await request.json();
      const { reason, amountPaise, lastKnownUpdatedAt } = body;
      if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
        return NextResponse.json(
          { error: 'Optimistic concurrency control: lastKnownUpdatedAt is mandatory for refund approvals.' },
          { status: 400 }
        );
      }
      const current = AdminDataService.getOrderById(id);
      if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      const refundAmount = amountPaise ? Math.min(amountPaise, current.totalPaise) : current.totalPaise;
      const note = `Refund of ₹${(refundAmount / 100).toFixed(2)} approved by ${auth.profile.full_name} (${auth.profile.role}). Reason: ${reason || 'Customer request'}`;

      const updated = AdminDataService.updateOrder(id, {
        refundStatus: 'approved',
        statusHistory: [
          ...(current.statusHistory || []),
          { status: current.status, timestamp: new Date().toISOString(), note },
        ],
      });

      AdminDataService.recordAudit({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'ORDER_REFUND_APPROVED',
        entityType: 'order',
        entityId: current.orderNumber,
        oldState: { refundStatus: current.refundStatus },
        newState: { refundStatus: 'approved', refundAmountPaise: refundAmount },
        notes: note,
      });

      return NextResponse.json({ success: true, order: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving refund';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  try {
    const body = await request.json();
    const { reason, amountPaise, lastKnownUpdatedAt } = body;

    // Mandatory Optimistic Concurrency Control
    if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: lastKnownUpdatedAt is mandatory for refund approvals.' },
        { status: 400 }
      );
    }

    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (currentOrder.payment_status !== 'captured') {
      return NextResponse.json(
        { error: `Cannot refund an order with payment status '${currentOrder.payment_status}'. Only captured payments can be refunded.` },
        { status: 400 }
      );
    }

    const refundAmount = amountPaise ? Math.min(amountPaise, currentOrder.total_paise) : currentOrder.total_paise;
    const note = `Refund of ₹${(refundAmount / 100).toFixed(2)} approved by ${auth.profile.full_name} (${auth.profile.role}). Reason: ${reason || 'Customer request'}`;

    const existingHistory = Array.isArray(currentOrder.status_history) ? currentOrder.status_history : [];

    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({
        refund_status: 'approved',
        refund_notes: note,
        status_history: [
          ...existingHistory,
          {
            status: currentOrder.status,
            timestamp: new Date().toISOString(),
            note,
            staff_id: auth.user.id,
            staff_name: auth.profile.full_name,
          },
        ],
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentOrder.id)
      .eq('updated_at', lastKnownUpdatedAt)
      .select('*, order_items(*)');

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to record refund approval' }, { status: 500 });
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Concurrency conflict: Order was updated by another operator. Please reload before approving refund.' },
        { status: 409 }
      );
    }

    const updatedOrder = updatedOrders[0];

    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'ORDER_REFUND_APPROVED',
      entityType: 'order',
      entityId: currentOrder.order_number || currentOrder.id,
      oldState: { refund_status: currentOrder.refund_status },
      newState: { refund_status: 'approved', amountPaise: refundAmount },
      notes: note,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Refund approved by administrator. Ready for disbursement.',
      order: serializeOrderFromDb(updatedOrder),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
