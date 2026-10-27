'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { HeroSlide } from '@/lib/types';

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-01',
    title: 'Geometric Origami Planters',
    headline: 'Architectural Geometric\nPlanter Series',
    subheadline:
      'Low-poly self-draining desk planters with integrated saucers. Engineered and 3D printed in our Nashik studio.',
    category: 'Planters & Decor',
    desktopImageUrl: '/products/planter-obsidian-black.jpg',
    mobileImageUrl: '/products/planter-orange-variant.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    overlayOpacity: 0.42,
    transitionPreset: 'crossfade',
    transitionDurationMs: 500,
    primaryButtonText: 'Shop Planters Collection',
    primaryButtonLink: '/catalog?category=Planters%20%26%20Decor',
    secondaryButtonText: 'Explore Full Catalog',
    secondaryButtonLink: '/catalog',
    accentTag: 'In Stock • Nashik Studio',
    badge: 'From ₹499',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'slide-02',
    title: 'Articulated Collectibles',
    headline: 'Cyber Gryphon\nArticulated Figure',
    subheadline:
      '18 interlocking ball-socket articulation points with zero assembly required. Precision print-in-place additive engineering.',
    category: 'Miniatures & Collectibles',
    desktopImageUrl: '/products/cyber-gryphon-figure.jpg',
    mobileImageUrl: '/products/figurine-mecha-gryphon.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    overlayOpacity: 0.45,
    transitionPreset: 'slide',
    transitionDurationMs: 550,
    primaryButtonText: 'Order Articulated Model',
    primaryButtonLink: '/catalog/mecha-gryphon-articulated-figurine',
    secondaryButtonText: 'Custom Print Quote',
    secondaryButtonLink: '/quote',
    accentTag: 'Made to Order',
    badge: 'From ₹899',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'slide-03',
    title: 'Heritage Scale Architecture',
    headline: 'Trimbakeshwar Temple\nArchitectural Replica',
    subheadline:
      'Honoring Nashik Jyotirlinga heritage. 50-micron SLA photopolymer resin captures intricate shikhara pillars and temple geometry.',
    category: 'Architectural Models',
    desktopImageUrl: '/products/trimbakeshwar-temple-model.jpg',
    mobileImageUrl: '/products/trimbakeshwar-temple-model.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    overlayOpacity: 0.45,
    transitionPreset: 'blur',
    transitionDurationMs: 600,
    primaryButtonText: 'Explore Scale Model',
    primaryButtonLink: '/catalog/trimbakeshwar-temple-architectural-replica',
    secondaryButtonText: 'Architectural Commission',
    secondaryButtonLink: '/quote',
    accentTag: 'Heritage Edition',
    badge: 'From ₹1,499',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'slide-04',
    title: 'Ergonomic Desk Systems',
    headline: 'HexaGrid Modular\nDesk Caddy System',
    subheadline:
      'Interlocking magnetic hexagonal modules crafted with matte charcoal PLA. Tailored for stylus, tool, and mechanical keyboard organization.',
    category: 'Desk Accessories',
    desktopImageUrl: '/products/hexagrid-desk-organizer.jpg',
    mobileImageUrl: '/products/aerostand-black.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    overlayOpacity: 0.42,
    transitionPreset: 'crossfade',
    transitionDurationMs: 500,
    primaryButtonText: 'Shop Desk Series',
    primaryButtonLink: '/catalog/modular-hex-desk-organizer',
    secondaryButtonText: 'View All Desk Items',
    secondaryButtonLink: '/catalog?category=Desk%20Accessories',
    accentTag: 'Studio Ready Stock',
    badge: 'From ₹649',
    displayOrder: 4,
    isActive: true,
  },
];

const AUTO_INTERVAL_MS = 6000;

