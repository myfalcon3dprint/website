'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthUser } from '@/lib/supabase/auth';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export default function PreviewBanner() {
  const pathname = usePathname();
  const { user, profile, isStaff } = useAuthUser();

  // Do not display on admin portal or customer homepage
  if (pathname?.startsWith('/admin') || pathname === '/') {
    return null;
  }

  // Only display badge if authenticated staff member
  if (!user || !isStaff) {
    return null;
  }

  const roleName = profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'STAFF';

  return (
    <aside
      aria-label="Staff Access Badge"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '1.25rem',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'rgba(24, 24, 24, 0.94)',
          color: '#FFFFFF',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          padding: '0.4rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} style={{ color: 'var(--status-ready)' }} />
          <span
            style={{
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#FAFAF7',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
            }}
          >
            Staff: {roleName}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)' }} />

        <Link
          href="/admin"
          style={{
            color: 'var(--brand-accent)',
            fontWeight: 700,
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 113, 0, 0.16)',
            textDecoration: 'none',
          }}
        >
          <span>Admin Portal</span>
          <ExternalLink size={11} />
        </Link>
      </div>
    </aside>
  );
}
