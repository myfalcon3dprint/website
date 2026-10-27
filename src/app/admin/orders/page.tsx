'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { Order, OrderStatus } from '@/lib/types';
import { 
  ShoppingBag, Search, Filter, CheckCircle2, AlertCircle, 
  ArrowRight, Edit3, Truck, ShieldAlert, ChevronDown, ChevronUp,
  Cpu, CheckSquare, Square, RefreshCw, DollarSign, ChevronLeft, ChevronRight,
  SlidersHorizontal, Plus, Minus, Trash2, X, Download, Ban, UserPlus
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
  const [productFilter, setProductFilter] = useState<string>('');
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
  const [stagedQuantities, setStagedQuantities] = useState<Record<string, number>>({});
  const [correctionReason, setCorrectionReason] = useState<string>('Customer requested quantity adjustment');
  const [isCorrectingItem, setIsCorrectingItem] = useState<boolean>(false);
  const [reconciliationNote, setReconciliationNote] = useState<string | null>(null);

  // Manual Order Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine1: '',
    city: 'Nashik',
    state: 'Maharashtra',
    pinCode: '422009',
    itemTitle: 'Precision Planetary Gearbox Kit',
    itemSku: 'FAL-GEAR-PLA-BLK',
    itemQuantity: 1,
    unitPriceINR: 1499,
    stockType: 'made_to_order' as 'ready_stock' | 'made_to_order',
    paymentStatus: 'pending' as 'pending' | 'captured' | 'additional_payment_due',
    paymentMethod: 'Razorpay UPI/Card' as 'Razorpay UPI/Card' | 'Cash on Delivery (Local Nashik)',
    status: 'confirmed' as OrderStatus,
  });

  // Explicit Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Permissions
  const canUpdateStatus = ['owner', 'order_manager', 'production_operator'].includes(staffRole);
  const canEditAddress = ['owner', 'order_manager'].includes(staffRole);
  const canApproveRefund = staffRole === 'owner';
  const canCreateOrder = ['owner', 'order_manager'].includes(staffRole);

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
      if (productFilter.trim()) params.set('product', productFilter.trim());

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
  }, [page, limit, statusFilter, searchQuery, skuFilter, productFilter]);

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

  // Handle Manual Order Creation
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName.trim() || !newOrderForm.customerPhone.trim()) {
      alert('Please fill out customer name and phone number.');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const unitPricePaise = Math.round(Number(newOrderForm.unitPriceINR) * 100);
      const quantity = Math.max(1, Number(newOrderForm.itemQuantity) || 1);
      const subtotalPaise = unitPricePaise * quantity;
      const orderNumber = `FAL-MAN-${Date.now().toString().slice(-6)}`;

      const payload = {
        orderNumber,
        customerName: newOrderForm.customerName.trim(),
        customerPhone: newOrderForm.customerPhone.trim(),
        customerEmail: newOrderForm.customerEmail.trim() || `${newOrderForm.customerPhone.trim().replace(/[^0-9]/g, '')}@customer.falcon3dprints.com`,
        shippingAddress: {
          fullName: newOrderForm.customerName.trim(),
          phone: newOrderForm.customerPhone.trim(),
          addressLine1: newOrderForm.addressLine1.trim() || 'Studio Pickup, Sector 4, CIDCO',
          city: newOrderForm.city.trim() || 'Nashik',
          state: newOrderForm.state.trim() || 'Maharashtra',
          pinCode: newOrderForm.pinCode.trim() || '422009',
        },
        items: [
          {
            productTitle: newOrderForm.itemTitle.trim(),
            variantSku: newOrderForm.itemSku.trim(),
            variantDetails: 'Custom Studio Configuration',
            quantity,
            unitPricePaise,
            totalPricePaise: subtotalPaise,
            stockType: newOrderForm.stockType,
          },
        ],
        subtotalPaise,
        shippingPaise: 0,
        taxPaise: 0,
        totalPaise: subtotalPaise,
        paymentStatus: newOrderForm.paymentStatus,
        paymentMethod: newOrderForm.paymentMethod,
        status: newOrderForm.status,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create manual order');
      }

      setSuccessMessage(`Order #${orderNumber} created successfully! Total: ₹${(subtotalPaise / 100).toFixed(2)}`);
      setIsCreateModalOpen(false);
      setNewOrderForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        addressLine1: '',
        city: 'Nashik',
        state: 'Maharashtra',
        pinCode: '422009',
        itemTitle: 'Precision Planetary Gearbox Kit',
        itemSku: 'FAL-GEAR-PLA-BLK',
        itemQuantity: 1,
        unitPriceINR: 1499,
        stockType: 'made_to_order',
        paymentStatus: 'pending',
        paymentMethod: 'Razorpay UPI/Card',
        status: 'confirmed',
      });
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create order';
      alert(`Error creating order: ${msg}`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Commit Order Cancellation
  const handleCommitCancellation = async () => {
    if (!cancellingOrder) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      alert('Please specify a cancellation reason (minimum 5 characters) for audit trail.');
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${cancellingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'cancelled',
          statusNote: `Cancelled by staff: ${cancelReason.trim()}. Note: cancellation does not automatically issue a financial refund.`,
          lastKnownUpdatedAt: cancellingOrder.updatedAt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to cancel order');
      }

      setSuccessMessage(`Order #${cancellingOrder.orderNumber} marked as CANCELLED. (Financial refund must be processed separately by Studio Owner if applicable).`);
      setCancellingOrder(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cancelling order';
      alert(`Error: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Export Filtered Orders CSV
  const handleExportFilteredCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export matching current filters.');
      return;
    }

    let csvContent = 'Order Number,Date,Customer,Phone,City,Items Count,Total (INR),Payment Status,Payment Method,Fulfillment Status\n';
    orders.forEach((o) => {
      const inr = (o.totalPaise / 100).toFixed(2);
      const itemsCount = o.items ? o.items.reduce((s, it) => s + (it.quantity || 1), 0) : 1;
      csvContent += `"${o.orderNumber}","${new Date(o.createdAt).toLocaleDateString()}","${o.customerName}","${o.customerPhone}","${o.shippingAddress?.city || ''}","${itemsCount}","${inr}","${o.paymentStatus}","${o.paymentMethod}","${o.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `falcon-orders-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Item Correction Modal and initialize staged quantities
  const openCorrectionModal = (ord: Order) => {
    setCorrectingOrder(ord);
    setCorrectionReason('Customer requested line item quantity adjustment');
    setReconciliationNote(null);
    const initialQty: Record<string, number> = {};
    for (const it of ord.items) {
      initialQty[it.id] = it.quantity;
    }
    setStagedQuantities(initialQty);
  };

  const updateStagedQuantity = (itemId: string, newQty: number) => {
    setStagedQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, newQty),
    }));
  };

  const handleCommitCorrection = async () => {
    if (!correctingOrder) return;
    const modifiedItems = correctingOrder.items.filter((it) => {
      const staged = stagedQuantities[it.id];
      return staged !== undefined && staged !== it.quantity;
    });

    if (modifiedItems.length === 0) {
      alert('No item quantity changes were staged.');
      return;
    }

    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      alert('Please specify an operational reason (minimum 5 characters) for auditing.');
      return;
    }

    setIsCorrectingItem(true);
    setReconciliationNote(null);

    try {
      let currentOrderState = correctingOrder;
      const notesAccumulated: string[] = [];

      for (const item of modifiedItems) {
        const targetQty = stagedQuantities[item.id];
        const action = targetQty === 0 ? 'remove' : 'update_quantity';

        const res = await fetch(`/api/orders/${currentOrderState.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            itemId: item.id,
            newQuantity: targetQty,
            reason: correctionReason.trim(),
            lastKnownUpdatedAt: currentOrderState.updatedAt,
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
        currentOrderState = data.order;
        if (data.reconciliation?.inventoryAdjustmentNote) {
          notesAccumulated.push(data.reconciliation.inventoryAdjustmentNote);
        }
        if (data.reconciliation?.financialAdjustmentNote) {
          notesAccumulated.push(data.reconciliation.financialAdjustmentNote);
        }
      }

      setOrders((prev) => prev.map((o) => (o.id === currentOrderState.id ? currentOrderState : o)));
      setCorrectingOrder(currentOrderState);
      const refreshedQty: Record<string, number> = {};
      for (const it of currentOrderState.items) {
        refreshedQty[it.id] = it.quantity;
      }
      setStagedQuantities(refreshedQty);

      setReconciliationNote(notesAccumulated.join('; '));
      setSuccessMessage(`Order ${currentOrderState.orderNumber} line items reconciled successfully.`);
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportFilteredCSV}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export CSV
          </button>

          {canCreateOrder && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Create Manual Order
            </button>
          )}

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Orders
          </button>
        </div>
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
            Filter by Product / Title
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Planter, Vase, Geometric..."
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
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
                          <div style={{ marginTop: '3px' }}>
                            {ord.paymentStatus === 'additional_payment_due' ? (
                              <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                ADDITIONAL DUE
                              </span>
                            ) : ord.paymentStatus === 'refund_due_pending_approval' ? (
                              <span style={{ fontSize: '0.68rem', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                REFUND DUE (PENDING APPROVAL)
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: ord.paymentStatus === 'captured' ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
                                {ord.paymentStatus.toUpperCase()}
                              </span>
                            )}
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
                                onClick={() => openCorrectionModal(ord)}
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

                            {canUpdateStatus && !['cancelled', 'delivered'].includes(ord.status) && (
                              <button
                                onClick={() => {
                                  setCancellingOrder(ord);
                                  setCancelReason('Customer requested cancellation prior to dispatch');
                                }}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#EF4444' }}
                                title="Cancel Order (Does not auto-refund)"
                              >
                                <Ban size={13} /> Cancel
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

      {/* Item Correction & Inventory Reconciliation Modal with Before/After Review */}
      {correctingOrder && (() => {
        const modifiedItems = correctingOrder.items.filter((it) => {
          const staged = stagedQuantities[it.id];
          return staged !== undefined && staged !== it.quantity;
        });

        const projectedTotalPaise = correctingOrder.items.reduce((sum, it) => {
          const staged = stagedQuantities[it.id] !== undefined ? stagedQuantities[it.id] : it.quantity;
          return sum + it.unitPricePaise * staged;
        }, (correctingOrder.shippingPaise || 0) + (correctingOrder.taxPaise || 0));

        const totalDeltaPaise = projectedTotalPaise - correctingOrder.totalPaise;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(24, 24, 24, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '16px',
            }}
          >
            <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Order Items Reconciliation
                  </h2>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Order: <strong>{correctingOrder.orderNumber}</strong> • Current Total: <strong>{formatINR(correctingOrder.totalPaise)}</strong>
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

              {/* Line Items List with Stepper */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  Order Line Items ({correctingOrder.items.length})
                </span>

                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {correctingOrder.items.map((item) => {
                    const currentStaged = stagedQuantities[item.id] !== undefined ? stagedQuantities[item.id] : item.quantity;
                    const isChanged = currentStaged !== item.quantity;

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: isChanged ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface)',
                          border: isChanged ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-decor)',
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
                            disabled={isCorrectingItem || currentStaged === 0}
                            onClick={() => updateStagedQuantity(item.id, currentStaged - 1)}
                            className="btn btn-outline"
                            style={{ padding: '2px 8px', height: '28px', minWidth: '28px' }}
                            title="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>

                          <span style={{ fontWeight: 600, minWidth: '28px', textAlign: 'center', fontSize: '0.875rem', color: currentStaged === 0 ? 'var(--danger)' : isChanged ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            {currentStaged === 0 ? '0 (Del)' : currentStaged}
                          </span>

                          <button
                            type="button"
                            disabled={isCorrectingItem}
                            onClick={() => updateStagedQuantity(item.id, currentStaged + 1)}
                            className="btn btn-outline"
                            style={{ padding: '2px 8px', height: '28px', minWidth: '28px' }}
                            title="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>

                          <button
                            type="button"
                            disabled={isCorrectingItem}
                            onClick={() => updateStagedQuantity(item.id, 0)}
                            className="btn btn-outline"
                            style={{ padding: '2px 8px', height: '28px', color: 'var(--danger)', marginLeft: '4px' }}
                            title="Stage item removal"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Before vs After Review Card (shown when modifications staged) */}
              {modifiedItems.length > 0 && (
                <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-decor)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Review Staged Corrections (Before vs. After)
                  </div>

                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse', marginBottom: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-decor)', color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '4px 0' }}>Before</th>
                        <th style={{ textAlign: 'center', padding: '4px 0' }}>After</th>
                        <th style={{ textAlign: 'right', padding: '4px 0' }}>Line Total Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modifiedItems.map((item) => {
                        const newQty = stagedQuantities[item.id] ?? item.quantity;
                        const deltaQty = newQty - item.quantity;
                        const deltaPaise = deltaQty * item.unitPricePaise;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '6px 0', fontWeight: 500 }}>
                              {item.productTitle} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({item.variantSku})</span>
                            </td>
                            <td style={{ padding: '6px 0', textAlign: 'center' }}>
                              {item.quantity} × {formatINR(item.unitPricePaise)}
                            </td>
                            <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 600 }}>
                              {newQty === 0 ? <span style={{ color: 'var(--danger)' }}>0 (Remove)</span> : `${newQty} × ${formatINR(item.unitPricePaise)}`}
                            </td>
                            <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: deltaQty > 0 ? '#f59e0b' : '#a855f7' }}>
                              {deltaQty > 0 ? `+${deltaQty}` : deltaQty} ({deltaPaise >= 0 ? `+${formatINR(deltaPaise)}` : `-${formatINR(Math.abs(deltaPaise))}`})
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Financial Comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.78rem', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Original Order Total:</span>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatINR(correctingOrder.totalPaise)}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Projected New Total:</span>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: totalDeltaPaise > 0 ? '#f59e0b' : totalDeltaPaise < 0 ? '#a855f7' : 'var(--text-primary)' }}>
                        {formatINR(projectedTotalPaise)} ({totalDeltaPaise >= 0 ? `+${formatINR(totalDeltaPaise)}` : `-${formatINR(Math.abs(totalDeltaPaise))}`})
                      </div>
                    </div>
                  </div>

                  {/* Explicit Resulting Financial State */}
                  <div style={{ padding: '10px 14px', borderRadius: '4px', background: totalDeltaPaise > 0 ? 'rgba(245, 158, 11, 0.12)' : totalDeltaPaise < 0 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${totalDeltaPaise > 0 ? 'rgba(245, 158, 11, 0.35)' : totalDeltaPaise < 0 ? 'rgba(168, 85, 247, 0.35)' : 'var(--border-decor)'}`, fontSize: '0.8125rem' }}>
                    {totalDeltaPaise > 0 ? (
                      <div>
                        <strong style={{ color: '#f59e0b' }}>EXPLICIT FINANCIAL STATE: ADDITIONAL PAYMENT DUE</strong>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Customer owes an additional {formatINR(totalDeltaPaise)}. Inventory will be locked and decremented transactionally upon confirmation.
                        </p>
                      </div>
                    ) : totalDeltaPaise < 0 ? (
                      <div>
                        <strong style={{ color: '#a855f7' }}>EXPLICIT FINANCIAL STATE: REFUND DUE (PENDING OWNER APPROVAL)</strong>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          A refundable credit of {formatINR(Math.abs(totalDeltaPaise))} is recorded. Inventory will be restocked transactionally. Actual refund disbursement remains behind explicit authorized owner approval.
                        </p>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>Line quantities changed with net zero order total impact.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Operational Reason Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Operational Reason for Audit Log * (min 5 characters)
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Customer requested extra piece via phone support"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
                {correctionReason.trim().length > 0 && correctionReason.trim().length < 5 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>
                    Reason must be at least 5 characters.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {modifiedItems.length > 0 && (
                  <button
                    type="button"
                    disabled={isCorrectingItem}
                    onClick={() => {
                      const resetQty: Record<string, number> = {};
                      for (const it of correctingOrder.items) {
                        resetQty[it.id] = it.quantity;
                      }
                      setStagedQuantities(resetQty);
                    }}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                  >
                    Reset Staged Changes
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCorrectingOrder(null)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  Close
                </button>

                {modifiedItems.length > 0 && (
                  <button
                    type="button"
                    disabled={isCorrectingItem || correctionReason.trim().length < 5}
                    onClick={handleCommitCorrection}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '0.8125rem' }}
                  >
                    {isCorrectingItem ? 'Reconciling...' : 'Confirm Correction & Reconcile'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Manual Order Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={20} color="#C2410C" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Create Manual Order
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Anand Mahindra"
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Customer Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="+91 98220 12345"
                    value={newOrderForm.customerPhone}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="anand@example.com"
                  value={newOrderForm.customerEmail}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Shipping Address / Studio Pickup
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Street or Studio Pickup"
                    value={newOrderForm.addressLine1}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, addressLine1: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newOrderForm.city}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, city: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newOrderForm.pinCode}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, pinCode: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-decor)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Order Line Item
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Product / Custom Job Title
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={newOrderForm.itemTitle}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, itemTitle: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Variant SKU
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={newOrderForm.itemSku}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, itemSku: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={newOrderForm.itemQuantity}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, itemQuantity: parseInt(e.target.value, 10) || 1 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Unit Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={newOrderForm.unitPriceINR}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, unitPriceINR: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Inventory Type
                    </label>
                    <select
                      className="input"
                      value={newOrderForm.stockType}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, stockType: e.target.value as any })}
                      style={{ width: '100%' }}
                    >
                      <option value="made_to_order">Made to Order (3D Print Queue)</option>
                      <option value="ready_stock">Ready Stock (Physical Inventory)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-decor)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Payment & Fulfillment State
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Payment Status
                    </label>
                    <select
                      className="input"
                      value={newOrderForm.paymentStatus}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentStatus: e.target.value as any })}
                      style={{ width: '100%' }}
                    >
                      <option value="pending">Unpaid (Payment Pending)</option>
                      <option value="captured">Paid in Full (Captured)</option>
                      <option value="additional_payment_due">Partial Payment (Balance Due)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Payment Method
                    </label>
                    <select
                      className="input"
                      value={newOrderForm.paymentMethod}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentMethod: e.target.value as any })}
                      style={{ width: '100%' }}
                    >
                      <option value="Razorpay UPI/Card">Razorpay UPI / Online</option>
                      <option value="Cash on Delivery (Local Nashik)">Cash on Delivery (Local Nashik)</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>Calculated Order Total:</span>
                  <strong style={{ fontSize: '1.25rem', color: '#15803D' }}>
                    {formatINR(Math.round(Number(newOrderForm.unitPriceINR) * Number(newOrderForm.itemQuantity || 1) * 100))}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrder}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  {isCreatingOrder ? 'Creating Order...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#DC2626', marginBottom: '1rem' }}>
              <Ban size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Cancel Order #{cancellingOrder.orderNumber}
              </h3>
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              marginBottom: '1.25rem',
            }}>
              <strong>Important Financial Policy:</strong> Cancelling this order halts production and fulfillment immediately. Cancellation does <em>not</em> automatically issue a financial refund. Any required refund must be reviewed and authorized separately by the Studio Owner.
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Cancellation Reason * (Audit Logged, min 5 chars)
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Customer cancelled order prior to 3D printing"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCommitCancellation}
                disabled={isCancelling || cancelReason.trim().length < 5}
                style={{
                  padding: '8px 20px',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isCancelling || cancelReason.trim().length < 5 ? 'not-allowed' : 'pointer',
                }}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
