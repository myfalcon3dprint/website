'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useProducts, useCart, addRecentlyViewedSlug } from '@/lib/store';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/money';
import {
  ShoppingCart,
  Info,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Package,
  Wrench,
  Clock,
  Layers,
  Sparkles,
  ZoomIn,
  X,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { products } = useProducts();
  const { cart, addToCart } = useCart();

  const [liveProduct, setLiveProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedLive, setHasCheckedLive] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interaction & Motion States
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'care' | 'dispatch'>('overview');
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Zoom / Magnifier state
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (resolvedParams.slug) {
      addRecentlyViewedSlug(resolvedParams.slug);
    }
  }, [resolvedParams.slug]);

  useEffect(() => {
    const memoryMatch = products.find((p) => p.slug === resolvedParams.slug);
    if (memoryMatch) {
      setLiveProduct(memoryMatch);
      setIsLoading(false);
      return;
    }

    fetch(`/api/products/${resolvedParams.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.product) {
          setLiveProduct(data.product);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
        setHasCheckedLive(true);
      });
  }, [products, resolvedParams.slug]);

  const product = liveProduct || products.find((p) => p.slug === resolvedParams.slug);

  useEffect(() => {
    if (product && product.variants.length > 0) {
      if (!selectedVariantId || !product.variants.some((v) => v.id === selectedVariantId)) {
        setSelectedVariantId(product.variants[0].id);
      }
    }
  }, [product, selectedVariantId]);

  // Mobile sticky bar scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (!buyButtonRef.current) return;
      const rect = buyButtonRef.current.getBoundingClientRect();
      // Show sticky bar once the main buy button scrolls out of view
      setShowStickyBar(rect.bottom < 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard escape for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  if (isLoading && !product) {
    return (
      <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-accent)', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '0.95rem' }}>Loading studio product specification...</p>
      </div>
    );
  }

  if (!product && hasCheckedLive) {
    return notFound();
  }

  if (!product) {
    return null;
  }

  const activeVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0] || {
    id: 'placeholder',
    sku: 'FAL-STD',
    title: 'Standard',
    material: 'PLA' as const,
    color: 'Standard',
    finish: 'Raw (Layered)' as const,
    pricePaise: product.basePricePaise,
    dimensions: { lengthMm: 100, widthMm: 100, heightMm: 100 },
    weightGrams: 100,
    stockQuantity: 10,
    leadTimeDays: 0,
  };

  // Stock calculations
  const existingCartItem = cart.find(
    (item) => item.product.id === product.id && item.variant.id === activeVariant.id
  );
  const existingInCart = existingCartItem?.quantity || 0;
  const isReadyStock = activeVariant.leadTimeDays === 0;
  const availableStock = isReadyStock
    ? Math.max(0, activeVariant.stockQuantity - existingInCart)
    : 99;
  const currentQuantity = draftQuantities[activeVariant.id] ?? 1;
  const isAtMaxStock = isReadyStock && (currentQuantity >= availableStock || availableStock === 0);

  // Variant change handler
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

  // Thumbnail click handler
  const handleThumbnailSelect = (idx: number) => {
    setSelectedImageIndex(idx);
    const targetImage = product.images[idx];
    const matchingVariant = product.variants.find((v) => v.image === targetImage);
    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  };

  // Quantity change handler
  const handleQuantityStep = (delta: number) => {
    const nextQty = currentQuantity + delta;
    if (nextQty < 1) return;
    if (isReadyStock && nextQty > availableStock) return;

    setDraftQuantities((prev) => ({
      ...prev,
      [activeVariant.id]: nextQty,
    }));
  };

  // Add to cart handler with tactile micro-interaction
  const handleAddToCart = () => {
    if (isReadyStock && availableStock <= 0) return;
    setIsAdding(true);

    setTimeout(() => {
      const qtyToAdd = Math.min(currentQuantity, availableStock > 0 ? availableStock : 1);
      addToCart(product, activeVariant.id, qtyToAdd);
      setIsAdding(false);
      setIsAdded(true);
      setToastMessage(`Added ${qtyToAdd} × ${activeVariant.title} to cart.`);

      // Trigger cart drawer preview event
      window.dispatchEvent(new CustomEvent('OPEN_CART_EVENT'));

      setTimeout(() => {
        setIsAdded(false);
      }, 2500);

      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 280);
  };

  // Image magnifier handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageFrameRef.current) return;
    const { left, top, width, height } = imageFrameRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  // Active display image resolution
  const hasDedicatedVariantImage = Boolean(activeVariant.image);
  const currentPreviewImage = product.images[selectedImageIndex];
  const isPreviewOfAnotherVariant = product.variants.some(
    (v) => v.id !== activeVariant.id && v.image && v.image === currentPreviewImage
  );

  let activeDisplayImage: string | undefined;
  let isGenericPreview = false;

  if (hasDedicatedVariantImage && !isPreviewOfAnotherVariant) {
    activeDisplayImage = activeVariant.image;
  } else if (currentPreviewImage && !isPreviewOfAnotherVariant) {
    activeDisplayImage = currentPreviewImage;
  } else if (hasDedicatedVariantImage) {
    activeDisplayImage = activeVariant.image;
  } else {
    isGenericPreview = true;
    activeDisplayImage = product.images[0];
  }

  // Supplementary data
  const includedItems =
    product.includedItems && product.includedItems.length > 0
      ? product.includedItems
      : [
          `1 × ${product.title} (${activeVariant.title})`,
          '1 × Studio calibration and quality assurance inspection slip',
          'Note: Plants, desk accessories, and styling props shown in photography are demonstration only and not included.',
        ];

  const careInstructions =
    product.careInstructions ||
    `Wipe gently with a clean, microfiber cloth. Avoid exposure to direct flame or ambient heat above ${product.specs.heatResistanceC}°C. Not certified for dishwashers or hot food/liquid contact.`;

  const dispatchInfo =
    product.dispatchInfo ||
    (activeVariant.leadTimeDays === 0
      ? 'In stock at our Nashik studio. Dispatches within 24 hours via express surface courier.'
      : `Fabricated to order with custom perimeter and layer slicing. Print duration and studio QC is ${activeVariant.leadTimeDays} business days prior to dispatch.`);

  // Variant color accent helper
  const getColorHex = (colorName: string): string => {
    const c = colorName.toLowerCase();
    if (c.includes('black') || c.includes('jet') || c.includes('charcoal')) return '#1A1816';
    if (c.includes('white') || c.includes('natural')) return '#F4F2EB';
    if (c.includes('terracotta') || c.includes('orange') || c.includes('copper')) return '#D9531E';
    if (c.includes('green') || c.includes('olive') || c.includes('sage')) return '#4A6B53';
    if (c.includes('silver') || c.includes('grey') || c.includes('gray')) return '#9E9D99';
    if (c.includes('blue') || c.includes('teal')) return '#2B5B84';
    if (c.includes('yellow') || c.includes('gold') || c.includes('brass')) return '#D4A017';
    return '#8C827A';
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '6rem' }}>
      {/* Editorial Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        <Link href="/catalog" style={{ color: 'var(--text-secondary)' }}>Catalog</Link>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        <Link
          href={`/catalog?category=${encodeURIComponent(product.category)}`}
          style={{ color: 'var(--text-secondary)' }}
        >
          {product.category}
        </Link>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.title}</span>
      </nav>

      {/* Main Grid: Gallery + Purchasing Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '3.5rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Left Column: Gallery & Magnifier */}
        <div>
          {/* Main Stage Image Frame */}
          <div
            ref={imageFrameRef}
            onMouseEnter={() => setIsHoverZooming(true)}
            onMouseLeave={() => setIsHoverZooming(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setIsLightboxOpen(true)}
            style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: '#F3EFE6',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
              cursor: 'zoom-in',
            }}
            title="Click to view full-resolution inspection zoom"
          >
            {activeDisplayImage ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image
                  key={`${activeVariant.id}_${activeDisplayImage}`}
                  src={activeDisplayImage}
                  alt={`${product.title} - ${activeVariant.title}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 550px"
                  style={{
                    objectFit: 'cover',
                    transform: isHoverZooming ? 'scale(1.28)' : 'scale(1)',
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: isHoverZooming ? 'transform 120ms ease-out' : 'transform 260ms ease-out',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>No preview photograph available</span>
              </div>
            )}

            {/* Magnifier Action Indicator */}
            <div
              style={{
                position: 'absolute',
                top: '0.85rem',
                right: '0.85rem',
                background: 'rgba(26, 24, 22, 0.75)',
                backdropFilter: 'blur(6px)',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                pointerEvents: 'none',
              }}
            >
              <ZoomIn size={13} />
              <span>Inspect Layer Detail</span>
            </div>

            {/* Active Variant Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '0.85rem',
                left: '0.85rem',
                background: 'rgba(26, 24, 22, 0.88)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getColorHex(activeVariant.color),
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                }}
              />
              <span>{activeVariant.color}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{activeVariant.material}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{activeVariant.finish}</span>
            </div>

            {/* Generic Preview Notice */}
            {isGenericPreview && (
              <div
                style={{
                  position: 'absolute',
                  top: '0.85rem',
                  left: '0.85rem',
                  background: 'rgba(255, 255, 255, 0.94)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                Studio preview • {activeVariant.color} custom printed on order
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {product.images.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                const associatedVariant = product.variants.find((v) => v.image === img);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbnailSelect(idx)}
                    style={{
                      width: '4.8rem',
                      height: '4.8rem',
                      borderRadius: 'var(--radius-xs)',
                      overflow: 'hidden',
                      border: isSelected ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                      outline: isSelected ? '2px solid var(--brand-accent)' : 'none',
                      outlineOffset: '2px',
                      background: '#F3EFE6',
                      opacity: isSelected ? 1 : 0.65,
                      transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                      padding: 0,
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isSelected ? '0 4px 12px rgba(232, 89, 12, 0.25)' : 'none',
                    }}
                    aria-label={associatedVariant ? `View ${associatedVariant.title}` : `View studio photograph ${idx + 1}`}
                  >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <Image
                        src={img}
                        alt={associatedVariant ? associatedVariant.title : `Studio angle ${idx + 1}`}
                        fill
                        sizes="80px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    {associatedVariant && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(26, 24, 22, 0.8)',
                          color: '#FFFFFF',
                          fontSize: '0.58rem',
                          textAlign: 'center',
                          padding: '0.12rem 0.2rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {associatedVariant.color}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Title, Variants, Purchasing Controls */}
        <div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--brand-accent)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.35rem',
            }}
          >
            {product.category}
          </span>

          <h1
            className="font-editorial"
            style={{
              fontSize: '2.35rem',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginTop: 0,
              marginBottom: '0.65rem',
              letterSpacing: '-0.02em',
            }}
          >
            {product.title}
          </h1>

          <p
            style={{
              fontSize: '0.96rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: '1.5rem',
            }}
          >
            {product.subtitle}
          </p>

          {/* Pricing & Stock Card */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unit Price (Inclusive of GST)
              </span>
              <p
                className="tabular-num"
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0.15rem 0 0',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatINR(activeVariant.pricePaise)}
              </p>
            </div>

            <div>
              {activeVariant.leadTimeDays === 0 ? (
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-ready">In Stock • Nashik</span>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                    Dispatches within 24 hours
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-mto">Made to Order</span>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                    Print & QC: {activeVariant.leadTimeDays} business days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tactile Variant Selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.65rem' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Select Configuration & Finish:
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                {activeVariant.title}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem' }}>
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const colorHex = getColorHex(v.color);

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantSelect(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      background: isSelected ? 'var(--surface)' : 'var(--surface-alt)',
                      border: isSelected ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                      transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {/* Tactile Swatch Dot */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: colorHex,
                          border: isSelected ? '2px solid var(--brand-accent)' : '1px solid rgba(0,0,0,0.15)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          flexShrink: 0,
                        }}
                      />

                      <div>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {v.title}
                        </p>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
                          {v.material} • {v.finish} • SKU: {v.sku}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        className="tabular-num"
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {formatINR(v.pricePaise)}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '1.35rem',
                            height: '1.35rem',
                            borderRadius: '50%',
                            background: 'var(--brand-accent)',
                            color: '#FFFFFF',
                            boxShadow: '0 2px 6px rgba(232, 89, 12, 0.35)',
                          }}
                          aria-label="Selected variant"
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Inventory Status Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.95rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Configuration: <strong style={{ color: 'var(--text-primary)' }}>{activeVariant.color} • {activeVariant.material}</strong>
            </span>
            {isReadyStock && (
              <span
                style={{
                  fontSize: '0.76rem',
                  color: availableStock <= 3 ? 'var(--brand-accent)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {availableStock > 0 ? `${availableStock} units ready in studio` : 'Maximum stock in your cart'}
              </span>
            )}
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            {/* Quantity Stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-control)',
                padding: '0.2rem',
                gap: '0.25rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <button
                type="button"
                onClick={() => handleQuantityStep(-1)}
                disabled={currentQuantity <= 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: currentQuantity <= 1 ? 'not-allowed' : 'pointer',
                  opacity: currentQuantity <= 1 ? 0.35 : 1,
                  borderRadius: 'var(--radius-xs)',
                }}
                aria-label={`Decrease quantity of ${activeVariant.title}`}
              >
                -
              </button>
              <span
                className="tabular-num"
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  minWidth: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                {currentQuantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityStep(1)}
                disabled={isAtMaxStock}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: isAtMaxStock ? 'not-allowed' : 'pointer',
                  opacity: isAtMaxStock ? 0.35 : 1,
                  borderRadius: 'var(--radius-xs)',
                }}
                aria-label={`Increase quantity of ${activeVariant.title}`}
              >
                +
              </button>
            </div>

            {/* Main Add to Cart Button */}
            <button
              ref={buyButtonRef}
              type="button"
              onClick={handleAddToCart}
              disabled={isReadyStock && availableStock <= 0}
              className="btn-primary"
              style={{
                flex: 1,
                padding: '0.85rem 1.35rem',
                fontSize: '0.96rem',
                height: '3rem',
                opacity: isReadyStock && availableStock <= 0 ? 0.5 : 1,
                cursor: isReadyStock && availableStock <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
              }}
            >
              {isAdding ? (
                <>
                  <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Adding to Cart...</span>
                </>
              ) : isAdded ? (
                <>
                  <CheckCircle2 size={17} />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={17} />
                  <span>
                    {isReadyStock && availableStock <= 0
                      ? 'Stock limit reached in cart'
                      : `Add to Cart (${formatINR(activeVariant.pricePaise * currentQuantity)})`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              role="status"
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--status-ready-bg)',
                border: '1px solid var(--status-ready-border)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--status-ready)',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '1.25rem',
                animation: 'badgePop 200ms ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <CheckCircle2 size={16} />
                <span>{toastMessage}</span>
              </div>
              <Link
                href="/checkout"
                style={{
                  color: 'var(--status-ready)',
                  textDecoration: 'underline',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                Proceed to Checkout &rarr;
              </Link>
            </div>
          )}

          {/* Value Propositions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginBottom: '2rem',
              padding: '0.85rem 1rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Truck size={15} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
              <span>Complimentary shipping on ₹999+</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={15} style={{ color: 'var(--status-ready)', flexShrink: 0 }} />
              <span>Calibrated Nashik Studio QC</span>
            </div>
          </div>

          {/* Tabs for Technical Specs & Details */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'specs', label: 'Manufacturing Specs' },
                { id: 'care', label: 'Care & Safety' },
                { id: 'dispatch', label: 'Dispatch Timeline' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    style={{
                      padding: '0.65rem 0.95rem',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--brand-accent)' : 'var(--text-secondary)',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--brand-accent)' : '2px solid transparent',
                      marginBottom: '-1px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {product.description}
                </p>

                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={15} style={{ color: 'var(--brand-accent)' }} />
                      <span>Key Features & Craftsmanship</span>
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {product.features.map((feat, idx) => (
                        <li key={idx} style={{ marginBottom: '0.35rem' }}>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={15} style={{ color: 'var(--status-ready)' }} />
                    <span>Package Contents</span>
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {includedItems.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Specs */}
            {activeTab === 'specs' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Technology:</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem', margin: 0 }}>
                      {product.specs.printTechnology}
                    </p>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Layer Resolution:</span>
                    <p className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem', margin: 0 }}>
                      {product.specs.layerHeightMm} mm
                    </p>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Dimensions ({activeVariant.color}):</span>
                    <p className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem', margin: 0 }}>
                      {activeVariant.dimensions.lengthMm} × {activeVariant.dimensions.widthMm} × {activeVariant.dimensions.heightMm} mm
                    </p>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Weight:</span>
                    <p className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem', margin: 0 }}>
                      ~{activeVariant.weightGrams} grams
                    </p>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Filament & Finish:</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem', margin: 0 }}>
                      {activeVariant.material} • {activeVariant.finish}
                    </p>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SKU Identifier:</span>
                    <p className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.15rem', margin: 0 }}>
                      {activeVariant.sku}
                    </p>
                  </div>
                </div>

                {!product.specs.foodSafe && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: 'var(--status-mto-bg)',
                      border: '1px solid var(--status-mto-border)',
                      borderRadius: 'var(--radius-xs)',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Info size={15} style={{ color: 'var(--status-mto)', marginTop: '0.15rem', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Safety Notice: Designed for decorative display or dry desktop organization. Not certified for hot liquids or direct food contact.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Care */}
            {activeTab === 'care' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {careInstructions}
                </p>
                <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tip: Avoid prolonged direct UV exposure or placement on automotive dashboards during extreme summer heat to preserve geometry.
                </div>
              </div>
            )}

            {/* Tab 4: Dispatch */}
            {activeTab === 'dispatch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {dispatchInfo}
                </p>
                <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  All shipments depart our Nashik studio via tracked express courier. Real-time telemetry tracking provided upon dispatch.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Inspection Lightbox Modal */}
      {isLightboxOpen && activeDisplayImage && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(26, 24, 22, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '2.75rem',
              height: '2.75rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 160ms',
            }}
            aria-label="Close Inspection Modal"
          >
            <X size={20} />
          </button>

          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              width: '800px',
              height: '600px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeDisplayImage}
              alt={`${product.title} inspection`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="90vw"
            />
          </div>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      {showStickyBar && (
        <aside
          aria-label="Quick Add to Cart"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 70,
            background: 'rgba(251, 249, 245, 0.96)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '0.75rem 1rem',
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -4px 16px rgba(26, 24, 22, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
            {activeDisplayImage && (
              <div
                style={{
                  width: '2.6rem',
                  height: '2.6rem',
                  borderRadius: 'var(--radius-xs)',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Image
                  src={activeDisplayImage}
                  alt={product.title}
                  fill
                  sizes="45px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {product.title}
              </p>
              <p
                className="tabular-num"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--brand-accent)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {formatINR(activeVariant.pricePaise)} • {activeVariant.color}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isReadyStock && availableStock <= 0}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.84rem',
              height: '2.4rem',
              flexShrink: 0,
            }}
          >
            {isAdding ? 'Adding...' : isAdded ? 'Added ✓' : 'Add to Cart'}
          </button>
        </aside>
      )}
    </div>
  );
}
