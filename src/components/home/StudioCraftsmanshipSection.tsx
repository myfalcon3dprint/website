'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Play,
  Sparkles,
  ShieldCheck,
  Compass,
  MapPin,
  X,
} from 'lucide-react';

interface FeaturePill {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const PILLARS: FeaturePill[] = [
  {
    icon: <Sparkles size={20} className="craft-pill-icon" aria-hidden="true" />,
    title: 'High-precision 3D printing',
    subtitle: 'Up to 50-micron SLA & FDM resolution',
  },
  {
    icon: <ShieldCheck size={20} className="craft-pill-icon" aria-hidden="true" />,
    title: 'Premium & eco-friendly materials',
    subtitle: 'Bio-based PLA and high-impact PETG',
  },
  {
    icon: <Compass size={20} className="craft-pill-icon" aria-hidden="true" />,
    title: 'Thoughtful, functional designs',
    subtitle: 'Engineered for home, office & mandir spaces',
  },
  {
    icon: <MapPin size={20} className="craft-pill-icon" aria-hidden="true" />,
    title: 'Proudly Made in Nashik',
    subtitle: 'Supporting local atelier craftsmanship',
  },
];

export default function StudioCraftsmanshipSection() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section className="studio-craftsmanship-section" aria-label="Studio Craftsmanship Story">
      {/* Background Architectural Glow & Jaali Texture */}
      <div className="craft-obsidian-glow" aria-hidden="true" />
      <div className="craft-jaali-texture" aria-hidden="true" />

      <div className="container relative-z">
        <div className="craft-layout-grid">
          {/* Left Column: Story Copy & Pillars */}
          <div className="craft-copy-col">
            <div className="ornamental-eyebrow-row">
              <span className="craft-eyebrow-dot" aria-hidden="true" />
              <span className="craft-eyebrow">MORE THAN JUST PRINTS</span>
            </div>

            <h2 className="craft-headline">
              Precision Printed.
              <br />
              <span className="craft-headline-accent">Deeply Inspired.</span>
            </h2>

            <p className="craft-desc">
              From India&apos;s rich architectural heritage to contemporary functional design,
              we create highly detailed 3D printed collectibles that celebrate art, culture, and
              additive engineering. Every piece is printed, deburred, and finished by hand in our
              Nashik studio.
            </p>

            {/* CTAs */}
            <div className="craft-cta-row">
              <Link href="/catalog" className="luxury-btn-solid">
                <span>Explore Our Story</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="luxury-btn-play"
                aria-label="Watch Studio Video"
              >
                <div className="craft-play-icon-box">
                  <Play size={14} fill="currentColor" />
                </div>
                <span>Watch Studio Video</span>
              </button>
            </div>

            {/* 4 Feature Pillars Grid */}
            <div className="craft-pillars-grid">
              {PILLARS.map((p, idx) => (
                <div key={idx} className="craft-pillar-card">
                  <div className="craft-pillar-icon-box">{p.icon}</div>
                  <div className="craft-pillar-text">
                    <h4>{p.title}</h4>
                    <p>{p.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Framed Archway Sculpture Visual */}
          <div className="craft-visual-col">
            <div className="craft-arch-frame">
              <div className="craft-arch-img-wrap">
                <Image
                  src="/nataraja-bronze-arch.jpg"
                  alt="Traditional bronze sculpture framed in ornate stone temple archway with warm light"
                  fill
                  sizes="(max-width: 900px) 100vw, 45vw"
                  className="craft-arch-img"
                  priority={false}
                />
                <div className="craft-arch-vignette" />
              </div>

              {/* Decorative Plaque Overlay */}
              <div className="craft-arch-plaque">
                <span className="craft-plaque-tag">✦ STUDIO ATELIER</span>
                <span className="craft-plaque-text">Where Heritage Meets Precision 3D Craft</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Player (Accessible & Clean) */}
      {showVideoModal && (
        <div
          className="luxury-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Studio Craftsmanship Video"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="luxury-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="luxury-modal-header">
              <h3>Falcon 3D Studio — Additive Craftsmanship</h3>
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
                src="/artisan-crafting-hands.jpg"
                alt="Master artisan hand-detailing architectural temple model"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className="luxury-video-caption-bar">
                <span>✦ Authentic Nashik workshop footage · Precision deburring &amp; finishing</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
