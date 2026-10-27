'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/store';
import { formatINR } from '@/lib/money';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function CartPage() {
  const { cart, isLoaded, itemCount, subtotalPaise, updateQuantity, removeFromCart, clearCart } = useCart();

  const freeShippingThresholdPaise = 99900;
  const qualifiesForFreeShipping = subtotalPaise >= freeShippingThresholdPaise;
  const remainingForFreeShipping = Math.max(0, freeShippingThresholdPaise - subtotalPaise);
  const shippingProgressPct = Math.min(100, Math.round((subtotalPaise / freeShippingThresholdPaise) * 100));

  if (!isLoaded) {
    return (
      <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-accent)', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading cart contents...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      {/* Editorial Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          marginBottom: '1.75rem',
        }}
      >
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Shopping Cart</span>
      </nav>

      {/* Cart Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            className="font-editorial"
            style={{
              fontSize: '2.25rem',
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Shopping Bag
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0' }}>
            Review your studio selections before proceeding to checkout.
          </p>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '0.25rem',
              transition: 'color 140ms ease',
            }}
          >
            Clear entire bag
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4.5rem 1.5rem',
            maxWidth: '600px',
            margin: '0 auto',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '4.5rem',
              height: '4.5rem',
              borderRadius: '50%',
              background: 'var(--surface-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--brand-accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <ShoppingCart size={28} />
          </div>
          <h2 className="font-editorial" style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Your Shopping Bag is Empty
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 2rem' }}>
            Discover our collection of geometric planters, articulated collectibles, and precision desk organizers crafted in Nashik.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalog" className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              Explore Full Catalog
            </Link>
            <Link href="/catalog?category=Planters%20%26%20Decor" className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              Browse Planters
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Line Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Free Shipping Progress Indicator */}
            <div
              style={{
                padding: '1.15rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                background: qualifiesForFreeShipping ? 'var(--status-ready-bg)' : 'var(--surface)',
                border: qualifiesForFreeShipping ? '1px solid var(--status-ready-border)' : '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                <Truck size={17} style={{ color: qualifiesForFreeShipping ? 'var(--status-ready)' : 'var(--brand-accent)', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: qualifiesForFreeShipping ? 'var(--status-ready)' : 'var(--text-primary)',
                  }}
                >
                  {qualifiesForFreeShipping
                    ? 'Your order qualifies for complimentary express shipping across India!'
                    : `Add ${formatINR(remainingForFreeShipping)} more to unlock FREE delivery across India.`}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--surface-alt)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: `${shippingProgressPct}%`,
                    height: '100%',
                    background: qualifiesForFreeShipping
                      ? 'var(--status-ready)'
                      : 'linear-gradient(90deg, var(--brand-accent) 0%, #F59F00 100%)',
                    borderRadius: '3px',
                    transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>

            {/* Cart Line Items */}
            {cart.map((item) => {
              const itemImage = item.variant.image || item.product.images[0] || '';
              const isReadyStock = item.variant.leadTimeDays === 0;
              const maxStock = isReadyStock ? item.variant.stockQuantity : 99;
              const isAtStockLimit = isReadyStock && item.quantity >= maxStock;

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '1.35rem',
                    borderRadius: 'var(--radius-sm)',
                    border: item.needsReselection ? '1px solid var(--status-mto-border)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {item.needsReselection && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: 'var(--status-mto-bg)',
                        color: 'var(--status-mto)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <AlertCircle size={15} />
                        <span>Variant unavailable — please re-select your preferred specification</span>
                      </div>
                      <Link
                        href={`/catalog/${item.product.slug}`}
                        style={{ color: 'var(--status-mto)', textDecoration: 'underline' }}
                      >
                        Re-select
                      </Link>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    {/* Variant Thumbnail */}
                    <div
                      style={{
                        width: '5.5rem',
                        height: '5.5rem',
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        background: '#F3EFE6',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {itemImage ? (
                        <Image
                          src={itemImage}
                          alt={`${item.product.title} - ${item.variant.title}`}
                          fill
                          sizes="90px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            padding: '0.25rem',
                          }}
                        >
                          Studio Preview
                        </div>
                      )}
                    </div>

                    {/* Details Column */}
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <Link
                            href={`/catalog/${item.product.slug}`}
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            {item.product.title}
                          </Link>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                            {item.variant.title}
                          </p>
                        </div>

                        <span className="tabular-num" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatINR(item.variant.pricePaise * item.quantity)}
                        </span>
                      </div>

                      {/* Variant Detail Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.72rem', background: 'var(--surface-alt)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          Color: <strong>{item.variant.color}</strong>
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'var(--surface-alt)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          Material: <strong>{item.variant.material}</strong>
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'var(--surface-alt)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          Finish: <strong>{item.variant.finish}</strong>
                        </span>
                        {item.variant.dimensions && (
                          <span className="tabular-num" style={{ fontSize: '0.72rem', background: 'var(--surface-alt)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            Dimensions: <strong>{item.variant.dimensions.lengthMm}×{item.variant.dimensions.widthMm}×{item.variant.dimensions.heightMm}mm</strong>
                          </span>
                        )}
                      </div>

                      {/* Unit Price & Stepper Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span className="tabular-num" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Unit Price: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(item.variant.pricePaise)}</strong>
                          </span>

                          {/* Stepper with accessible controls */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              background: 'var(--surface-alt)',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border-control)',
                              padding: '0.15rem',
                              gap: '0.25rem',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.variant.title}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.9rem',
                                height: '1.9rem',
                                color: 'var(--text-primary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-xs)',
                              }}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="tabular-num" style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '1.6rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={isAtStockLimit}
                              aria-label={`Increase quantity of ${item.variant.title}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.9rem',
                                height: '1.9rem',
                                color: isAtStockLimit ? 'var(--text-muted)' : 'var(--text-primary)',
                                background: 'none',
                                border: 'none',
                                cursor: isAtStockLimit ? 'not-allowed' : 'pointer',
                                opacity: isAtStockLimit ? 0.35 : 1,
                                borderRadius: 'var(--radius-xs)',
                              }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Remove Action targeting only this line */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.variant.title} from cart`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.8rem',
                            color: 'var(--status-danger)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-xs)',
                            transition: 'opacity 140ms ease',
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>

                      {isAtStockLimit && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', margin: '0.5rem 0 0', fontWeight: 600 }}>
                          Maximum ready stock reached ({maxStock} units currently available).
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary */}
          <div style={{ position: 'sticky', top: '5.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-editorial" style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatINR(subtotalPaise)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Estimated Shipping</span>
                  <span style={{ color: qualifiesForFreeShipping ? 'var(--status-ready)' : 'var(--text-primary)', fontWeight: qualifiesForFreeShipping ? 700 : 400 }}>
                    {qualifiesForFreeShipping ? 'FREE' : 'Calculated at checkout'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Included GST (18%)</span>
                  <span className="tabular-num">{formatINR(Math.round(subtotalPaise * 0.18))}</span>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.85rem',
                    marginTop: '0.4rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>Estimated Total</span>
                  <span className="tabular-num">{formatINR(subtotalPaise)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.98rem',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  height: '3rem',
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/catalog"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '0.35rem',
                }}
              >
                <ArrowLeft size={14} />
                <span>Continue Browsing Studio Catalog</span>
              </Link>
            </div>

            {/* Trust and Assurance Cards */}
            <div
              style={{
                marginTop: '1rem',
                padding: '1.15rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--status-ready)', flexShrink: 0 }} />
                <span>Precision 3D printed & hand-inspected in our Nashik studio.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <Truck size={16} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                <span>Ready stock dispatches within 24 hours via express surface courier.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
