import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--surface-alt)',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        paddingTop: '3.5rem',
        paddingBottom: '2.5rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand Col */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ position: 'relative', height: '2.4rem', width: '13.75rem', marginBottom: '0.85rem' }}>
              <Image
                src="/logo-horizontal.png"
                alt="Falcon 3D Prints"
                fill
                sizes="220px"
                style={{ objectFit: 'contain', objectPosition: 'left center' }}
              />
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--brand-accent)', fontWeight: 600, marginBottom: '0.65rem' }}>
              &ldquo;Where ideas take shapes&rdquo;
            </p>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Contemporary additive manufacturing studio based in Nashik, Maharashtra. Engineering architectural scale models, functional desk accessories, and custom collector miniatures.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                <a
                  href="tel:+919850607144"
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  +91 98506 07144
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={14} style={{ color: 'var(--brand-accent)', marginTop: '0.2rem', flexShrink: 0 }} />
                <span>Uttam Nagar, CIDCO, Nashik, Maharashtra 422009</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Catalog
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <li>
                <Link href="/catalog?category=Planters%20%26%20Decor">
                  Planters &amp; Modern Decor
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Miniatures%20%26%20Collectibles">
                  Articulated &amp; Fantasy Miniatures
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Desk%20Accessories">
                  Desk Ergonomics &amp; Organizers
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Architectural%20Models">
                  Architectural &amp; Temple Scale Models
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Kitchen%20Miniatures">
                  Heritage Miniature Cookware
                </Link>
              </li>
            </ul>
          </div>

          {/* Custom Services */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Custom Prototyping
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <li>
                <Link
                  href="/quote"
                  style={{ color: 'var(--brand-accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span>Instant 3D Print Quote</span>
                  <ArrowUpRight size={13} />
                </Link>
              </li>
              <li>
                <Link href="/quote">Bulk Manufacturing &amp; Fleet Orders</Link>
              </li>
              <li>
                <Link href="/catalog">Rapid Prototyping (FDM &amp; SLA)</Link>
              </li>
              <li>
                <Link href="/account">Track Active Order Status</Link>
              </li>
              <li>
                <Link href="/admin" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  Staff Production Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio Standards */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Studio Standards
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
              Each physical piece is sliced, printed, and deburred in our Nashik studio using calibrated engineering-grade filaments and photopolymer resins.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Note: Miniature kitchen items and temple models are decorative collector editions and not intended for food contact or outdoor structural use.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.77rem',
            color: 'var(--text-muted)',
          }}
        >
          <p>&copy; {new Date().getFullYear()} Falcon 3D Prints. All rights reserved. Nashik, Maharashtra, India.</p>

          <nav aria-label="Legal links" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/policies/shipping">Shipping Policy</Link>
            <Link href="/policies/returns">Return &amp; Replacement</Link>
            <Link href="/policies/terms">Terms of Service</Link>
            <Link href="/contact">Contact Support</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
