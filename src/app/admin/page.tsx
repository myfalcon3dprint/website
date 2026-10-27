'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { useAdminRole } from '@/lib/adminRoleContext';
import { Order, CustomQuoteRequest } from '@/lib/types';
import { hasPermission, ROLE_METADATA, StaffRole } from '@/lib/rbac';
import { 
  ShoppingBag, Cpu, MessageSquare, 
  AlertTriangle, CheckCircle2, RefreshCw, AlertCircle,
  Truck, Plus, DollarSign, Package,
  Clock, ShieldAlert, Boxes, ChevronRight, HelpCircle,
  Layers, Tags, Video, ShieldCheck, Settings, Users,
  CheckCircle, PlayCircle, Eye
} from 'lucide-react';

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface DashboardJob {
  id: string;
  jobNumber: string;
  itemTitle: string;
  variantSku: string;
  quantity: number;
  material: string;
  color: string;
  status: string;
  printerName: string;
}

interface DashboardProduct {
  id: string;
  name: string;
  variantsCount: number;
  totalStock: number;
}

interface DashboardMetrics {
  newOrdersCount: number;
  ordersAwaitingPayment: number;
  ordersToPrepare: number;
  ordersReadyToShip: number;
  jobsAwaitingAction: number;
  overdueJobs: number;
  pendingQuotesCount: number;
  unansweredEnquiriesCount: number;
  grossSalesPaise?: number;
  paymentsReceivedPaise?: number;
  refundsPaise?: number;
  outstandingBalancesPaise?: number;
  totalOrdersCount: number;
  totalProductsCount: number;
  lowStockCount: number;
}

