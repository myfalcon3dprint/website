'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Bot, Layers, Landmark, Utensils, 
  Compass, Check, ArrowRight, ChevronRight 
} from 'lucide-react';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
  icon?: string | null;
}

interface CategoryNavProps {
  selectedCategory?: string;
  onSelectCategory?: (name: string) => void;
  variant?: 'home-grid' | 'catalog-chips';
}

function renderCategoryIcon(iconName?: string | null) {
  const norm = iconName?.toLowerCase();
  switch (norm) {
    case 'bot':
      return <Bot size={24} style={{ color: 'var(--brand-accent)' }} />;
    case 'sparkles':
      return <Sparkles size={24} style={{ color: 'var(--brand-accent)' }} />;
    case 'landmark':
      return <Landmark size={24} style={{ color: 'var(--brand-accent)' }} />;
    case 'utensils':
      return <Utensils size={24} style={{ color: 'var(--brand-accent)' }} />;
    case 'compass':
      return <Compass size={24} style={{ color: 'var(--brand-accent)' }} />;
    default:
      return <Layers size={24} style={{ color: 'var(--brand-accent)' }} />;
  }
}

export default function CategoryNav({
  selectedCategory = 'All',
  onSelectCategory,
  variant = 'home-grid',
}: CategoryNavProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading && categories.length === 0) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          margin: '1.5rem 0',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              height: '180px',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              opacity: 0.6,
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
        ))}
      </div>
    );
  }

  // Filter to active categories only
  const activeCategories = categories.filter((c) => c.is_active);

  // Variant A: Catalog Filter Chips / Visual Cards
  if (variant === 'catalog-chips') {
    return (
      <nav
        aria-label="Category Filters"
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* All Products Option */}
        <button
          type="button"
          onClick={() => onSelectCategory?.('All')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: selectedCategory === 'All' ? 'var(--surface)' : 'var(--surface-alt)',
            border: selectedCategory === 'All' ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
            boxShadow: selectedCategory === 'All' ? 'var(--shadow-card)' : 'none',
            color: selectedCategory === 'All' ? 'var(--brand-accent)' : 'var(--text-primary)',
            fontWeight: selectedCategory === 'All' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
          }}
        >
          <Compass size={16} />
          <span>All Categories</span>
          {selectedCategory === 'All' && <Check size={14} style={{ color: 'var(--brand-accent)' }} />}
        </button>

        {activeCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory?.(cat.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.4rem 0.95rem 0.4rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--surface)' : 'var(--surface-alt)',
                border: isSelected ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                color: isSelected ? 'var(--brand-accent)' : 'var(--text-primary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
              }}
            >
              {/* Thumbnail or Icon */}
              {cat.image_url ? (
                <div
                  style={{
                    width: '1.85rem',
                    height: '1.85rem',
                    borderRadius: 'var(--radius-xs)',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="40px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div style={{ flexShrink: 0 }}>{renderCategoryIcon(cat.icon)}</div>
              )}

              <span>{cat.name}</span>
              {isSelected && <Check size={14} style={{ color: 'var(--brand-accent)' }} />}
            </button>
          );
        })}
      </nav>
    );
  }

  // Variant B: Home Visual Grid / Mobile Swipe Row
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.35rem',
      }}
    >
      {activeCategories.map((cat) => {
        const href = `/catalog?category=${encodeURIComponent(cat.name)}`;

        return (
          <Link
            key={cat.id}
            href={href}
            className="category-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease',
            }}
          >
            {/* Visual Image / Icon Container */}
            <div
              style={{
                width: '100%',
                height: '140px',
                position: 'relative',
                background: '#F3EFE6',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {cat.image_url ? (
                <div className="cat-img-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 280px"
                    style={{
                      objectFit: 'cover',
                      transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {renderCategoryIcon(cat.icon)}
                </div>
              )}

              {/* Icon Overlay Badge if Image is Present */}
              {cat.image_url && cat.icon && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0.65rem',
                    right: '0.65rem',
                    width: '1.9rem',
                    height: '1.9rem',
                    borderRadius: '50%',
                    background: 'rgba(26, 24, 22, 0.75)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  {renderCategoryIcon(cat.icon)}
                </div>
              )}
            </div>

            {/* Category Meta Info */}
            <div
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    margin: '0 0 0.35rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cat.name}
                </h3>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {cat.description || 'Precision 3D printed additive manufacturing.'}
                </p>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--brand-accent)',
                  marginTop: '1rem',
                }}
              >
                <span>Shop Domain</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        );
      })}

      <style>{`
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-card-hover);
          border-color: rgba(232, 89, 12, 0.3);
        }
        .category-card:hover .cat-img-wrapper img {
          transform: scale(1.06);
        }
        .category-card:focus-visible {
          outline: 2px solid var(--brand-accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
