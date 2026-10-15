'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthUser } from '@/lib/supabase/auth';
import { 
  LayoutDashboard, ShoppingBag, Cpu, MessageSquare, 
  Layers, ArrowLeft, ShieldCheck, LogOut, Lock, AlertTriangle, Tags
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders & Fulfilment', icon: ShoppingBag },
  { href: '/admin/queue', label: 'Print Farm Queue', icon: Cpu },
  { href: '/admin/quotes', label: 'Custom STL Quotes', icon: MessageSquare },
  { href: '/admin/products', label: 'Catalog & Stock', icon: Layers },
  { href: '/admin/categories', label: 'Categories CMS', icon: Tags },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, isStaff, isLoading, signOut } = useAuthUser();
  // Authentication loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '2px solid var(--border-decor)', borderTopColor: 'var(--brand-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
          <div>Verifying administrative session...</div>
        </div>
      </div>
    );
  }

  // Unauthorized screen if user is not authenticated or lacks staff role
  if (!user || !isStaff) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Lock size={32} />
          </div>

          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            Administrative Access Restricted
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {user
              ? `You are signed in as ${user.email}, which has the '${profile?.role || 'customer'}' role. Only authorized Falcon studio staff may access this operations desk.`
              : 'You must sign in with an authorized staff account to access the Falcon operations desk.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user ? (
              <>
                <Link href="/account" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Return to Customer Portal
                </Link>
                <button onClick={() => signOut()} className="btn-outline" style={{ justifyContent: 'center' }}>
                  Sign Out & Switch Account
                </button>
              </>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary" style={{ justifyContent: 'center' }}>
                Sign in with Staff Account
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Staff Member';
  const staffRole = profile?.role || 'staff';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      {/* Admin Top Navigation Bar */}
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Logo & Subsystem Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={15} /> Storefront
            </Link>

            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                FALCON<span style={{ color: 'var(--brand-accent)' }}>ADMIN</span>
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  textTransform: 'uppercase',
                }}
              >
                Nashik Hub • Verified
              </span>
            </div>
          </div>

          {/* Authenticated Staff Identity (Server-Verified) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--status-ready)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {staffName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', textTransform: 'capitalize', fontWeight: 600 }}>
                  Role: {staffRole.replace('_', ' ')}
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Sign Out of Operations Desk"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div
            className="container"
            style={{
              display: 'flex',
              gap: '4px',
              padding: '0 24px',
              overflowX: 'auto',
            }}
          >
            {ADMIN_NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderBottom: `2px solid ${isActive ? 'var(--action-primary)' : 'transparent'}`,
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={15} style={{ color: isActive ? 'var(--brand-accent)' : 'var(--text-muted)' }} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ paddingBottom: '60px' }}>{children}</main>
    </div>
  );
}
