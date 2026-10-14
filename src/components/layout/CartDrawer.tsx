'use client';

import React from 'react';
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

  if (!isOpen) return null;

  const freeShippingThresholdPaise = 99900;
  const remainingForFreeShipping = Math.max(0, freeShippingThresholdPaise - subtotalPaise);
  const freeShippingProgress = Math.min(100, Math.round((subtotalPaise / freeShippingThresholdPaise) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(24, 24, 24, 0.4)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer Surface */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 70,
          boxShadow: 'var(--shadow-dropdown)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} style={{ color: 'var(--brand-accent)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Shopping Cart ({itemCount})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart drawer"
            style={{
              padding: '0.4rem',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <Truck size={14} style={{ color: remainingForFreeShipping === 0 ? 'var(--status-ready)' : 'var(--brand-accent)' }} />
            {remainingForFreeShipping === 0 ? (
              <span style={{ color: 'var(--status-ready)', fontWeight: 600 }}>You qualify for free delivery across India</span>
            ) : (
              <span>
                Add <strong>{formatINR(remainingForFreeShipping)}</strong> more for <strong>Free Delivery</strong>
              </span>
            )}
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${freeShippingProgress}%`,
                height: '100%',
                background: remainingForFreeShipping === 0 ? 'var(--status-ready)' : 'var(--brand-accent)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto 0', padding: '2rem 1rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--text-muted)',
                }}
              >
                <ShoppingCart size={24} />
              </div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Your cart is empty</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Discover our precision 3D planters, desk gadgets, and architectural models.
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '0.85rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: '4.25rem',
                    height: '4.25rem',
                    borderRadius: 'var(--radius-xs)',
                    overflow: 'hidden',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                      {item.variant.title}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', marginTop: '0.1rem', fontWeight: 500 }}>
                      {item.variant.material} • {item.variant.leadTimeDays === 0 ? 'Ready Stock' : `${item.variant.leadTimeDays}d lead`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    {/* Stepper */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'var(--surface-alt)',
                        padding: '0.15rem 0.35rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        style={{ color: 'var(--text-primary)', padding: '0.1rem', display: 'flex' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '1rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        style={{ color: 'var(--text-primary)', padding: '0.1rem', display: 'flex' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatINR(item.variant.pricePaise * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                        style={{ color: 'var(--status-danger)', opacity: 0.8 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>
                {formatINR(subtotalPaise)}
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Shipping calculated at checkout. Free shipping on orders over ₹999.
            </p>

            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem', gap: '0.5rem' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
