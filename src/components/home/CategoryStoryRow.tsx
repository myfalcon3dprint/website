'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface StoryCategory {
  id: string;
  name: string;
  href: string;
  imageUrl: string;
  badge?: string;
}

const STORY_CATEGORIES: StoryCategory[] = [
  {
    id: 'story-temple',
    name: 'Sacred Replicas',
    href: '/catalog?category=Architectural%20Models',
    imageUrl: '/products/trimbakeshwar-temple-model.jpg',
    badge: '50µm SLA',
  },
  {
    id: 'story-planters',
    name: 'Origami Planters',
    href: '/catalog?category=Planters%20%26%20Decor',
    imageUrl: '/products/planter-obsidian-black.jpg',
    badge: 'Bio-PLA',
  },
  {
    id: 'story-gryphon',
    name: 'Articulated Figures',
    href: '/catalog?category=Miniatures%20%26%20Collectibles',
    imageUrl: '/products/cyber-gryphon-figure.jpg',
    badge: '18 Joints',
  },
  {
    id: 'story-organizer',
    name: 'HexaGrid Desk',
    href: '/catalog/modular-hex-desk-organizer',
    imageUrl: '/products/hexagrid-desk-organizer.jpg',
    badge: 'Modular',
  },
  {
    id: 'story-aerostand',
    name: 'AeroStand Pro',
    href: '/catalog/aerostand-phone-tablet-display-dock',
    imageUrl: '/products/aerostand-black.jpg',
    badge: 'Acoustic',
  },
  {
    id: 'story-cookware',
    name: 'Heritage Brass',
    href: '/catalog/miniature-traditional-brass-cookware-set',
    imageUrl: '/products/mini-brass-cookware.jpg',
    badge: 'Collectible',
  },
  {
    id: 'story-quote',
    name: 'Custom CAD File',
    href: '/quote',
    imageUrl: '/products/planter-orange-variant.jpg',
    badge: 'Upload .STL',
  },
];

export default function CategoryStoryRow() {
  return (
    <section aria-label="Quick Category Stories" style={{ borderBottom: '1px solid #ECE7DE', background: '#FFFFFF' }}>
      <div className="container" style={{ padding: '0 1rem' }}>
        <div className="story-scroll-container">
          {STORY_CATEGORIES.map((item) => (
            <Link key={item.id} href={item.href} className="story-squircle-item">
              <div className="story-squircle-frame">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="84px"
                  style={{ objectFit: 'cover' }}
                />
                {item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(23, 21, 19, 0.88)',
                      backdropFilter: 'blur(4px)',
                      color: '#FDE68A',
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="story-squircle-label">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
