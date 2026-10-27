'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Sparkles, UploadCloud } from 'lucide-react';
import { HeroSlide } from '@/lib/types';

interface AtelierHeroShowcaseProps {
  initialSlides?: HeroSlide[];
}

const ATELIER_DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-atelier-01',
    title: 'Objects with a story',
    headline: 'Objects with a story.',
    subheadline:
      'Discover thoughtful 3D-printed pieces for your space, your rituals, and your everyday. Engineered and hand-finished in our Nashik studio.',
    category: 'The Falcon Studio Atelier',
    desktopMediaType: 'image',
    desktopImageUrl: '/products/trimbakeshwar-temple-model.jpg',
    desktopPosterUrl: '/products/trimbakeshwar-temple-model.jpg',
    desktopComplementaryDetailUrl: '/products/planter-obsidian-black.jpg',
    mobileMediaType: 'image',
    mobileImageUrl: '/products/trimbakeshwar-temple-model.jpg',
    mobilePosterUrl: '/products/trimbakeshwar-temple-model.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    mobileTextAlignment: 'left',
    overlayOpacity: 0.38,
    transitionPreset: 'crossfade',
    transitionDurationMs: 500,
    primaryButtonText: 'Explore the Collection',
    primaryButtonLink: '/catalog',
    secondaryButtonText: 'Create Something Personal',
    secondaryButtonLink: '/quote',
    accentTag: '50µm SLA & Bio-PLA',
    badge: 'Nashik Studio Atelier',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'slide-atelier-02',
    title: 'Architectural Geometric Planters',
    headline: 'Vessels Sculpted for Light & Flora.',
    subheadline:
      'Low-poly architectural desk planters with concealed drainage saucers. Printed with renewable plant-derived PLA biopolymers.',
    category: 'Planters & Decor',
    desktopMediaType: 'image',
    desktopImageUrl: '/products/planter-obsidian-black.jpg',
    desktopPosterUrl: '/products/planter-obsidian-black.jpg',
    desktopComplementaryDetailUrl: '/products/planter-orange-variant.jpg',
    mobileMediaType: 'image',
    mobileImageUrl: '/products/planter-orange-variant.jpg',
    mobilePosterUrl: '/products/planter-orange-variant.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    mobileTextAlignment: 'left',
    overlayOpacity: 0.35,
    transitionPreset: 'slide',
    transitionDurationMs: 500,
    primaryButtonText: 'Shop Planters Collection',
    primaryButtonLink: '/catalog?category=Planters%20%26%20Decor',
    secondaryButtonText: 'View Studio Catalog',
    secondaryButtonLink: '/catalog',
    accentTag: 'Ready Stock Dispatches in 24h',
    badge: 'From ₹499',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'slide-atelier-03',
    title: 'Print-in-Place Articulated Figures',
    headline: '18 Interlocking Points of Articulation.',
    subheadline:
      'Zero assembly required off the print bed. Precision ball-and-socket engineering inspired by high-speed falcons and mythical gryphons.',
    category: 'Miniatures & Collectibles',
    desktopMediaType: 'image',
    desktopImageUrl: '/products/cyber-gryphon-figure.jpg',
    desktopPosterUrl: '/products/cyber-gryphon-figure.jpg',
    desktopComplementaryDetailUrl: '/products/figurine-mecha-gryphon.jpg',
    mobileMediaType: 'image',
    mobileImageUrl: '/products/figurine-mecha-gryphon.jpg',
    mobilePosterUrl: '/products/figurine-mecha-gryphon.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    mobileTextAlignment: 'left',
    overlayOpacity: 0.40,
    transitionPreset: 'crossfade',
    transitionDurationMs: 500,
    primaryButtonText: 'Order Cyber Gryphon',
    primaryButtonLink: '/catalog/mecha-gryphon-articulated-figurine',
    secondaryButtonText: 'Bespoke Print Quote',
    secondaryButtonLink: '/quote',
    accentTag: 'Bespoke Craft Edition',
    badge: 'From ₹899',
    displayOrder: 3,
    isActive: true,
  },
];

const AUTO_SLIDE_INTERVAL_MS = 6500;