export default function AdminDashboardPage() {
  const { user, profile } = useAuthUser();
  const { effectiveRole, isPreviewMode } = useAdminRole();

  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Studio Staff';
  const roleMeta = ROLE_METADATA[effectiveRole] || {
    title: effectiveRole.replace('_', ' '),
    badgeColor: '#C2410C',
    badgeBg: '#FFF7ED',
    description: 'Operational staff member',
  };

  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<CustomQuoteRequest[]>([]);
  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([]);
  const [recentProducts, setRecentProducts] = useState<DashboardProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/metrics?range=${dateRange}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data.metrics || null);
      setLowStockItems(data.lowStockItems || []);
      setRecentOrders(data.recentOrders || []);
      setRecentQuotes(data.recentQuotes || []);
      setRecentJobs(data.recentJobs || []);
      setRecentProducts(data.recentProducts || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve operations metrics';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // Role permissions
  const canViewFinancials = hasPermission(effectiveRole, 'reports:financial');
  const canViewOrders = hasPermission(effectiveRole, 'orders:view');
  const canManageShipping = hasPermission(effectiveRole, 'shipping:view');
  const canViewProduction = hasPermission(effectiveRole, 'production:view');
  const canManageCatalog = hasPermission(effectiveRole, 'catalog:edit') || hasPermission(effectiveRole, 'catalog:adjust_stock');
  const canViewCustomers = hasPermission(effectiveRole, 'customers:view');
  const canManageStaff = hasPermission(effectiveRole, 'staff:view');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Top Welcome & Operations Status Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '4px',
                background: roleMeta.badgeBg,
                color: roleMeta.badgeColor,
                border: `1px solid ${roleMeta.badgeColor}`,
              }}
            >
              {roleMeta.title} Operations
            </span>
            {isPreviewMode && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: '#FEF3C7',
                  color: '#92400E',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Eye size={12} /> Visual Preview Active
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: '#0F172A', fontWeight: 800 }}>
            Welcome back, {staffName}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>
            {effectiveRole === 'owner' && 'Executive overview: Store financials, production throughput, staff management, and system configuration.'}
            {effectiveRole === 'order_manager' && 'Fulfillment operations: Customer order dispatch, shipping labels, and client communications.'}
            {effectiveRole === 'production_operator' && 'Nashik 3D print farm: Machine allocation, material slicing queue, and quality inspection.'}
            {effectiveRole === 'catalog_editor' && 'Storefront merchandising: Product catalog, variant inventory counts, showcase media, and branding.'}
          </p>
        </div>

        {/* Date Filter & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  background: dateRange === r ? '#FFFFFF' : 'transparent',
                  color: dateRange === r ? '#0F172A' : '#64748B',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: dateRange === r ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: dateRange === r ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardMetrics}
            disabled={isLoading}
            style={{
              fontSize: '0.8rem',
              padding: '0.5rem 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#0F172A',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Refresh Status"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#DC2626',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* QUICK ACTIONS ROW (TAILORED BY ROLE) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Role Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
          {/* Owner Quick Actions */}
          {effectiveRole === 'owner' && (
            <>
              <Link
                href="/admin/products?action=new"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#FFF7ED', color: '#C2410C' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Add Product</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Publish new 3D model</div>
                </div>
              </Link>

              <Link
                href="/admin/orders?action=manual_order"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB' }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Create Manual Order</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>COD or offline payment</div>
                </div>
              </Link>

              <Link
                href="/admin/shipping"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669' }}>
                  <Truck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Shipping & Dispatch</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Generate packing slips</div>
                </div>
              </Link>

              <Link
                href="/admin/staff"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#F5F3FF', color: '#7C3AED' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Staff & Permissions</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Manage team access</div>
                </div>
              </Link>
            </>
          )}

          {/* Order Manager Quick Actions */}
          {effectiveRole === 'order_manager' && (
            <>
              <Link
                href="/admin/orders"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB' }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Order Desk</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Review active purchases</div>
                </div>
              </Link>

              <Link
                href="/admin/shipping"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669' }}>
                  <Truck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Shipping Desk</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Generate packing slips</div>
                </div>
              </Link>

              <Link
                href="/admin/custom-requests"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#FAF5FF', color: '#9333EA' }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Custom Requests</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Respond to STL quotes</div>
                </div>
              </Link>

              <Link
                href="/admin/messages"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#FDF2F8', color: '#DB2777' }}>
                  <Boxes size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Contact Inbox</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Unread customer inquiries</div>
                </div>
              </Link>
            </>
          )}

          {/* Production Operator Quick Actions */}
          {effectiveRole === 'production_operator' && (
            <>
              <Link
                href="/admin/production"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#ECFEFF', color: '#0891B2' }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Print Farm Queue</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Claim ready print jobs</div>
                </div>
              </Link>

              <Link
                href="/admin/production?status=waiting_to_print"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Waiting to Slice</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Prepare G-code for printers</div>
                </div>
              </Link>

              <Link
                href="/admin/production?status=printing"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669' }}>
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>QC Inspection Desk</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Pass/fail completed parts</div>
                </div>
              </Link>

              <Link
                href="/admin/products"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Material Specs</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>View PLA/PETG dimensions</div>
                </div>
              </Link>
            </>
          )}

          {/* Catalog Editor Quick Actions */}
          {effectiveRole === 'catalog_editor' && (
            <>
              <Link
                href="/admin/products?action=new"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#FFF7ED', color: '#C2410C' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Add Product</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>New 3D model listing</div>
                </div>
              </Link>

              <Link
                href="/admin/categories"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#F0FDF4', color: '#16A34A' }}>
                  <Tags size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Manage Categories</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Organize store taxonomy</div>
                </div>
              </Link>

              <Link
                href="/admin/videos"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB' }}>
                  <Video size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Showcase Videos</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Add YouTube & print reels</div>
                </div>
              </Link>

              <Link
                href="/admin/products?stock=low"
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Low Stock Alert</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Restock ready-stock items</div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* SECTION 1: FINANCIALS (SUPER ADMIN ONLY - REPORTS:FINANCIAL) */}
      {canViewFinancials && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.65rem' }}>
            <DollarSign size={15} style={{ color: '#C2410C' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Store Financials ({dateRange === 'all' ? 'All Time' : dateRange === 'today' ? 'Today' : dateRange === '7d' ? '7 Days' : '30 Days'})
            </span>
            <span title="Figures derived directly from verified database records in integer paise (Super Admin exclusive)" style={{ cursor: 'help', color: '#64748B' }}>
              <HelpCircle size={13} />
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Gross Sales */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.35rem', fontWeight: 600 }}>
                Gross Sales (All Orders)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>
                {formatINR(metrics?.grossSalesPaise || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.4rem' }}>
                Total value across {metrics?.totalOrdersCount || 0} customer orders
              </div>
            </div>

            {/* Payments Received */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.35rem', fontWeight: 600 }}>
                Payments Received (Settled)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
                {formatINR(metrics?.paymentsReceivedPaise || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.4rem' }}>
                Captured through Razorpay & settled COD
              </div>
            </div>

            {/* Refunds Processed */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #EF4444', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#DC2626', marginBottom: '0.35rem', fontWeight: 600 }}>
                Refunds Processed
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#DC2626' }}>
                {formatINR(metrics?.refundsPaise || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.4rem' }}>
                Completed reversals & cancellations
              </div>
            </div>

            {/* Outstanding Balances */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#D97706', marginBottom: '0.35rem', fontWeight: 600 }}>
                Outstanding Balance Due
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706' }}>
                {formatINR(metrics?.outstandingBalancesPaise || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.4rem' }}>
                Awaiting payment or partial deposit
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: OPERATIONAL WORKFLOW TILES (SCOPED BY PERMISSION) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Operational Queue & Status
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {/* New Orders (Orders view permission) */}
          {canViewOrders && (
            <Link
              href="/admin/orders?status=confirmed"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>New Orders</span>
                  <ShoppingBag size={15} style={{ color: '#C2410C' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A' }}>
                  {metrics?.newOrdersCount || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#C2410C', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                View new orders <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Orders Awaiting Payment (Owner & Order Manager) */}
          {canViewOrders && (
            <Link
              href="/admin/orders?payment=pending"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Awaiting Payment</span>
                  <Clock size={15} style={{ color: '#D97706' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#D97706' }}>
                  {metrics?.ordersAwaitingPayment || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Filter pending payment <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Jobs to Prepare (Production view permission) */}
          {canViewProduction && (
            <Link
              href="/admin/production?status=waiting_to_print"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Jobs to Prepare</span>
                  <Cpu size={15} style={{ color: '#0891B2' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0891B2' }}>
                  {metrics?.jobsAwaitingAction || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0891B2', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Production queue <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Orders Ready to Ship (Shipping permission) */}
          {canManageShipping && (
            <Link
              href="/admin/shipping?status=ready"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Ready to Ship</span>
                  <Truck size={15} style={{ color: '#059669' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669' }}>
                  {metrics?.ordersReadyToShip || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Dispatch desk <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Pending Custom Quotes (Customers permission) */}
          {canViewCustomers && (
            <Link
              href="/admin/custom-requests?status=submitted"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Custom Requests</span>
                  <MessageSquare size={15} style={{ color: '#7C3AED' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#7C3AED' }}>
                  {metrics?.pendingQuotesCount || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Review STL quotes <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Unanswered Enquiries (Customers permission) */}
          {canViewCustomers && (
            <Link
              href="/admin/messages?status=new"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>New Enquiries</span>
                  <Boxes size={15} style={{ color: '#DB2777' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#DB2777' }}>
                  {metrics?.unansweredEnquiriesCount || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#DB2777', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Open inbox <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Catalog Editor Metric: Total Models */}
          {effectiveRole === 'catalog_editor' && (
            <Link
              href="/admin/products"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Catalog Listings</span>
                  <Layers size={15} style={{ color: '#C2410C' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A' }}>
                  {metrics?.totalProductsCount || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#C2410C', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Browse 3D models <ChevronRight size={13} />
              </div>
            </Link>
          )}

          {/* Catalog Editor Metric: Low Stock Variants */}
          {effectiveRole === 'catalog_editor' && (
            <Link
              href="/admin/products?stock=low"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Low Stock Count</span>
                  <AlertTriangle size={15} style={{ color: '#DC2626' }} />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#DC2626' }}>
                  {metrics?.lowStockCount || 0}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.65rem', fontWeight: 600 }}>
                Review inventory <ChevronRight size={13} />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* SECTION 3: LOW STOCK INVENTORY ALERTS (FOR OWNER & CATALOG EDITOR) */}
      {(effectiveRole === 'owner' || effectiveRole === 'catalog_editor' || effectiveRole === 'order_manager') && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Low-Stock Inventory Warnings (Threshold ≤ 5 Units)
              </span>
            </div>
            {hasPermission(effectiveRole, 'catalog:adjust_stock') && (
              <Link href="/admin/products?stock=low" style={{ fontSize: '0.78rem', color: '#C2410C', textDecoration: 'none', fontWeight: 600 }}>
                Manage Catalog Stock →
              </Link>
            )}
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '1rem 1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#059669' }} />
              <span>All catalog product variants have sufficient inventory above the minimum workshop threshold.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {lowStockItems.map((item) => (
                <div
                  key={item.sku}
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #DC2626',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: item.stock === 0 ? '#FEE2E2' : '#FEF3C7',
                        color: item.stock === 0 ? '#DC2626' : '#D97706',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {item.stock} left
                    </span>
                    {hasPermission(effectiveRole, 'catalog:adjust_stock') && (
                      <Link
                        href={`/admin/products?search=${encodeURIComponent(item.sku)}`}
                        style={{ display: 'block', fontSize: '0.68rem', color: '#C2410C', marginTop: '4px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Restock →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: FEEDS (DYNAMICALLY TAILORED PER ROLE) */}

      {/* For PRODUCTION OPERATOR: Show Active 3D Print Farm Jobs */}
      {effectiveRole === 'production_operator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Active Print Farm Production Queue</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>Real-time G-code printing jobs and QC inspection status (Nashik Workshop)</p>
              </div>
              <Link href="/admin/production" style={{ fontSize: '0.78rem', color: '#C2410C', textDecoration: 'none', fontWeight: 600 }}>
                Open Production Desk →
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                No active 3D printing jobs in the queue.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentJobs.map((j) => (
                  <div
                    key={j.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{j.jobNumber}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>[{j.variantSku}]</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                        {j.itemTitle} • {j.quantity} unit(s) • {j.material} ({j.color})
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          background: j.status === 'printing' ? '#ECFEFF' : j.status === 'qc_passed' ? '#ECFDF5' : '#FEF3C7',
                          color: j.status === 'printing' ? '#0891B2' : j.status === 'qc_passed' ? '#059669' : '#D97706',
                        }}
                      >
                        {j.status.replace(/_/g, ' ')}
                      </span>
                      <Link
                        href="/admin/production"
                        style={{ display: 'block', fontSize: '0.7rem', color: '#C2410C', marginTop: '4px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Inspect Part →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* For CATALOG EDITOR: Show Catalog Listings & Health */}
      {effectiveRole === 'catalog_editor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Storefront Catalog Listings</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>Public 3D printable products, variant counts, and live stock levels</p>
              </div>
              <Link href="/admin/products" style={{ fontSize: '0.78rem', color: '#C2410C', textDecoration: 'none', fontWeight: 600 }}>
                Manage All Products →
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                No catalog items currently found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentProducts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {p.variantsCount} purchasable variant(s)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: p.totalStock > 5 ? '#ECFDF5' : p.totalStock > 0 ? '#FEF3C7' : '#FEE2E2',
                          color: p.totalStock > 5 ? '#059669' : p.totalStock > 0 ? '#D97706' : '#DC2626',
                        }}
                      >
                        {p.totalStock} total units
                      </span>
                      <Link
                        href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                        style={{ display: 'block', fontSize: '0.7rem', color: '#C2410C', marginTop: '4px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Edit Product →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* For OWNER and ORDER MANAGER: Show Orders Feed and Quotes Feed */}
      {(effectiveRole === 'owner' || effectiveRole === 'order_manager') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Orders Feed */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Recent Store Orders</h2>
              <Link href="/admin/orders" style={{ fontSize: '0.78rem', color: '#C2410C', textDecoration: 'none', fontWeight: 600 }}>
                All Orders →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                No orders found for the selected time range.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{o.orderNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {o.customerName} • {new Date(o.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {canViewFinancials ? (
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{formatINR(o.totalPaise)}</div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{o.items?.length || 1} item(s)</div>
                      )}
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          color: o.status === 'delivered' ? '#059669' : o.status === 'cancelled' ? '#DC2626' : '#C2410C',
                        }}
                      >
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Custom Requests Feed */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Custom Print Requests</h2>
              <Link href="/admin/custom-requests" style={{ fontSize: '0.78rem', color: '#C2410C', textDecoration: 'none', fontWeight: 600 }}>
                All Requests →
              </Link>
            </div>

            {recentQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                No custom quotes currently awaiting staff review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentQuotes.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{q.referenceNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{q.fullName} • {q.fileName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#FAF5FF',
                          color: '#7C3AED',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {q.status.replace(/_/g, ' ')}
                      </span>
                      <Link
                        href={`/admin/custom-requests?ref=${encodeURIComponent(q.referenceNumber)}`}
                        style={{ display: 'block', fontSize: '0.7rem', color: '#C2410C', marginTop: '4px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Price Quote →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
