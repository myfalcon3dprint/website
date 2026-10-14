'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useProducts, useCart } from '@/lib/store';
import { formatINR } from '@/lib/money';
import {
  ChevronLeft,
  ShoppingCart,
  Info,
  CheckCircle2,
  Layers,
  Ruler,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { products } = useProducts();
  const { addToCart } = useCart();

  const product = products.find((p) => p.slug === resolvedParams.slug);

  if (!product) {
    return notFound();
  }

  const [selectedVariantId, setSelectedVariantId] = useState<string>(product.variants[0].id);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  const activeVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant?.image) {
      const idx = product.images.indexOf(variant.image);
      if (idx !== -1) {
        setSelectedImageIndex(idx);
      }
    }
  };

  const handleThumbnailSelect = (idx: number) => {
    setSelectedImageIndex(idx);
    const targetImage = product.images[idx];
    const matchingVariant = product.variants.find((v) => v.image === targetImage);
    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, activeVariant.id, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const activeDisplayImage = product.images[selectedImageIndex] || activeVariant.image || product.images[0];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <Link href="/catalog" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={15} />
          <span>Catalog</span>
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{product.category}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.title}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '3.5rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Left: Gallery */}
        <div>
          {/* Main Photo with Warm Neutral Background */}
          <div
            style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: '#F5F5F0',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <img
              src={activeDisplayImage}
              alt={`${product.title} - ${activeVariant.title}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
            {/* Active Variant Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '0.85rem',
                left: '0.85rem',
                background: 'rgba(24, 24, 24, 0.85)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                letterSpacing: '0.02em',
              }}
            >
              {activeVariant.material} • {activeVariant.finish}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {product.images.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailSelect(idx)}
                    style={{
                      width: '4.8rem',
                      height: '4.8rem',
                      borderRadius: 'var(--radius-xs)',
                      overflow: 'hidden',
                      border: isSelected ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                      background: '#F5F5F0',
                      opacity: isSelected ? 1 : 0.65,
                      transition: 'opacity 0.15s, border-color 0.15s',
                      padding: 0,
                    }}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={img} alt={`Studio angle ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Product Details & Variant Picker */}
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: '2.1rem', color: 'var(--text-primary)', marginTop: '0.25rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>
            {product.title}
          </h1>
          <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
            {product.subtitle}
          </p>

          {/* Price & Lead Time Card */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unit Price (Inclusive of taxes)</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {formatINR(activeVariant.pricePaise)}
              </p>
            </div>

            <div>
              {activeVariant.leadTimeDays === 0 ? (
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-ready">In Stock • Nashik</span>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                    Dispatches in 24 hours
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-mto">Made to Order</span>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                    Lead time: {activeVariant.leadTimeDays} business days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Variant Selection */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'block' }}>
              Select Specification & Finish:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantSelect(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-xs)',
                      textAlign: 'left',
                      background: isSelected ? '#FFFFFF' : 'var(--surface-alt)',
                      border: isSelected ? '2px solid var(--action-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid var(--brand-accent)' : '2px solid var(--border-control)',
                          background: '#FFFFFF',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {v.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
                          {v.material} • {v.finish} • SKU: {v.sku}
                        </p>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {formatINR(v.pricePaise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem' }}>
            {/* Quantity */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-control)',
                padding: '0.35rem 0.65rem',
                gap: '0.65rem',
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ color: 'var(--text-primary)', padding: '0.2rem', fontSize: '1rem', fontWeight: 600 }}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '1.25rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ color: 'var(--text-primary)', padding: '0.2rem', fontSize: '1rem', fontWeight: 600 }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddToCart}
              className="btn-primary"
              style={{ flex: 1, padding: '0.8rem', fontSize: '0.95rem' }}
            >
              <ShoppingCart size={17} />
              <span>Add to Cart ({formatINR(activeVariant.pricePaise * quantity)})</span>
            </button>
          </div>

          {/* Toast Notice */}
          {addedToast && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                background: 'var(--status-ready-bg)',
                border: '1px solid var(--status-ready-border)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--status-ready)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '1.5rem',
              }}
            >
              <CheckCircle2 size={15} />
              <span>Added to your cart. Cart drawer ready.</span>
            </div>
          )}

          {/* Technical Specifications */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.85rem', fontWeight: 600 }}>
              Physical & Manufacturing Specs
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.65rem', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Technology:</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.1rem', margin: 0 }}>
                  {product.specs.printTechnology}
                </p>
              </div>

              <div style={{ padding: '0.65rem', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Layer Height:</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.1rem', margin: 0 }}>
                  {product.specs.layerHeightMm} mm
                </p>
              </div>

              <div style={{ padding: '0.65rem', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dimensions:</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.1rem', margin: 0 }}>
                  {activeVariant.dimensions.lengthMm} × {activeVariant.dimensions.widthMm} × {activeVariant.dimensions.heightMm} mm
                </p>
              </div>

              <div style={{ padding: '0.65rem', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Weight:</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.1rem', margin: 0 }}>
                  ~{activeVariant.weightGrams} grams
                </p>
              </div>
            </div>

            {/* Food Safety Disclosure */}
            {!product.specs.foodSafe && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.65rem',
                  background: 'var(--status-mto-bg)',
                  border: '1px solid var(--status-mto-border)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  gap: '0.4rem',
                  alignItems: 'flex-start',
                }}
              >
                <Info size={14} style={{ color: 'var(--status-mto)', marginTop: '0.1rem', flexShrink: 0 }} />
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  Material Safety Note: This product is designed for decorative display or dry desktop organization. It is not certified for hot liquids or direct food contact.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
