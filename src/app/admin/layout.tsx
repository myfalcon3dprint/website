'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthUser } from '@/lib/supabase/auth';
import { canAccessAdminRoute, ROLE_METADATA, StaffRole } from '@/lib/rbac';
import { 
  LayoutDashboard, ShoppingBag, Cpu, Truck, 
  Layers, Tags, Video, Home, Palette, 
  Users, FileCode, Boxes, MessageSquare, Star, 
  Mail, BarChart3, ShieldCheck, Settings, History, 
  Menu, X, LogOut, ArrowLeft, Lock, UserCheck, ShieldAlert, Eye
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: string;
  aliases?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Sales & Operations',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/production', label: 'Production & Quality Check', icon: Cpu, aliases: ['/admin/queue'] },
      { href: '/admin/shipping', label: 'Shipping & Delivery', icon: Truck },
    ],
  },
  {
    title: 'Products & Storefront',
    items: [
      { href: '/admin/products', label: 'Products', icon: Layers },
      { href: '/admin/categories', label: 'Categories', icon: Tags },
      { href: '/admin/videos', label: 'Product Videos', icon: Video },
      { href: '/admin/homepage', label: 'Homepage', icon: Home },
      { href: '/admin/branding', label: 'Branding & Appearance', icon: Palette },
    ],
  },
  {
    title: 'Customers & Communication',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/custom-requests', label: 'Custom Print Requests', icon: FileCode, aliases: ['/admin/quotes'] },
      { href: '/admin/bulk-enquiries', label: 'Bulk Enquiries', icon: Boxes },
      { href: '/admin/messages', label: 'Contact Messages', icon: MessageSquare },
      { href: '/admin/reviews', label: 'Product Reviews', icon: Star },
      { href: '/admin/email-templates', label: 'Email Templates', icon: Mail },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/admin/staff', label: 'Staff & Permissions', icon: ShieldCheck },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/activity', label: 'Activity History', icon: History },
    ],
  },
];

