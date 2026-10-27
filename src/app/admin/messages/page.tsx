'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { CustomerInquiry } from '@/lib/types';
import { 
  MessageSquare, Search, RefreshCw, CheckCircle2, 
  Clock, AlertTriangle, User, Mail, Phone, 
  ArrowRight, ShieldCheck, X, FileText, Send, Trash2
} from 'lucide-react';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Messages' },
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'awaiting_customer', label: 'Awaiting Customer' },
  { key: 'closed', label: 'Closed' },
  { key: 'spam', label: 'Spam' },
];

export default function ContactMessagesPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [messages, setMessages] = useState<CustomerInquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected message details & reply
  const [selectedMessage, setSelectedMessage] = useState<CustomerInquiry | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [editStatus, setEditStatus] = useState('in_progress');

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({ type: 'contact' });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setMessages(data.inquiries || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve messages');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenDetails = (msg: CustomerInquiry) => {
    setSelectedMessage(msg);
    setInternalNotes(msg.internalNotes || '');
    setEditStatus(msg.status);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMessage.id,
          updates: {
            status: editStatus,
            internalNotes,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update message');
      setSelectedMessage(null);
      setSuccessMessage('Message status updated!');
      fetchMessages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filtered = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.customerName.toLowerCase().includes(q) ||
      m.customerEmail.toLowerCase().includes(q) ||
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      m.message.toLowerCase().includes(q)
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
              CUSTOMER SUPPORT DESK
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Contact Messages
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Customer inquiries submitted through the storefront contact form, custom consulting requests, and support tickets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchMessages}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Honest Messaging Notice */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 87, 34, 0.05)',
          border: '1px solid rgba(255, 87, 34, 0.2)',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
        }}
      >
        <Mail size={16} style={{ color: 'var(--brand-accent)' }} />
        <span>
          <strong>Outbound Messaging Safeguard</strong>: Client replies are logged internally. Real customer email dispatch is enabled only when an authenticated SMTP/Resend API key is populated in environment settings.
        </span>
      </div>

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
          placeholder="Search by client name, email, or message copy..."
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

      {/* Messages List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No messages in this folder
            </div>
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                borderLeft: `4px solid ${
                  msg.status === 'new' ? 'var(--brand-accent)' : msg.status === 'closed' ? '#10B981' : '#00E5FF'
                }`,
              }}
            >
              <div style={{ minWidth: '320px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {msg.customerName}
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
                    {msg.status.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    • {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Subject: {msg.subject || 'Storefront Inquiry'}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                  {msg.message}
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span>Email: <strong>{msg.customerEmail}</strong></span>
                  {msg.customerPhone && <span>Phone: <strong>{msg.customerPhone}</strong></span>}
                </div>

                {msg.internalNotes && (
                  <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#00E5FF' }}>
                    Staff notes: {msg.internalNotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenDetails(msg)}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.95rem' }}
                >
                  Manage Ticket
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: MANAGE TICKET */}
      {selectedMessage && (
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
                  Support Ticket: {selectedMessage.customerName}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedMessage.customerEmail}
                </div>
              </div>
              <button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Customer Message:</strong>
              <div style={{ marginTop: '0.35rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {selectedMessage.message}
              </div>
            </div>

            <form onSubmit={handleSaveStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Update Ticket Status
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
                  <option value="awaiting_customer">Awaiting Customer Reply</option>
                  <option value="closed">Resolved & Closed</option>
                  <option value="spam">Flag as Spam</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Internal Staff Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes about phone call or customer resolution..."
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
                <button type="button" onClick={() => setSelectedMessage(null)} className="btn-outline">
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
