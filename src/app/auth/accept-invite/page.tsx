'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthUser } from '@/lib/supabase/auth';
import { ROLE_METADATA, StaffRole } from '@/lib/rbac';
import { 
  ShieldCheck, ArrowRight, Loader2, Sparkles, AlertCircle, 
  UserCheck, LogOut, CheckCircle2, Building2, Lock
} from 'lucide-react';

interface InviteState {
  found: boolean;
  role?: StaffRole;
  email?: string;
  isExpired?: boolean;
  status?: string;
  unmigrated?: boolean;
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const { user, profile, isStaff, isLoading: isAuthLoading, signOut } = useAuthUser();

  const [invite, setInvite] = useState<InviteState | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch invitation details
  useEffect(() => {
    let isMounted = true;
    async function checkInvite() {
      if (!inviteEmail && !token) {
        if (isMounted) setIsCheckingInvite(false);
        return;
      }

      try {
        const query = token ? `token=${encodeURIComponent(token)}` : `email=${encodeURIComponent(inviteEmail)}`;
        const res = await fetch(`/api/admin/staff/invitations/accept?${query}`);
        const data = await res.json();
        if (isMounted) {
          setInvite(data);
          setIsCheckingInvite(false);
        }
      } catch {
        if (isMounted) {
          setInvite({ found: false });
          setIsCheckingInvite(false);
        }
      }
    }

    checkInvite();
    return () => {
      isMounted = false;
    };
  }, [inviteEmail, token]);

  // 2. Accept Action
  const handleAcceptInvite = async () => {
    setIsAccepting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/staff/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token || undefined, email: inviteEmail || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccessMsg(`Welcome to the team! Your account has been upgraded to ${data.role || 'Staff'}.`);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to accept invitation');
      setIsAccepting(false);
    }
  };

  if (isAuthLoading || isCheckingInvite) {
    return (
      <div className="card" style={{ maxWidth: '520px', margin: '3rem auto', padding: '3.5rem 2rem', textAlign: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--brand-accent)', margin: '0 auto 1.25rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Verifying Staff Invitation
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
          Connecting to Falcon 3D Prints security registry...
        </p>
      </div>
    );
  }

  const assignedRole: StaffRole = invite?.role || 'production_operator';
  const roleMeta = ROLE_METADATA[assignedRole] || {
    title: assignedRole.replace('_', ' '),
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    description: 'Operational staff privileges across the Falcon 3D Prints studio hub.',
  };

  const isUserEmailMatching = user && inviteEmail && user.email?.toLowerCase() === inviteEmail.toLowerCase();
  const currentPathWithParams = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/auth/accept-invite';

  return (
    <div
      className="card"
      style={{
        maxWidth: '540px',
        margin: '2rem auto',
        padding: '2.75rem 2.25rem',
        boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
        borderRadius: '14px',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-accent)', marginBottom: '0.35rem' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            FALCON 3D PRINTS • NASHIK STUDIO
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0.5rem', letterSpacing: '-0.02em' }}>
          Staff Invitation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
          You have been invited to join the Falcon 3D Prints studio operations team.
        </p>
      </div>

      {/* Role Badge and Preview Card */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
            Designated Role
          </span>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '20px',
              background: roleMeta.badgeBg,
              color: roleMeta.badgeColor,
              fontWeight: 700,
              fontSize: '0.78rem',
              border: `1px solid ${roleMeta.badgeColor}`,
            }}
          >
            {roleMeta.title}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>
          {roleMeta.description}
        </p>

        {inviteEmail && (
          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed #CBD5E1', fontSize: '0.82rem', color: '#64748B' }}>
            Issued for: <strong style={{ color: '#0F172A' }}>{inviteEmail}</strong>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '0.86rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            color: '#15803D',
            fontSize: '0.86rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* State 1: Unauthenticated */}
      {!user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 0.5rem' }}>
            Please authenticate with <strong>{inviteEmail || 'your email'}</strong> to claim this staff role.
          </p>

          <Link
            href={`/login?next=${encodeURIComponent(currentPathWithParams)}`}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem' }}
          >
            <span>Sign In to Accept Invitation</span>
            <ArrowRight size={17} />
          </Link>

          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <Link href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Return to Public Storefront
            </Link>
          </div>
        </div>
      )}

      {/* State 2: Authenticated with Email Mismatch */}
      {user && inviteEmail && !isUserEmailMatching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.9rem',
              borderRadius: '8px',
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: '0.84rem',
              lineHeight: 1.5,
            }}
          >
            You are currently signed in as <strong>{user.email}</strong>, but this invitation is designated for <strong>{inviteEmail}</strong>.
          </div>

          <button
            onClick={() => signOut()}
            className="btn-outline"
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      )}

      {/* State 3: Authenticated with Matching Email (Ready to Accept) */}
      {user && (!inviteEmail || isUserEmailMatching) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.84rem', fontWeight: 600 }}>
            <UserCheck size={16} /> Signed in as {user.email} (Identity verified)
          </div>

          <button
            onClick={handleAcceptInvite}
            disabled={isAccepting || Boolean(successMsg)}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.95rem',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            {isAccepting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Activating Staff Account...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={19} />
                <span>Accept Invitation & Open Operations Desk</span>
              </>
            )}
          </button>

          {isStaff && (
            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
              <Link href="/admin" style={{ fontSize: '0.84rem', color: 'var(--brand-accent)', fontWeight: 600, textDecoration: 'none' }}>
                Go directly to Operations Desk &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '5rem', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', width: '100%' }}>Loading invitation...</div>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
