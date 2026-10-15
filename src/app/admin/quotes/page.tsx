'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { CustomQuoteRequest } from '@/lib/types';
import { 
  MessageSquare, FileCode, CheckCircle2, Phone, Mail, 
  ArrowRight, ShieldCheck, DollarSign, Clock, Edit2, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AdminQuotesPage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'customer';
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

  // Pricing modal state
  const [activeQuote, setActiveQuote] = useState<CustomQuoteRequest | null>(null);
  const [quotePriceInput, setQuotePriceInput] = useState<string>('');
  const [quoteLeadDays, setQuoteLeadDays] = useState<number>(3);
  const [quoteNotes, setQuoteNotes] = useState<string>('');
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
    setQuotePriceInput(quote.quotedPricePaise ? (quote.quotedPricePaise / 100).toString() : '950');
    setQuoteLeadDays(quote.estimatedLeadDays || 3);
    setQuoteNotes(quote.adminNotes || 'Printed on Bambu X1C with 0.16mm optimal layer height.');
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    const priceRupees = parseFloat(quotePriceInput) || 0;
    const pricePaise = Math.round(priceRupees * 100);

    if (pricePaise <= 0) {
      alert('Price must be greater than zero.');
      return;
    }

    setIsSubmittingPricing(true);

    try {
      const res = await fetch(`/api/quotes/${activeQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotedPricePaise: pricePaise,
          estimatedLeadDays: quoteLeadDays,
          adminNotes: quoteNotes.trim(),
          lastKnownUpdatedAt: activeQuote.updatedAt,
        }),
      });

      if (res.status === 409) {
        alert('Concurrency Conflict: Quote was updated by another user. Reloading data.');
        setActiveQuote(null);
        fetchQuotes();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update quote price');
      }

      const data = await res.json();
      setQuotes((prev) => prev.map((q) => (q.id === activeQuote.id ? data.quote : q)));
      setSuccessNote(`Quotation estimate of ${formatINR(pricePaise)} committed to PostgreSQL for RFQ ${activeQuote.referenceNumber}.`);
      setActiveQuote(null);
      setTimeout(() => setSuccessNote(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save quote';
      alert(`Quote error: ${msg}`);
    } finally {
      setIsSubmittingPricing(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Custom STL Inquiry Desk
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Custom Quotations & RFQ Slicing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Authoritative custom quotation review, volume slicing calculations, and database pricing commitments.
          </p>
        </div>

        <button
          onClick={fetchQuotes}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Quotes
        </button>
      </div>

      {successNote && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
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
          <CheckCircle2 size={16} /> {successNote}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
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
          <button onClick={fetchQuotes} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
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
            Filter by Status
          </label>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Inquiries ({totalCount})</option>
            <option value="submitted">SUBMITTED</option>
            <option value="under_review">UNDER REVIEW</option>
            <option value="quoted">QUOTED</option>
            <option value="approved">APPROVED</option>
            <option value="rejected">REJECTED</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Search Quotes
          </label>
          <input
            type="text"
            className="input"
            placeholder="Search reference #, customer, file..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Quotes List */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading quotes from Supabase database...
        </div>
      ) : quotes.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No custom quote requests found in database matching criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {quotes.map((q) => {
            const isQuoted = q.status === 'quoted' || q.status === 'approved';

            return (
              <div
                key={q.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${isQuoted ? 'var(--success)' : 'var(--primary-action)'}`,
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{q.referenceNumber}</h2>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          textTransform: 'uppercase',
                          background: isQuoted ? 'var(--success-bg)' : 'var(--surface-alt)',
                          color: isQuoted ? 'var(--success)' : 'var(--text-primary)',
                          border: '1px solid var(--border-decor)',
                        }}
                      >
                        {q.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Submitted by <strong style={{ color: 'var(--text-primary)' }}>{q.fullName}</strong> on{' '}
                      {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <a
                      href={`tel:${q.phone}`}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                      title="Direct Call"
                    >
                      <Phone size={14} /> +91 {q.phone}
                    </a>
                    <a
                      href={`mailto:${q.email}`}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                      title="Send Email"
                    >
                      <Mail size={14} /> Email
                    </a>
                    <button
                      onClick={() => handleStartPricing(q)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                    >
                      <Edit2 size={14} /> {isQuoted ? 'Re-quote' : 'Calculate & Issue Quote'}
                    </button>
                  </div>
                </div>

                {/* Geometry Specs Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-decor)',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>3D Model Asset</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      <FileCode size={15} color="var(--primary-action)" /> {q.fileName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Size: {(q.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>Bounding Box</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {q.dimensionsMm.x} × {q.dimensionsMm.y} × {q.dimensionsMm.z} mm
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Est. Volume: {Math.round((q.dimensionsMm.x * q.dimensionsMm.y * q.dimensionsMm.z) / 1000)} cm³
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>Material & Infill</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {q.materialPreference} ({q.colorPreference})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Infill: {q.infillPercentage}% • Units: {q.quantity}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>Commercial Status</span>
                    {q.quotedPricePaise ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '1rem' }}>
                          {formatINR(q.quotedPricePaise)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Lead Time: {q.estimatedLeadDays} Days
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                        Awaiting Price Quote
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Notes */}
                {q.customerNotes && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Customer Instructions:</strong> &ldquo;{q.customerNotes}&rdquo;
                  </div>
                )}

                {/* Admin Notes */}
                {q.adminNotes && (
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-decor)',
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>Engineer Notes:</strong> {q.adminNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <div>Page {page} of {totalPages} ({totalCount} total inquiries)</div>
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

      {/* Pricing Modal */}
      {activeQuote && (
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
              Issue Precision Quotation
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '20px' }}>
              Committed by <strong>{staffName}</strong> ({staffRole}). Recorded in PostgreSQL database and audit log.
            </p>

            <form onSubmit={handleSaveQuote} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Total Quoted Price (₹ INR) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    className="input"
                    placeholder="e.g. 1250"
                    value={quotePriceInput}
                    onChange={(e) => setQuotePriceInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Estimated Production Lead Time (Business Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  className="input"
                  value={quoteLeadDays}
                  onChange={(e) => setQuoteLeadDays(parseInt(e.target.value) || 3)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Engineering Slicing Notes & Print Recommendations
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Sliced at 0.16mm optimal layer height with tree supports."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={isSubmittingPricing} className="btn btn-primary" style={{ flex: 1 }}>
                  {isSubmittingPricing ? 'Saving to Database...' : 'Confirm & Transmit Quote'}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingPricing}
                  onClick={() => setActiveQuote(null)}
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
