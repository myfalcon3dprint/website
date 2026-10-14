'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  category: string;
  headline: string;
  subline: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image: string;
  imageAlt: string;
  accentTag: string;
  badge?: string;
}

const SLIDES: HeroSlide[] = [
  {
    id: 'slide-planters',
    category: 'Planters & Decor',
    headline: 'Geometric\nOrigami Planter',
    subline:
      'Low-poly architectural succulent planter with integrated drainage tray. Printed in our Nashik workshop with precision FDM.',
    cta: { label: 'Shop Planters', href: '/catalog/falcon-heavy-geometric-planter' },
    secondaryCta: { label: 'View Full Catalog', href: '/catalog' },
    image: '/products/planter-obsidian-black.jpg',
    imageAlt: 'Falcon Geometric Origami Planter in Obsidian Black — FDM 3D printed in Nashik',
    accentTag: 'Ready to Ship',
    badge: 'From ₹499',
  },
  {
    id: 'slide-figurines',
    category: 'Miniatures & Collectibles',
    headline: 'Cyber Gryphon\nArticulated Figure',
    subline:
      '18 interlocking articulation points, zero assembly required. Ball-socket wings expand to 26 cm — pure print-in-place engineering.',
    cta: { label: 'Order Yours', href: '/catalog/mecha-gryphon-articulated-figurine' },
    secondaryCta: { label: 'Request Custom', href: '/quote' },
    image: '/products/cyber-gryphon-figure.jpg',
    imageAlt: 'Cyber Gryphon Articulated Collectible Figure — SLA Resin and PLA prints',
    accentTag: 'Made to Order',
    badge: 'From ₹899',
  },
  {
    id: 'slide-temple',
    category: 'Architectural Models',
    headline: 'Trimbakeshwar\nTemple Replica',
    subline:
      "Honoring Nashik's iconic Jyotirlinga. 50-micron SLA fidelity captures every carved shikhara detail and courtyard geometry.",
    cta: { label: 'Explore Model', href: '/catalog/trimbakeshwar-temple-architectural-replica' },
    secondaryCta: { label: 'Commission Custom', href: '/quote' },
    image: '/products/trimbakeshwar-temple-model.jpg',
    imageAlt: 'Trimbakeshwar Temple Architectural Scale Model — SLA resin high-detail replica',
    accentTag: 'Heritage Edition',
    badge: 'From ₹1,499',
  },
  {
    id: 'slide-desk',
    category: 'Desk Accessories',
    headline: 'HexaGrid Modular\nDesk Caddy System',
    subline:
      'Magnetic snap-fit hexagonal bays with neodymium joints. Expandable configuration for tools, cards, pens and drives.',
    cta: { label: 'Shop Desk Series', href: '/catalog/modular-hex-desk-organizer' },
    secondaryCta: { label: 'View All', href: '/catalog' },
    image: '/products/hexagrid-desk-organizer.jpg',
    imageAlt: 'HexaGrid Modular Desk Caddy System — Charcoal Grey FDM 3D printed organizer',
    accentTag: 'Ready to Ship',
    badge: 'From ₹649',
  },
];