export default function AtelierHeroShowcase({ initialSlides }: AtelierHeroShowcaseProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(
    initialSlides && initialSlides.length > 0 ? initialSlides : ATELIER_DEFAULT_SLIDES
  );
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check reduced motion & viewport on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionHandler);

    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  // Fetch configured slides if available from API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/hero-slides')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Pause playback when tab is hidden or element is offscreen
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
        if (videoRef.current) videoRef.current.pause();
      } else if (!isHovered) {
        setIsPaused(false);
        if (videoRef.current) videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isHovered]);

  const slideCount = slides.length;
  const safeCurrent = Math.min(current, Math.max(0, slideCount - 1));
  const activeSlide = slides[safeCurrent] || slides[0];

  const goToSlide = useCallback(
    (index: number) => {
      if (index === safeCurrent || index < 0 || index >= slideCount) return;
      setCurrent(index);
    },
    [safeCurrent, slideCount]
  );

  const nextSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setCurrent((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setCurrent((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Only swipe if horizontal distance exceeds vertical distance significantly (avoids trapping vertical scroll)
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Autoplay Rotation Timer
  useEffect(() => {
    if (isPaused || isHovered || slideCount <= 1 || isReducedMotion) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(nextSlide, AUTO_SLIDE_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [safeCurrent, isPaused, isHovered, slideCount, isReducedMotion, nextSlide]);

  if (slideCount === 0) return null;

  // Compute media records based on viewport
  const isVideo = isMobileViewport
    ? activeSlide.mobileMediaType === 'video'
    : activeSlide.desktopMediaType === 'video';

  const isGif = isMobileViewport
    ? activeSlide.mobileMediaType === 'gif'
    : activeSlide.desktopMediaType === 'gif';

  const activeMediaUrl = isMobileViewport
    ? activeSlide.mobileImageUrl || activeSlide.desktopImageUrl
    : activeSlide.desktopImageUrl;

  const activePosterUrl = isMobileViewport
    ? activeSlide.mobilePosterUrl || activeSlide.mobileImageUrl || activeSlide.desktopImageUrl
    : activeSlide.desktopPosterUrl || activeSlide.desktopImageUrl;

  // Heading and subheadline with per-device overrides
  const displayHeadline = isMobileViewport && activeSlide.mobileHeadline
    ? activeSlide.mobileHeadline
    : activeSlide.headline;

  const displaySubheadline = isMobileViewport && activeSlide.mobileSubheadline
    ? activeSlide.mobileSubheadline
    : activeSlide.subheadline;

  return (
    <section
      aria-label="Falcon Atelier Hero Showcase"
      aria-roledescription="carousel"
      className="container"
      style={{ padding: '0 1rem' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#141311',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minHeight: 'clamp(520px, 72vh, 680px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          boxShadow: '0 20px 48px -12px rgba(20, 18, 16, 0.35)',
        }}
      >
        {/* 1. DOMINANT BACKGROUND MEDIA LAYER (Supports Image, Video, or GIF) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {isVideo && !isPaused && !isReducedMotion ? (
            <video
              ref={videoRef}
              key={activeMediaUrl}
              src={activeMediaUrl}
              poster={activePosterUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: isMobileViewport
                  ? activeSlide.mobileFocalPoint || 'center center'
                  : activeSlide.desktopFocalPoint || 'center center',
              }}
            />
          ) : isGif && !isPaused && !isReducedMotion ? (
            <Image
              src={activeMediaUrl}
              alt={activeSlide.title}
              fill
              unoptimized
              priority
              sizes="100vw"
              style={{
                objectFit: 'cover',
                objectPosition: isMobileViewport
                  ? activeSlide.mobileFocalPoint || 'center center'
                  : activeSlide.desktopFocalPoint || 'center center',
              }}
            />
          ) : (
            <Image
              src={activePosterUrl || activeMediaUrl}
              alt={activeSlide.title}
              fill
              priority
              sizes="100vw"
              style={{
                objectFit: 'cover',
                objectPosition: isMobileViewport
                  ? activeSlide.mobileFocalPoint || 'center center'
                  : activeSlide.desktopFocalPoint || 'center center',
                transition: isReducedMotion ? 'none' : 'opacity 300ms ease',
              }}
            />
          )}

          {/* Calibrated Tonal Overlay: Keeps text legible without hiding the 3D printed silhouette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, rgba(20, 18, 16, 0.25) 0%, rgba(20, 18, 16, 0.72) 75%, rgba(20, 18, 16, 0.92) 100%)`,
            }}
          />
        </div>

        {/* 2. ASYMMETRIC CONTENT & DETAIL STAGE */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: 'clamp(2rem, 5vw, 4rem)',
            display: 'grid',
            gridTemplateColumns: isMobileViewport ? '1fr' : '1.35fr 0.85fr',
            alignItems: 'flex-end',
            gap: '2.5rem',
          }}
        >
          {/* Main Asymmetric Text Stage */}
          <div style={{ maxWidth: '640px' }}>
            {/* Category / Accent Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--brand-accent)',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {activeSlide.category || 'FALCON 3D ATELIER'}
              </span>
              {activeSlide.badge && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(6px)',
                    color: '#FDE68A',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-xs)',
                    fontWeight: 700,
                    border: '1px solid rgba(253, 230, 138, 0.3)',
                  }}
                >
                  {activeSlide.badge}
                </span>
              )}
            </div>

            {/* Selectable HTML Headline (Preserving One Meaningful Page H1) */}
            <h1
              className="font-editorial"
              style={{
                fontSize: 'clamp(2.15rem, 4.4vw, 3.45rem)',
                color: '#FFFFFF',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                marginBottom: '1rem',
                fontWeight: 700,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
              }}
            >
              {displayHeadline}
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)',
                color: '#E7E2DA',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '520px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              {displaySubheadline}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href={activeSlide.primaryButtonLink}
                className="btn-accent"
                style={{
                  padding: '0.85rem 1.65rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 18px rgba(232, 89, 12, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>{activeSlide.primaryButtonText}</span>
                <ArrowRight size={16} />
              </Link>

              {activeSlide.secondaryButtonText && activeSlide.secondaryButtonLink && (
                <Link
                  href={activeSlide.secondaryButtonLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 1.35rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    transition: 'all 160ms ease',
                  }}
                >
                  <UploadCloud size={16} style={{ color: 'var(--brand-accent)' }} />
                  <span>{activeSlide.secondaryButtonText}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Asymmetric Secondary Complementary Detail Panel (Hidden on Mobile) */}
          {!isMobileViewport && activeSlide.desktopComplementaryDetailUrl && (
            <div
              style={{
                justifySelf: 'end',
                background: 'rgba(23, 21, 19, 0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                maxWidth: '300px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  flexShrink: 0,
                  background: '#1F1C18',
                }}
              >
                <Image
                  src={activeSlide.desktopComplementaryDetailUrl}
                  alt="Complementary craft detail"
                  fill
                  sizes="60px"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--brand-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Macro Detail
                </span>
                <strong style={{ fontSize: '0.82rem', color: '#FFFFFF', display: 'block', lineHeight: 1.25, marginTop: '0.15rem' }}>
                  {activeSlide.accentTag || 'Calibrated Micro-Layers'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#D1CDC4' }}>
                  CIDCO Studio Inspection
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. VISIBLE SLIDE CONTROLS (Manual Nav, Dots, and Pause/Play) */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            right: 'clamp(1.5rem, 4vw, 3rem)',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(20, 18, 16, 0.65)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Pause / Play Toggle */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? 'Resume hero rotation' : 'Pause hero rotation'}
            style={{
              color: '#FFFFFF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
          >
            {isPaused ? <Play size={13} fill="#FFFFFF" /> : <Pause size={13} fill="#FFFFFF" />}
          </button>

          <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.2)' }} aria-hidden="true" />

          {/* Previous Button */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous hero slide"
            style={{
              color: '#FFFFFF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Slide Indicator Dots */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === safeCurrent ? 'true' : 'false'}
                style={{
                  width: idx === safeCurrent ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  background: idx === safeCurrent ? 'var(--brand-accent)' : 'rgba(255, 255, 255, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next hero slide"
            style={{
              color: '#FFFFFF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
