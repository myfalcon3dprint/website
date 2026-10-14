'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders, useStaffRole } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { Order, OrderStatus } from '@/lib/types';
import { 
  ShoppingBag, Search, Filter, CheckCircle2, AlertCircle, 
  ArrowRight, Edit3, Truck, ShieldAlert, ChevronDown, ChevronUp,
  Cpu, CheckSquare, Square
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
  const { orders, updateOrderStatus, updateShippingAddress } = useOrders();
  const { activeStaff } = useStaffRole();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skuFilter, setSkuFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Bulk actions selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatusAction, setBulkStatusAction] = useState<OrderStatus>('queued');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Address edit modal state
  const [editingAddressOrder, setEditingAddressOrder] = useState<Order | null>(null);
  const [editAddressForm, setEditAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    pinCode: '',
  });

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (skuFilter.trim()) {
      const hasSku = o.items.some((i) => i.variantSku.toLowerCase().includes(skuFilter.toLowerCase()));
      if (!hasSku) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(query);
      const matchCust = o.customerName.toLowerCase().includes(query);
      const matchCity = o.shippingAddress.city.toLowerCase().includes(query);
      if (!matchNum && !matchCust && !matchCity) return false;
    }
    return true;
  });

  // Staff permission helper
  const canUpdateStatus = ['owner', 'order_manager', 'production_operator'].includes(activeStaff.role);
  const canEditAddress = ['owner', 'order_manager'].includes(activeStaff.role);

  // Status update handler
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (!canUpdateStatus) {
      alert(`Access Restricted: Staff role "${activeStaff.role}" is not authorized to alter order states.`);
      return;
    }
    const note = `Updated to ${newStatus} by ${activeStaff.name} (${activeStaff.role})`;
    updateOrderStatus(orderId, newStatus, note);
  };

  // Bulk action handler
  const handleExecuteBulk = () => {
    if (selectedOrderIds.length === 0) return;
    if (!canUpdateStatus) {
      alert(`Access Restricted: Staff role "${activeStaff.role}" cannot execute bulk state modifications.`);
      return;
    }

    let successCount = 0;
    selectedOrderIds.forEach((id) => {
      const ord = orders.find((o) => o.id === id);
      if (ord && ord.status !== 'cancelled') {
        updateOrderStatus(id, bulkStatusAction, `Bulk updated to ${bulkStatusAction} by ${activeStaff.name}`);
        successCount++;
      }
    });

    setBulkMessage(`Bounded bulk execution finished: ${successCount} order(s) successfully transitioned to "${bulkStatusAction}".`);
    setSelectedOrderIds([]);
    setTimeout(() => setBulkMessage(null), 5000);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((item) => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const openAddressEdit = (order: Order) => {
    if (!canEditAddress) {
      alert(`Access Restricted: Only 'owner' or 'order_manager' may edit client delivery addresses.`);
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

  const saveAddressEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressOrder) return;

    updateShippingAddress(editingAddressOrder.id, {
      ...editingAddressOrder.shippingAddress,
      fullName: editAddressForm.fullName,
      phone: editAddressForm.phone,
      addressLine1: editAddressForm.addressLine1,
      city: editAddressForm.city,
      pinCode: editAddressForm.pinCode,
    });

    updateOrderStatus(
      editingAddressOrder.id,
      editingAddressOrder.status,
      `Address amended by ${activeStaff.name}: City ${editAddressForm.city}, PIN ${editAddressForm.pinCode}`
    );

    setEditingAddressOrder(null);
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Title & Filter Bar */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Operational Fulfilment
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
          Orders Pipeline
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Manage multi-item print batches, audit stage transitions, and process dispatches.
        </p>
      </div>

      {bulkMessage && (
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
          <CheckCircle2 size={16} /> {bulkMessage}
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
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Stages ({orders.length})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replace('_', ' ').toUpperCase()} ({orders.filter((o) => o.status === st).length})
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
            onChange={(e) => setSkuFilter(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Search Order / Customer
          </label>
          <input
            type="text"
            className="input"
            placeholder="Search FAL-2026 or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selectedOrderIds.length > 0 && (
        <div
          style={{
            padding: '12px 20px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border-decor)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <strong>{selectedOrderIds.length}</strong> order(s) selected
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Transition selected to:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
              value={bulkStatusAction}
              onChange={(e) => setBulkStatusAction(e.target.value as OrderStatus)}
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={handleExecuteBulk}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              Apply Bulk Action
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-decor)' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <button
                    onClick={toggleSelectAll}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
                    aria-label="Select all orders"
                  >
                    {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare size={16} color="var(--primary-action)" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Order #</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Items & SKUs</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total (INR)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Current Stage</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No orders match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isExpanded = expandedOrderId === ord.id;
                  const isSelected = selectedOrderIds.includes(ord.id);

                  return (
                    <React.Fragment key={ord.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-decor)',
                          background: isSelected ? 'var(--surface-alt)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => toggleSelectOrder(ord.id)}
                            style={{ background: 'none', border: 'none', color: isSelected ? 'var(--primary-action)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                            aria-label={`Select order ${ord.orderNumber}`}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ord.orderNumber}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
                            {ord.items.map((it) => (
                              <div key={it.id} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{it.quantity}×</strong> {it.productTitle}
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> ({it.variantSku})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatINR(ord.totalPaise)}
                          <div style={{ fontSize: '0.7rem', color: ord.paymentStatus === 'captured' ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
                            {ord.paymentStatus}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={ord.status}
                            disabled={!canUpdateStatus || ord.status === 'cancelled'}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
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
                              Public View ↗
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Detail Row */}
                      {isExpanded && (
                        <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-decor)' }}>
                          <td colSpan={7} style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                              {/* Address with Edit Button */}
                              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border-decor)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Shipping Destination</strong>
                                  {canEditAddress && (
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
                                  Audit Status Trail ({ord.statusHistory.length})
                                </strong>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {ord.statusHistory.map((h, i) => (
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
              Modifications are recorded into order audit history with your identity ({activeStaff.name}).
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
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Correction
                </button>
                <button
                  type="button"
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
    </div>
  );
}
