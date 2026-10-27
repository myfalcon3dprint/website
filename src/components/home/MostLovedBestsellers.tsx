'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts, useCart, openCartDrawer } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { Star, CheckCircle2, Clock, ArrowRight, Eye, Sparkles, Compass } from 'lucide-react';

export default function MostLovedBestsellers() {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Focus on top 4 featured creations
  const featured = products.filter((p) => p.featured).slice(0, 4);

  const handleQuickAdd = (product: typeof products[0], variantId: string) => {
    setAddingId(product.id);
    setTimeout(() => {
      addToCart(product, variantId, 1);
      setAddingId(null);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1800);
    }, 140);
  };

  const handleOrderNow = (product: typeof products[0], variantId: string) => {
    addToCart(product, variantId, 1);
    openCartDrawer();
  };

  return (
    <section className="container" aria-label="Most Loved Studio Masterpieces">
      {/* MurtiHub-Style Ornamental Section Header */}
      <div className="ornamental-header">
        <div className="ornamental-line">
          <span>&diams; MOST LOVED CREATIONS &diams;</span>
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
          Studio Masterpieces
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.96rem', lineHeight: 1.6, margin: 0 }}>
          Our most sought-after physical editions, from desk sanctuaries to architectural Jyotirlinga scale models.
        </p>
      </div>

      {/* Grid of Bestseller Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {featured.map((product) => {
          const activeVariant = product.variants[0];
          const isAdding = addingId === product.id;
          const isAdded = addedId === product.id;

          // Compute MRP strikethrough (~30% higher for visual discount like MurtiHub)
          const basePaise = product.basePricePaise || 49900;
          const originalPaise = Math.round(basePaise * 1.35);
          const discountPct = Math.round(((originalPaise - basePaise) / originalPaise) * 100);

          const precisionLabel =
            product.specs?.layerHeightMm < 0.1
              ? `${Math.round(product.specs.layerHeightMm * 1000)}µm ${product.specs.printTechnology || 'Resin'}`
              : `${product.specs?.layerHeightMm || 0.16}mm ${product.specs?.printTechnology || 'FDM'}`;

          return (
            <div key={product.id} className="luxury-card" style={{ background: '#FFFFFF', border: '1px solid #ECE7DE' }}>
              {/* Image Frame */}
              <Link
                href={`/catalog/${product.slug}`}
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  background: '#F6F3EC',
                  display: 'block',
                }}
              >
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="img-zoom"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F1EA', color: '#827D74' }}>
                    <Compass size={32} />
                  </div>
                )}

                {/* Top Left: Gold Most Loved Pill */}
                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2 }}>
                  <span className="badge-gold">
                    <Sparkles size={11} />
                    <span>Most Loved</span>
                  </span>
                </div>

                {/* Top Right: Stock Status */}
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 2 }}>
                  {product.stockType === 'ready_stock' ? (
                    <span className="badge badge-ready">Ready Stock</span>
                  ) : (
                    <span className="badge badge-mto">Made to Order</span>
                  )}
                </div>

                {/* Bottom Overlay: Precision Tag */}
                <div style={{ position: 'absolute', bottom: '0.65rem', left: '0.65rem', zIndex: 2 }}>
                  <span className="badge-precision">
                    {precisionLabel}
                  </span>
                </div>
              </Link>

              {/* Card Body */}
              <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>
                      {product.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#1C1917', fontWeight: 700 }}>
                      <Star size={12} fill="#C59B27" color="#C59B27" />
                      <span>{product.rating ? product.rating.toFixed(1) : '4.9'}</span>
                      <span style={{ color: '#78716C', fontSize: '0.7rem' }}>({product.reviewCount || 28})</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: '#1C1917', marginTop: '0.15rem', marginBottom: '0.35rem', fontWeight: 700, lineHeight: 1.35 }}>
                    <Link href={`/catalog/${product.slug}`} style={{ color: '#1C1917' }}>
                      {product.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: '#57534E',
                      lineHeight: 1.5,
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

                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #ECE7DE' }}>
                  {/* MurtiHub-Style Price Row with Discount Tag */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.85rem' }}>
                    <span className="tabular-num" style={{ fontSize: '1.28rem', fontWeight: 800, color: '#1C1917' }}>
                      {formatINR(basePaise)}
                    </span>
                    <span className="strikethrough-price">
                      {formatINR(originalPaise)}
                    </span>
                    <span className="discount-tag">
                      {discountPct}% OFF
                    </span>
                  </div>

                  {/* Dual Action Buttons: Quick Add + Order Now */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product, activeVariant?.id || '')}
                      disabled={isAdding}
                      style={{
                        padding: '0.65rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid #1C1917',
                        background: '#FFFFFF',
                        color: '#1C1917',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        transition: 'all 160ms ease',
                      }}
                      aria-label={`Quick add ${product.title} to cart`}
                    >
                      {isAdding ? (
                        <Clock size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : isAdded ? (
                        <CheckCircle2 size={14} style={{ color: '#047857' }} />
                      ) : (
                        <span>Quick Add</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOrderNow(product, activeVariant?.id || '')}
                      className="btn-primary"
                      style={{
                        padding: '0.65rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        background: '#1C1917',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(28, 25, 23, 0.18)',
                      }}
                      aria-label={`Order ${product.title} now`}
                    >
                      <span>Order Now</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link
          href="/catalog"
          className="btn-secondary"
          style={{
            padding: '0.75rem 1.85rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #D6D0C4',
            background: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <span>Explore Entire Catalog ({products.length} Items)</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
