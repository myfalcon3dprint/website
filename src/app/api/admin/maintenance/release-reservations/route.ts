import { NextResponse } from 'next/server';
import { verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { releaseExpiredReservations } from '@/lib/payment-finalization';

export async function POST() {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const releasedCount = await releaseExpiredReservations();

    if (releasedCount > 0) {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'EXPIRED_RESERVATIONS_RELEASED',
        entityType: 'system',
        entityId: 'stock_reservations',
        notes: `Released ${releasedCount} expired inventory reservations.`,
      });
    }

    return NextResponse.json({
      success: true,
      releasedCount,
      message: `Successfully released ${releasedCount} expired stock reservation(s).`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to release expired reservations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
