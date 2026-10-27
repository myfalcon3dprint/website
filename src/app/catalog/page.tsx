'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useProducts, useCart } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { Search, Compass, X, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import CategoryNav from '@/components/CategoryNav';

const DEFAULT_CATEGORIES = [
  'All Categories',
  'Planters & Decor',
  'Miniatures & Collectibles',
  'Desk Accessories',
  'Architectural Models',
  'Scale Models',
  'Kitchen Miniatures',
];

const MATERIALS = ['All Materials', 'PLA', 'PETG', 'Resin'];

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialQuery = searchParams.get('query') || '';

  const { products } = useProducts();
  const { addToCart } = useCart();

  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('All Materials');
  const [selectedStockType, setSelectedStockType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          const names = data.categories.map((c: { name: string }) => c.name);
          setCategoriesList(Array.from(new Set(['All Categories', ...names])));
        }
      })
      .catch(() => {});
  }, []);

  const dynamicCategories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...categoriesList, ...fromProducts]));
  }, [categoriesList, products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Only show published and non-archived products to customers
        if (p.isPublished === false || p.archivedAt) return false;

        // Category filter
        if (selectedCategory !== 'All Categories') {
          const matchName = (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
          const matchId = p.categoryId === selectedCategory;
          if (!matchName && !matchId) return false;
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

  const hasActiveFilters =
    selectedCategory !== 'All Categories' ||
    selectedMaterial !== 'All Materials' ||
    selectedStockType !== 'all' ||
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedMaterial('All Materials');
    setSelectedStockType('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  const handleQuickAdd = (product: typeof products[0], variantId: string) => {
    setAddingId(product.id);
    setTimeout(() => {
      addToCart(product, variantId, 1);
      setAddingId(null);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1800);
    }, 140);
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            STUDIO CATALOG
          </span>
        </div>
        <h1 className="font-editorial" style={{ fontSize: 'clamp(2.2rem, 4vw, 2.8rem)', color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
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
          padding: '1.1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search planters, miniatures, organizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.4rem', paddingRight: searchQuery ? '2rem' : '0.85rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Sort & Availability Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={selectedStockType}
            onChange={(e) => setSelectedStockType(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
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
            style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
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
            style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
            aria-label="Sort products"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Visual Category Navigation Chips */}
      <div style={{ marginBottom: '1.25rem' }}>
        <CategoryNav
          variant="catalog-chips"
          selectedCategory={selectedCategory === 'All Categories' ? 'All' : selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat === 'All' ? 'All Categories' : cat)}
        />
      </div>

      {/* Filter Status Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          padding: '0.4rem 0.2rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <span>
            Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'creation' : 'creations'}
          </span>
          {selectedCategory !== 'All Categories' && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
              in {selectedCategory}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--brand-accent)',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset all filters</span>
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Compass size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No creations found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            We could not find items matching your active filters. You can reset filters or request a bespoke 3D CAD quotation.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={resetAllFilters}
              className="btn-primary"
              style={{ fontSize: '0.88rem' }}
            >
              Reset Filters
            </button>
            <Link href="/quote" className="btn-secondary" style={{ fontSize: '0.88rem' }}>
              Upload Custom STL
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map((product) => {
            const activeVariant = product.variants[0];
            const isAdding = addingId === product.id;
            const isAdded = addedId === product.id;

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
                    background: '#F5F2EB',
                    display: 'block',
                  }}
                >
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
                      <Compass size={32} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem', zIndex: 2 }}>
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
                      <Link href={`/catalog/${product.slug}`} className="product-title-link" style={{ color: 'inherit', textDecoration: 'none' }}>
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
                      <p className="tabular-num" style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {formatINR(product.basePricePaise)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product, activeVariant.id)}
                      disabled={isAdding}
                      className="btn-primary"
                      style={{
                        padding: '0.52rem 0.95rem',
                        fontSize: '0.82rem',
                        background: isAdded ? 'var(--status-ready)' : 'var(--action-primary)',
                        borderColor: isAdded ? 'var(--status-ready)' : 'var(--action-primary)',
                        transition: 'all var(--duration-fast) ease',
                      }}
                      aria-label={`Add ${product.title} to cart`}
                    >
                      {isAdding ? (
                        <>
                          <Clock size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Adding...</span>
                        </>
                      ) : isAdded ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Added!</span>
                        </>
                      ) : (
                        <span>Add to Cart</span>
                      )}
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
