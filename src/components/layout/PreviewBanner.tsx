'use client';

import React from 'react';
import Link from 'next/link';
import { useStaffRole } from '@/lib/store';
import { ExternalLink } from 'lucide-react';

export default function PreviewBanner() {
  const { activeStaff, switchRole, staffUsers } = useStaffRole();

  return (
    <aside
      aria-label="Staff Preview Controls"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'rgba(24, 24, 24, 0.92)',
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
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#22C55E',
              display: 'inline-block',
              boxShadow: '0 0 6px #22C55E',
            }}
          />
          <span
            style={{
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#FAFAF7',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
            }}
          >
            Preview
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <label htmlFor="staff-role-select" style={{ color: '#A1A1AA', fontSize: '0.72rem' }}>
            Role:
          </label>
          <select
            id="staff-role-select"
            value={activeStaff.id}
            onChange={(e) => switchRole(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.15rem 0.4rem',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontWeight: 600,
              outline: 'none',
            }}
            aria-label="Switch Staff Role for Testing"
          >
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id} style={{ background: '#181818', color: '#FFFFFF' }}>
                {u.role.toUpperCase()} ({u.name.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

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
          <span>Admin</span>
          <ExternalLink size={11} />
        </Link>
      </div>
    </aside>
  );
}

