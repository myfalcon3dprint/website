import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners and Order Managers may review feedback' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let reviews = AdminDataService.getReviews();

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('product_reviews').select('*, products(name)');
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      const { data: dbReviews } = await query;
      if (dbReviews && dbReviews.length > 0) {
        reviews = dbReviews.map((r) => ({
          id: r.id,
          productId: r.product_id,
          productTitle: r.products?.name || 'Catalog Product',
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          rating: r.rating,
          title: r.title,
          reviewText: r.review_text,
          isVerifiedPurchase: Boolean(r.is_verified_purchase),
          orderId: r.order_id,
          status: r.status,
          staffReply: r.staff_reply,
          staffRepliedAt: r.staff_replied_at,
          createdAt: r.created_at,
        }));
      }
    }

    if (status && status !== 'all') {
      reviews = reviews.filter((r) => r.status === status);
    }

    return NextResponse.json({ reviews });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, status, staffReply } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (staffReply !== undefined) {
      updates.staffReply = staffReply;
      updates.staffRepliedAt = new Date().toISOString();
      updates.staffRepliedBy = auth.user.id;
    }

    const updated = AdminDataService.updateReview(id, updates);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase
        .from('product_reviews')
        .update({
          status: updates.status,
          staff_reply: updates.staffReply,
          staff_replied_at: updates.staffRepliedAt,
          staff_replied_by: updates.staffRepliedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'MODERATE_REVIEW',
        entityType: 'product',
        entityId: id,
        newState: updates,
        notes: `Review status changed to ${status || 'updated'}. Staff reply: ${staffReply ? 'Yes' : 'No'}`,
      });
    } catch {
      AdminDataService.recordAudit({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'MODERATE_REVIEW',
        entityType: 'product',
        entityId: id,
        newState: updates,
        notes: `Review status changed to ${status || 'updated'}. Staff reply: ${staffReply ? 'Yes' : 'No'}`,
      });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to moderate review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
