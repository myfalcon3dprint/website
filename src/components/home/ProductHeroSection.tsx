'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, PackageCheck, Pause, Play, Sparkles } from 'lucide-react';
import type { HeroSlide } from '@/lib/types';

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'slide-01',
    title: 'Geometric Origami Planters',
    headline: 'Architectural Geometric\nPlanter Series',
    subheadline: 'Low-poly self-draining desk planters with integrated saucers. Engineered and 3D printed with eco-friendly matte PLA in our Nashik studio.',
    category: 'Planters & Decor',
    desktopImageUrl: '/products/planter-obsidian-black.jpg',
    mobileImageUrl: '/products/planter-orange-variant.jpg',
    primaryButtonText: 'Shop Origami Planters',
    primaryButtonLink: '/catalog/falcon-heavy-geometric-planter',
    secondaryButtonText: 'Browse All Planters',
    secondaryButtonLink: '/catalog?category=Planters%20%26%20Decor',
    accentTag: 'Studio Bestseller',
    badge: 'Ready Stock · ₹499',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'slide-02',
    title: 'Cyber Gryphon Articulated Figure',
    headline: 'Cyber Gryphon\nArticulated Figure',
    subheadline: '18 interlocking ball-socket articulation points with zero assembly required. Precision print-in-place additive engineering with a 26cm mechanical wingspan.',
    category: 'Miniatures & Collectibles',
    desktopImageUrl: '/products/cyber-gryphon-figure.jpg',
    mobileImageUrl: '/products/figurine-mecha-gryphon.jpg',
    primaryButtonText: 'Order Cyber Gryphon',
    primaryButtonLink: '/catalog/mecha-gryphon-articulated-figurine',
    secondaryButtonText: 'Explore Collectibles',
    secondaryButtonLink: '/catalog?category=Miniatures%20%26%20Collectibles',
    accentTag: 'Print-in-Place Engineering',
    badge: 'Ready Stock · ₹899',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'slide-03',
    title: 'Trimbakeshwar Temple Architectural Replica',
    headline: 'Trimbakeshwar Temple\nArchitectural Replica',
    subheadline: 'Honoring Nashik\'s sacred Jyotirlinga heritage. 50-micron ultra-high resolution SLA photopolymer resin captures intricate shikhara pillars and sanctuary geometry.',
    category: 'Architectural Models',
    desktopImageUrl: '/products/trimbakeshwar-temple-model.jpg',
    mobileImageUrl: '/products/trimbakeshwar-temple-model.jpg',
    primaryButtonText: 'Shop Temple Replica',
    primaryButtonLink: '/catalog/trimbakeshwar-temple-architectural-replica',
    secondaryButtonText: 'Explore Scale Models',
    secondaryButtonLink: '/catalog?category=Architectural%20Models',
    accentTag: 'Heritage Edition',
    badge: '50μm SLA Resin · ₹1,499',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'slide-04',
    title: 'HexaGrid Modular Desk Caddy System',
    headline: 'HexaGrid Modular\nDesk Caddy System',
    subheadline: 'Interlocking magnetic hexagonal modules crafted with matte charcoal PLA. Tailored compartments for pens, stylus, tools, and mechanical keyboards.',
    category: 'Desk Accessories',
    desktopImageUrl: '/products/hexagrid-desk-organizer.jpg',
    mobileImageUrl: '/products/aerostand-black.jpg',
    primaryButtonText: 'Shop HexaGrid System',
    primaryButtonLink: '/catalog/modular-hex-desk-organizer',
    secondaryButtonText: 'Browse Desk Series',
    secondaryButtonLink: '/catalog?category=Desk%20Accessories',
    accentTag: 'Precision Workspace',
    badge: 'In Stock · ₹649',
    displayOrder: 4,
    isActive: true,
  },
];

