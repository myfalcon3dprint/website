'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { Order } from '@/lib/types';
import { 
  Cpu, Thermometer, Layers, Clock, AlertTriangle, CheckCircle2, 
  RotateCcw, Sparkles, Activity, ShieldCheck, RefreshCw, AlertCircle 
} from 'lucide-react';

interface PrintQueueRow {
  id: string;
  printer_name: string;
  technology: string;
  status: 'printing' | 'idle' | 'maintenance' | 'calibrating';
  current_job_name?: string | null;
  material?: string | null;
  progress_percent: number;
  hotend_temp_c: number;
  bed_temp_c: number;
  remaining_minutes: number;
}

export default function AdminQueuePage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'customer';
  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Operator';

  const [machines, setMachines] = useState<PrintQueueRow[]>([]);
  const [qcOrders, setQcOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qcActionNote, setQcActionNote] = useState<string | null>(null);

  const canOperateFarm = ['owner', 'production_operator'].includes(staffRole);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch live machines from database
      const queueRes = await fetch('/api/admin/queue');
      if (!queueRes.ok) {
        const errorData = await queueRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch machine fleet (${queueRes.status})`);
      }
      const queueData = await queueRes.json();
      setMachines(queueData.machines || []);

      // 2. Fetch live active production orders
      const ordersRes = await fetch('/api/orders?limit=50');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const active = (ordersData.orders || []).filter((o: Order) =>
          ['queued', 'printing', 'finishing', 'quality_check', 'reprint_required'].includes(o.status)
        );
        setQcOrders(active);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve farm telemetry';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTriggerReprint = async (order: Order) => {
    if (!canOperateFarm) {
      alert(`Access Restricted: Role '${staffRole}' cannot trigger machine reprints.`);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'reprint_required',
          statusNote: `QC Delamination or Dimension Failure flagged by ${staffName} (${staffRole}). Reprint priority queued.`,
          lastKnownUpdatedAt: order.updatedAt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update order status');
      }

      setQcOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'reprint_required' as const } : o))
      );
      setQcActionNote(`QC Flag Recorded: Reprints triggered for order ${order.orderNumber}. Recorded in audit history.`);
      setTimeout(() => setQcActionNote(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      alert(`Error triggering reprint: ${msg}`);
    }
  };

  const handlePassQC = async (order: Order) => {
    if (!canOperateFarm) {
      alert(`Access Restricted: Role '${staffRole}' cannot log QC passes.`);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'ready',
          statusNote: `Passed Quality Tolerance Verification (±0.2mm checked) by ${staffName} (${staffRole}). Cleared for packaging.`,
          lastKnownUpdatedAt: order.updatedAt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update order status');
      }

      setQcOrders((prev) => prev.filter((o) => o.id !== order.id));
      setQcActionNote(`QC Pass Logged: Order ${order.orderNumber} committed to 'Ready for Dispatch'.`);
      setTimeout(() => setQcActionNote(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      alert(`Error passing QC: ${msg}`);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Nashik Additive Print Farm
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Print Farm Fleet & QC Station
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Authoritative hardware telemetry, farm fleet records, and post-processing quality control.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {qcActionNote && (
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
          <CheckCircle2 size={16} /> {qcActionNote}
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
          <button onClick={fetchData} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Fleet telemetry grid */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Activity size={18} color="var(--primary-action)" /> Hardware Fleet Records ({machines.length})
        </h2>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading print farm telemetry from PostgreSQL database...
          </div>
        ) : machines.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No print farm machines configured in the database.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {machines.map((unit) => {
              const isPrinting = unit.status === 'printing';

              return (
                <div
                  key={unit.id}
                  className="card"
                  style={{
                    borderTop: `3px solid ${isPrinting ? 'var(--primary-action)' : 'var(--border-decor)'}`,
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 2px', color: 'var(--text-primary)' }}>{unit.printer_name}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Tech: {unit.technology} • Unit ID: {unit.id}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        textTransform: 'uppercase',
                        background: isPrinting ? 'var(--success-bg)' : 'var(--surface-alt)',
                        color: isPrinting ? 'var(--success)' : 'var(--text-secondary)',
                        border: `1px solid ${isPrinting ? 'var(--success-border)' : 'var(--border-decor)'}`,
                      }}
                    >
                      ● {unit.status}
                    </span>
                  </div>

                  {isPrinting && unit.current_job_name ? (
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {unit.current_job_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Filament: {unit.material || 'Standard PLA'}
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Job Progress</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{unit.progress_percent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-decor)' }}>
                          <div
                            style={{
                              width: `${unit.progress_percent}%`,
                              height: '100%',
                              background: 'var(--primary-action)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>

                      {/* Thermal sensors */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-decor)' }}>
                          <Thermometer size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          Hotend: {unit.hotend_temp_c}°C
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-decor)' }}>
                          Bed: {unit.bed_temp_c}°C • ETA: {unit.remaining_minutes}m
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      Machine idle. Ready to accept next sliced toolpath batch.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QC & Manufacturing pipeline table */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <ShieldCheck size={18} color="var(--primary-action)" /> Quality Control (QC) & Active Farm Orders ({qcOrders.length})
        </h2>

        {qcOrders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No orders currently in the active print or QC queue in the database.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-decor)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Order</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Part Details</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Current Phase</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>QC Decision</th>
                </tr>
              </thead>
              <tbody>
                {qcOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-decor)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ord.orderNumber}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        {ord.customerName}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {ord.items.map((it, idx) => (
                        <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{it.quantity}×</strong> {it.productTitle} ({it.variantDetails})
                        </div>
                      ))}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          textTransform: 'uppercase',
                          background:
                            ord.status === 'quality_check'
                              ? '#FEF08A'
                              : ord.status === 'reprint_required'
                              ? 'var(--danger-bg)'
                              : 'var(--surface-alt)',
                          color:
                            ord.status === 'quality_check'
                              ? '#854D0E'
                              : ord.status === 'reprint_required'
                              ? 'var(--danger)'
                              : 'var(--text-primary)',
                          border: '1px solid var(--border-decor)',
                        }}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handlePassQC(ord)}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            color: 'var(--success)',
                            borderColor: 'var(--success-border)',
                          }}
                        >
                          <CheckCircle2 size={14} /> Pass QC
                        </button>
                        <button
                          onClick={() => handleTriggerReprint(ord)}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            color: 'var(--danger)',
                            borderColor: 'var(--danger-border)',
                          }}
                        >
                          <RotateCcw size={14} /> Fail & Reprint
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
