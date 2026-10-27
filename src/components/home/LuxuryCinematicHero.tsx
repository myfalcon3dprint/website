'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  MapPin,
  Pause,
  Play,
  Award,
} from 'lucide-react';

interface HeroSlide {
  id: string;
  kicker: string;
  headlinePrimary: string;
  headlineAccent: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  imageUrl: string;
  imageAlt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-temple',
    kicker: "INDIA'S HERITAGE, REIMAGINED IN 3D",
    headlinePrimary: 'Timeless Landmarks.',
    headlineAccent: 'In Your Space.',
    description:
      "Meticulously 3D printed replicas of India's architectural wonders, collectibles, planters and desk essentials for modern spaces.",
    primaryCtaText: 'Shop Temple Replica',
    primaryCtaLink: '/catalog/trimbakeshwar-temple-architectural-replica',
    secondaryCtaText: 'Explore Collections',
    secondaryCtaLink: '/catalog',
    imageUrl: '/hero-temple-stage.jpg',
    imageAlt: 'Trimbakeshwar Temple 3D scale model replica on dark wood base in sunlit temple',
  },
  {
    id: 'slide-planter',
    kicker: 'PARAMETRIC BOTANICAL EDITIONS',
    headlinePrimary: 'Architectural Planters.',
    headlineAccent: 'Crafted For Life.',
    description:
      'Low-poly self-draining desk planters with integrated saucers. Engineered and 3D printed with eco-friendly matte PLA in our Nashik studio.',
    primaryCtaText: 'Shop Origami Planters',
    primaryCtaLink: '/catalog/falcon-heavy-geometric-planter',
    secondaryCtaText: 'Browse All Planters',
    secondaryCtaLink: '/catalog?category=Planters%20%26%20Decor',
    imageUrl: '/products/planter-obsidian-black.jpg',
    imageAlt: 'Geometric black succulent planter on textured surface',
  },
  {
    id: 'slide-gryphon',
    kicker: 'PRINT-IN-PLACE ENGINEERING',
    headlinePrimary: 'Mechanical Predators.',
    headlineAccent: 'Zero Assembly.',
    description:
      '18 interlocking ball-socket articulation points right off the build plate. Precision additive engineering with a 26cm mechanical wingspan.',
    primaryCtaText: 'Order Cyber Gryphon',
    primaryCtaLink: '/catalog/mecha-gryphon-articulated-figurine',
    secondaryCtaText: 'Explore Collectibles',
    secondaryCtaLink: '/catalog?category=Miniatures%20%26%20Collectibles',
    imageUrl: '/products/cyber-gryphon-figure.jpg',
    imageAlt: 'Cyber gryphon articulated mechanical figure in matte orange and charcoal',
  },
  {
    id: 'slide-desk',
    kicker: 'MINIMALIST WORKSPACE ERGONOMICS',
    headlinePrimary: 'Precision Workspaces.',
    headlineAccent: 'Made To Focus.',
    description:
      'Interlocking hexagonal desk modules crafted with matte charcoal PLA. Tailored compartments for pens, tools, mechanical keyboards, and stylus.',
    primaryCtaText: 'Shop HexaGrid System',
    primaryCtaLink: '/catalog/modular-hex-desk-organizer',
    secondaryCtaText: 'Browse Desk Series',
    secondaryCtaLink: '/catalog?category=Desk%20Accessories',
    imageUrl: '/products/hexagrid-desk-organizer.jpg',
    imageAlt: 'HexaGrid modular desk organizer with stationery and pens',
  },
];

