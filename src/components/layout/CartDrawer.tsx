'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart, Truck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, itemCount, subtotalPaise, updateQuantity, removeFromCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const freeShippingThresholdPaise = 99900;
  const remainingForFreeShipping = Math.max(0, freeShippingThresholdPaise - subtotalPaise);
  const freeShippingProgress = Math.min(100, Math.round((subtotalPaise / freeShippingThresholdPaise) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(18, 18, 18, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: 'cartDrawerFadeIn 220ms ease-out',
        }}
      />

      {/* Drawer Surface */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          boxShadow: 'var(--shadow-drawer)',
          animation: 'cartDrawerSlideIn 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={20} style={{ color: 'var(--brand-accent)' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Shopping Cart ({itemCount})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart drawer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.25rem',
              height: '2.25rem',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-xs)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-alt)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div
          style={{
            padding: '0.9rem 1.5rem',
            background: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
            <Truck size={15} style={{ color: remainingForFreeShipping === 0 ? 'var(--status-ready)' : 'var(--brand-accent)' }} />
            {remainingForFreeShipping === 0 ? (
              <span style={{ color: 'var(--status-ready)', fontWeight: 600 }}>You qualify for free delivery across India</span>
            ) : (
              <span>
                Add <strong>{formatINR(remainingForFreeShipping)}</strong> more for <strong>Free Delivery</strong>
              </span>
            )}
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${freeShippingProgress}%`,
                height: '100%',
                background: remainingForFreeShipping === 0 ? 'var(--status-ready)' : 'var(--brand-accent)',
                transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto 0', padding: '2.5rem 1rem' }}>
              <div
                style={{
                  width: '3.75rem',
                  height: '3.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <ShoppingCart size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontWeight: 700 }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '280px', margin: '0 auto 1.5rem' }}>
                Discover our precision 3D planters, desk gadgets, and architectural scale models.
              </p>
              <Link
                href="/catalog"
                onClick={onClose}
                className="btn-primary"
                style={{ fontSize: '0.88rem', padding: '0.7rem 1.4rem' }}
              >
                Browse Studio Catalog
              </Link>
            </div>
          ) : (
            cart.map((item) => {
              const itemImage = item.variant.image || item.product.images[0] || '';
              const isReadyStock = item.variant.leadTimeDays === 0;
              const maxStock = isReadyStock ? item.variant.stockQuantity : 99;
              const isAtStockLimit = isReadyStock && item.quantity >= maxStock;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    padding: '0.95rem',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: item.needsReselection ? '1px solid var(--status-mto-border)' : '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  {item.needsReselection && (
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        background: 'var(--status-mto-bg)',
                        color: 'var(--status-mto)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Variant unavailable — please re-select</span>
                      <Link
                        href={`/catalog/${item.product.slug}`}
                        onClick={onClose}
                        style={{ color: 'var(--status-mto)', textDecoration: 'underline' }}
                      >
                        Select Option
                      </Link>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.9rem' }}>
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '4.75rem',
                        height: '4.75rem',
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        background: '#F5F5F0',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {itemImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={itemImage}
                          alt={`${item.product.title} - ${item.variant.title}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '0.3';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            padding: '0.25rem',
                          }}
                        >
                          Studio Preview
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {item.product.title}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0, fontWeight: 500 }}>
                          {item.variant.title}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                            {item.variant.color}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                            {item.variant.material} • {item.variant.finish}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                          {formatINR(item.variant.pricePaise)} each
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                        {/* Stepper with accessible targets */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: 'var(--surface-alt)',
                            padding: '0.15rem',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.variant.title}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1.75rem',
                              height: '1.75rem',
                              color: 'var(--text-primary)',
                              background: 'none',
                              border: 'none',
                              borderRadius: 'var(--radius-xs)',
                              cursor: 'pointer',
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '1.25rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isAtStockLimit}
                            aria-label={`Increase quantity of ${item.variant.title}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1.75rem',
                              height: '1.75rem',
                              color: isAtStockLimit ? 'var(--text-muted)' : 'var(--text-primary)',
                              background: 'none',
                              border: 'none',
                              borderRadius: 'var(--radius-xs)',
                              cursor: isAtStockLimit ? 'not-allowed' : 'pointer',
                              opacity: isAtStockLimit ? 0.4 : 1,
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="tabular-num" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatINR(item.variant.pricePaise * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.variant.title} from cart`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1.75rem',
                              height: '1.75rem',
                              color: 'var(--status-danger)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius-xs)',
                              opacity: 0.85,
                              transition: 'opacity var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isAtStockLimit && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                      Maximum stock reached ({maxStock} available)
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--surface-alt)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                {formatINR(subtotalPaise)}
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
              Shipping calculated at checkout. Free shipping on orders over ₹999.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Link
                href="/cart"
                onClick={onClose}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem', textAlign: 'center', justifyContent: 'center' }}
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="btn-primary"
                style={{
                  flex: 1.5,
                  padding: '0.8rem',
                  fontSize: '0.88rem',
                  gap: '0.45rem',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1A1816 0%, #2A241F 100%)',
                  border: '1px solid var(--gallery-gold)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  letterSpacing: '0.04em',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: 'var(--gallery-gold)' }}>Express Checkout</span>
                <ArrowRight size={15} color="var(--gallery-gold)" />
              </Link>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Continue Browsing
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cartDrawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes cartDrawerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
