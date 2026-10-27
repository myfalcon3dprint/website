'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface CategoryCard {
  id: string;
  name: string;
  label: string;
  imageUrl: string;
  href: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: 'cat-planters',
    name: 'Planters & Decor',
    label: 'Modern planters for homes',
    imageUrl: '/products/planter-obsidian-black.jpg',
    href: '/catalog?category=Planters%20%26%20Decor',
  },
  {
    id: 'cat-desk',
    name: 'Desk Accessories',
    label: 'Functional & stylish',
    imageUrl: '/products/hexagrid-desk-organizer.jpg',
    href: '/catalog?category=Desk%20Accessories',
  },
  {
    id: 'cat-collectibles',
    name: 'Collectibles',
    label: 'Unique figures & models',
    imageUrl: '/products/cyber-gryphon-figure.jpg',
    href: '/catalog?category=Miniatures%20%26%20Collectibles',
  },
  {
    id: 'cat-architectural',
    name: 'Architectural Models',
    label: 'Iconic temples & monuments',
    imageUrl: '/products/trimbakeshwar-temple-model.jpg',
    href: '/catalog?category=Architectural%20Models',
  },
  {
    id: 'cat-scale-models',
    name: 'Scale Models',
    label: 'Detailed replicas',
    imageUrl: '/products/vintage-jeep-model.jpg',
    href: '/catalog?category=Scale%20Models',
  },
];

export default function SandstoneCategorySection() {
  return (
    <section className="sandstone-category-section" aria-label="Explore Product Collections">
      {/* Decorative Jaali Texture Overlay */}
      <div className="sandstone-jaali-overlay" aria-hidden="true" />

      <div className="container relative-z">
        {/* Section Header */}
        <div className="sandstone-header-row">
          <div>
            <div className="ornamental-eyebrow-row">
              <span className="ornamental-diamond">♦</span>
              <span className="sandstone-eyebrow">SHOP BY CATEGORY</span>
              <span className="ornamental-diamond">♦</span>
            </div>
            <h2 className="sandstone-heading">Explore Our Collections</h2>
          </div>

          <Link href="/catalog" className="sandstone-view-all">
            <span>View all categories</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* 5-Column Category Grid */}
        <div className="sandstone-category-grid">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="sandstone-cat-card"
              aria-label={`${cat.name} — ${cat.label}`}
            >
              {/* Product Visual Container */}
              <div className="sandstone-img-frame">
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw"
                  className="sandstone-cat-img"
                  priority={idx < 2}
                />
                <div className="sandstone-img-vignette" />
              </div>

              {/* Card Meta */}
              <div className="sandstone-cat-body">
                <div>
                  <h3 className="sandstone-cat-title">{cat.name}</h3>
                  <p className="sandstone-cat-label">{cat.label}</p>
                </div>
                <div className="sandstone-cat-arrow-btn" aria-hidden="true">
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
