import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getAuthenticatedUserSession, recordAuditLog } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedUserSession();
  if (!session.user || !session.user.email) {
    return NextResponse.json(
      { error: 'Unauthorized: You must sign in to accept a staff invitation.' },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invitation token is required.' }, { status: 400 });
    }

    // 1. Try PostgreSQL RPC procedure first (enforces transactional single redemption)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'accept_staff_invitation',
        {
          p_token: token.trim(),
          p_user_id: session.user.id,
        }
      );

      if (!rpcError && rpcData) {
        return NextResponse.json({
          success: true,
          role: rpcData.role,
          email: rpcData.email,
          message: `Staff invitation successfully accepted. Account upgraded to ${rpcData.role}.`,
        });
      }
    } catch {
      // Fallback if RPC unmigrated in database
    }

    // 2. Fallback: Defensively query invitation, check ownership, and redeem atomically
    const { data: invite, error: fetchErr } = await supabase
      .from('staff_invitations')
      .select('*')
      .eq('token', token.trim())
      .single();

    if (fetchErr || !invite) {
      return NextResponse.json(
        { error: 'Invalid or non-existent invitation token.' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation is no longer active (status: ${invite.status}).` },
        { status: 400 }
      );
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'This invitation has expired. Please request a new invitation from an owner.' },
        { status: 400 }
      );
    }

    // Strict ownership verification: email must match authenticated user email
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: `Email mismatch: This invitation was issued for '${invite.email}', but you are signed in as '${session.user.email}'.` },
        { status: 403 }
      );
    }

    // Atomic redemption: only update if status is still 'pending'
    const { data: updatedInvites, error: redeemErr } = await supabase
      .from('staff_invitations')
      .update({
        status: 'accepted',
        redeemed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite.id)
      .eq('status', 'pending')
      .select();

    if (redeemErr || !updatedInvites || updatedInvites.length === 0) {
      return NextResponse.json(
        { error: 'Invitation could not be redeemed. It may have already been accepted concurrently.' },
        { status: 409 }
      );
    }

    // Upgrade profile role
    await supabase
      .from('profiles')
      .update({
        role: invite.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    // Record audit log
    await recordAuditLog({
      staffUserId: session.user.id,
      staffName: session.profile?.full_name || session.user.email,
      staffRole: invite.role,
      action: 'STAFF_INVITATION_REDEEMED',
      entityType: 'user',
      entityId: session.user.email,
      newState: { role: invite.role, status: 'accepted' },
      notes: `Staff invitation redeemed by existing customer ${session.user.email}. Role upgraded to ${invite.role}.`,
    });

    return NextResponse.json({
      success: true,
      role: invite.role,
      email: invite.email,
      message: `Staff invitation successfully accepted. Account upgraded to ${invite.role}.`,
    });
  } catch (err: unknown) {
    console.error('Accept staff invitation error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
