import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { StaffRole } from '@/lib/types';

const ALLOWED_STAFF_ROLES: StaffRole[] = [
  'owner',
  'order_manager',
  'production_operator',
  'catalog_editor',
  'support',
];

/**
 * GET /api/admin/staff/invitations
 * Only owner may list active or historical staff invitations.
 */
export async function GET() {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { data: invitations, error } = await supabase
      .from('staff_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('does not exist')) {
        return NextResponse.json({ invitations: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve staff invitations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/staff/invitations
 * Owner-controlled staff invitation generation.
 * Bound to the specified email, role, and 7-day expiration.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, role, expiresInDays = 7 } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!role || !ALLOWED_STAFF_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of [${ALLOWED_STAFF_ROLES.join(', ')}]. Received: ${role}` },
        { status: 400 }
      );
    }

    const days = Math.min(30, Math.max(1, parseInt(String(expiresInDays), 10) || 7));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Check if an existing active profile already has this role
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', cleanEmail) // or email lookup if supported
      .single();

    if (existingProfile && existingProfile.role === role) {
      return NextResponse.json(
        { error: `User with email '${cleanEmail}' is already registered with role '${role}'.` },
        { status: 400 }
      );
    }

    // Insert or update pending invitation
    const { data: invitation, error: insertError } = await supabase
      .from('staff_invitations')
      .upsert(
        [
          {
            email: cleanEmail,
            role,
            invited_by: auth.user.id,
            status: 'pending',
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Record immutable audit log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'STAFF_INVITATION_ISSUED',
      entityType: 'user',
      entityId: cleanEmail,
      newState: { role, expiresAt, status: 'pending' },
      notes: `Staff invitation issued to ${cleanEmail} for role ${role} by owner ${auth.profile.full_name}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      invitation,
      message: `Staff invitation generated for ${cleanEmail} with role '${role}'. Expires in ${days} days.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/staff/invitations
 * Owner revocation of pending staff invitations.
 */
export async function DELETE(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
    }

    const { data: revoked, error } = await supabase
      .from('staff_invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)
      .eq('status', 'pending')
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!revoked || revoked.length === 0) {
      return NextResponse.json({ error: 'No active pending invitation found for this email' }, { status: 404 });
    }

    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'STAFF_INVITATION_REVOKED',
      entityType: 'user',
      entityId: email,
      notes: `Invitation revoked for ${email} by owner ${auth.profile.full_name}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, message: `Invitation for ${email} revoked.` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
