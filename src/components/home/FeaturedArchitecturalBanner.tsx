'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, X } from 'lucide-react';

const MINI_COLLECTIONS = [
  {
    name: 'Planters & Decor',
    tagline: 'Nature meets design',
    image: '/products/planter-obsidian-black.jpg',
    href: '/catalog?category=Planters%20%26%20Decor',
  },
  {
    name: 'Desk Accessories',
    tagline: 'Organize beautifully',
    image: '/products/hexagrid-desk-organizer.jpg',
    href: '/catalog?category=Desk%20Accessories',
  },
  {
    name: 'Collectibles',
    tagline: 'Figures & models',
    image: '/products/cyber-gryphon-figure.jpg',
    href: '/catalog?category=Miniatures%20%26%20Collectibles',
  },
  {
    name: 'Scale Models',
    tagline: 'Built for enthusiasts',
    image: '/products/vintage-jeep-model.jpg',
    href: '/catalog?category=Scale%20Models',
  },
];

export default function FeaturedArchitecturalBanner() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section className="featured-banner-section" aria-label="Featured Architectural Collection">
      <div className="container">
        <div className="featured-banner-card">
          {/* Background Atmospheric Temple Image */}
          <div className="featured-banner-bg" aria-hidden="true">
            <Image
              src="/hero-temple-stage.jpg"
              alt="Architectural temple backdrop"
              fill
              sizes="100vw"
              className="featured-bg-img"
            />
            <div className="featured-banner-overlay" />
          </div>

          <div className="featured-banner-content relative-z">
            {/* Left Copy */}
            <div className="featured-banner-copy">
              <span className="featured-eyebrow">FEATURED COLLECTION</span>
              <h2 className="featured-headline">Architectural Masterpieces</h2>
              <p className="featured-desc">
                Iconic structures, captured in stunning detail. Bring home a piece of India&apos;s
                rich heritage with 50-micron photopolymer SLA precision.
              </p>

              <div className="featured-cta-row">
                <Link
                  href="/catalog?category=Architectural%20Models"
                  className="luxury-btn-solid"
                >
                  <span>Explore Collection</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="featured-btn-glass"
                  aria-label="Watch Architectural Studio Video"
                >
                  <Play size={13} fill="currentColor" aria-hidden="true" />
                  <span>Watch Studio Video</span>
                </button>
              </div>
            </div>

            {/* Right Mini Collection Cards */}
            <div className="featured-mini-grid">
              {MINI_COLLECTIONS.map((c) => (
                <Link key={c.name} href={c.href} className="featured-mini-card">
                  <div className="featured-mini-img-wrap">
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="140px"
                      className="featured-mini-img"
                    />
                  </div>
                  <div className="featured-mini-body">
                    <h4>{c.name}</h4>
                    <p>{c.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Player */}
      {showVideoModal && (
        <div
          className="luxury-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Architectural Scale Models Video"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="luxury-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="luxury-modal-header">
              <h3>Architectural Masterpieces — Trimbakeshwar Scale Model</h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="luxury-modal-close"
                aria-label="Close video player"
              >
                <X size={20} />
              </button>
            </div>
            <div className="luxury-modal-video-wrap">
              <Image
                src="/products/trimbakeshwar-temple-model.jpg"
                alt="Trimbakeshwar Temple scale model detailing"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className="luxury-video-caption-bar">
                <span>✦ 50-micron SLA resin precision · 84 hours continuous additive print</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
