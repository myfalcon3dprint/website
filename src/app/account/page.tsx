'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '@/lib/store';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { Package, Search, ArrowRight, User, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

export default function AccountOrdersPage() {
  const { orders } = useOrders();
  const { user, profile, isStaff, signOut, signInWithGoogle } = useAuthUser();
  const [searchOrderNum, setSearchOrderNum] = useState('');

  const displayedOrders = orders.filter((o) => {
    if (!searchOrderNum.trim()) return true;
    return (
      o.orderNumber.toLowerCase().includes(searchOrderNum.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchOrderNum.toLowerCase())
    );
  });

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* User Session Banner */}
      {user ? (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '2.8rem',
                height: '2.8rem',
                borderRadius: '50%',
                background: 'var(--brand-accent)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                flexShrink: 0,
              }}
            >
              {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: isStaff ? 'rgba(255, 113, 0, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: isStaff ? 'var(--brand-accent)' : '#22C55E',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {profile?.role || 'Customer'}
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isStaff && (
              <Link href="/admin" className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>
                <ShieldCheck size={14} />
                <span>Admin Hub</span>
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="btn-outline"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            background: 'rgba(255, 113, 0, 0.05)',
            border: '1px solid rgba(255, 113, 0, 0.2)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-accent)', marginBottom: '0.2rem' }}>
              <Sparkles size={14} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SYNC YOUR 3D PRINTS
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              Sign in with Google to synchronize orders, quotation history, and dispatch updates across all your devices.
            </p>
          </div>
          <button
            onClick={() => signInWithGoogle('/account')}
            className="btn-primary"
            style={{ fontSize: '0.84rem', padding: '0.55rem 1.1rem' }}
          >
            <span>Sign in with Google</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            CUSTOMER PORTAL
          </span>
          <h1 style={{ fontSize: '2.1rem', color: 'var(--text-primary)', marginTop: '0.25rem', letterSpacing: '-0.025em' }}>
            Your Orders &amp; Print Status
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Track real-time layer progress, quality check milestones, and delivery dispatch.
          </p>
        </div>

        {/* Search Order Number */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search FAL-2026-..."
            value={searchOrderNum}
            onChange={(e) => setSearchOrderNum(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No orders found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            You haven't placed any orders yet or no match found for &ldquo;{searchOrderNum}&rdquo;.
          </p>
          <Link href="/catalog" className="btn-primary" style={{ fontSize: '0.88rem' }}>
            Explore 3D Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedOrders.map((order) => {
            return (
              <div
                key={order.id}
                className="card card-hover"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '0.1rem', margin: 0 }}>
                      {order.orderNumber}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      className={`badge ${
                        order.status === 'delivered'
                          ? 'badge-ready'
                          : order.status === 'cancelled'
                          ? 'badge-danger'
                          : 'badge-mto'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>

                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatINR(order.totalPaise)}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.quantity}× <strong style={{ color: 'var(--text-primary)' }}>{item.productTitle}</strong> ({item.variantDetails})
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatINR(item.totalPricePaise)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer with Tracker Link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Shipping to: {order.customerName}, {order.shippingAddress.city} ({order.shippingAddress.pinCode})
                  </p>

                  <Link
                    href={`/account/orders/${order.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'var(--brand-accent)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    <span>View Print Timeline & Invoice</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