import { AdminRoleContext } from '@/lib/adminRoleContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, isStaff, isLoading, signOut } = useAuthUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState<StaffRole | null>(null);

  // Authentication loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'inline-block', width: '2.25rem', height: '2.25rem', border: '3px solid var(--border-decor)', borderTopColor: 'var(--brand-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Loading Falcon Operations Desk...</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Verifying secure administrative permissions</div>
        </div>
      </div>
    );
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const effectiveIsStaff = isStaff || (isDev && !user);

  // Determine authoritative profile role
  const actualRole: StaffRole = (profile?.role as StaffRole) || (isDev && !user ? 'owner' : 'customer' as any);
  const isActualSuperAdmin = actualRole === 'owner';

  // Visual Preview: ONLY permitted for genuine Super Admin ('owner').
  // A non-owner can NEVER trigger preview mode or change their permissions.
  const isPreviewMode = isActualSuperAdmin && previewRole !== null && previewRole !== 'owner';
  const effectiveRole: StaffRole = isPreviewMode ? (previewRole as StaffRole) : actualRole;

  const staffName = profile?.full_name || user?.email?.split('@')[0] || (isDev && !user ? 'Studio Director' : 'Staff Member');
  const roleMeta = ROLE_METADATA[effectiveRole] || {
    title: effectiveRole.replace('_', ' '),
    badgeColor: '#C2410C',
    badgeBg: '#FFF7ED',
    description: 'Operational staff member',
  };

  // Unauthorized screen if user is not authenticated or lacks staff role
  if (!effectiveIsStaff && !isDev) {
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

          <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            Administrative Access Restricted
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {user
              ? `Signed in as ${user.email} (${profile?.role || 'customer'}). Only authorized Falcon 3D Prints staff may access this operations panel.`
              : 'Sign in with an authorized staff account to access store operations.'}
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

  // Filter navigation groups by permissions of the effective role
  const filteredNavGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessAdminRoute(effectiveRole, item.href)),
  })).filter((group) => group.items.length > 0);

  // Validate whether the current URL route is permitted for the active role
  const isPathAuthorized = canAccessAdminRoute(effectiveRole, pathname);

  const isRouteActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.aliases && item.aliases.includes(pathname)) return true;
    if (item.href !== '/admin' && pathname.startsWith(item.href)) return true;
    return false;
  };

  return (
    <AdminRoleContext.Provider
      value={{
        effectiveRole,
        actualRole,
        isPreviewMode,
        canMutate: !isPreviewMode,
      }}
    >
      <div className="admin-layout-root" style={{ minHeight: '100vh', display: 'flex', background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
        {/* Mobile Top Header */}
        <div
          className="mobile-admin-header"
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 60,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              FALCON<span style={{ color: 'var(--brand-accent)' }}>ADMIN</span>
            </span>
          </div>

          <Link
            href="/"
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={13} /> Store
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <aside
          className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
          style={{
            width: '260px',
            flexShrink: 0,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 50,
            overflowY: 'auto',
          }}
        >
          {/* Sidebar Brand Header */}
          <div
            style={{
              padding: '1.25rem 1.25rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <Link
                href="/admin"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--brand-accent), #FF8A65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                  }}
                >
                  F
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  FALCON<span style={{ color: 'var(--brand-accent)' }}>ADMIN</span>
                </div>
              </Link>

              <Link
                href="/"
                title="View Public Storefront"
                style={{
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={16} />
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Nashik Operations Hub
              </span>
            </div>
          </div>

          {/* Sidebar Nav Items (Filtered by Role Permissions) */}
          <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredNavGroups.map((group) => (
              <div key={group.title}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    padding: '0 0.65rem 0.4rem',
                  }}
                >
                  {group.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {group.items.map((item) => {
                    const active = isRouteActive(item);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: active ? 700 : 500,
                          textDecoration: 'none',
                          color: active ? '#9A3412' : '#475569',
                          background: active ? '#FFF7ED' : 'transparent',
                          borderLeft: `3px solid ${active ? '#C2410C' : 'transparent'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Icon
                            size={17}
                            style={{
                              color: active ? '#9A3412' : '#64748B',
                              flexShrink: 0,
                            }}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: '#C2410C',
                              color: '#FFFFFF',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Authenticated Staff Card & Preview Selector */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderTop: '1px solid var(--border-subtle, #E2E8F0)',
              background: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: roleMeta.badgeBg,
                    border: `1px solid ${roleMeta.badgeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: roleMeta.badgeColor,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    flexShrink: 0,
                  }}
                >
                  {staffName.charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {staffName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: roleMeta.badgeColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {roleMeta.title}
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                title="Sign Out of Operations Desk"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Visual Preview Mode: Strictly Reserved for Authenticated Super Admin */}
            {isActualSuperAdmin && (
              <div
                style={{
                  marginTop: '0.5rem',
                  paddingTop: '0.45rem',
                  borderTop: '1px dashed #CBD5E1',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: '#475569', fontWeight: 600 }}>
                  <UserCheck size={11} /> Super Admin Visual Preview:
                </div>
                <select
                  value={previewRole || 'owner'}
                  onChange={(e) => setPreviewRole(e.target.value === 'owner' ? null : (e.target.value as StaffRole))}
                  style={{
                    width: '100%',
                    fontSize: '0.72rem',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #64748B',
                    color: '#0F172A',
                  }}
                >
                  <option value="owner">None (Full Owner Access)</option>
                  <option value="order_manager">Preview as Order Manager</option>
                  <option value="production_operator">Preview as Production Operator</option>
                  <option value="catalog_editor">Preview as Catalog Editor</option>
                </select>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            minHeight: '100vh',
            background: '#F8FAFC',
          }}
        >
          {/* Prominent Preview Mode Banner */}
          {isPreviewMode && (
            <div
              style={{
                background: '#FEF3C7',
                borderBottom: '1px solid #F59E0B',
                padding: '0.6rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#92400E',
                fontSize: '0.82rem',
                fontWeight: 600,
                position: 'sticky',
                top: 0,
                zIndex: 40,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} />
                <span>
                  PREVIEW MODE: Viewing interface as <strong>{roleMeta.title}</strong>. Visual layout preview only. Business mutations are disabled.
                </span>
              </div>
              <button
                onClick={() => setPreviewRole(null)}
                style={{
                  background: '#92400E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exit Preview
              </button>
            </div>
          )}

          {/* Authorization Gate */}
          <div style={{ flex: 1, paddingBottom: '3rem' }}>
            {isPathAuthorized ? (
              children
            ) : (
              <div style={{ padding: '4rem 1.5rem', maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}>
                <div
                  style={{
                    width: '4.5rem',
                    height: '4.5rem',
                    borderRadius: '50%',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}
                >
                  <ShieldAlert size={36} />
                </div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                  Permission Denied
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                  Your role <strong>({roleMeta.title})</strong> does not possess authorization to access <code>{pathname}</code>.
                  This administrative module is restricted to authorized roles.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  <Link
                    href="/admin"
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <ArrowLeft size={16} /> Return to Permitted Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>

        <style jsx global>{`
          @media (max-width: 900px) {
            .mobile-admin-header {
              display: flex !important;
            }
            .admin-sidebar {
              position: fixed !important;
              left: -270px;
              top: 56px !important;
              height: calc(100vh - 56px) !important;
              transition: left 0.25s ease;
            }
            .admin-sidebar.mobile-open {
              left: 0 !important;
            }
            main {
              margin-top: 56px;
            }
          }
        `}</style>
      </div>
    </AdminRoleContext.Provider>
  );
}
