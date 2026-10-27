'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { CustomerDetail } from '@/lib/types';
import { formatINR } from '@/lib/money';
import { 
  Users, Search, Download, RefreshCw, Plus, 
  MessageSquare, ShoppingBag, Eye, X, ShieldAlert, 
  CheckCircle2, Mail, Phone, Calendar, Clock, Lock
} from 'lucide-react';

export default function CustomersPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected customer drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerNotes, setCustomerNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const canExport = ['owner', 'order_manager'].includes(staffRole);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve customers');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSelectCustomer = async (cust: CustomerDetail) => {
    setSelectedCustomer(cust);
    try {
      const res = await fetch(`/api/admin/customers?customerId=${cust.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
        setCustomerNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          note: newNote.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to record staff note');
      const data = await res.json();
      setCustomerNotes([data.note, ...customerNotes]);
      setNewNote('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Note creation failed');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleExportCustomers = () => {
    if (!canExport) {
      alert('Access Restricted: Only owners and order managers may export customer PII.');
      return;
    }

    let csv = 'Customer Name,Email,Phone,Joined Date,Total Orders,Total Spent (INR),Marketing Consent\n';
    customers.forEach((c) => {
      const inr = (c.totalSpentPaise / 100).toFixed(2);
      csv += `"${c.fullName}","${c.email}","${c.phone || ''}","${new Date(c.createdAt).toLocaleDateString()}","${c.totalOrders}","${inr}","${c.marketingConsent ? 'YES' : 'NO'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `falcon-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
              CUSTOMER RELATIONSHIP MANAGEMENT
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Customers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Inspect client purchase histories, internal CRM notes, communication preferences, and lifetime value.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchCustomers}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
          {canExport && (
            <button
              onClick={handleExportCustomers}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} /> Export Customers (CSV)
            </button>
          )}
        </div>
      </div>

      {/* Security & Privacy Shield */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#34D399',
          fontSize: '0.82rem',
        }}
      >
        <Lock size={16} />
        <span>
          <strong>Strict Customer Credential Protection</strong> — Customer passwords are encrypted using salted bcrypt/argon2 hashing and are inaccessible to all staff. Silent credential resets are strictly disabled.
        </span>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Customer Name</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Contact Info</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Joined Date</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>Total Orders</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Spent (INR)</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Marketing Consent</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customer records match your filter criteria.
                </td>
              </tr>
            ) : (
              customers.map((cust) => (
                <tr
                  key={cust.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cust.fullName}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: 'var(--text-primary)' }}>{cust.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.phone || 'No phone recorded'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>
                    {cust.totalOrders}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--brand-accent)' }}>
                    {formatINR(cust.totalSpentPaise)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: cust.marketingConsent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(113, 113, 122, 0.2)',
                        color: cust.marketingConsent ? '#10B981' : 'var(--text-muted)',
                      }}
                    >
                      {cust.marketingConsent ? 'Opted In' : 'No Consent'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleSelectCustomer(cust)}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> View History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CUSTOMER DETAIL DRAWER MODAL */}
      {selectedCustomer && (
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
          <div
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
                  {selectedCustomer.fullName}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Registered Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-alt)', padding: '0.85rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Orders</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCustomer.totalOrders}</div>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '0.85rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lifetime Spend</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-accent)' }}>{formatINR(selectedCustomer.totalSpentPaise)}</div>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '0.85rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Marketing Consent</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedCustomer.marketingConsent ? '#10B981' : 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedCustomer.marketingConsent ? 'Subscribed' : 'Unsubscribed'}
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div style={{ background: 'var(--surface-alt)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Contact Details:</div>
              <div>Email: <strong>{selectedCustomer.email}</strong></div>
              <div>Phone: <strong>{selectedCustomer.phone || 'None provided'}</strong></div>
            </div>

            {/* Internal Staff Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Internal Studio Staff Notes
              </h3>

              {customerNotes.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  No internal staff notes on this profile.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {customerNotes.map((note) => (
                    <div key={note.id} style={{ background: 'var(--surface-alt)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                        <span>{note.staffName}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>{note.note}</div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Record private staff observation..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                  }}
                />
                <button type="submit" disabled={isAddingNote} className="btn-primary" style={{ fontSize: '0.78rem' }}>
                  Add Note
                </button>
              </form>
            </div>

            {/* Order History */}
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Order History ({customerOrders.length})
              </h3>
              {customerOrders.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No completed orders found for this account.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {customerOrders.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        background: 'var(--surface-alt)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{o.order_number}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(o.total_paise)}</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand-accent)', textTransform: 'capitalize' }}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
