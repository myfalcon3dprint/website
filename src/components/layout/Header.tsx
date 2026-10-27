'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart, useProducts, OPEN_CART_EVENT } from '@/lib/store';
import { Product } from '@/lib/types';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import {
  ShoppingCart,
  Menu,
  X,
  Compass,
  FileCode,
  User,
  Phone,
  Search,
  LogOut,
  ArrowRight,
  Sparkles,
  Heart,
  ChevronDown,
} from 'lucide-react';
import CartDrawer from './CartDrawer';
import AnnouncementBar from './AnnouncementBar';

export default function Header() {
  const router = useRouter();
  const { itemCount } = useCart();
  const { products } = useProducts();
  const { user, profile, isStaff, signOut } = useAuthUser();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);
  const [badgeAnimated, setBadgeAnimated] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchDialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Scroll listener for sticky header elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Open cart drawer from global custom event
  useEffect(() => {
    const handleOpen = () => setIsCartOpen(true);
    window.addEventListener(OPEN_CART_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CART_EVENT, handleOpen);
  }, []);

  // Trigger bounce animation when itemCount changes
  useEffect(() => {
    if (itemCount !== prevCount) {
      setBadgeAnimated(true);
      setPrevCount(itemCount);
      const timer = setTimeout(() => setBadgeAnimated(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount, prevCount]);

  // Handle search overlay open & auto focus
  useEffect(() => {
    if (isSearchOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 60);

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsSearchOpen(false);
        if (e.key === 'Tab') {
          const items = searchDialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex="0"]');
          const first = items?.[0];
          const last = items?.[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      };
      window.addEventListener('keydown', handleKey);

      return () => {
        document.body.style.overflow = origOverflow;
        window.removeEventListener('keydown', handleKey);
        clearTimeout(focusTimer);
        searchTriggerRef.current?.focus();
      };
    }
  }, [isSearchOpen]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Filter products for quick search
  const searchResults = searchQuery.trim()
    ? products
        .filter((p: Product) => {
          if (p.isPublished === false || p.archivedAt) return false;
          const q = searchQuery.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  const handleSelectSearchResult = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(`/catalog/${slug}`);
  };

  return (
    <>
      <a
        href="#main-content"
        className="skip-to-content"
        style={{
          position: 'absolute',
          top: '-200px',
          left: '1rem',
          zIndex: 9999,
          background: '#1A1816',
          color: '#FAF7F2',
          padding: '0.6rem 1.1rem',
          borderRadius: '4px',
          fontSize: '0.88rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Skip to main content
      </a>

      <header
        className={pathname === '/' ? 'home-header' : undefined}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: pathname === '/' ? '#10100F' : (isScrolled ? 'rgba(251, 249, 245, 0.96)' : 'rgba(251, 249, 245, 0.92)'),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: pathname === '/' ? '1px solid rgba(217, 194, 163, 0.12)' : (isScrolled ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)'),
          boxShadow: pathname === '/' ? '0 4px 24px rgba(0,0,0,0.45)' : (isScrolled ? 'var(--shadow-subtle)' : 'none'),
          transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
        }}
      >
        <AnnouncementBar />
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: pathname === '/' ? '5.2rem' : '4.5rem',
            gap: '1.25rem',
          }}
        >
          {/* Brand Logo - Single responsive wrap */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div
              className="brand-logo-wrap"
              style={{
                position: 'relative',
                height: pathname === '/' ? 'clamp(2.1rem, 3.8vw, 3.2rem)' : 'clamp(1.85rem, 3vw, 2.3rem)',
                width: pathname === '/' ? 'clamp(9.5rem, 24vw, 16.5rem)' : 'clamp(9rem, 18vw, 13.5rem)',
              }}
            >
              <Image
                src={pathname === '/' ? '/logo-horizontal-light.png' : '/logo-horizontal.png'}
                alt="Falcon 3D Prints — Where ideas take shapes"
                fill
                sizes="(max-width: 768px) 160px, 340px"
                style={{ objectFit: 'contain', objectPosition: 'left center' }}
                priority
              />
            </div>
          </Link>

          {/* Homepage Center Search Pill */}
          {pathname === '/' ? (
            <div
              className="home-search-pill"
              onClick={() => setIsSearchOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') setIsSearchOpen(true); }}
              style={{
                flex: '1',
                maxWidth: '480px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(217, 194, 163, 0.22)',
                cursor: 'pointer',
                color: 'rgba(245, 239, 229, 0.72)',
                fontSize: '0.84rem',
                transition: 'border-color 180ms ease, background 180ms ease',
              }}
            >
              <Search size={15} style={{ color: '#F45112', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Search for temple replicas, planters, accessories...
              </span>
            </div>
          ) : (
            /* Desktop Navigation for other routes */
            <nav
              style={{ display: 'flex', alignItems: 'center', gap: '1.85rem' }}
              className="desktop-nav"
              aria-label="Primary navigation"
            >
              <Link
                href="/catalog"
                className={`nav-link${pathname.startsWith('/catalog') ? ' active' : ''}`}
              >
                <Compass size={15} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                <span>Catalog</span>
              </Link>

              <Link
                href="/catalog?sort=bestselling"
                className={`nav-link${pathname.includes('bestselling') ? ' active' : ''}`}
              >
                <Sparkles size={15} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                <span>Bestsellers</span>
              </Link>

              <Link
                href="/account"
                className={`nav-link${pathname.startsWith('/account') ? ' active' : ''}`}
              >
                <User size={15} style={{ flexShrink: 0 }} />
                <span>Order Tracking</span>
              </Link>

              <Link
                href="/contact"
                className={`nav-link${pathname === '/contact' ? ' active' : ''}`}
              >
                <Phone size={14} style={{ flexShrink: 0 }} />
                <span>Nashik Studio</span>
              </Link>
            </nav>
          )}

          {/* Action Header Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Quick Catalog Search Trigger for mobile or non-home */}
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search creations and products"
              className={pathname === '/' ? 'mobile-search-btn header-action-btn' : 'btn-icon'}
              title="Search catalog (Press Esc to close)"
            >
              <Search size={18} />
            </button>

            {/* Wishlist Link on Desktop */}
            {pathname === '/' && (
              <Link
                href="/catalog?filter=wishlist"
                aria-label="Wishlist"
                className="header-action-btn header-wishlist-link desktop-only-action"
                title="Your Wishlist"
              >
                <Heart size={19} />
              </Link>
            )}

            {/* User Account / Login Link on Desktop */}
            <Link
              href={user ? (isStaff ? '/admin' : '/account') : '/login'}
              aria-label={user ? `Account (${profile?.full_name || user.email})` : 'Sign in with Google'}
              className={pathname === '/' ? 'header-action-btn header-account-link desktop-only-action' : 'btn-icon header-account-link desktop-only-action'}
              title={user ? `Signed in as ${user.email}` : 'Sign in with Google'}
            >
              <User size={19} />
              {user && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '1px solid var(--surface)',
                  }}
                />
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart with ${itemCount} items`}
              className={pathname === '/' ? 'header-action-btn header-cart-btn' : undefined}
              style={
                pathname === '/'
                  ? undefined
                  : {
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
                      cursor: 'pointer',
                    }
              }
            >
              <ShoppingCart size={19} />
              {itemCount > 0 && (
                <span
                  className={badgeAnimated ? 'badge-pop' : ''}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--brand-accent)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
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
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={pathname === '/' ? 'mobile-toggle header-action-btn' : 'mobile-toggle btn-icon'}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              style={{ display: 'none', cursor: 'pointer' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Homepage Category Sub-Navigation Bar */}
        {pathname === '/' && (
          <div
            className="home-subnav-bar"
            style={{
              borderTop: '1px solid rgba(217, 194, 163, 0.08)',
              background: '#0D0C0B',
              padding: '0.5rem 0',
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(1rem, 2.5vw, 2.4rem)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Link href="/catalog" className="home-subnav-link">
                <span>All prints</span>
                <ChevronDown size={11} style={{ opacity: 0.7 }} />
              </Link>
              <Link href="/catalog?category=Planters%20%26%20Decor" className="home-subnav-link">
                Planters &amp; Decor
              </Link>
              <Link href="/catalog?category=Desk%20Accessories" className="home-subnav-link">
                Desk Accessories
              </Link>
              <Link href="/catalog?category=Miniatures%20%26%20Collectibles" className="home-subnav-link">
                Collectibles
              </Link>
              <Link href="/catalog?category=Scale%20Models" className="home-subnav-link">
                Scale Models
              </Link>
              <Link href="/catalog?sort=bestselling" className="home-subnav-link home-subnav-highlight">
                Bestsellers
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-dropdown)',
              animation: 'mobileSheetIn 240ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-drawer-link"
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0',
                transition: 'color var(--duration-fast) ease',
              }}
            >
              <Compass size={18} style={{ color: 'var(--brand-accent)' }} />
              Browse Catalog
            </Link>

            <Link
              href="/catalog?filter=wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-drawer-link"
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0',
                transition: 'color var(--duration-fast) ease',
              }}
            >
              <Heart size={18} style={{ color: 'var(--brand-accent)' }} />
              Saved Wishlist
            </Link>

            <Link
              href="/quote"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-drawer-link"
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0',
                transition: 'color var(--duration-fast) ease',
              }}
            >
              <FileCode size={18} />
              Custom 3D Quotation
            </Link>

            {user ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  margin: '0.2rem 0',
                }}
              >
                <Link
                  href={isStaff ? '/admin' : '/account'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-drawer-link"
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'color var(--duration-fast) ease',
                  }}
                >
                  <User size={16} style={{ color: 'var(--brand-accent)' }} />
                  <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
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
                className="mobile-drawer-link"
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--brand-accent)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0',
                  transition: 'color var(--duration-fast) ease',
                }}
              >
                <User size={18} />
                Sign In with Google
              </Link>
            )}

            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-drawer-link"
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0',
                transition: 'color var(--duration-fast) ease',
              }}
            >
              <Compass size={18} />
              Order Tracking &amp; Status
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-drawer-link"
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0',
                transition: 'color var(--duration-fast) ease',
              }}
            >
              <Phone size={18} />
              Nashik Studio &amp; Workshop
            </Link>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-drawer-link"
              style={{
                fontSize: '0.88rem',
                color: 'var(--action-primary)',
                fontWeight: 600,
                padding: '0.6rem 0',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'color var(--duration-fast) ease',
              }}
            >
              <span>Staff Production Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </header>

      {/* QUICK SEARCH OVERLAY */}
      {isSearchOpen && (
        <div
          ref={searchDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Studio Catalog Quick Search"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 95,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 'clamp(2rem, 10vh, 5rem)',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsSearchOpen(false)}
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26, 24, 22, 0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              animation: 'backdropFadeIn 200ms ease-out',
            }}
          />

          {/* Search Card Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '620px',
              margin: '0 1rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-dropdown)',
              overflow: 'hidden',
              zIndex: 100,
              animation: 'searchCardIn 220ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                gap: '0.75rem',
              }}
            >
              <Search size={20} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                aria-label="Search products"
                placeholder="Search planters, miniatures, desk organizers, models..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'Enter' && searchQuery.trim()) {
                    setIsSearchOpen(false);
                    router.push(`/catalog?query=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.55rem',
                  cursor: 'pointer',
                }}
              >
                ESC
              </button>
            </div>

            {/* Quick Domain Pills */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                background: 'var(--surface-alt)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                overflowX: 'auto',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Categories:
              </span>
              {[
                'Planters & Decor',
                'Miniatures & Collectibles',
                'Desk Accessories',
                'Architectural Models',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    router.push(`/catalog?category=${encodeURIComponent(cat)}`);
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem 0' }}>
              {searchQuery.trim() === '' ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>
                    Type a creation title or material to discover 3D-printed editions.
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    No studio creations matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Have a custom CAD file? You can submit an STL file for a bespoke quotation.
                  </p>
                  <Link
                    href="/quote"
                    onClick={() => setIsSearchOpen(false)}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                  >
                    Custom 3D Print Quote
                  </Link>
                </div>
              ) : (
                searchResults.map((product: Product) => {
                  const firstVariant = product.variants[0];
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectSearchResult(product.slug)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter') handleSelectSearchResult(product.slug);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.75rem 1.25rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background var(--duration-fast) ease',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '3.2rem',
                          height: '3.2rem',
                          borderRadius: 'var(--radius-xs)',
                          overflow: 'hidden',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          flexShrink: 0,
                        }}
                      >
                        {product.images && product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : null}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {product.category}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>•</span>
                          <span
                            className={`badge ${product.stockType === 'ready_stock' ? 'badge-ready' : 'badge-mto'}`}
                            style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}
                          >
                            {product.stockType === 'ready_stock' ? 'Ready Stock' : 'Made to Order'}
                          </span>
                        </div>
                        <p style={{ margin: '0.15rem 0 0', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.title}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className="tabular-num" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {formatINR(product.basePricePaise)}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* View Full Catalog Link */}
            {searchResults.length > 0 && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'var(--surface-alt)',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <Link
                  href={`/catalog?query=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setIsSearchOpen(false)}
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--brand-accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>View all matching results in Catalog</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <style jsx global>{`
        @keyframes searchCardIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes mobileSheetIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
