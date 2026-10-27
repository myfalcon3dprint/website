'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { CustomQuoteRequest } from '@/lib/types';
import { 
  FileCode, CheckCircle2, Phone, Mail, 
  ArrowRight, ShieldCheck, DollarSign, Clock, 
  Edit2, AlertCircle, RefreshCw, ChevronLeft, 
  ChevronRight, Download, ShoppingBag, X, FileText, Send
} from 'lucide-react';

const STAGES = [
  { key: 'all', label: 'All Requests' },
  { key: 'submitted', label: 'New' },
  { key: 'under_review', label: 'Reviewing' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'approved', label: 'Accepted' },
  { key: 'rejected', label: 'Declined' },
];

export default function CustomPrintRequestsPage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';
  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Staff';

  const [quotes, setQuotes] = useState<CustomQuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Itemized Pricing modal state
  const [activeQuote, setActiveQuote] = useState<CustomQuoteRequest | null>(null);
  const [materialCostINR, setMaterialCostINR] = useState('800');
  const [finishingCostINR, setFinishingCostINR] = useState('400');
  const [shippingFeeINR, setShippingFeeINR] = useState('99');
  const [quoteLeadDays, setQuoteLeadDays] = useState<number>(3);
  const [customerMessage, setCustomerMessage] = useState<string>('Quotation prepared based on 0.16mm layer height and 20% infill profile.');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [isSubmittingPricing, setIsSubmittingPricing] = useState(false);

  const canPriceQuotes = ['owner', 'order_manager'].includes(staffRole);

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setQuotes(data.quotes || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.totalCount || 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve quote requests';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleStartPricing = (quote: CustomQuoteRequest) => {
    if (!canPriceQuotes) {
      alert(`Access Restricted: Role '${staffRole}' cannot issue price quotes.`);
      return;
    }
    setActiveQuote(quote);
    setMaterialCostINR('800');
    setFinishingCostINR('400');
    setShippingFeeINR('99');
    setQuoteLeadDays(quote.estimatedLeadDays || 3);
    setCustomerMessage('Quotation calculated based on requested material, technology, and studio inspection.');
    setInternalNotes(quote.adminNotes || '');
  };

  const calculateTotalPaise = () => {
    const mat = Number(materialCostINR) || 0;
    const fin = Number(finishingCostINR) || 0;
    const ship = Number(shippingFeeINR) || 0;
    const subtotal = mat + fin;
    const gst = Math.round(subtotal * 0.18);
    return Math.round((subtotal + gst + ship) * 100);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    const totalPaise = calculateTotalPaise();
    if (totalPaise <= 0) {
      alert('Total price must be greater than zero.');
      return;
    }

    setIsSubmittingPricing(true);
    try {
      const res = await fetch(`/api/quotes/${activeQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'quoted',
          quotedPricePaise: totalPaise,
          estimatedLeadDays: quoteLeadDays,
          adminNotes: `${internalNotes ? `[Internal: ${internalNotes}] ` : ''}${customerMessage}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update quotation pricing');
      }

      setSuccessNote(`Quotation issued for ${activeQuote.referenceNumber} (${formatINR(totalPaise)})`);
      setActiveQuote(null);
      fetchQuotes();
      setTimeout(() => setSuccessNote(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating pricing');
    } finally {
      setIsSubmittingPricing(false);
    }
  };

  // Convert Accepted Quote to Traceable Order
  const handleConvertToOrder = async (quote: CustomQuoteRequest) => {
    if (!confirm(`Convert accepted quote ${quote.referenceNumber} into an official workshop order?`)) return;

    try {
      const orderNumber = `FAL-ORD-${quote.referenceNumber.replace(/[^0-9]/g, '').slice(-4) || '9901'}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            orderNumber,
            customerName: quote.fullName,
            customerEmail: quote.email,
            customerPhone: quote.phone,
            shippingAddress: {
              fullName: quote.fullName,
              phone: quote.phone,
              addressLine1: 'Studio Client Order (Pending Address Confirmation)',
              city: 'Nashik',
              state: 'Maharashtra',
              pinCode: '422009',
            },
            subtotalPaise: quote.quotedPricePaise || 150000,
            shippingPaise: 0,
            taxPaise: 0,
            totalPaise: quote.quotedPricePaise || 150000,
            paymentStatus: 'pending',
            paymentMethod: 'Razorpay UPI/Card',
            status: 'confirmed',
            items: [
              {
                productTitle: `Custom 3D Print (${quote.fileName})`,
                variantSku: `CUSTOM-${quote.referenceNumber}`,
                variantDetails: `${quote.materialPreference} • ${quote.colorPreference} • ${quote.infillPercentage}% infill`,
                quantity: quote.quantity,
                unitPricePaise: Math.round((quote.quotedPricePaise || 150000) / quote.quantity),
                totalPricePaise: quote.quotedPricePaise || 150000,
                stockType: 'made_to_order',
              },
            ],
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to convert quote to order');

      // Update quote status to approved
      await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      setSuccessNote(`Successfully converted ${quote.referenceNumber} to Order #${orderNumber}! View in Orders.`);
      fetchQuotes();
      setTimeout(() => setSuccessNote(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Conversion failed');
    }
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
              CUSTOM FABRICATION QUOTATION DESK
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Custom Print Requests
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Analyze customer-uploaded CAD models (STL, OBJ, STEP), calculate itemized manufacturing quotes, and convert approved quotes to orders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchQuotes}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successNote && (
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
          <span>{successNote}</span>
        </div>
      )}

      {/* Pipeline Stage Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
        }}
      >
        {STAGES.map((s) => {
          const isActive = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => {
                setStatusFilter(s.key);
                setPage(1);
              }}
              style={{
                background: isActive ? 'var(--brand-accent)' : 'var(--surface)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '420px' }}>
        <input
          type="text"
          placeholder="Search by quote ref, customer name, phone, or file..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          style={{
            width: '100%',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
          }}
        />
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {quotes.length === 0 ? (
          <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileCode size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No custom print requests in this view
            </div>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Requests submitted through the online 3D quoting calculator will appear here.
            </p>
          </div>
        ) : (
          quotes.map((q) => {
            const isQuoted = q.status === 'quoted';
            const isApproved = q.status === 'approved';
            const dim = q.dimensionsMm || { x: 100, y: 100, z: 80 };
            const fileSizeMb = (q.fileSizeBytes / (1024 * 1024)).toFixed(2);
            return (
              <div
                key={q.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  borderLeft: `4px solid ${
                    isApproved ? '#10B981' : isQuoted ? '#A855F7' : 'var(--brand-accent)'
                  }`,
                }}
              >
                <div style={{ minWidth: '320px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {q.referenceNumber}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isApproved ? 'rgba(16, 185, 129, 0.15)' : isQuoted ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 87, 34, 0.15)',
                        color: isApproved ? '#10B981' : isQuoted ? '#C084FC' : 'var(--brand-accent)',
                      }}
                    >
                      {q.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    Client: {q.fullName} • Phone: {q.phone} • Email: {q.email}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '0.4rem' }}>
                    <span><strong>CAD File:</strong> {q.fileName} ({fileSizeMb} MB)</span>
                    <span><strong>Bounding Box:</strong> {dim.x} × {dim.y} × {dim.z} mm</span>
                    <span><strong>Material:</strong> {q.materialPreference} ({q.colorPreference})</span>
                    <span><strong>Infill:</strong> {q.infillPercentage}%</span>
                    <span><strong>Quantity:</strong> {q.quantity} unit(s)</span>
                  </div>

                  {q.customerNotes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      Customer note: &ldquo;{q.customerNotes}&rdquo;
                    </div>
                  )}

                  {/* Quoted Pricing Information */}
                  {q.quotedPricePaise && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-accent)' }}>
                        Quoted: {formatINR(q.quotedPricePaise)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        (Lead time: {q.estimatedLeadDays || 3} days)
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Secure CAD Download */}
                  {q.storagePath && (
                    <a
                      href={`/api/storage/presigned-url?path=${encodeURIComponent(q.storagePath)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                    >
                      <Download size={13} /> Download CAD Model
                    </a>
                  )}

                  {/* Pricing Action */}
                  {canPriceQuotes && (
                    <button
                      onClick={() => handleStartPricing(q)}
                      className="btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <DollarSign size={13} /> {q.quotedPricePaise ? 'Revise Quote' : 'Price Quote'}
                    </button>
                  )}

                  {/* Convert to Order */}
                  {isApproved && (
                    <button
                      onClick={() => handleConvertToOrder(q)}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#10B981', borderColor: '#10B981', color: '#FFFFFF' }}
                    >
                      <ShoppingBag size={13} /> Convert to Order
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ITEMIZED QUOTE PRICING CALCULATOR */}
      {activeQuote && (
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
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Itemized Price Quote: {activeQuote.referenceNumber}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {activeQuote.fileName} • {activeQuote.materialPreference}
                </div>
              </div>
              <button onClick={() => setActiveQuote(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Print & Material Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={materialCostINR}
                    onChange={(e) => setMaterialCostINR(e.target.value)}
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
                    Finishing / Post-Processing (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={finishingCostINR}
                    onChange={(e) => setFinishingCostINR(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingFeeINR}
                    onChange={(e) => setShippingFeeINR(e.target.value)}
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
                    Estimated Lead Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quoteLeadDays}
                    onChange={(e) => setQuoteLeadDays(Number(e.target.value))}
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

              {/* Total Calculation Display */}
              <div
                style={{
                  background: 'var(--surface-alt)',
                  padding: '0.85rem 1rem',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Calculated Price (Incl. 18% GST)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-accent)' }}>
                    {formatINR(calculateTotalPaise())}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Validity: <strong>14 Days</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Customer-Facing Quotation Notes
                </label>
                <textarea
                  rows={2}
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
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
                  Internal Studio Notes (Private to staff)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Requires support tree setting; approx 140g filament..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
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
                <button type="button" onClick={() => setActiveQuote(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingPricing} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={13} /> {isSubmittingPricing ? 'Sending...' : 'Issue Official Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
