'use client';

import React from 'react';
import Link from 'next/link';
import { useOrders, useQuotes, useProducts, useStaffRole } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { 
  ShoppingBag, Cpu, MessageSquare, TrendingUp, 
  AlertTriangle, CheckCircle2 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { orders } = useOrders();
  const { quotes } = useQuotes();
  const { products } = useProducts();
  const { activeStaff } = useStaffRole();

  // Metrics calculations
  const totalRevenuePaise = orders
    .filter((o) => o.paymentStatus === 'captured')
    .reduce((sum, o) => sum + o.totalPaise, 0);

  const activeProductionJobs = orders.filter((o) =>
    ['queued', 'printing', 'finishing', 'quality_check'].includes(o.status)
  ).length;

  const pendingQuotes = quotes.filter((q) => q.status === 'submitted' || q.status === 'under_review').length;

  const readyToShip = orders.filter((o) => o.status === 'ready' || o.status === 'packed').length;

  // Urgent attention tasks
  const unhandledOrders = orders.filter((o) => o.status === 'confirmed');

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              OPERATIONS DESK • NASHIK HUB
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
            Welcome back, {activeStaff.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Active permissions: <strong style={{ color: 'var(--text-primary)' }}>{activeStaff.role}</strong>. Farm telemetry synchronized.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Link href="/admin/queue" className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
            <Cpu size={15} /> Farm Fleet
          </Link>
          <Link href="/admin/orders" className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
            <ShoppingBag size={15} /> View Orders ({orders.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Captured Revenue</span>
            <TrendingUp size={16} style={{ color: 'var(--status-ready)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatINR(totalRevenuePaise)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Across {orders.length} orders
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Print Jobs</span>
            <Cpu size={16} style={{ color: 'var(--brand-accent)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {activeProductionJobs}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Prusa & Bambu machines running
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pending STL Quotes</span>
            <MessageSquare size={16} style={{ color: 'var(--status-info)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {pendingQuotes}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Require volume slicing review
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ready for Dispatch</span>
            <CheckCircle2 size={16} style={{ color: 'var(--status-ready)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-ready)' }}>
            {readyToShip}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Awaiting shipping labels
          </div>
        </div>
      </div>

      {/* Operational Attention Alerts */}
      {unhandledOrders.length > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--status-mto-bg)',
            border: '1px solid var(--status-mto-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--status-mto)' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                {unhandledOrders.length} New Order(s) Awaiting Print Allocation
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Paid orders require G-code toolpath assignment to farm printers.
              </div>
            </div>
          </div>
          <Link href="/admin/orders" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
            Process Orders
          </Link>
        </div>
      )}

      {/* Two columns: Recent Orders & Quick Management */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Recent orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Recent Orders</h2>
            <Link href="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
              View all ({orders.length}) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {ord.orderNumber}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {ord.customerName} • {ord.items.length} item(s) • {ord.shippingAddress.city}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {formatINR(ord.totalPaise)}
                  </div>
                  <span
                    className={`badge ${
                      ord.status === 'delivered'
                        ? 'badge-ready'
                        : ord.status === 'cancelled'
                        ? 'badge-danger'
                        : 'badge-mto'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Quotes & Catalog Quick Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Custom STL RFQ Overview */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Custom STL Inquiries</h2>
              <Link href="/admin/quotes" style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                Manage RFQs →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {quotes.slice(0, 3).map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{q.referenceNumber}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        File: {q.fileName} ({q.materialPreference})
                      </div>
                    </div>
                    <span
                      className={`badge ${q.status === 'quoted' ? 'badge-ready' : 'badge-mto'}`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catalog Stock Alerts */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Catalog Inventory Health</h2>
              <Link href="/admin/products" style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                Inventory Editor →
              </Link>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {products.length} live products configured in Nashik database across 5 categories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
