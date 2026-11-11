'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  specs: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-ganesha',
    title: 'Bal Ganesha',
    specs: '16K Resin Printed • Hand-Painted •',
    ctaText: 'Shop Now',
    ctaLink: '/catalog?category=Miniatures%20%26%20Collectibles',
    imageUrl: '/hero-ganesha-clean.jpg',
    imageAlt: 'Bal Ganesha 16K resin 3D printed hand-painted idol with warm temple diya lighting',
  },
  {
    id: 'slide-temple',
    title: 'Trimbakeshwar Temple',
    specs: '50-Micron SLA Resin • Hand-Finished •',
    ctaText: 'Shop Now',
    ctaLink: '/catalog/trimbakeshwar-temple-architectural-replica',
    imageUrl: '/hero-temple-stage.jpg',
    imageAlt: 'Trimbakeshwar Temple 3D scale model replica in sunlit temple stage',
  },
  {
    id: 'slide-nataraja',
    title: 'Nataraja Bronze Heritage',
    specs: 'Ultra-Detail SLA Resin • Antique Patina •',
    ctaText: 'Shop Now',
    ctaLink: '/catalog',
    imageUrl: '/nataraja-bronze-arch.jpg',
    imageAlt: 'Nataraja bronze heritage sculpture framed in ornate stone temple archway',
  },
  {
    id: 'slide-gryphon',
    title: 'Cyber Gryphon',
    specs: 'Print-in-Place • Interlocking Joints •',
    ctaText: 'Shop Now',
    ctaLink: '/catalog/mecha-gryphon-articulated-figurine',
    imageUrl: '/products/cyber-gryphon-figure.jpg',
    imageAlt: 'Cyber gryphon articulated mechanical figure in matte orange and charcoal',
  },
];

export default function LuxuryCinematicHero() {
  const [current, setCurrent] = useState(0);
  const [isPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

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

  // Autoplay rotation every 5.5 seconds
  useEffect(() => {
    if (!isPlaying || isHovered) return;
    const timer = setInterval(nextSlide, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, nextSlide]);

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  };

  return (
    <section
      className="kalpnik-hero"
      aria-label="Falcon 3D Prints Hero Banner"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Background Image Stage with Crossfade */}
      <div className="kalpnik-hero-bg-stage" aria-hidden="true">
        {HERO_SLIDES.map((s, idx) => (
          <div
            key={s.id}
            className={`kalpnik-hero-bg-slide ${idx === current ? 'active' : ''}`}
          >
            <Image
              src={s.imageUrl}
              alt={s.imageAlt}
              fill
              priority={idx === 0}
              quality={90}
              sizes="100vw"
              className="kalpnik-hero-bg-img"
            />
          </div>
        ))}
        {/* Soft Vignette Overlay for Text Legibility */}
        <div className="kalpnik-hero-overlay" />
      </div>

      {/* Hero Foreground Content */}
      <div className="container kalpnik-hero-content-wrap">
        {/* Top-Left Studio Identity: Logo + Tagline */}
        <div className="kalpnik-hero-brand">
          <div className="kalpnik-brand-header">
            {/* Falcon Bird Icon */}
            <div className="kalpnik-brand-icon">
              <svg width="46" height="46" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 16C15 20 23 25 27 42C31 25 39 20 48 16C37 29 31 37 27 48C23 37 17 29 6 16Z"
                  fill="url(#falconHeroGrad)"
                />
                <path
                  d="M14 10C20 14 25 20 27 30C29 20 34 14 40 10C32 16 30 22 27 28C24 22 22 16 14 10Z"
                  fill="#FF8C00"
                />
                <defs>
                  <linearGradient id="falconHeroGrad" x1="6" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F45112" />
                    <stop offset="1" stopColor="#E8590C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="kalpnik-brand-text">
              <span className="kalpnik-brand-title">FALCON</span>
              <span className="kalpnik-brand-sub">3D PRINTS</span>
            </div>
          </div>

          {/* Slogan with Dividers */}
          <div className="kalpnik-brand-tagline">
            <span>IDEA</span>
            <span className="kalpnik-tag-sep">|</span>
            <span>MODEL</span>
            <span className="kalpnik-tag-sep">|</span>
            <span>CREATE</span>
            <span className="kalpnik-tag-sep">|</span>
            <span>REALIZE</span>
          </div>
        </div>

        {/* Bottom-Left Floating Product Glass Card */}
        <div className="kalpnik-floating-card">
          <h2 className="kalpnik-card-title">{slide.title}</h2>
          <p className="kalpnik-card-specs">{slide.specs}</p>
          <Link href={slide.ctaLink} className="kalpnik-card-btn">
            <span>{slide.ctaText}</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Minimalist Slide Navigation Controls (Bottom Right) */}
        <div className="kalpnik-hero-nav">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="kalpnik-nav-btn"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="kalpnik-nav-dots">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`kalpnik-dot ${idx === current ? 'active' : ''}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="kalpnik-nav-btn"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
