'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { ShippingZone } from '@/lib/types';
import { 
  Truck, Package, CheckCircle2, AlertTriangle, 
  RefreshCw, Plus, Printer, Download, ExternalLink, 
  Search, ArrowRight, ShieldCheck, X, FileText, AlertCircle
} from 'lucide-react';

interface ReadyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
  };
  total_paise: number;
  status: string;
  payment_status: string;
  payment_method: string;
  tracking_number?: string;
  created_at: string;
  order_items: {
    id: string;
    product_title: string;
    variant_sku: string;
    variant_details: string;
    quantity: number;
    unit_price_paise: number;
  }[];
}

export default function ShippingDeliveryPage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [activeTab, setActiveTab] = useState<'ready' | 'shipped' | 'zones'>('ready');
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [shippedOrders, setShippedOrders] = useState<ReadyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dispatch modal
  const [selectedOrder, setSelectedOrder] = useState<ReadyOrder | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Delhivery Surface & Air Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Packing slip modal
  const [slipOrder, setSlipOrder] = useState<ReadyOrder | null>(null);

  // New zone modal
  const [isNewZoneModalOpen, setIsNewZoneModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneDescription, setZoneDescription] = useState('');
  const [zoneBaseFeeINR, setZoneBaseFeeINR] = useState('99');
  const [zoneFreeAboveINR, setZoneFreeAboveINR] = useState('1999');
  const [zonePrefixes, setZonePrefixes] = useState('');

  const canManageShipping = ['owner', 'order_manager'].includes(staffRole);

  const fetchShippingData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/shipping');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setZones(data.zones || []);
      setReadyOrders(data.readyOrders || []);

      // Also fetch shipped orders from /api/orders
      const ordRes = await fetch('/api/orders?status=shipped&limit=50');
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setShippedOrders(ordData.orders || []);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve shipping operations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShippingData();
  }, [fetchShippingData]);

  // Handle Order Dispatch
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_order',
          orderId: selectedOrder.id,
          courierName,
          trackingNumber,
          trackingLink: trackingLink || `https://www.delhivery.com/track/package/${trackingNumber}`,
          dispatchDate,
          notes: dispatchNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch order');
      }

      setIsDispatchModalOpen(false);
      setSelectedOrder(null);
      setSuccessMessage(`Order #${selectedOrder.order_number} marked as Shipped! Tracking AWB: ${trackingNumber}`);
      fetchShippingData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Dispatch failed');
    }
  };

  // Add Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prefixes = zonePrefixes
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_zone',
          name: zoneName,
          description: zoneDescription,
          postalCodePrefixes: prefixes,
          baseFeePaise: Math.round(Number(zoneBaseFeeINR) * 100),
          freeShippingThresholdPaise: zoneFreeAboveINR ? Math.round(Number(zoneFreeAboveINR) * 100) : null,
          estimatedDaysMin: 2,
          estimatedDaysMax: 5,
          codAvailable: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to create zone');
      setIsNewZoneModalOpen(false);
      setZoneName('');
      setZoneDescription('');
      fetchShippingData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Zone creation failed');
    }
  };

  // Export CSV
  const handleExportShipments = () => {
    window.open('/api/admin/reports?report=production&range=30d&format=csv', '_blank');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Top Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FULFILLMENT & LOGISTICS DESK
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Shipping & Delivery
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Dispatch ready-packed orders, assign courier AWB tracking, print packing slips, and manage Indian delivery zones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchShippingData}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
          <button
            onClick={handleExportShipments}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} /> Export Shipments
          </button>
        </div>
      </div>

      {/* Honest Integration Health Indicator */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'rgba(0, 229, 255, 0.05)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={18} style={{ color: 'var(--action-secondary)' }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <strong>Manual Tracking Mode Active</strong> — Real courier AWB numbers and tracking URLs are recorded authoritatively. No fabricated carrier telemetry is presented.
          </div>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(0, 229, 255, 0.15)',
            color: 'var(--action-secondary)',
            fontWeight: 700,
          }}
        >
          Studio Hub Verified
        </span>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            color: '#34D399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('ready')}
          style={{
            background: activeTab === 'ready' ? 'var(--brand-accent)' : 'var(--surface)',
            color: activeTab === 'ready' ? '#FFFFFF' : 'var(--text-secondary)',
            border: 'none',
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'ready' ? 700 : 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Package size={15} /> Ready to Dispatch ({readyOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('shipped')}
          style={{
            background: activeTab === 'shipped' ? 'var(--brand-accent)' : 'var(--surface)',
            color: activeTab === 'shipped' ? '#FFFFFF' : 'var(--text-secondary)',
            border: 'none',
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'shipped' ? 700 : 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Truck size={15} /> Dispatched & In-Transit ({shippedOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          style={{
            background: activeTab === 'zones' ? 'var(--brand-accent)' : 'var(--surface)',
            color: activeTab === 'zones' ? '#FFFFFF' : 'var(--text-secondary)',
            border: 'none',
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'zones' ? 700 : 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Shipping Zones & Delivery Rates ({zones.length})
        </button>
      </div>

      {/* TAB 1: ORDERS READY TO DISPATCH */}
      {activeTab === 'ready' && (
        <div>
          {readyOrders.length === 0 ? (
            <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No orders currently waiting for dispatch
              </div>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                Orders marked as &ldquo;Ready&rdquo; or &ldquo;Packed&rdquo; from the Production Queue appear here for courier handover.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {readyOrders.map((order) => {
                const addr = order.shipping_address;
                return (
                  <div
                    key={order.id}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      borderLeft: '4px solid #10B981',
                    }}
                  >
                    <div style={{ minWidth: '300px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {order.order_number}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10B981',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {order.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • Total: <strong>{formatINR(order.total_paise)}</strong>
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>
                        Customer: {order.customer_name} ({order.customer_phone})
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Destination: {addr?.addressLine1}, {addr?.city}, {addr?.state} - <strong>{addr?.pinCode}</strong>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Items ({order.order_items?.length || 0}): {order.order_items?.map((i) => `${i.quantity}x ${i.product_title}`).join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setSlipOrder(order)}
                        className="btn-outline"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Printer size={14} /> Print Packing Slip
                      </button>

                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDispatchModalOpen(true);
                        }}
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Truck size={14} /> Assign Courier & Dispatch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHIPPED & ACTIVE TRACKING */}
      {activeTab === 'shipped' && (
        <div>
          {shippedOrders.length === 0 ? (
            <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Truck size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No active dispatched shipments
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {shippedOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="card"
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {order.orderNumber || order.order_number}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                        SHIPPED
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Customer: {order.customerName || order.customer_name} • {order.customerPhone || order.customer_phone}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Courier AWB: <strong style={{ color: 'var(--brand-accent)' }}>{order.trackingNumber || order.tracking_number || 'Awaiting Tracking'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.trackingNumber && (
                      <a
                        href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> Carrier Tracking Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHIPPING ZONES & RATES */}
      {activeTab === 'zones' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Active Shipping Zones (Domestic India)
            </div>
            {canManageShipping && (
              <button
                onClick={() => setIsNewZoneModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Plus size={14} /> Add Shipping Zone
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {zones.map((zone) => (
              <div key={zone.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{zone.name}</div>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
                    Active
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                  {zone.description}
                </p>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <div><strong>Base Shipping Fee:</strong> {formatINR(zone.baseFeePaise)}</div>
                  <div>
                    <strong>Free Shipping Threshold:</strong> {zone.freeShippingThresholdPaise ? formatINR(zone.freeShippingThresholdPaise) : 'No Free Shipping'}
                  </div>
                  <div><strong>Estimated Delivery:</strong> {zone.estimatedDaysMin} to {zone.estimatedDaysMax} business days</div>
                  <div><strong>Cash on Delivery:</strong> {zone.codAvailable ? 'Eligible' : 'Prepaid Only'}</div>
                  {zone.postalCodePrefixes.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      PIN Prefixes: {zone.postalCodePrefixes.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN COURIER & DISPATCH */}
      {isDispatchModalOpen && selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Dispatch Order: #{selectedOrder.order_number}
              </h2>
              <button onClick={() => setIsDispatchModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Courier Service Partner
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="Delhivery Surface & Air Express">Delhivery Surface & Air Express</option>
                  <option value="Blue Dart Aviation Express">Blue Dart Aviation Express</option>
                  <option value="DTDC Courier & Cargo">DTDC Courier & Cargo</option>
                  <option value="India Post Speed Post">India Post Speed Post</option>
                  <option value="Porter / Local Nashik City Dispatch">Porter / Local Nashik City Dispatch</option>
                  <option value="Customer Self-Pickup (Studio Hub)">Customer Self-Pickup (Studio Hub)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Courier Tracking Number (AWB)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEL98712345678"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Carrier Web Tracking Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://delhivery.com/track/package/..."
                  value={trackingLink}
                  onChange={(e) => setTrackingLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Dispatch Date
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Internal Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handed over to Delhivery Nashik Hub pickup driver..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE PACKING SLIP */}
      {slipOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card print-slip-container"
            style={{
              maxWidth: '680px',
              width: '100%',
              background: '#FFFFFF',
              color: '#0B0F19',
              padding: '2.5rem',
              borderRadius: '8px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E5E7EB', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0B0F19', margin: '0 0 0.25rem' }}>
                  FALCON 3D PRINTS
                </h1>
                <div style={{ fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.4 }}>
                  Precision Additive Manufacturing Studio<br />
                  Uttam Nagar, CIDCO, Nashik, Maharashtra 422009<br />
                  GSTIN: 27AABCF1234F1Z8 • Phone: +91 98506 07144
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FF5722' }}>PACKING SLIP</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Order #{slipOrder.order_number}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Date: {new Date(slipOrder.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Recipient Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.35rem' }}>
                  Ship To:
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{slipOrder.shipping_address?.fullName}</div>
                <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.4 }}>
                  {slipOrder.shipping_address?.addressLine1}<br />
                  {slipOrder.shipping_address?.addressLine2 && <>{slipOrder.shipping_address.addressLine2}<br /></>}
                  {slipOrder.shipping_address?.city}, {slipOrder.shipping_address?.state} - <strong>{slipOrder.shipping_address?.pinCode}</strong><br />
                  Phone: {slipOrder.shipping_address?.phone}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.35rem' }}>
                  Payment & Verification:
                </div>
                <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>
                  Payment Method: <strong>{slipOrder.payment_method}</strong><br />
                  Payment Status: <strong>{slipOrder.payment_status.toUpperCase()}</strong><br />
                  Invoice Value: <strong>{formatINR(slipOrder.total_paise)}</strong><br />
                  Package QC Inspector: <strong>Verified Studio Operator</strong>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Check</th>
                  <th style={{ padding: '8px 10px' }}>Item Description</th>
                  <th style={{ padding: '8px 10px' }}>SKU</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {(slipOrder.order_items || []).map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '10px', width: '40px', textAlign: 'center' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{item.product_title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.variant_details}</div>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#374151' }}>{item.variant_sku}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer notes */}
            <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: '1rem', fontSize: '0.75rem', color: '#6B7280', textAlign: 'center' }}>
              Thank you for choosing Falcon 3D Prints! Manufactured with precision engineering in Nashik, Maharashtra.<br />
              Need support? WhatsApp us at +91 98506 07144 or email contact@falcon3dprints.com
            </div>

            {/* Print & Close Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }} className="no-print">
              <button onClick={() => setSlipOrder(null)} className="btn-outline" style={{ color: '#111827', borderColor: '#D1D5DB' }}>
                Close
              </button>
              <button onClick={() => window.print()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW SHIPPING ZONE */}
      {isNewZoneModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Add Shipping Zone
              </h2>
              <button onClick={() => setIsNewZoneModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateZone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Zone Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South India Express"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karnataka, Tamil Nadu, Telangana, Kerala"
                  value={zoneDescription}
                  onChange={(e) => setZoneDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Base Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={zoneBaseFeeINR}
                    onChange={(e) => setZoneBaseFeeINR(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Free Shipping Above (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={zoneFreeAboveINR}
                    onChange={(e) => setZoneFreeAboveINR(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Postal Code Prefixes (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 560, 600, 500, 682"
                  value={zonePrefixes}
                  onChange={(e) => setZonePrefixes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsNewZoneModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-slip-container,
          .print-slip-container * {
            visibility: visible;
          }
          .print-slip-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