export default function HeroSlider({ initialSlides }: { initialSlides?: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides && initialSlides.length > 0 ? initialSlides : DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [transitioning, setTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Check reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sync slides from API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSlides() {
      try {
        const res = await fetch('/api/hero-slides');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
      } catch {
        // Retain fallback slides safely
      }
    }
    loadSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Pause rotation when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setPaused(true);
      } else {
        setPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const slideCount = slides.length;
  const safeCurrent = Math.min(current, Math.max(0, slideCount - 1));

  const goTo = useCallback(
    (index: number, navDirection: 'next' | 'prev' = 'next') => {
      if (index === safeCurrent || index < 0 || index >= slideCount) return;

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      setDirection(navDirection);
      setTransitioning(true);
      setCurrent(index);

      const targetSlide = slides[index];
      const duration = reducedMotion ? 120 : (targetSlide?.transitionDurationMs || 500);

      transitionTimeoutRef.current = setTimeout(() => {
        setTransitioning(false);
      }, duration);
    },
    [safeCurrent, slideCount, slides, reducedMotion]
  );

  const next = useCallback(() => {
    if (slideCount === 0) return;
    goTo((safeCurrent + 1) % slideCount, 'next');
  }, [safeCurrent, slideCount, goTo]);

  const prev = useCallback(() => {
    if (slideCount === 0) return;
    goTo((safeCurrent - 1 + slideCount) % slideCount, 'prev');
  }, [safeCurrent, slideCount, goTo]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        next();
      } else {
        prev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  // Autoplay timer
  useEffect(() => {
    if (paused || slideCount <= 1) return;
    timerRef.current = setTimeout(next, AUTO_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [safeCurrent, paused, next, slideCount]);

  if (slideCount === 0) return null;

  return (
    <section
      aria-label="Falcon 3D Prints Hero Showcase"
      aria-roledescription="carousel"
      className="falcon-hero-banner"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'clamp(540px, 80vh, 760px)',
        backgroundColor: '#121110',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* SLIDES CONTAINER */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'clamp(540px, 80vh, 760px)',
          display: 'grid',
          gridTemplateColumns: '1fr',
        }}
      >
        {slides.map((slide, index) => {
          const isActive = index === safeCurrent;
          const isOutgoing = !isActive && transitioning;
          const preset = slide.transitionPreset || 'crossfade';
          const duration = reducedMotion ? 120 : (slide.transitionDurationMs || 500);
          const overlayVal = slide.overlayOpacity ?? 0.44;
          const textAlign = slide.textAlignment || 'left';
          const isCenter = textAlign === 'center';
          const isRight = textAlign === 'right';

          // Controlled visual transitions
          let filterStyle = 'none';
          let transformStyle = 'none';

          if (!reducedMotion) {
            if (preset === 'blur') {
              filterStyle = isActive ? 'blur(0px)' : 'blur(9px)';
            } else if (preset === 'slide') {
              if (isActive) {
                transformStyle = 'translateX(0)';
              } else {
                transformStyle = direction === 'next' ? 'translateX(-3%)' : 'translateX(3%)';
              }
            }
          }

          // Responsive image URLs with fallbacks
          const desktopImg = slide.desktopImageUrl || slide.mobileImageUrl || '/products/planter-obsidian-black.jpg';
          const mobileImg = slide.mobileImageUrl || slide.desktopImageUrl || '/products/planter-orange-variant.jpg';
          const desktopFocal = slide.desktopFocalPoint || 'center center';
          const mobileFocal = slide.mobileFocalPoint || 'center center';

          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slideCount}: ${slide.title || slide.headline}`}
              aria-hidden={!isActive}
              style={{
                gridArea: '1 / 1',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
                filter: filterStyle,
                transform: transformStyle,
                transition: reducedMotion
                  ? 'opacity 120ms ease'
                  : `opacity ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), filter ${duration}ms ease`,
                zIndex: isActive ? 2 : isOutgoing ? 1 : 0,
              }}
            >
              {/* RESPONSIVE PICTURE ELEMENT (Loads mobile asset on mobile devices) */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  overflow: 'hidden',
                }}
              >
                <picture style={{ width: '100%', height: '100%' }}>
                  {slide.mobileImageUrl && (
                    <source media="(max-width: 768px)" srcSet={mobileImg} />
                  )}
                  <source media="(min-width: 769px)" srcSet={desktopImg} />
                  <img
                    src={desktopImg}
                    alt={slide.title || 'Falcon 3D Prints custom manufacturing'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'var(--hero-focal, center center)',
                      transform: isActive && !reducedMotion ? 'scale(1.03)' : 'scale(1.0)',
                      transition: reducedMotion ? 'none' : 'transform 7000ms ease-out',
                    }}
                    className={`hero-img-${slide.id}`}
                  />
                </picture>

                <style>{`
                  .hero-img-${slide.id} {
                    --hero-focal: ${desktopFocal};
                  }
                  @media (max-width: 768px) {
                    .hero-img-${slide.id} {
                      --hero-focal: ${mobileFocal};
                    }
                  }
                `}</style>

                {/* Editorial dark charcoal gradient overlays for high legibility */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: isCenter
                      ? `radial-gradient(circle at center, rgba(18,16,14,${overlayVal * 0.7}) 0%, rgba(18,16,14,${overlayVal + 0.35}) 100%)`
                      : `linear-gradient(105deg, rgba(18,16,14,${overlayVal + 0.42}) 0%, rgba(18,16,14,${overlayVal + 0.18}) 48%, rgba(18,16,14,${overlayVal * 0.4}) 78%, rgba(18,16,14,0.12) 100%)`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(to top, rgba(18,16,14,0.65) 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* SLIDE TEXT CONTENT (Accessible semantic HTML) */}
              <div
                className="container"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  paddingTop: '6rem',
                  paddingBottom: '4.8rem',
                  alignItems: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '660px',
                    textAlign: isCenter ? 'center' : isRight ? 'right' : 'left',
                  }}
                >
                  {/* Category, Tag, and Badge Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                      marginBottom: '1rem',
                      opacity: isActive ? 1 : 0,
                      transform: isActive && !reducedMotion ? 'translateY(0)' : 'translateY(6px)',
                      transition: reducedMotion ? 'opacity 120ms ease' : 'opacity 350ms ease 0ms, transform 350ms ease 0ms',
                    }}
                  >
                    {slide.category && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#FF7100',
                        }}
                      >
                        {slide.category}
                      </span>
                    )}
                    {slide.category && slide.accentTag && (
                      <span
                        style={{
                          width: '3.5px',
                          height: '3.5px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.4)',
                        }}
                      />
                    )}
                    {slide.accentTag && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          color: 'rgba(255,255,255,0.7)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {slide.accentTag}
                      </span>
                    )}
                    {slide.badge && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#FF7100',
                          color: '#FFFFFF',
                          padding: '0.16rem 0.6rem',
                          borderRadius: '999px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {slide.badge}
                      </span>
                    )}
                  </div>

                  {/* Accessible Heading */}
                  <h1
                    style={{
                      fontSize: 'clamp(2.3rem, 5.5vw, 4.1rem)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-serif)',
                      lineHeight: 1.08,
                      letterSpacing: '-0.025em',
                      color: '#FFFFFF',
                      marginBottom: '1.15rem',
                      whiteSpace: 'pre-line',
                      opacity: isActive ? 1 : 0,
                      transform: isActive && !reducedMotion ? 'translateY(0)' : 'translateY(8px)',
                      transition: reducedMotion ? 'opacity 120ms ease' : 'opacity 380ms ease 80ms, transform 380ms cubic-bezier(0.16,1,0.3,1) 80ms',
                    }}
                  >
                    {slide.headline}
                  </h1>

                  {/* Supporting Subheadline */}
                  <p
                    style={{
                      fontSize: 'clamp(0.94rem, 1.35vw, 1.1rem)',
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.62,
                      marginBottom: '2.1rem',
                      maxWidth: isCenter ? '580px' : '540px',
                      opacity: isActive ? 1 : 0,
                      transform: isActive && !reducedMotion ? 'translateY(0)' : 'translateY(8px)',
                      transition: reducedMotion ? 'opacity 120ms ease' : 'opacity 400ms ease 160ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 160ms',
                    }}
                  >
                    {slide.subheadline}
                  </p>

                  {/* Primary & Secondary Buttons (Keyboard isolated when slide is inactive) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      alignItems: 'center',
                      justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
                      opacity: isActive ? 1 : 0,
                      transform: isActive && !reducedMotion ? 'translateY(0)' : 'translateY(8px)',
                      transition: reducedMotion ? 'opacity 120ms ease' : 'opacity 420ms ease 240ms, transform 420ms cubic-bezier(0.16,1,0.3,1) 240ms',
                    }}
                  >
                    <Link
                      href={slide.primaryButtonLink}
                      tabIndex={isActive ? 0 : -1}
                      aria-hidden={!isActive}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--brand-accent)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        padding: '0.85rem 1.75rem',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '-0.01em',
                        transition:
                          'background-color var(--duration-fast) ease, transform var(--duration-fast) var(--ease-spring), box-shadow var(--duration-fast) ease',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 14px rgba(232, 89, 12, 0.35)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--brand-accent-hover)';
                        e.currentTarget.style.transform = 'translateY(-1.5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--brand-accent)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>{slide.primaryButtonText}</span>
                      <ArrowRight size={16} />
                    </Link>

                    {slide.secondaryButtonText && slide.secondaryButtonLink && (
                      <Link
                        href={slide.secondaryButtonLink}
                        tabIndex={isActive ? 0 : -1}
                        aria-hidden={!isActive}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: 'rgba(255,255,255,0.92)',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          padding: '0.82rem 1.35rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(255,255,255,0.28)',
                          backdropFilter: 'blur(8px)',
                          transition:
                            'border-color var(--duration-fast) ease, color var(--duration-fast) ease, transform var(--duration-fast) ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)';
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.92)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {slide.secondaryButtonText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* BOTTOM CONTROLS: SLIDE INDICATORS & PAUSE/PLAY TOGGLE */}
        <div
          className="container"
          style={{
            position: 'absolute',
            bottom: '1.4rem',
            left: 0,
            right: 0,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              pointerEvents: 'auto',
            }}
          >
            {/* Tablist with clearly labelled slide indicators */}
            <div
              role="tablist"
              aria-label="Hero slide selection"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {slides.map((s, i) => {
                const isSelected = i === safeCurrent;
                return (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={`Show slide ${i + 1} of ${slideCount}: ${s.title || s.headline.split('\n')[0]}`}
                    onClick={() => goTo(i, i > safeCurrent ? 'next' : 'prev')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.45rem 0.2rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        height: '4px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--brand-accent)' : 'rgba(255,255,255,0.32)',
                        transition: reducedMotion ? 'background-color 120ms ease' : 'width 0.35s ease, background-color 0.35s ease',
                        width: isSelected ? '2.5rem' : '0.85rem',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Accessible Pause/Play Button */}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume automatic slide rotation' : 'Pause automatic slide rotation'}
              title={paused ? 'Resume slideshow' : 'Pause slideshow'}
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: 'var(--radius-full)',
                color: '#FFFFFF',
                width: '1.85rem',
                height: '1.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background var(--duration-fast) ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            >
              {paused ? <Play size={11} /> : <Pause size={11} />}
            </button>
          </div>

          {/* Current / Total Slide Counter for Screen Readers and Visual Clarity */}
          <div
            aria-live="polite"
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.7)',
              pointerEvents: 'auto',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            0{safeCurrent + 1} / 0{slideCount}
          </div>
        </div>

        {/* PREV / NEXT ARROW BUTTONS */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.85rem',
            height: '2.85rem',
            borderRadius: '50%',
            background: 'rgba(20, 18, 16, 0.45)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'background 0.18s ease, transform 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(232, 89, 12, 0.85)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20, 18, 16, 0.45)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.0)';
          }}
        >
          <ChevronLeft size={22} />
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.85rem',
            height: '2.85rem',
            borderRadius: '50%',
            background: 'rgba(20, 18, 16, 0.45)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'background 0.18s ease, transform 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(232, 89, 12, 0.85)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20, 18, 16, 0.45)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.0)';
          }}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* SUBTLE PROGRESS BAR FOR AUTOPLAY */}
      {!paused && !reducedMotion && slideCount > 1 && (
        <div
          aria-hidden="true"
          key={`hero-prog-${safeCurrent}`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2.5px',
            background: 'var(--brand-accent)',
            animationName: 'heroProgressBar',
            animationDuration: `${AUTO_INTERVAL_MS}ms`,
            animationTimingFunction: 'linear',
            animationIterationCount: 1,
            zIndex: 5,
          }}
        />
      )}

      <style>{`
        @keyframes heroProgressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @media (max-width: 680px) {
          .falcon-hero-banner button[aria-label="Previous slide"],
          .falcon-hero-banner button[aria-label="Next slide"] {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
