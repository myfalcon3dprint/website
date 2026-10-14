'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStaffRole } from '@/lib/store';
import { 
  LayoutDashboard, ShoppingBag, Cpu, MessageSquare, 
  Layers, ArrowLeft, ShieldCheck 
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders & Fulfilment', icon: ShoppingBag },
  { href: '/admin/queue', label: 'Print Farm Queue', icon: Cpu },
  { href: '/admin/quotes', label: 'Custom STL Quotes', icon: MessageSquare },
  { href: '/admin/products', label: 'Catalog & Stock', icon: Layers },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeStaff, switchRole, staffUsers } = useStaffRole();

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
                Nashik Hub v2.1
              </span>
            </div>
          </div>

          {/* Role switcher & active operator identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} style={{ color: 'var(--status-ready)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeStaff.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  Role: <strong style={{ color: 'var(--text-primary)' }}>{activeStaff.role.replace('_', ' ')}</strong>
                </div>
              </div>
            </div>

            <select
              value={activeStaff.id}
              onChange={(e) => switchRole(e.target.value)}
              className="input"
              style={{
                padding: '3px 8px',
                fontSize: '0.75rem',
                width: 'auto',
                height: 'auto',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-control)',
              }}
              title="Switch Staff Role Preview"
            >
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  Switch to: {u.name} ({u.role})
                </option>
              ))}
            </select>
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
