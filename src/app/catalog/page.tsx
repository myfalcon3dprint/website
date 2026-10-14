'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProducts, useCart } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { Search, Compass } from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Planters & Decor',
  'Miniatures & Collectibles',
  'Desk Accessories',
  'Architectural Models',
  'Kitchen Miniatures',
];

const MATERIALS = ['All Materials', 'PLA', 'PETG', 'Resin'];

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All Categories';

  const { products } = useProducts();
  const { addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('All Materials');
  const [selectedStockType, setSelectedStockType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'All Categories' && p.category !== selectedCategory) {
          return false;
        }
        // Material filter
        if (selectedMaterial !== 'All Materials') {
          const hasMaterial = p.variants.some((v) => v.material === selectedMaterial);
          if (!hasMaterial) return false;
        }
        // Stock filter
        if (selectedStockType !== 'all' && p.stockType !== selectedStockType) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesSubtitle = p.subtitle.toLowerCase().includes(q);
          const matchesCategory = p.category.toLowerCase().includes(q);
          if (!matchesTitle && !matchesSubtitle && !matchesCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.basePricePaise - b.basePricePaise;
        if (sortBy === 'price_desc') return b.basePricePaise - a.basePricePaise;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, selectedMaterial, selectedStockType, searchQuery, sortBy]);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            STUDIO CATALOG
          </span>
        </div>
        <h1 style={{ fontSize: '2.25rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Crafted Physical Objects
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Precision additive manufacturing editions, ready stock, and custom architectural models.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search planters, miniatures, organizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Sort & Availability Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={selectedStockType}
            onChange={(e) => setSelectedStockType(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '0.65rem 0.75rem' }}
            aria-label="Filter by availability"
          >
            <option value="all">All Availability</option>
            <option value="ready_stock">Ready Stock (24h)</option>
            <option value="made_to_order">Made to Order (2-4d)</option>
          </select>

          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '0.65rem 0.75rem' }}
            aria-label="Filter by material"
          >
            {MATERIALS.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input"
            style={{ width: 'auto', padding: '0.65rem 0.75rem' }}
            aria-label="Sort products"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Segment Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isActive ? 'var(--action-primary)' : 'var(--surface)',
                color: isActive ? 'var(--action-primary-text)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--action-primary)' : '1px solid var(--border-subtle)',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Compass size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No creations found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Try adjusting your search criteria, material filter, or category selection.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All Categories');
              setSelectedMaterial('All Materials');
              setSelectedStockType('all');
              setSearchQuery('');
            }}
            className="btn-primary"
            style={{ fontSize: '0.88rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map((product) => {
            const activeVariant = product.variants[0];
            return (
              <div
                key={product.id}
                className="product-card-lift"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                {/* Product Image */}
                <Link
                  href={`/catalog/${product.slug}`}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    overflow: 'hidden',
                    background: '#F5F5F0',
                    display: 'block',
                  }}
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
                    {product.stockType === 'ready_stock' ? (
                      <span className="badge badge-ready">Ready Stock</span>
                    ) : (
                      <span className="badge badge-mto">Made to Order ({activeVariant.leadTimeDays}d)</span>
                    )}
                  </div>
                </Link>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {product.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.2rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                      <Link href={`/catalog/${product.slug}`} style={{ color: 'var(--text-primary)' }}>
                        {product.title}
                      </Link>
                    </h3>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                    >
                      {product.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>From</span>
                      <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {formatINR(product.basePricePaise)}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(product, activeVariant.id, 1)}
                      className="btn-primary"
                      style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem' }}
                      aria-label={`Add ${product.title} to cart`}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
            Loading Studio Catalog...
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