export default function ProductHeroSection({ initialSlides }: { initialSlides?: HeroSlide[] }) {
  const [slides, setSlides] = useState(initialSlides?.length ? initialSlides : FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/hero-slides', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.slides)) {
          const active = (data.slides as HeroSlide[])
            .filter((slide) => slide.isActive && slide.desktopImageUrl)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          if (active.length) {
            setSlides(active);
            setCurrent(0);
          }
        }
      })
      .catch(() => {});

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const small = matchMedia('(max-width: 800px), (orientation: portrait)');
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateMobile = () => setMobile(small.matches);
    const updateVisibility = () => setHidden(document.hidden);

    updateMotion();
    updateMobile();
    updateVisibility();

    motion.addEventListener('change', updateMotion);
    small.addEventListener('change', updateMobile);
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      controller.abort();
      motion.removeEventListener('change', updateMotion);
      small.removeEventListener('change', updateMobile);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const index = Math.min(current, slides.length - 1);
  const slide = slides[index];
  const canPlay = playing && !hovered && !focused && !hidden && !reducedMotion;

  const goToSlide = (newIndex: number) => {
    setCurrent((newIndex + slides.length) % slides.length);
  };

  const changeSlide = (direction: number) => {
    goToSlide(current + direction);
  };

  useEffect(() => {
    if (!canPlay || slides.length < 2) return;
    const timer = setTimeout(() => {
      setCurrent((value) => (value + 1) % slides.length);
    }, 6000);
    return () => clearTimeout(timer);
  }, [canPlay, current, slides.length]);

  const mediaUrl = mobile ? slide.mobileImageUrl || slide.desktopImageUrl : slide.desktopImageUrl;

  // Split headline for expressive styling
  const headlineParts = slide.headline.includes('\n')
    ? slide.headline.split('\n')
    : [slide.headline];

  return (
    <section className="home-hero" aria-labelledby="home-title">
      {/* Top Shop Category Navigation Bar */}
      <nav className="home-container home-shop-nav" aria-label="Shop collections">
        <Link href="/catalog" className="active">
          All prints <ArrowUpRight size={14} />
        </Link>
        <Link href="/catalog?category=Planters%20%26%20Decor">Planters &amp; decor</Link>
        <Link href="/catalog?category=Desk%20Accessories">Desk accessories</Link>
        <Link href="/catalog?category=Miniatures%20%26%20Collectibles">Collectibles</Link>
        <Link href="/catalog?category=Architectural%20Models">Scale models</Link>
        <Link href="/catalog?sort=bestselling" className="bestsellers-link">
          <Sparkles size={13} aria-hidden="true" /> Bestsellers
        </Link>
      </nav>

      {/* Main Hero Showcase Banner */}
      <div
        className="home-hero-banner"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured 3D Printed Products"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            changeSlide(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}
        onTouchStart={(event) => {
          touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }}
        onTouchEnd={(event) => {
          if (!touch.current) return;
          const x = touch.current.x - event.changedTouches[0].clientX;
          const y = touch.current.y - event.changedTouches[0].clientY;
          if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.5) changeSlide(x > 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div className="home-container home-banner-layout">
          {/* Left Column: Custom Text for Active Banner */}
          <div className="home-hero-copy">
            <div className="home-hero-meta">
              <span className="home-hero-kicker">
                <span className="home-kicker-dot" aria-hidden="true" />
                {slide.category || 'Falcon 3D Studio'}
              </span>
              {slide.badge && <span className="home-hero-badge">{slide.badge}</span>}
            </div>

            <h1 id="home-title">
              {headlineParts.map((part, i) => (
                <span key={i} className={i > 0 ? 'home-headline-accent' : 'home-headline-primary'}>
                  {part}
                  {i < headlineParts.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="home-hero-description">{slide.subheadline}</p>

            <div className="home-hero-actions">
              <Link href={slide.primaryButtonLink} className="home-button home-button-primary">
                {slide.primaryButtonText || 'Shop This Product'} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href={slide.secondaryButtonLink || '/catalog'} className="home-button home-button-outline">
                {slide.secondaryButtonText || 'Explore Collection'} <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="home-hero-note">
              <PackageCheck size={16} aria-hidden="true" />
              <span>100% In-House 3D Printed</span>
              <span className="dot-sep" />
              <span>Dispatches from Nashik</span>
              <span className="dot-sep" />
              <span>Pan-India Courier</span>
            </div>
          </div>

          {/* Right Column: FULL Image of Hero Banner in Native 4:3 Studio Frame */}
          <div className="home-hero-visual-stage" key={slide.id}>
            <div className="home-hero-frame">
              <Image
                className="home-banner-full-image"
                src={mediaUrl}
                alt={slide.title}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
                quality={92}
              />
              <span className="home-frame-badge">✦ Studio Direct</span>
            </div>
          </div>
        </div>

        {/* Carousel Bottom Controls & Quick Switcher */}
        <div className="home-container home-showcase-bottom-wrap">
          <div className="home-showcase-bottom">
            <div className="home-product-pills" role="tablist" aria-label="Featured Products">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === index}
                  className={`home-product-pill ${idx === index ? 'active' : ''}`}
                  onClick={() => goToSlide(idx)}
                >
                  <span className="pill-number">0{idx + 1}</span>
                  <span className="pill-title">{s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}</span>
                </button>
              ))}
            </div>

            <div className="home-carousel-controls">
              <button
                type="button"
                onClick={() => changeSlide(-1)}
                aria-label="Previous product banner"
                disabled={slides.length < 2}
              >
                <ChevronLeft size={18} />
              </button>
              <span aria-label={`Product ${index + 1} of ${slides.length}`} className="home-counter">
                {String(index + 1).padStart(2, '0')}{' '}
                <span className="counter-total">/ {String(slides.length).padStart(2, '0')}</span>
              </span>
              <button
                type="button"
                onClick={() => changeSlide(1)}
                aria-label="Next product banner"
                disabled={slides.length < 2}
              >
                <ChevronRight size={18} />
              </button>
              {!reducedMotion && (
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                  aria-pressed={playing}
                  className="home-play-btn"
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
