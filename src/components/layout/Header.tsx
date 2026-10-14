'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/store';
import { ShoppingCart, Menu, X, Compass, FileCode, User, Phone, Search } from 'lucide-react';
import CartDrawer from './CartDrawer';

export default function Header() {
  const { itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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
            style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}
            className="desktop-nav"
          >
            <Link
              href="/catalog"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <Compass size={16} style={{ color: 'var(--brand-accent)' }} />
              Catalog
            </Link>

            <Link
              href="/quote"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <FileCode size={16} />
              Custom 3D Quote
            </Link>

            <Link
              href="/account"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <User size={16} />
              Order Tracking
            </Link>

            <Link
              href="/contact"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <Phone size={15} />
              Nashik Studio
            </Link>
          </nav>

          {/* Action Header Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Quick Catalog Search Link */}
            <Link
              href="/catalog"
              aria-label="Search catalog"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                transition: 'border-color var(--transition-fast), color var(--transition-fast)',
              }}
              title="Search products"
            >
              <Search size={18} />
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
                transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
              }}
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--brand-accent)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              aria-label="Toggle mobile navigation menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
              <User size={18} />
              Order Tracking &amp; Account
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
