'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';

interface StoryPanel {
  id: string;
  tagline: string;
  title: string;
  description: string;
  productName: string;
  specBadge: string;
  priceNote: string;
  primaryLink: string;
  primaryLinkText: string;
  imageUrl: string;
  reverseLayout?: boolean;
}

const STORIES: StoryPanel[] = [
  {
    id: 'desk-sanctuary',
    tagline: 'STUDIO DESK SERIES',
    title: 'A Quiet Command of Tools and Space.',
    description:
      'Engineered for mechanical keyboards, styluses, and acoustic isolation. The HexaGrid modular magnetic caddy and AeroStand dock bring tactile order to creative work surfaces.',
    productName: 'HexaGrid Desk System & AeroStand Pro',
    specBadge: 'Matte Charcoal & Carbon Infill',
    priceNote: 'Starting from ₹649',
    primaryLink: '/catalog?category=Desk%20Accessories',
    primaryLinkText: 'Explore Desk Collection',
    imageUrl: '/products/hexagrid-desk-organizer.jpg',
    reverseLayout: false,
  },
  {
    id: 'heritage-miniature',
    tagline: 'HERITAGE SCALE EDITIONS',
    title: 'Sacred Architecture Captured in 50-Micron Resin.',
    description:
      'Honoring Maharashtra temple craftsmanship. Liquid photopolymer curing preserves intricate shikhara pillars and delicate stone relief carvings at precise 1:250 scale.',
    productName: 'Trimbakeshwar Jyotirlinga Temple Replica',
    specBadge: '50µm SLA Monochrome Photopolymer',
    priceNote: 'Starting from ₹1,499',
    primaryLink: '/catalog/trimbakeshwar-temple-architectural-replica',
    primaryLinkText: 'View Heritage Replica',
    imageUrl: '/products/trimbakeshwar-temple-model.jpg',
    reverseLayout: true,
  },
  {
    id: 'botanical-geometry',
    tagline: 'LIVING SPACES & BOTANICALS',
    title: 'Architectural Vessels That Catch the Daylight.',
    description:
      'Low-poly geometric facets that catch shifting morning light on your windowsill. Crafted with hidden internal drainage saucers that keep wooden desk surfaces dry.',
    productName: 'Origami Geometric Planter Series',
    specBadge: 'Eco-Friendly Biodegradable Bio-PLA',
    priceNote: 'Starting from ₹499',
    primaryLink: '/catalog?category=Planters%20%26%20Decor',
    primaryLinkText: 'Shop Planters Series',
    imageUrl: '/products/planter-obsidian-black.jpg',
    reverseLayout: false,
  },
];

export default function LifestyleCollectionStories() {
  return (
    <section className="container" aria-label="Curated Collection Stories">
      <div className="ornamental-header" style={{ marginBottom: '3.5rem' }}>
        <div className="ornamental-line">
          <span>&diams; CURATED SPACES &diams;</span>
        </div>
        <h2
          className="font-editorial"
          style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            color: '#1C1917',
            letterSpacing: '-0.025em',
            margin: '0.25rem 0 0.5rem',
            fontWeight: 700,
          }}
        >
          Objects for Space &amp; Ritual
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.96rem', lineHeight: 1.6, margin: 0 }}>
          Generous lifestyle compositions exploring how our physical prints enrich workdesks, sanctuaries, and living rooms.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
        {STORIES.map((story) => (
          <div
            key={story.id}
            style={{
              background: '#FAF8F4',
              border: '1px solid #ECE7DE',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(28, 26, 23, 0.04)',
            }}
          >
            {/* Visual Panel */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '4/3',
                minHeight: '340px',
                order: story.reverseLayout ? 2 : 1,
                background: '#F4F1EA',
                overflow: 'hidden',
              }}
            >
              <Image
                src={story.imageUrl}
                alt={story.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 70%, rgba(20, 18, 16, 0.45) 100%)',
                }}
              />
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 2 }}>
                <span className="badge-precision" style={{ background: 'rgba(23, 21, 19, 0.9)', color: '#FFFFFF' }}>
                  {story.specBadge}
                </span>
              </div>
            </div>

            {/* Editorial Content Panel */}
            <div
              style={{
                padding: 'clamp(2rem, 4vw, 3.25rem)',
                order: story.reverseLayout ? 1 : 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                <Sparkles size={14} style={{ color: 'var(--brand-accent)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {story.tagline}
                </span>
              </div>

              <h3
                className="font-editorial"
                style={{
                  fontSize: 'clamp(1.65rem, 2.5vw, 2.15rem)',
                  color: '#1C1917',
                  lineHeight: 1.22,
                  letterSpacing: '-0.02em',
                  marginBottom: '1rem',
                  fontWeight: 700,
                }}
              >
                {story.title}
              </h3>

              <p style={{ color: '#57534E', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                {story.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#78716C', textTransform: 'uppercase', display: 'block' }}>
                    Featured Piece
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: '#1C1917' }}>
                    {story.productName}
                  </strong>
                </div>
                <div style={{ width: '1px', height: '24px', background: '#ECE7DE' }} aria-hidden="true" />
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#78716C', textTransform: 'uppercase', display: 'block' }}>
                    Atelier Pricing
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--brand-accent)' }}>
                    {story.priceNote}
                  </strong>
                </div>
              </div>

              <Link
                href={story.primaryLink}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.75rem 1.45rem',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#1C1917',
                  boxShadow: '0 4px 12px rgba(28, 25, 23, 0.15)',
                }}
              >
                <span>{story.primaryLinkText}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