export default function LuxuryCinematicHero() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const totalSlides = HERO_SLIDES.length;
  const slide = HERO_SLIDES[current];

  const goToSlide = useCallback(
    (index: number) => {
      setCurrent((index + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(current + 1);
  }, [current, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(current - 1);
  }, [current, goToSlide]);

  // Autoplay rotation every 6.5s
  useEffect(() => {
    if (!isPlaying || isHovered) return;
    const timer = setInterval(nextSlide, 6500);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, nextSlide]);

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  };

  return (
    <section
      className="luxury-hero"
      aria-label="Featured Falcon 3D Prints Showcase"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Background Image Layer with Crossfade */}
      <div className="luxury-hero-bg-stage" aria-hidden="true">
        {HERO_SLIDES.map((s, idx) => (
          <div
            key={s.id}
            className={`luxury-hero-bg-slide ${idx === current ? 'active' : ''}`}
          >
            <Image
              src={s.imageUrl}
              alt={s.imageAlt}
              fill
              priority={idx === 0}
              quality={90}
              sizes="100vw"
              className="luxury-hero-bg-img"
            />
          </div>
        ))}

        {/* Cinematic Vignette & Atmospheric Overlays */}
        <div className="luxury-hero-vignette" />
        <div className="luxury-hero-gradient-overlay" />
        <div className="luxury-hero-jaali-texture" />
      </div>

      {/* Hero Foreground Content */}
      <div className="container luxury-hero-content-wrap">
        <div className="luxury-hero-copy">
          {/* Eyebrow Kicker */}
          <div className="luxury-hero-kicker-row">
            <span className="luxury-hero-kicker-dot" aria-hidden="true" />
            <span className="luxury-hero-kicker">{slide.kicker}</span>
          </div>

          {/* Editorial Display Headline */}
          <h1 className="luxury-hero-headline">
            <span className="luxury-headline-primary">{slide.headlinePrimary}</span>
            <br />
            <span className="luxury-headline-accent">{slide.headlineAccent}</span>
          </h1>

          {/* Description Prose */}
          <p className="luxury-hero-desc">{slide.description}</p>

          {/* Dual Action CTAs */}
          <div className="luxury-hero-cta-group">
            <Link href={slide.primaryCtaLink} className="luxury-btn-solid">
              <span>{slide.primaryCtaText}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>

            <Link href={slide.secondaryCtaLink} className="luxury-btn-glass">
              <span>{slide.secondaryCtaText}</span>
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {/* Heritage Reimagined Badge */}
          <div className="luxury-hero-heritage-tag">
            <span>✦ 50-Micron Photopolymer &amp; Precision FDM</span>
            <span className="luxury-hero-tag-sep" />
            <span>Nashik Atelier</span>
          </div>
        </div>

        {/* Right Artistic Callout badge on Slide 0 as in Reference 2 */}
        {current === 0 && (
          <div className="luxury-hero-artistic-callout" aria-hidden="true">
            <div className="callout-tag">Heritage Reimagined in 3D</div>
            <svg width="42" height="36" viewBox="0 0 42 36" fill="none" className="callout-arrow">
              <path d="M4 4C14 12 28 20 38 30M38 30L26 31M38 30L36 18" stroke="#D9C2A3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom Reassurance Strip & Slider Navigation Bar */}
      <div className="luxury-hero-bottom-bar">
        <div className="container luxury-hero-bottom-grid">
          {/* 4 Mini Trust Indicators */}
          <div className="luxury-hero-trust-badges">
            <div className="luxury-hero-trust-pill">
              <Award size={18} className="luxury-trust-icon" aria-hidden="true" />
              <span>Premium Quality</span>
            </div>
            <div className="luxury-hero-trust-pill">
              <MapPin size={18} className="luxury-trust-icon" aria-hidden="true" />
              <span>Made in India</span>
            </div>
            <div className="luxury-hero-trust-pill">
              <ShieldCheck size={18} className="luxury-trust-icon" aria-hidden="true" />
              <span>Secure Packaging</span>
            </div>
            <div className="luxury-hero-trust-pill">
              <Truck size={18} className="luxury-trust-icon" aria-hidden="true" />
              <span>Pan-India Delivery</span>
            </div>
          </div>

          {/* Slide Switcher Controls */}
          <div className="luxury-hero-nav-controls">
            <span className="luxury-hero-counter">
              <strong>0{current + 1}</strong>
              <span className="counter-sep">/</span>
              <span>0{totalSlides}</span>
            </span>

            <div className="luxury-hero-arrows">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="luxury-hero-arrow-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
                className="luxury-hero-arrow-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              className="luxury-hero-pause-btn"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
