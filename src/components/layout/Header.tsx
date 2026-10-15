'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCart, OPEN_CART_EVENT } from '@/lib/store';
import { useAuthUser } from '@/lib/supabase/auth';
import { ShoppingCart, Menu, X, Compass, FileCode, User, Phone, Search, LogOut } from 'lucide-react';
import CartDrawer from './CartDrawer';

export default function Header() {
  const { itemCount } = useCart();
  const { user, profile, isStaff, signOut } = useAuthUser();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleOpen = () => setIsCartOpen(true);
    window.addEventListener(OPEN_CART_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CART_EVENT, handleOpen);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(250, 250, 247, 0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '4.5rem',
          }}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {/* Desktop Full Horizontal Logo */}
            <div
              className="brand-logo-desktop"
              style={{
                position: 'relative',
                height: '2.4rem',
                width: '13.75rem',
              }}
            >
              <Image
                src="/logo-horizontal.png"
                alt="Falcon 3D Prints — Where ideas take shapes"
                fill
                sizes="220px"
                style={{ objectFit: 'contain', objectPosition: 'left center' }}
                priority
              />
            </div>

            {/* Mobile Full Horizontal Logo */}
            <div
              className="brand-logo-mobile"
              style={{
                position: 'relative',
                height: '1.9rem',
                width: '10.8rem',
              }}
            >
              <Image
                src="/logo-horizontal.png"
                alt="Falcon 3D Prints"
                fill
                sizes="175px"
                style={{ objectFit: 'contain', objectPosition: 'left center' }}
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}
            className="desktop-nav"
            aria-label="Primary navigation"
          >
            <Link
              href="/catalog"
              className={`nav-link${pathname.startsWith('/catalog') ? ' active' : ''}`}
            >
              <Compass size={15} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
              Catalog
            </Link>

            <Link
              href="/quote"
              className={`nav-link${pathname === '/quote' ? ' active' : ''}`}
            >
              <FileCode size={15} style={{ flexShrink: 0 }} />
              Custom 3D Quote
            </Link>

            <Link
              href="/account"
              className={`nav-link${pathname.startsWith('/account') ? ' active' : ''}`}
            >
              <User size={15} style={{ flexShrink: 0 }} />
              Order Tracking
            </Link>

            <Link
              href="/contact"
              className={`nav-link${pathname === '/contact' ? ' active' : ''}`}
            >
              <Phone size={14} style={{ flexShrink: 0 }} />
              Nashik Studio
            </Link>
          </nav>

          {/* Action Header Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Quick Catalog Search Link */}
            <Link
              href="/catalog"
              aria-label="Search catalog"
              className="btn-icon"
              title="Search products"
            >
              <Search size={17} />
            </Link>

            {/* User Account / Login Link */}
            <Link
              href={user ? (isStaff ? '/admin' : '/account') : '/login'}
              aria-label={user ? `Account (${profile?.full_name || user.email})` : 'Sign in with Google'}
              className="btn-icon"
              title={user ? `Signed in as ${user.email}` : 'Sign in with Google'}
              style={{
                position: 'relative',
                color: user ? 'var(--brand-accent)' : 'var(--text-secondary)',
              }}
            >
              <User size={17} />
              {user && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    border: '1px solid var(--surface)',
                  }}
                />
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart with ${itemCount} items`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--action-primary)',
                border: '1px solid var(--action-primary)',
                color: '#FFFFFF',
                flexShrink: 0,
                transition: 'background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary-hover)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--action-primary)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <ShoppingCart size={17} />
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--brand-accent)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    width: '1.2rem',
                    height: '1.2rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    lineHeight: 1,
                  }}
                  aria-live="polite"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle btn-icon"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              style={{ display: 'none' }}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0',
              }}
            >
              <Compass size={18} style={{ color: 'var(--brand-accent)' }} />
              Browse Catalog
            </Link>
            <Link
              href="/quote"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0',
              }}
            >
              <FileCode size={18} />
              Custom 3D Quotation
            </Link>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.25rem' }}>
                <Link
                  href={isStaff ? '/admin' : '/account'}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <User size={16} style={{ color: 'var(--brand-accent)' }} />
                  <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--brand-accent)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0',
                }}
              >
                <User size={18} />
                Sign In with Google
              </Link>
            )}

            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0',
              }}
            >
              <Compass size={18} />
              Order Tracking &amp; Status
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0',
              }}
            >
              <Phone size={18} />
              Nashik Studio &amp; Workshop
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.9rem',
                color: 'var(--action-primary)',
                fontWeight: 600,
                padding: '0.5rem 0',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '0.25rem',
              }}
            >
              Staff Production Portal →
            </Link>
          </div>
        )}
      </header>

      {/* Cart Drawer Modal */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <style jsx global>{`
        .brand-logo-desktop {
          display: block !important;
        }
        .brand-logo-mobile {
          display: none !important;
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
          .brand-logo-desktop {
            display: none !important;
          }
          .brand-logo-mobile {
            display: block !important;
            height: 1.85rem !important;
            width: 10.6rem !important;
          }
        }
        @media (max-width: 420px) {
          .brand-logo-mobile {
            height: 1.6rem !important;
            width: 9.15rem !important;
          }
        }
      `}</style>
    </>
  );
}
