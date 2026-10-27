'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { AuditLogEntry, StaffRole } from '@/lib/types';
import { 
  History, Search, Filter, ShieldCheck, ShieldAlert, 
  Clock, Eye, RefreshCw, AlertCircle, FileText, 
  ArrowRight, User, Laptop, Database, Lock, X
} from 'lucide-react';

export default function AdminActivityPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'customer';
  const isAuthorized = ['owner', 'order_manager'].includes(staffRole);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [immutabilityNotice, setImmutabilityNotice] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Selected Log Diff Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter);
      if (roleFilter !== 'all') params.set('staffRole', roleFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch activity records');

      setLogs(data.logs || []);
      if (data.immutabilityNotice) setImmutabilityNotice(data.immutabilityNotice);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error retrieving audit trail');
    } finally {
      setIsLoading(false);
    }
  }, [entityTypeFilter, roleFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', label: 'Owner' };
      case 'order_manager':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', label: 'Order Mgr' };
      case 'production_operator':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', label: 'Operator' };
      case 'catalog_editor':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', label: 'Catalog' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', label: role };
    }
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'order':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', label: 'Order' };
      case 'product':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#C084FC', label: 'Product' };
      case 'shipping':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#34D399', label: 'Shipping' };
      case 'settings':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', label: 'Settings' };
      case 'user':
        return { bg: 'rgba(236, 72, 153, 0.12)', color: '#F472B6', label: 'Staff' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', color: '#D1D5DB', label: entityType };
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10B981' }}>
              <History size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
              Activity History & Audit Trail
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted, #9CA3AF)', margin: 0, fontSize: '0.95rem' }}>
            Searchable, tamper-proof record of every administrative event, status shift, and store modification.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'var(--text-primary, #F3F4F6)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Log
        </button>
      </div>

      {/* Security Immutability Alert */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <Lock size={18} color="#10B981" />
        <span style={{ fontSize: '0.85rem', color: '#A7F3D0', lineHeight: '1.4' }}>
          <strong>Append-Only Security Guarantee:</strong> {immutabilityNotice || 'Audit records are append-only and cryptographically timestamped. Modifying or deleting logs is strictly blocked by database security policies.'}
        </span>
      </div>

      {errorMsg && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#F87171',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by staff name, action, entity ID or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          style={{
            padding: '0.625rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="all" style={{ background: '#1F2937' }}>All Entity Types</option>
          <option value="order" style={{ background: '#1F2937' }}>Orders</option>
          <option value="product" style={{ background: '#1F2937' }}>Products</option>
          <option value="shipping" style={{ background: '#1F2937' }}>Shipping</option>
          <option value="settings" style={{ background: '#1F2937' }}>Settings</option>
          <option value="user" style={{ background: '#1F2937' }}>Staff / Users</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '0.625rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="all" style={{ background: '#1F2937' }}>All Staff Roles</option>
          <option value="owner" style={{ background: '#1F2937' }}>Studio Owner</option>
          <option value="order_manager" style={{ background: '#1F2937' }}>Order Manager</option>
          <option value="production_operator" style={{ background: '#1F2937' }}>Production Operator</option>
          <option value="catalog_editor" style={{ background: '#1F2937' }}>Catalog Editor</option>
        </select>
      </div>

      {/* Logs Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '0.875rem 1.25rem', color: '#9CA3AF', fontWeight: 600 }}>Timestamp (IST)</th>
              <th style={{ padding: '0.875rem 1.25rem', color: '#9CA3AF', fontWeight: 600 }}>Staff Member</th>
              <th style={{ padding: '0.875rem 1.25rem', color: '#9CA3AF', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '0.875rem 1.25rem', color: '#9CA3AF', fontWeight: 600 }}>Affected Target</th>
              <th style={{ padding: '0.875rem 1.25rem', color: '#9CA3AF', fontWeight: 600 }}>Operational Notes</th>
              <th style={{ padding: '0.875rem 1.25rem', color: '#9CA3AF', fontWeight: 600, textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const roleMeta = getRoleBadge(log.staffRole);
              const entityMeta = getEntityBadge(log.entityType);
              const hasDiff = Boolean(log.oldState || log.newState);

              return (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '1rem 1.25rem', color: '#9CA3AF', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#F3F4F6' }}>{log.staffName}</div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: roleMeta.bg,
                      color: roleMeta.color,
                      marginTop: '0.15rem',
                    }}>
                      {roleMeta.label}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      color: '#E5E7EB',
                      fontWeight: 600,
                    }}>
                      {log.action}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: entityMeta.bg,
                        color: entityMeta.color,
                      }}>
                        {entityMeta.label}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#D1D5DB' }}>
                        {log.entityId}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', color: '#9CA3AF', fontSize: '0.8rem', maxWidth: '320px' }}>
                    {log.notes || 'No custom remarks recorded'}
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    {hasDiff ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#D1D5DB',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={14} />
                        View Diff
                      </button>
                    ) : (
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>No State Diff</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: '#9CA3AF' }}>
                  No administrative actions match your current search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* State Diff Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  State Inspection: {selectedLog.action}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                  Entity {selectedLog.entityType.toUpperCase()}: #{selectedLog.entityId} • {new Date(selectedLog.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#D1D5DB',
              }}>
                <strong>Operator Note:</strong> {selectedLog.notes || 'Direct administrative action.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F87171', margin: '0 0 0.5rem 0' }}>
                    Previous State (Before)
                  </h4>
                  <pre style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#FCA5A5',
                    overflowX: 'auto',
                    margin: 0,
                    minHeight: '160px',
                  }}>
                    {selectedLog.oldState ? JSON.stringify(selectedLog.oldState, null, 2) : '// No previous state recorded'}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34D399', margin: '0 0 0.5rem 0' }}>
                    New State (After)
                  </h4>
                  <pre style={{
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#6EE7B7',
                    overflowX: 'auto',
                    margin: 0,
                    minHeight: '160px',
                  }}>
                    {selectedLog.newState ? JSON.stringify(selectedLog.newState, null, 2) : '// No new state snapshot'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
