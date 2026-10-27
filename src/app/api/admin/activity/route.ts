import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';
import { AuditLogEntry } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners may inspect audit history' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const staffRole = searchParams.get('staffRole');
    const search = searchParams.get('search')?.toLowerCase().trim();

    let logs: AuditLogEntry[] = AdminDataService.getAuditLogs();

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(200);

      if (entityType && entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }
      if (staffRole && staffRole !== 'all') {
        query = query.eq('staff_role', staffRole);
      }

      const { data: dbLogs } = await query;
      if (dbLogs && dbLogs.length > 0) {
        logs = dbLogs.map((l) => ({
          id: l.id,
          staffUserId: l.staff_user_id,
          staffName: l.staff_name,
          staffRole: l.staff_role,
          action: l.action,
          entityType: l.entity_type,
          entityId: l.entity_id,
          oldState: l.old_state,
          newState: l.new_state,
          notes: l.notes,
          ipAddress: l.ip_address,
          createdAt: l.created_at,
        }));
      }
    }

    if (search) {
      logs = logs.filter(
        (l) =>
          l.staffName.toLowerCase().includes(search) ||
          l.action.toLowerCase().includes(search) ||
          l.entityId.toLowerCase().includes(search) ||
          (l.notes && l.notes.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      logs,
      totalCount: logs.length,
      immutabilityNotice: 'Audit records are append-only and cryptographically timestamped. Modifying or deleting logs is strictly blocked by database security policies.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve audit log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
