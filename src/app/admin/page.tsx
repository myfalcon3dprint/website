'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { Order, CustomQuoteRequest } from '@/lib/types';
import { 
  ShoppingBag, Cpu, MessageSquare, TrendingUp, 
  AlertTriangle, CheckCircle2, RefreshCw, AlertCircle 
} from 'lucide-react';

interface AdminMetrics {
  totalRevenuePaise: number;
  totalOrdersCount: number;
  activeProductionJobs: number;
  pendingQuotesCount: number;
  readyToShip: number;
  unhandledOrdersCount: number;
  totalProductsCount: number;
}

export default function AdminDashboardPage() {
  const { user, profile } = useAuthUser();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<CustomQuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardMetrics = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data.metrics || null);
      setRecentOrders(data.recentOrders || []);
      setRecentQuotes(data.recentQuotes || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve operations metrics';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Administrator';
  const staffRole = profile?.role || 'staff';

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
            Welcome back, {staffName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Authoritative session: <strong style={{ color: 'var(--brand-accent)', textTransform: 'capitalize' }}>{staffRole.replace('_', ' ')}</strong>. Telemetry synchronized with live database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchDashboardMetrics}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Metrics"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/admin/queue" className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
            <Cpu size={15} /> Farm Fleet
          </Link>
          <Link href="/admin/orders" className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
            <ShoppingBag size={15} /> View Orders ({metrics?.totalOrdersCount ?? 0})
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.88rem' }}>{errorMessage}</span>
          </div>
          <button
            onClick={fetchDashboardMetrics}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
          >
            Retry
          </button>
        </div>
      )}

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
            {isLoading ? '...' : formatINR(metrics?.totalRevenuePaise ?? 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Across {metrics?.totalOrdersCount ?? 0} live orders
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Print Jobs</span>
            <Cpu size={16} style={{ color: 'var(--brand-accent)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isLoading ? '...' : metrics?.activeProductionJobs ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Queued, printing, or in finishing
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pending STL Quotes</span>
            <MessageSquare size={16} style={{ color: 'var(--status-info)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isLoading ? '...' : metrics?.pendingQuotesCount ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Awaiting slicing volume review
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ready for Dispatch</span>
            <CheckCircle2 size={16} style={{ color: 'var(--status-ready)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-ready)' }}>
            {isLoading ? '...' : metrics?.readyToShip ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Packed or QC cleared
          </div>
        </div>
      </div>

      {/* Operational Attention Alerts */}
      {(metrics?.unhandledOrdersCount ?? 0) > 0 && (
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
                {metrics?.unhandledOrdersCount} Paid Order(s) Awaiting Machine Allocation
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Paid orders require G-code toolpath assignment and print farm dispatch.
              </div>
            </div>
          </div>
          <Link href="/admin/orders" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
            Process Orders
          </Link>
        </div>
      )}

      {/* Two columns: Recent Orders & Inquiries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Recent orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Recent Live Orders</h2>
            <Link href="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
              View all ({metrics?.totalOrdersCount ?? 0}) →
            </Link>
          </div>

          {isLoading ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading recent orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No orders found in the database. Customer orders placed on the storefront will appear here in real-time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentOrders.slice(0, 5).map((ord) => (
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
          )}
        </div>

        {/* Custom Quotes Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Custom STL Inquiries</h2>
              <Link href="/admin/quotes" style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                Manage RFQs ({metrics?.pendingQuotesCount ?? 0}) →
              </Link>
            </div>

            {isLoading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading custom RFQs...
              </div>
            ) : recentQuotes.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No custom quote requests in database.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentQuotes.slice(0, 4).map((q) => (
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
                          {q.fullName} • {q.fileName} ({q.materialPreference})
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
            )}
          </div>

          {/* Catalog Stock Health */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Catalog Inventory Health</h2>
              <Link href="/admin/products" style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                Inventory Editor →
              </Link>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {metrics?.totalProductsCount ?? 0} live products configured in Supabase PostgreSQL database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
