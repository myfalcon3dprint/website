import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getAuthenticatedUserSession, recordAuditLog } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email && !token) {
    return NextResponse.json({ error: 'Email or token parameter required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    let query = supabase.from('staff_invitations').select('id, email, role, status, expires_at, created_at');
    if (token) {
      query = query.eq('token', token.trim());
    } else if (email) {
      query = query.ilike('email', email.trim());
    }

    const { data: invite, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        return NextResponse.json({ found: false, unmigrated: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expires_at,
      isExpired: new Date(invite.expires_at).getTime() < Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query invitation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const token = typeof body.token === 'string' ? body.token.trim() : null;
    const targetEmail = (typeof body.email === 'string' ? body.email.trim() : session.user.email).toLowerCase();

    // 1. Try PostgreSQL RPC procedure if token is available
    if (token) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'accept_staff_invitation',
          {
            p_token: token,
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
    }

    // 2. Query invitation by token or authenticated email
    let query = supabase.from('staff_invitations').select('*');
    if (token) {
      query = query.eq('token', token);
    } else {
      query = query.ilike('email', targetEmail);
    }

    const { data: invite, error: fetchErr } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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
