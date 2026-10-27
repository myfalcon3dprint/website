'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { ProductReview } from '@/lib/types';
import { 
  Star, CheckCircle2, AlertTriangle, RefreshCw, 
  MessageSquare, ShieldCheck, Eye, EyeOff, X, 
  CornerDownRight, Send, AlertCircle
} from 'lucide-react';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Reviews' },
  { key: 'pending', label: 'Pending Moderation' },
  { key: 'approved', label: 'Approved (Live)' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'spam', label: 'Spam' },
];

export default function ProductReviewsPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';
  const staffName = profile?.full_name || 'Studio Staff';

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Staff reply modal
  const [replyReview, setReplyReview] = useState<ProductReview | null>(null);
  const [staffReplyText, setStaffReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateStatus = async (review: ProductReview, nextStatus: ProductReview['status']) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: review.id,
          status: nextStatus,
        }),
      });

      if (!res.ok) throw new Error('Status update failed');
      setSuccessMessage(`Review marked as ${nextStatus}!`);
      fetchReviews();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReview || !staffReplyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: replyReview.id,
          staffReply: staffReplyText.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to post reply');
      setReplyReview(null);
      setStaffReplyText('');
      setSuccessMessage('Official studio response published!');
      fetchReviews();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setIsSubmittingReply(false);
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
              COMMUNITY & REVIEWS MODERATION
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Product Reviews
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Review customer ratings, verified purchase tags, post official studio replies, and moderate spam.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchReviews}
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

      {/* Filter Tabs */}
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

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reviews.length === 0 ? (
          <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Star size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No reviews in this moderation folder
            </div>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Submitted customer reviews will appear here for staff review.
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${
                  rev.status === 'approved' ? '#10B981' : rev.status === 'rejected' ? '#EF4444' : '#F59E0B'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {rev.customerName}
                    </span>
                    {rev.isVerifiedPurchase && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <CheckCircle2 size={10} /> Verified Purchase
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                    Product: {rev.productTitle || '3D Printed Model'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= rev.rating ? '#F59E0B' : 'none'}
                      stroke={star <= rev.rating ? '#F59E0B' : 'var(--text-muted)'}
                    />
                  ))}
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginLeft: '4px' }}>
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {rev.title && (
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  &ldquo;{rev.title}&rdquo;
                </div>
              )}

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.85rem' }}>
                {rev.reviewText}
              </p>

              {/* Verified Staff Response block */}
              {rev.staffReply && (
                <div
                  style={{
                    background: 'var(--surface-alt)',
                    borderLeft: '3px solid var(--brand-accent)',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    marginBottom: '0.85rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--brand-accent)', fontWeight: 700, marginBottom: '0.2rem' }}>
                    <CornerDownRight size={13} />
                    <span>Official Studio Response ({rev.staffRepliedAt ? new Date(rev.staffRepliedAt).toLocaleDateString() : 'Staff'})</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{rev.staffReply}</div>
                </div>
              )}

              {/* Moderation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: rev.status === 'approved' ? '#10B981' : rev.status === 'rejected' ? '#EF4444' : '#F59E0B',
                  }}
                >
                  Status: {rev.status}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setReplyReview(rev);
                      setStaffReplyText(rev.staffReply || '');
                    }}
                    className="btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <MessageSquare size={13} /> {rev.staffReply ? 'Edit Studio Reply' : 'Reply'}
                  </button>

                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(rev, 'approved')}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#10B981', borderColor: '#10B981' }}
                    >
                      Approve (Publish)
                    </button>
                  )}

                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(rev, 'rejected')}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Reject
                    </button>
                  )}

                  {rev.status !== 'spam' && (
                    <button
                      onClick={() => handleUpdateStatus(rev, 'spam')}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--text-muted)' }}
                    >
                      Spam
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: POST STAFF REPLY */}
      {replyReview && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Studio Reply to {replyReview.customerName}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {replyReview.productTitle}
                </div>
              </div>
              <button onClick={() => setReplyReview(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <em>&ldquo;{replyReview.reviewText}&rdquo;</em>
            </div>

            <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Official Response
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for your feedback! We are thrilled your print turned out great..."
                  value={staffReplyText}
                  onChange={(e) => setStaffReplyText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setReplyReview(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingReply} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={13} /> {isSubmittingReply ? 'Saving...' : 'Publish Studio Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
