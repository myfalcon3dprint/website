'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, Sparkles, MapPin, Star, UploadCloud } from 'lucide-react';

export default function EditorialHeroBanner() {
  return (
    <section className="container" aria-label="Editorial Studio Showcase">
      <div className="murtihub-hero-stage">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '2.5rem',
            padding: 'clamp(2rem, 5vw, 4rem)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Column: Editorial Prose & Trust Badges */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ width: '24px', height: '1px', background: 'var(--gold-primary)' }} aria-hidden="true" />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--gold-primary)',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                BESPOKE ADDITIVE ATELIER &bull; NASHIK
              </span>
              <span style={{ width: '24px', height: '1px', background: 'var(--gold-primary)' }} aria-hidden="true" />
            </div>

            <h1
              className="font-editorial"
              style={{
                fontSize: 'clamp(2.35rem, 4.5vw, 3.65rem)',
                color: '#1C1917',
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                marginBottom: '1rem',
                fontWeight: 700,
              }}
            >
              Where Code Becomes Solid Art.
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.4vw, 1.1rem)',
                color: '#57534E',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '540px',
              }}
            >
              From 50-micron sacred temple replicas to articulated mechanical collectibles and architectural desk essentials. Designed, sliced, and finished by hand in our Maharashtra studio.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
              <Link
                href="/catalog"
                className="btn-primary"
                style={{
                  padding: '0.85rem 1.65rem',
                  fontSize: '0.92rem',
                  background: '#1C1917',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 14px rgba(28, 25, 23, 0.2)',
                }}
              >
                <span>Shop Masterpieces</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/quote"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--gold-border)',
                  background: '#FFFFFF',
                  color: '#997316',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  transition: 'all 160ms ease',
                  boxShadow: '0 2px 8px rgba(197, 155, 39, 0.1)',
                }}
              >
                <UploadCloud size={16} style={{ color: 'var(--gold-primary)' }} />
                <span>Upload 3D File (Get Quote)</span>
              </Link>
            </div>

            {/* MurtiHub-Style Fine Trust Badges Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1.25rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #ECE7DE',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>
                  <Star size={18} fill="#C59B27" color="#C59B27" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: '#1C1917', display: 'block', lineHeight: 1.1 }}>
                    4.9 / 5.0 Rating
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#78716C' }}>350+ Commissions</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>
                  <Truck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: '#1C1917', display: 'block', lineHeight: 1.1 }}>
                    Pan-India Delivery
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#78716C' }}>Tracked &amp; Insured</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: '#1C1917', display: 'block', lineHeight: 1.1 }}>
                    Zero Warpage
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#78716C' }}>PEI Bed Verified</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: '#1C1917', display: 'block', lineHeight: 1.1 }}>
                    Nashik Atelier
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#78716C' }}>Direct Studio Pickups</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Tactile Photography Composition */}
          <div style={{ position: 'relative' }}>
            {/* Top Right Luxury Motif Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '10px',
                zIndex: 3,
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gold-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(197, 155, 39, 0.15)',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#997316', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                TIMELESS CRAFT &bull; MODERN SPACES
              </span>
            </div>

            {/* Main Visual Image Card */}
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '4/3',
                boxShadow: '0 20px 45px -12px rgba(28, 25, 23, 0.22)',
                border: '1.5px solid #E7E2D6',
                background: '#F4F1EA',
              }}
            >
              <Image
                src="/products/trimbakeshwar-temple-model.jpg"
                alt="Trimbakeshwar Temple Architectural Replica in 50-micron SLA Resin"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 60%, rgba(20, 18, 16, 0.75) 100%)',
                }}
              />

              <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem', color: '#FFFFFF', zIndex: 2 }}>
                <span className="badge-precision" style={{ background: 'rgba(212, 175, 55, 0.95)', color: '#1C1917', fontWeight: 800 }}>
                  Heritage Scale Series
                </span>
                <p style={{ margin: '0.35rem 0 0', fontSize: '1.15rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  Trimbakeshwar Jyotirlinga Temple Replica
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#F3EFE6' }}>
                  Captured in 50-micron photopolymer SLA resin &bull; From ₹1,499
                </p>
              </div>
            </div>

            {/* Overlapping Floating Specimen Card */}
            <div
              style={{
                position: 'absolute',
                bottom: '-24px',
                left: '-16px',
                zIndex: 3,
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                border: '1px solid #ECE7DE',
                boxShadow: '0 12px 28px -6px rgba(28, 25, 23, 0.16)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #ECE7DE',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/products/planter-obsidian-black.jpg"
                  alt="Origami Planter Specimen"
                  fill
                  sizes="44px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--brand-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Studio Bestseller
                </span>
                <strong style={{ fontSize: '0.84rem', color: '#1C1917', display: 'block', lineHeight: 1.2 }}>
                  Matte Obsidian Planter
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                  Ready Stock &bull; ₹499
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
