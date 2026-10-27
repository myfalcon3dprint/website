import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';
import { StaffRole, StaffUser } from '@/lib/types';

const ALLOWED_STAFF_ROLES: StaffRole[] = [
  'owner',
  'order_manager',
  'production_operator',
  'catalog_editor',
  'support',
];

/**
 * GET /api/admin/staff
 * Lists all registered staff team members and pending staff invitations.
 * Owner-only privilege.
 */
export async function GET() {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners may access staff and permission controls.' }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  let staff: StaffUser[] = AdminDataService.getStaffUsers();
  let invitations = AdminDataService.getStaffInvitations();

  if (supabase) {
    try {
      const { data: dbStaff } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_suspended')
        .in('role', ALLOWED_STAFF_ROLES)
        .order('role');

      if (dbStaff && dbStaff.length > 0) {
        staff = dbStaff.map((p) => ({
          id: p.id,
          name: p.full_name || 'Staff User',
          email: `${p.role}@falcon3dprints.com`,
          role: p.role as StaffRole,
          isSuspended: Boolean(p.is_suspended) || AdminDataService.isUserSuspended(p.id),
        }));
      }

      const { data: dbInvites } = await supabase
        .from('staff_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbInvites && dbInvites.length > 0) {
        invitations = dbInvites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role as StaffRole,
          invitedBy: i.invited_by,
          status: i.status,
          expiresAt: i.expires_at,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
        }));
      }
    } catch {
      // Fallback to AdminDataService gracefully
    }
  }

  return NextResponse.json({
    staff,
    invitations,
  });
}

/**
 * PATCH /api/admin/staff
 * Updates a staff member's role or suspension status.
 * Owner-only privilege with last-owner demotion and self-promotion protection.
 */
export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || 'Only Studio Owners may adjust staff roles and permissions.' },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const { action, reason } = body;
    const userId = body.userId || body.targetStaffId;
    const role = body.role || body.newRole;

    if (!userId) {
      return NextResponse.json({ error: 'userId (or targetStaffId) is required' }, { status: 400 });
    }

    // 1. Handle Account Suspension / Unsuspension
    if (action === 'suspend' || action === 'unsuspend') {
      if (userId === auth.user.id && action === 'suspend') {
        return NextResponse.json(
          { error: 'Cannot suspend your own active Super Admin account.' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      if (action === 'suspend') {
        // Protect last owner
        if (isUuid && supabase) {
          const { data: owners } = await supabase
            .from('profiles')
            .select('id, role, is_suspended')
            .eq('role', 'owner');
          const activeOwners = (owners || []).filter((o) => !o.is_suspended && o.id !== userId);
          if (owners?.some((o) => o.id === userId) && activeOwners.length === 0) {
            return NextResponse.json(
              { error: 'Cannot suspend the only remaining active Studio Owner.' },
              { status: 400 }
            );
          }
          await supabase.from('profiles').update({ is_suspended: true, updated_at: new Date().toISOString() }).eq('id', userId);
        }
        const storeRes = AdminDataService.suspendStaffUser(userId);
        if (!storeRes.success) {
          return NextResponse.json({ error: storeRes.error }, { status: 400 });
        }
      } else {
        if (isUuid && supabase) {
          await supabase.from('profiles').update({ is_suspended: false, updated_at: new Date().toISOString() }).eq('id', userId);
        }
        AdminDataService.unsuspendStaffUser(userId);
      }

      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: action === 'suspend' ? 'STAFF_SUSPENDED' : 'STAFF_UNSUSPENDED',
        entityType: 'user',
        entityId: userId,
        newState: { status: action === 'suspend' ? 'suspended' : 'active', reason: reason || 'Suspension state modified by owner' },
        notes: `Staff account ${userId} was ${action}ed by owner ${auth.profile.full_name}`,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });

      return NextResponse.json({
        success: true,
        message: `Staff member successfully ${action}ed.`,
      });
    }

    // 2. Handle Role Update
    if (!role) {
      return NextResponse.json({ error: 'role is required for role modification' }, { status: 400 });
    }

    if (!ALLOWED_STAFF_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Allowed roles: ${ALLOWED_STAFF_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Invariant: Cannot self-modify role or self-promote
    if (userId === auth.user.id && role !== auth.profile.role) {
      return NextResponse.json(
        { error: 'Self-modification forbidden: Staff members cannot change their own role. Another Super Admin must perform this action.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (isUuid && supabase) {
      const { data: allOwners } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'owner');

      const isTargetOwner = allOwners?.some((o: { id: string; role: string }) => o.id === userId);
      if (isTargetOwner && role !== 'owner' && (allOwners?.length || 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the only remaining Studio Owner. Promote another staff member to Owner first.' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // In-memory runtime checks
      const isTargetOwner = AdminDataService.getStaffUsers().some((u) => u.id === userId && u.role === 'owner');
      const remainingOwners = AdminDataService.getStaffUsers().filter((u) => u.role === 'owner' && u.id !== userId);
      if (isTargetOwner && role !== 'owner' && remainingOwners.length === 0) {
        return NextResponse.json(
          { error: 'Cannot demote the only remaining Studio Owner. Promote another staff member to Owner first.' },
          { status: 400 }
        );
      }
    }

    // Update in-memory service as well
    const storeResult = AdminDataService.updateStaffRole(userId, role);
    if (!storeResult.success) {
      return NextResponse.json({ error: storeResult.error }, { status: 400 });
    }
    if (!storeResult.success) {
      return NextResponse.json({ error: storeResult.error }, { status: 400 });
    }

    // Record immutable audit log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'STAFF_ROLE_MODIFIED',
      entityType: 'user',
      entityId: userId,
      newState: { newRole: role, reason: reason || 'Role permissions updated by owner' },
      notes: `Staff member ${userId} role changed to ${role} by owner ${auth.profile.full_name}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Staff role successfully updated to ${role}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/staff
 * Removes a staff member from the studio team (reverts role to 'customer').
 * Owner-only privilege with last-owner removal protection.
 */
export async function DELETE(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || 'Only Studio Owners may remove staff members.' },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove your own active owner account. Transfer ownership first.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (isUuid && supabase) {
      const { data: allOwners } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'owner');

      const isTargetOwner = allOwners?.some((o) => o.id === userId);
      if (isTargetOwner && (allOwners?.length || 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the only remaining Studio Owner.' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: 'customer', updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const isTargetOwner = AdminDataService.getStaffUsers().some((u) => u.id === userId && u.role === 'owner');
      const remainingOwners = AdminDataService.getStaffUsers().filter((u) => u.role === 'owner' && u.id !== userId);
      if (isTargetOwner && remainingOwners.length === 0) {
        return NextResponse.json(
          { error: 'Cannot remove the only remaining Studio Owner.' },
          { status: 400 }
        );
      }
    }

    const storeResult = AdminDataService.removeStaffUser(userId);
    if (!storeResult.success) {
      return NextResponse.json({ error: storeResult.error }, { status: 400 });
    }

    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'STAFF_MEMBER_REMOVED',
      entityType: 'user',
      entityId: userId,
      notes: `Staff privileges revoked for ${userId} by owner ${auth.profile.full_name}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff privileges revoked successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
