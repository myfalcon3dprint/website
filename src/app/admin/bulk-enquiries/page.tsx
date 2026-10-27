'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { CustomerInquiry } from '@/lib/types';
import { formatINR } from '@/lib/money';
import { 
  Boxes, Search, RefreshCw, CheckCircle2, 
  Clock, AlertTriangle, User, Calendar, MessageSquare, 
  ArrowRight, ShieldCheck, X, FileText, Send
} from 'lucide-react';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Enquiries' },
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'closed', label: 'Closed' },
  { key: 'spam', label: 'Spam' },
];

export default function BulkEnquiriesPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit / Details modal
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [editStatus, setEditStatus] = useState<string>('new');
  const [editPriority, setEditPriority] = useState<string>('normal');
  const [editFollowUpDate, setEditFollowUpDate] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');

  const canEdit = ['owner', 'order_manager', 'support'].includes(staffRole);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({ type: 'bulk_quote' });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve enquiries');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleOpenDetails = (inq: CustomerInquiry) => {
    setSelectedInquiry(inq);
    setEditStatus(inq.status);
    setEditPriority(inq.priority);
    setEditFollowUpDate(inq.followUpDate || '');
    setInternalNotes(inq.internalNotes || '');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInquiry.id,
          updates: {
            status: editStatus,
            priority: editPriority,
            followUpDate: editFollowUpDate || null,
            internalNotes,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update enquiry');
      setSelectedInquiry(null);
      setSuccessMessage('Bulk enquiry updated successfully!');
      fetchInquiries();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filtered = inquiries.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.customerName.toLowerCase().includes(q) ||
      i.customerEmail.toLowerCase().includes(q) ||
      (i.companyName && i.companyName.toLowerCase().includes(q)) ||
      (i.subject && i.subject.toLowerCase().includes(q))
    );
  });

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
              COMMERCIAL B2B PIPELINE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Bulk & Batch Enquiries
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Track volume prototyping requests, enterprise corporate inquiries, target deadlines, and batch quotations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchInquiries}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Success Notification */}
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

      {/* Pipeline Filter Tabs */}
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
        {STATUS_FILTERS.map((s) => {
          const isActive = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
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

      {/* Search Input */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '420px' }}>
        <input
          type="text"
          placeholder="Search by client, company, or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Inquiries Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Boxes size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No bulk enquiries in this view
            </div>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Batch print and commercial requests will appear here.
            </p>
          </div>
        ) : (
          filtered.map((inq) => {
            const isUrgent = inq.priority === 'urgent' || inq.priority === 'high';
            return (
              <div
                key={inq.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  borderLeft: `4px solid ${
                    inq.status === 'new' ? 'var(--brand-accent)' : inq.status === 'in_progress' ? '#00E5FF' : '#10B981'
                  }`,
                }}
              >
                <div style={{ minWidth: '320px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {inq.companyName || inq.customerName}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: 'rgba(255, 87, 34, 0.15)',
                        color: 'var(--brand-accent)',
                      }}
                    >
                      {inq.status.replace(/_/g, ' ')}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-alt)',
                        color: isUrgent ? '#EF4444' : 'var(--text-muted)',
                      }}
                    >
                      {inq.priority}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {inq.subject || 'Volume 3D Print Quotation Request'}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                    {inq.message}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <span>Client: <strong>{inq.customerName}</strong></span>
                    <span>Email: <strong>{inq.customerEmail}</strong></span>
                    {inq.customerPhone && <span>Phone: <strong>{inq.customerPhone}</strong></span>}
                    {inq.quantityRequested && <span>Units Requested: <strong>{inq.quantityRequested}</strong></span>}
                    {inq.targetDeliveryDate && <span>Target Date: <strong>{inq.targetDeliveryDate}</strong></span>}
                    {inq.estimatedBudgetPaise && <span>Target Budget: <strong>{formatINR(inq.estimatedBudgetPaise)}</strong></span>}
                  </div>

                  {inq.internalNotes && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#00E5FF' }}>
                      Staff notes: {inq.internalNotes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenDetails(inq)}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.95rem' }}
                  >
                    Manage & Quote
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: MANAGE & QUOTE ENQUIRY */}
      {selectedInquiry && (
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
                  Manage Enquiry: {selectedInquiry.customerName}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedInquiry.companyName || 'Independent Client'}
                </div>
              </div>
              <button onClick={() => setSelectedInquiry(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Pipeline Stage
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
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
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="quoted">Quoted</option>
                    <option value="awaiting_customer">Awaiting Customer</option>
                    <option value="closed">Closed / Won</option>
                    <option value="spam">Mark as Spam</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Priority Level
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
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
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Next Follow-Up Date
                </label>
                <input
                  type="date"
                  value={editFollowUpDate}
                  onChange={(e) => setEditFollowUpDate(e.target.value)}
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
                  Internal Studio Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record discussions, client specifications, material quotes, or machine capacity..."
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
                <button type="button" onClick={() => setSelectedInquiry(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
