'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { Order, OrderStatus } from '@/lib/types';
import { 
  ShoppingBag, Search, Filter, CheckCircle2, AlertCircle, 
  ArrowRight, Edit3, Truck, ShieldAlert, ChevronDown, ChevronUp,
  Cpu, CheckSquare, Square, RefreshCw, DollarSign, ChevronLeft, ChevronRight,
  SlidersHorizontal, Plus, Minus, Trash2, X
} from 'lucide-react';

const ALL_STATUSES: OrderStatus[] = [
  'confirmed',
  'queued',
  'printing',
  'finishing',
  'quality_check',
  'reprint_required',
  'ready',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrdersPage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'customer';
  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Staff';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skuFilter, setSkuFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Address edit modal state
  const [editingAddressOrder, setEditingAddressOrder] = useState<Order | null>(null);
  const [editAddressForm, setEditAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    pinCode: '',
  });
  const [isAddressSaving, setIsAddressSaving] = useState(false);

  // Refund modal state
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  // Item Correction & Financial Reconciliation modal state
  const [correctingOrder, setCorrectingOrder] = useState<Order | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>('Inventory reconciliation adjustment');
  const [isCorrectingItem, setIsCorrectingItem] = useState<boolean>(false);
  const [reconciliationNote, setReconciliationNote] = useState<string | null>(null);

  // Permissions
  const canUpdateStatus = ['owner', 'order_manager', 'production_operator'].includes(staffRole);
  const canEditAddress = ['owner', 'order_manager'].includes(staffRole);
  const canApproveRefund = staffRole === 'owner';

  // Fetch orders from live API
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (skuFilter.trim()) params.set('sku', skuFilter.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setOrders(data.orders || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.totalCount || 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve orders';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery, skuFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Status update handler with Concurrency Detection
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (!canUpdateStatus) {
      alert(`Access Restricted: Role '${staffRole}' cannot modify order states.`);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          statusNote: `Transitioned to ${newStatus} by ${staffName} (${staffRole})`,
          lastKnownUpdatedAt: order.updatedAt,
        }),
      });

      if (res.status === 409) {
        alert('Concurrency Conflict: This order was updated by another user. Reloading latest records.');
        fetchOrders();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update order status');
      }

      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
      setSuccessMessage(`Order ${order.orderNumber} successfully updated to ${newStatus.toUpperCase()}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      alert(`Error updating order: ${msg}`);
    }
  };

  // Address edit modal opener
  const openAddressEdit = (order: Order) => {
    if (!canEditAddress) {
      alert(`Access Restricted: Only 'owner' or 'order_manager' may edit delivery addresses.`);
      return;
    }
    const lockedStatuses: OrderStatus[] = ['packed', 'shipped', 'delivered'];
    if (lockedStatuses.includes(order.status)) {
      alert(`Address modification blocked: Order is already '${order.status}'. Courier labels cannot be altered.`);
      return;
    }

    setEditingAddressOrder(order);
    setEditAddressForm({
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      addressLine1: order.shippingAddress.addressLine1,
      city: order.shippingAddress.city,
      pinCode: order.shippingAddress.pinCode,
    });
  };

  // Address edit saver with Concurrency Detection
  const saveAddressEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressOrder) return;
    setIsAddressSaving(true);

    try {
      const res = await fetch(`/api/orders/${editingAddressOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: editAddressForm,
          lastKnownUpdatedAt: editingAddressOrder.updatedAt,
        }),
      });

      if (res.status === 409) {
        alert('Concurrency Conflict: This order was modified by another user. Reloading latest data.');
        setEditingAddressOrder(null);
        fetchOrders();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update shipping address');
      }

      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === editingAddressOrder.id ? data.order : o)));
      setEditingAddressOrder(null);
      setSuccessMessage(`Delivery address corrected for order ${editingAddressOrder.orderNumber}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Address correction failed';
      alert(`Address correction error: ${msg}`);
    } finally {
      setIsAddressSaving(false);
    }
  };

  // Refund approval handler (Strictly Owner)
  const handleApproveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder) return;
    setIsRefunding(true);

    try {
      const res = await fetch(`/api/orders/${refundOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason.trim() || 'Admin manual refund authorization',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to approve refund');
      }

      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === refundOrder.id ? data.order : o)));
      setRefundOrder(null);
      setRefundReason('');
      setSuccessMessage(`Refund approved for order ${refundOrder.orderNumber}. Recorded in audit history.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Refund authorization failed';
      alert(`Refund error: ${msg}`);
    } finally {
      setIsRefunding(false);
    }
  };

  // Item correction & reconciliation handler
  const handleItemCorrection = async (
    action: 'add' | 'update_quantity' | 'remove',
    itemId?: string,
    newQuantity?: number,
    variantId?: string
  ) => {
    if (!correctingOrder) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      alert('Please specify an operational reason (minimum 5 characters) for auditing.');
      return;
    }

    setIsCorrectingItem(true);
    setReconciliationNote(null);

    try {
      const res = await fetch(`/api/orders/${correctingOrder.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          itemId,
          variantId,
          newQuantity,
          reason: correctionReason.trim(),
          lastKnownUpdatedAt: correctingOrder.updatedAt,
        }),
      });

      if (res.status === 409) {
        alert('Concurrency Conflict: Order was modified by another operator. Reloading data.');
        setCorrectingOrder(null);
        fetchOrders();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to reconcile order item');
      }

      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === correctingOrder.id ? data.order : o)));
      setCorrectingOrder(data.order);
      setReconciliationNote(
        `${data.reconciliation.inventoryAdjustmentNote}. ${data.reconciliation.financialAdjustmentNote}.`
      );
      setSuccessMessage(`Order items reconciled for ${data.order.orderNumber}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reconciliation failed';
      alert(`Item correction error: ${msg}`);
    } finally {
      setIsCorrectingItem(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Operational Fulfilment
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Orders Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Transactional fulfillment desk, courier tracking assignment, and authorized status auditing.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Orders
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMessage}
          </div>
          <button onClick={fetchOrders} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Filter by Stage
          </label>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Stages ({totalCount})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Filter by Item SKU
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. FAL-MIN-001"
            value={skuFilter}
            onChange={(e) => { setSkuFilter(e.target.value); setPage(1); }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Search Order / Customer
          </label>
          <input
            type="text"
            className="input"
            placeholder="Search order #, customer, phone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-decor)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Order #</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Items & SKUs</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total (INR)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Current Stage</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading orders from Supabase database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No orders match the specified filters. Live customer orders placed on the storefront will appear here.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isExpanded = expandedOrderId === ord.id;

                  return (
                    <React.Fragment key={ord.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-decor)',
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ord.orderNumber}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ord.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {ord.shippingAddress.city} ({ord.shippingAddress.pinCode})
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {ord.items.map((it, idx) => (
                              <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{it.quantity}×</strong> {it.productTitle}
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> ({it.variantSku})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatINR(ord.totalPaise)}
                          <div style={{ fontSize: '0.7rem', color: ord.paymentStatus === 'captured' ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
                            {ord.paymentStatus.toUpperCase()}
                          </div>
                          {ord.refundStatus && ord.refundStatus !== 'none' && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                              Refund: {ord.refundStatus.toUpperCase()}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={ord.status}
                            disabled={!canUpdateStatus || ord.status === 'cancelled'}
                            onChange={(e) => handleStatusChange(ord, e.target.value as OrderStatus)}
                            className="input"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              width: 'auto',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              color: ord.status === 'delivered' ? 'var(--success)' : 'var(--text-primary)',
                            }}
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st.replace('_', ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {canEditAddress && !['packed', 'shipped', 'delivered', 'cancelled'].includes(ord.status) && (
                              <button
                                onClick={() => {
                                  setCorrectingOrder(ord);
                                  setCorrectionReason('Item quantity reconciliation');
                                  setReconciliationNote(null);
                                }}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--accent-primary)' }}
                                title="Correct Order Items & Inventory Reconciliation"
                              >
                                <SlidersHorizontal size={13} /> Items
                              </button>
                            )}

                            {canApproveRefund && ord.paymentStatus === 'captured' && ord.refundStatus !== 'approved' && (
                              <button
                                onClick={() => setRefundOrder(ord)}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--brand-accent)' }}
                                title="Authorize Refund"
                              >
                                <DollarSign size={13} /> Refund
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details
                            </button>
                            <Link
                              href={`/account/orders/${ord.id}`}
                              target="_blank"
                              style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textDecoration: 'underline' }}
                              title="Public customer tracking link"
                            >
                              Track ↗
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Detail Row */}
                      {isExpanded && (
                        <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-decor)' }}>
                          <td colSpan={6} style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                              {/* Address with Edit Button */}
                              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border-decor)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Shipping Destination</strong>
                                  {canEditAddress && !['packed', 'shipped', 'delivered'].includes(ord.status) && (
                                    <button
                                      onClick={() => openAddressEdit(ord)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        textDecoration: 'underline',
                                      }}
                                    >
                                      <Edit3 size={12} /> Correct Address
                                    </button>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                  {ord.shippingAddress.fullName} • +91 {ord.shippingAddress.phone}<br />
                                  {ord.shippingAddress.addressLine1}<br />
                                  {ord.shippingAddress.city}, {ord.shippingAddress.state} - {ord.shippingAddress.pinCode}
                                </div>
                              </div>

                              {/* Audit trail */}
                              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border-decor)' }}>
                                <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                  Audit Status Trail ({ord.statusHistory?.length || 0})
                                </strong>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {(ord.statusHistory || []).map((h, i) => (
                                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>[{h.status}]</span> {h.note} —{' '}
                                      {new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-decor)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} orders)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Address Correction Modal */}
      {editingAddressOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 24, 24, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Authorised Address Correction
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '20px' }}>
              Modifications are committed to PostgreSQL and logged in audit history under your identity ({staffName}).
            </p>

            <form onSubmit={saveAddressEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={editAddressForm.fullName}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Phone
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={editAddressForm.phone}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={editAddressForm.addressLine1}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, addressLine1: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={editAddressForm.city}
                    onChange={(e) => setEditAddressForm({ ...editAddressForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    className="input"
                    value={editAddressForm.pinCode}
                    onChange={(e) => setEditAddressForm({ ...editAddressForm, pinCode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" disabled={isAddressSaving} className="btn btn-primary" style={{ flex: 1 }}>
                  {isAddressSaving ? 'Saving to Database...' : 'Save Correction'}
                </button>
                <button
                  type="button"
                  disabled={isAddressSaving}
                  onClick={() => setEditingAddressOrder(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit Refund Approval Modal (Strictly Owner) */}
      {refundOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 24, 24, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Authorize Refund Approval
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '16px' }}>
              Order: <strong>{refundOrder.orderNumber}</strong> • Total: <strong>{formatINR(refundOrder.totalPaise)}</strong>
            </p>

            <form onSubmit={handleApproveRefund} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Refund Justification / Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  className="input"
                  placeholder="e.g. Approved due to cancellation request before slicing allocation."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={isRefunding} className="btn btn-primary" style={{ flex: 1 }}>
                  {isRefunding ? 'Recording...' : 'Authorize Refund'}
                </button>
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={() => setRefundOrder(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Correction & Inventory Reconciliation Modal */}
      {correctingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 24, 24, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Order Items Reconciliation
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Order: <strong>{correctingOrder.orderNumber}</strong> • Total: <strong>{formatINR(correctingOrder.totalPaise)}</strong>
                </span>
              </div>
              <button
                onClick={() => setCorrectingOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {reconciliationNote && (
              <div
                style={{
                  padding: '10px 14px',
                  marginBottom: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  color: 'var(--success)',
                  fontSize: '0.8125rem',
                }}
              >
                ✓ {reconciliationNote}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Operational Reason for Audit Log *
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Customer requested extra piece via support call"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                Line Items ({correctingOrder.items.length})
              </span>

              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {correctingOrder.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border-decor)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {item.productTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        SKU: {item.variantSku} • {formatINR(item.unitPricePaise)} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={isCorrectingItem}
                        onClick={() => {
                          if (item.quantity <= 1) {
                            if (confirm(`Remove '${item.productTitle}' from this order?`)) {
                              handleItemCorrection('remove', item.id);
                            }
                          } else {
                            handleItemCorrection('update_quantity', item.id, item.quantity - 1);
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '2px 8px', height: '28px', minWidth: '28px' }}
                        title="Decrease quantity or remove"
                      >
                        <Minus size={12} />
                      </button>

                      <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={isCorrectingItem}
                        onClick={() => handleItemCorrection('update_quantity', item.id, item.quantity + 1)}
                        className="btn btn-outline"
                        style={{ padding: '2px 8px', height: '28px', minWidth: '28px' }}
                        title="Increase quantity and decrement stock"
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        type="button"
                        disabled={isCorrectingItem}
                        onClick={() => {
                          if (confirm(`Remove '${item.productTitle}' completely?`)) {
                            handleItemCorrection('remove', item.id);
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '2px 8px', height: '28px', color: 'var(--danger)', marginLeft: '4px' }}
                        title="Remove item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCorrectingOrder(null)}
                className="btn btn-outline"
                style={{ padding: '8px 18px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
