'use client';

import React from 'react';
import Link from 'next/link';
import { useProducts, useCart } from '@/lib/store';
import { formatINR } from '@/lib/money';
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  FileCode,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';

export default function HomePage() {
  const { products } = useProducts();
  const { addToCart } = useCart();

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem', paddingBottom: '5rem' }}>
      {/* 1. HERO SLIDER */}
      <HeroSlider />



      {/* 2. CATEGORY DISCOVERY */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              COLLECTIONS
            </span>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              Explore Studio Domains
            </h2>
          </div>
          <Link
            href="/catalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <span>View All Categories</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {[
            {
              title: 'Planters & Decor',
              count: 'Geometric & Low-Poly',
              href: '/catalog?category=Planters%20%26%20Decor',
              desc: 'Self-draining desktop planters with matte tactile surfaces',
            },
            {
              title: 'Miniatures & Collectibles',
              count: 'Articulated & Tabletop',
              href: '/catalog?category=Miniatures%20%26%20Collectibles',
              desc: 'Print-in-place dragons and high-detail resin models',
            },
            {
              title: 'Desk Accessories',
              count: 'Modular Ergonomics',
              href: '/catalog?category=Desk%20Accessories',
              desc: 'Keyboard stands, cable organizers, and stationery pots',
            },
            {
              title: 'Architectural Models',
              count: 'Scale Facades',
              href: '/catalog?category=Architectural%20Models',
              desc: 'Precision temple scale models and heritage facades',
            },
            {
              title: 'Kitchen Miniatures',
              count: 'Heritage Display',
              href: '/catalog?category=Kitchen%20Miniatures',
              desc: 'Detailed traditional miniature cookware models',
            },
          ].map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="card card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '140px',
                padding: '1.25rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  {cat.desc}
                </p>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-accent)', marginTop: '1rem' }}>
                {cat.count} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-ready)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              HAND-CRAFTED EDITIONS
            </span>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              Featured Creations
            </h2>
          </div>
          <Link
            href="/catalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <span>Browse Full Catalog</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.75rem' }}>
          {featuredProducts.map((product) => {
            const activeVariant = product.variants[0];
            return (
              <div
                key={product.id}
                className="product-card-lift"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                {/* Product Image */}
                <Link
                  href={`/catalog/${product.slug}`}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    overflow: 'hidden',
                    background: '#F5F5F0',
                    display: 'block',
                  }}
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
                    {product.stockType === 'ready_stock' ? (
                      <span className="badge badge-ready">Ready Stock</span>
                    ) : (
                      <span className="badge badge-mto">Made to Order</span>
                    )}
                  </div>
                </Link>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {product.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.25rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                      <Link href={`/catalog/${product.slug}`} style={{ color: 'var(--text-primary)' }}>
                        {product.title}
                      </Link>
                    </h3>
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                    >
                      {product.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>From</span>
                      <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {formatINR(product.basePricePaise)}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(product, activeVariant.id, 1)}
                      className="btn-primary"
                      style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem' }}
                      aria-label={`Add ${product.title} to cart`}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CUSTOM CAD / STL PROTOTYPING BANNER */}
      <section className="container">
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'clamp(2rem, 4vw, 3rem)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--brand-accent)',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              BESPOKE ADDITIVE MANUFACTURING
            </span>

            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Have your own 3D design? Let's fabricate it.
            </h2>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Upload your <code>.stl</code> or <code>.obj</code> file. Our Nashik engineering team inspects wall thicknesses, calculates infill volume, and issues an exact price estimate within 4 business hours.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Link href="/quote" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}>
                <FileCode size={17} />
                <span>Upload 3D File (Get Quote)</span>
              </Link>

              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Accepts STL, OBJ, 3MF up to 50MB
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WORKSHOP CREDENTIALS & NASHIK LOCAL HUB */}
      <section className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              NASHIK WORKSHOP FACILITY
            </span>
            <h2 style={{ fontSize: '1.9rem', color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '1rem' }}>
              Engineered with pride in Maharashtra.
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Falcon 3D Prints bridges CAD design with physical reality. Operating calibrated multi-material 3D printer fleets from our CIDCO studio in Nashik. We serve architectural firms, engineers, artists, and retail patrons.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--status-ready)' }} />
                <span>Strict dimensional calibration & bed-leveling verification</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--status-ready)' }} />
                <span>Biodegradable PLA, robust PETG, and high-detail SLA resins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--status-ready)' }} />
                <span>Direct studio pickups in Nashik & tracked pan-India shipping</span>
              </div>
            </div>

            <Link href="/contact" className="btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
              <MapPin size={15} style={{ color: 'var(--brand-accent)' }} />
              <span>Visit Nashik Studio Location</span>
            </Link>
          </div>

          {/* Machine Specs Box */}
          <div className="card" style={{ padding: '1.75rem', background: 'var(--surface)' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--brand-accent)' }} />
              Falcon Studio Fleet Specifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>High-Speed FDM Farm:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0, fontSize: '0.82rem' }}>
                  Prusa MK4 & Bambu Lab X1C (Max build volume: 256 × 256 × 256 mm)
                </p>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>SLA Resin Station:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0, fontSize: '0.82rem' }}>
                  High-detail SLA UV curing (25–50 micron micro-layer resolution)
                </p>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Workshop Inquiries:</strong>
                <p style={{ color: 'var(--status-ready)', fontWeight: 600, marginTop: '0.2rem', margin: 0, fontSize: '0.82rem' }}>
                  +91 98506 07144 (Direct calls & technical consultations)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