const AUTO_INTERVAL_MS = 5500;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [entering, setEntering] = useState<'left' | 'right' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const goTo = useCallback(
    (index: number, direction: 'left' | 'right' = 'right') => {
      if (!prefersReducedMotion) setEntering(direction);
      setCurrent(index);
      setTimeout(() => setEntering(null), 450);
    },
    [prefersReducedMotion],
  );

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 'right');
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, 'left');
  }, [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, AUTO_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, next]);

  const slide = SLIDES[current];

  return (
    <section
      aria-label="Hero product showcase"
      style={{ position: 'relative', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* SLIDE WRAPPER */}
      <div
        style={{
          position: 'relative',
          minHeight: 'clamp(520px, 80vh, 780px)',
          display: 'grid',
          gridTemplateColumns: '1fr',
        }}
      >
        {/* Background image with subtle Ken Burns */}
        <div
          key={slide.id + '-bg'}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={current === 0}
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              transform: paused ? 'scale(1.04)' : 'scale(1.06)',
              transition: prefersReducedMotion
                ? 'none'
                : `transform ${AUTO_INTERVAL_MS + 500}ms linear, opacity 0.4s ease`,
            }}
          />
          {/* Premium gradient overlay: charcoal-to-transparent left vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(105deg, rgba(20,18,16,0.88) 0%, rgba(20,18,16,0.62) 42%, rgba(20,18,16,0.18) 70%, rgba(20,18,16,0.06) 100%)',
            }}
          />
          {/* Bottom fade for readability */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '35%',
              background: 'linear-gradient(to top, rgba(20,18,16,0.55) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* CONTENT */}
        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingTop: '5rem',
            paddingBottom: '4.5rem',
          }}
        >
          <div
            key={slide.id + '-content'}
            style={{
              maxWidth: '640px',
              opacity: entering ? 0 : 1,
              transform: entering
                ? `translateX(${entering === 'right' ? '2rem' : '-2rem'})`
                : 'translateX(0)',
              transition: prefersReducedMotion
                ? 'none'
                : 'opacity 0.42s ease, transform 0.42s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Category + Badge Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.6rem',
                marginBottom: '1rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: '#FF7100',
                }}
              >
                {slide.category}
              </span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: 'rgba(255,255,255,0.65)',
                  textTransform: 'uppercase',
                }}
              >
                {slide.accentTag}
              </span>
              {slide.badge && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: '#FF7100',
                    color: '#fff',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    letterSpacing: '0.03em',
                  }}
                >
                  {slide.badge}
                </span>
              )}
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                marginBottom: '1.1rem',
                whiteSpace: 'pre-line',
              }}
            >
              {slide.headline}
            </h1>

            {/* Sub-headline */}
            <p
              style={{
                fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.65,
                marginBottom: '2rem',
                maxWidth: '520px',
              }}
            >
              {slide.subline}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
              <Link
                href={slide.cta.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#FF7100',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '0.8rem 1.6rem',
                  borderRadius: '0.375rem',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.18s ease, transform 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#e05e00';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#FF7100';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                }}
              >
                {slide.cta.label}
                <ArrowRight size={16} />
              </Link>

              {slide.secondaryCta && (
                <Link
                  href={slide.secondaryCta.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.22)',
                    backdropFilter: 'blur(8px)',
                    transition: 'border-color 0.18s ease, color 0.18s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.55)';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.22)';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.85)';
                  }}
                >
                  {slide.secondaryCta.label}
                </Link>
              )}
            </div>
          </div>

          {/* Slide Indicators */}
          <div
            role="tablist"
            aria-label="Hero slide indicators"
            style={{
              display: 'flex',
              gap: '0.45rem',
              marginTop: '2.5rem',
            }}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}: ${s.category}`}
                onClick={() => goTo(i, i > current ? 'right' : 'left')}
                style={{
                  height: '3px',
                  borderRadius: '999px',
                  background: i === current ? '#FF7100' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width 0.3s ease, background 0.3s ease',
                  width: i === current ? '2rem' : '0.75rem',
                }}
              />
            ))}
          </div>
        </div>

        {/* Prev / Next Arrow Controls */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.18s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)')}
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={next}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.18s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)')}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Progress bar for auto-play */}
      {!paused && !prefersReducedMotion && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2px',
            background: '#FF7100',
            animationName: 'heroProgress',
            animationDuration: `${AUTO_INTERVAL_MS}ms`,
            animationTimingFunction: 'linear',
            animationIterationCount: 1,
          }}
          key={`progress-${current}`}
        />
      )}

      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @media (max-width: 600px) {
          [aria-label="Previous slide"],
          [aria-label="Next slide"] {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
