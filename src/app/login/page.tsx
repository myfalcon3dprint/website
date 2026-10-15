'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthUser } from '@/lib/supabase/auth';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';

  const { user, profile, isStaff, signInWithGoogle, signInWithPassword, signUpWithPassword, signOut } = useAuthUser();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Google OAuth action
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const res = await signInWithGoogle(nextUrl);
      if (res.error) {
        setErrorMessage(res.error);
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google authentication failed');
      setIsGoogleLoading(false);
    }
  };

  // 2. Email/Password action
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (mode === 'signin') {
      const res = await signInWithPassword(email, password);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else {
        router.push(nextUrl);
      }
    } else {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        setIsLoading(false);
        return;
      }
      const res = await signUpWithPassword(email, password, fullName);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else {
        setSuccessMessage('Account created! Please check your email to confirm registration or sign in.');
        setIsLoading(false);
        setMode('signin');
      }
    }
  };

  // If already authenticated
  if (user) {
    return (
      <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: 'rgba(255, 113, 0, 0.12)',
            color: 'var(--brand-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <ShieldCheck size={32} />
        </div>

        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SESSION ACTIVE
        </span>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0.35rem 0 0.5rem' }}>
          Welcome back, {profile?.full_name || user.email?.split('@')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
          Signed in as <strong>{user.email}</strong>
          {isStaff && <span style={{ display: 'block', color: 'var(--brand-accent)', fontWeight: 600, marginTop: '0.25rem' }}>Studio Staff Role: {profile?.role}</span>}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href={isStaff ? '/admin' : '/account'} className="btn-primary" style={{ justifyContent: 'center' }}>
            <span>{isStaff ? 'Open Admin Control Hub' : 'Go to Customer Portal'}</span>
            <ArrowRight size={16} />
          </Link>

          <button
            onClick={() => signOut()}
            className="btn-outline"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        padding: '2.5rem 2rem',
        boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-accent)', marginBottom: '0.25rem' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            FALCON 3D PRINTS ACCOUNT
          </span>
        </div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: '0.2rem 0 0.4rem', letterSpacing: '-0.02em' }}>
          {mode === 'signin' ? 'Sign in to Falcon' : 'Create an Account'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
          Track custom slicing quotes, order milestones, and delivery dispatch.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#EF4444',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#22C55E',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {/* Primary Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #D1D5DB',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!isGoogleLoading) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.14)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.5rem 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          or email
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mode === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Rohit Verma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email"
              className="input"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="password"
              className="input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>{mode === 'signin' ? 'Sign In with Password' : 'Create Falcon Account'}</span>
          )}
        </button>
      </form>

      {/* Toggle between sign in and sign up */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {mode === 'signin' ? (
          <>
            Need an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--brand-accent)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Sign up here
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--brand-accent)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '5rem' }}>
      <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>Loading login options...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
