'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer
      className={pathname === '/' ? 'storefront-footer home-footer' : 'storefront-footer'}
      style={{
        background: 'linear-gradient(180deg, #181513 0%, #100E0D 100%)',
        borderTop: '1px solid rgba(212, 175, 55, 0.28)',
        marginTop: 'auto',
        paddingTop: '4rem',
        paddingBottom: '2.5rem',
        color: '#D4CDC3',
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
          <div style={{ maxWidth: '380px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                position: 'relative',
                height: '3.5rem',
                width: '17.5rem',
                marginBottom: '1rem',
              }}
            >
              <Image
                src="/logo-horizontal-light.png"
                alt="Falcon 3D Prints — Where ideas take shapes"
                fill
                sizes="340px"
                style={{ objectFit: 'contain', objectPosition: 'left center' }}
              />
            </Link>

            <p
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1rem',
                fontStyle: 'italic',
                color: '#D4AF37',
                fontWeight: 600,
                letterSpacing: '0.01em',
                marginBottom: '0.75rem',
                lineHeight: 1.4,
              }}
            >
              Where ideas take shapes.
            </p>

            <p
              style={{
                fontSize: '0.86rem',
                color: 'rgba(250, 247, 242, 0.72)',
                lineHeight: 1.65,
                marginBottom: '1.4rem',
              }}
            >
              Contemporary additive manufacturing studio based in Nashik, Maharashtra. Engineering architectural scale models, functional desk accessories, and custom collector miniatures.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '9999px',
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#D4AF37',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={13} />
                </span>
                <a
                  href="tel:+919850607144"
                  style={{
                    fontWeight: 600,
                    color: '#FAF7F2',
                    textDecoration: 'none',
                    transition: 'color 180ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#E8590C')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FAF7F2')}
                >
                  +91 98506 07144
                </a>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  color: 'rgba(250, 247, 242, 0.72)',
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '9999px',
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#D4AF37',
                    marginTop: '0.1rem',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={13} />
                </span>
                <span>Uttam Nagar, CIDCO, Nashik, Maharashtra 422009</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Quick Links
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.84rem', color: '#B5AEA4' }}>
              <li>
                <Link href="/catalog" style={{ color: 'inherit', textDecoration: 'none' }}>
                  All Prints
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Planters%20%26%20Decor" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Planters &amp; Decor
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Desk%20Accessories" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Desk Accessories
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Miniatures%20%26%20Collectibles" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Collectibles
                </Link>
              </li>
              <li>
                <Link href="/catalog?sort=bestselling" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Customer Support
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.84rem', color: '#B5AEA4' }}>
              <li>
                <Link href="/contact#faqs" style={{ color: 'inherit', textDecoration: 'none' }}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Return &amp; Refund
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/account" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay Connected / Newsletter */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Join Our Newsletter
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#B5AEA4', lineHeight: 1.5, marginBottom: '1rem' }}>
              Get exclusive offers, new arrivals and design stories.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you for subscribing to Falcon 3D Prints.');
              }}
              style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                aria-label="Email address"
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(217, 194, 163, 0.22)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#FAF7F2',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                aria-label="Subscribe"
                style={{
                  background: 'var(--falcon-orange)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0 0.85rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                ➔
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.85rem', color: '#B5AEA4', fontSize: '0.85rem' }}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }} aria-label="Instagram">Instagram</a>
              <span>•</span>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }} aria-label="YouTube">YouTube</a>
              <span>•</span>
              <a href="https://wa.me/919850607144" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }} aria-label="WhatsApp">WhatsApp</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(217, 194, 163, 0.12)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            fontSize: '0.77rem',
            color: '#8A8278',
          }}
        >
          <div>
            <p style={{ margin: 0 }}>
              &copy; {new Date().getFullYear()} Falcon 3D Prints. All rights reserved. | Made in India | Designed for dreamers, built for collectors.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Payment Trust Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: '#D9C2A3', letterSpacing: '0.04em' }}>
              <span style={{ padding: '2px 6px', border: '1px solid rgba(217, 194, 163, 0.25)', borderRadius: '3px' }}>VISA</span>
              <span style={{ padding: '2px 6px', border: '1px solid rgba(217, 194, 163, 0.25)', borderRadius: '3px' }}>MASTERCARD</span>
              <span style={{ padding: '2px 6px', border: '1px solid rgba(217, 194, 163, 0.25)', borderRadius: '3px' }}>UPI</span>
              <span style={{ padding: '2px 6px', border: '1px solid rgba(217, 194, 163, 0.25)', borderRadius: '3px' }}>RAZORPAY</span>
            </div>

            <nav aria-label="Legal links" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link href="/policies/terms" style={{ color: 'inherit' }}>Terms &amp; Conditions</Link>
              <Link href="/policies/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link>
              <Link href="/policies/shipping" style={{ color: 'inherit' }}>Shipping Policy</Link>
              <Link href="/contact" style={{ color: 'inherit' }}>Contact</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
