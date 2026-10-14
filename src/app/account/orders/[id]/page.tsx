'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useOrders } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { OrderStatus, ShippingAddress } from '@/lib/types';
import { 
  ArrowLeft, Package, Clock, CheckCircle2, AlertCircle, 
  MapPin, Phone, Mail, Edit2, ShieldAlert, Cpu 
} from 'lucide-react';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'confirmed', label: 'Confirmed', desc: 'Payment verified' },
  { status: 'queued', label: 'Queued', desc: 'G-code sliced' },
  { status: 'printing', label: 'Printing', desc: 'Layer deposition' },
  { status: 'finishing', label: 'Finishing', desc: 'Supports cured & sanded' },
  { status: 'quality_check', label: 'QC Check', desc: 'Tolerance inspection' },
  { status: 'ready', label: 'Ready', desc: 'Passed inspection' },
  { status: 'packed', label: 'Packed', desc: 'Shipping label affixed' },
  { status: 'shipped', label: 'In Transit', desc: 'Handed to courier' },
  { status: 'delivered', label: 'Delivered', desc: 'Received by customer' },
];

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, updateShippingAddress, updateOrderStatus } = useOrders();
  const order = orders.find((o) => o.id === resolvedParams.id || o.orderNumber === resolvedParams.id);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pinCode: '',
  });
  const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Package size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Order Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          We could not locate an order matching ID &ldquo;{resolvedParams.id}&rdquo;.
        </p>
        <Link href="/account" className="btn-primary" style={{ fontSize: '0.88rem' }}>
          Back to Your Orders
        </Link>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const isCancellable = order.status === 'confirmed' || order.status === 'queued';
  const isAddressEditable = currentStepIdx < 6; // before 'packed'

  const handleStartEdit = () => {
    setAddressForm(order.shippingAddress);
    setIsEditingAddress(true);
    setAddressSaveSuccess(false);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateShippingAddress(order.id, addressForm);
    setIsEditingAddress(false);
    setAddressSaveSuccess(true);
    setTimeout(() => setAddressSaveSuccess(false), 4000);
  };

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order? Any payment will be refunded to the source account.')) {
      updateOrderStatus(order.id, 'cancelled', 'Cancelled by customer before production packaging.');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Navigation breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={15} /> Back to Orders
        </Link>
      </div>

      {/* Header card */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)' }}>Order {order.orderNumber}</h1>
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
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at{' '}
            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isCancellable && (
            <button
              onClick={handleCancelOrder}
              className="btn-secondary"
              style={{
                color: 'var(--status-danger)',
                borderColor: 'var(--status-danger-border)',
                padding: '0.55rem 1rem',
                fontSize: '0.82rem',
              }}
            >
              Cancel Order
            </button>
          )}
          <Link href="/catalog" className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
            Continue Shopping
          </Link>
        </div>
      </div>

      {addressSaveSuccess && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            color: 'var(--status-ready)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} /> Shipping destination updated successfully.
        </div>
      )}

      {/* Production & Delivery Progress Timeline */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <Cpu size={18} style={{ color: 'var(--brand-accent)' }} /> Production & Dispatch Pipeline
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Live telemetry milestones from our Nashik print farm and dispatch desk.
            </p>
          </div>
          {order.trackingNumber && (
            <div
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
              }}
            >
              Tracking #{order.trackingNumber}
            </div>
          )}
        </div>

        {order.status === 'cancelled' ? (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--status-danger)',
            }}
          >
            <AlertCircle size={20} />
            <div>
              <strong style={{ fontSize: '0.9rem' }}>This order has been cancelled.</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Manufacturing toolpaths terminated. Any paid amounts processed for refund.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', marginTop: '1.5rem' }}>
            {/* Timeline steps */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '1rem',
              }}
            >
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isFuture = idx > currentStepIdx;

                return (
                  <div
                    key={step.status}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      opacity: isFuture ? 0.45 : 1,
                    }}
                  >
                    {/* Circle icon */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                        transition: 'all 0.2s ease',
                        background: isPassed
                          ? 'var(--status-ready-bg)'
                          : isCurrent
                          ? 'var(--action-primary)'
                          : 'var(--surface-alt)',
                        color: isPassed
                          ? 'var(--status-ready)'
                          : isCurrent
                          ? '#FFFFFF'
                          : 'var(--text-muted)',
                        border: isPassed
                          ? '1px solid var(--status-ready-border)'
                          : isCurrent
                          ? '1px solid var(--action-primary)'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      {isPassed ? (
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <Clock size={15} strokeWidth={2.5} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{idx + 1}</span>
                      )}
                    </div>

                    <div style={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.78rem', color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.25 }}>
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status History log */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Milestone Audit Log
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {order.statusHistory.map((hist, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    fontSize: '0.78rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(hist.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(hist.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--brand-accent)',
                      textTransform: 'uppercase',
                      fontSize: '0.72rem',
                    }}
                  >
                    [{hist.status}]
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{hist.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Ordered items breakdown */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Order Items ({order.items.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '0.92rem', margin: '0 0 0.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.productTitle}
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    SKU: {item.variantSku} • {item.variantDetails}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${item.stockType === 'ready_stock' ? 'badge-ready' : 'badge-mto'}`}>
                      {item.stockType === 'ready_stock' ? 'Ready Stock' : 'Custom Print'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Qty: {item.quantity} × {formatINR(item.unitPricePaise)}
                    </span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {formatINR(item.totalPricePaise)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary */}
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatINR(order.subtotalPaise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Delivery Charges</span>
              <span>{order.shippingPaise === 0 ? 'FREE' : formatINR(order.shippingPaise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>Included GST</span>
              <span>₹0.00</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '1.05rem',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem',
                marginTop: '0.25rem',
                color: 'var(--text-primary)',
              }}
            >
              <span>Total Paid</span>
              <span>{formatINR(order.totalPaise)}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Payment Method: {order.paymentMethod} (Status: {order.paymentStatus})
              {order.razorpayPaymentId && <span> • ID: {order.razorpayPaymentId}</span>}
            </div>
          </div>
        </div>

        {/* Shipping details and customer info */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <MapPin size={18} style={{ color: 'var(--brand-accent)' }} /> Delivery Address
              </h2>
              {isAddressEditable && !isEditingAddress && (
                <button
                  onClick={handleStartEdit}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--action-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Edit2 size={13} /> Update Address
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Contact Phone (+91)
                  </label>
                  <input
                    type="tel"
                    required
                    className="input"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Street Address / Flat / Building
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Landmark / Area (Optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={addressForm.addressLine2 || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      City
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      PIN Code (6 Digits)
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      className="input"
                      value={addressForm.pinCode}
                      onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.65rem' }}>
                    Save Correction
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.65rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {order.shippingAddress.fullName}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.addressLine2 && (
                  <div style={{ color: 'var(--text-secondary)' }}>{order.shippingAddress.addressLine2}</div>
                )}
                <div style={{ color: 'var(--text-secondary)' }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Phone size={13} /> +91 {order.shippingAddress.phone}
                </div>

                {!isAddressEditable && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <ShieldAlert size={14} /> Parcel packed; destination address locked.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Need help card */}
          <div className="card" style={{ background: 'var(--surface-alt)' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Assistance with this commission?
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Questions regarding print tolerances, finishes, or custom dimensions? Contact our Nashik workshop team.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <a
                href="tel:+919850607144"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <Phone size={14} style={{ color: 'var(--brand-accent)' }} /> +91 98506 07144 (Workshop Direct)
              </a>
              <a
                href="mailto:contact@falcon3dprints.com"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Mail size={14} /> contact@falcon3dprints.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
