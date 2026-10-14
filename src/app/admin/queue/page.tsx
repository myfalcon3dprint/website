'use client';

import React, { useState } from 'react';
import { useOrders, useStaffRole } from '@/lib/store';
import { 
  Cpu, Thermometer, Layers, Clock, AlertTriangle, CheckCircle2, 
  RotateCcw, Sparkles, Activity, ShieldCheck 
} from 'lucide-react';

interface PrintFarmMachine {
  id: string;
  name: string;
  type: 'FDM' | 'SLA Resin';
  status: 'printing' | 'idle' | 'maintenance';
  currentJob?: {
    orderNumber: string;
    itemTitle: string;
    filament: string;
    layerCurrent: number;
    layerTotal: number;
    nozzleTempC: number;
    bedTempC: number;
    etaMinutes: number;
  };
}

const INITIAL_MACHINES: PrintFarmMachine[] = [
  {
    id: 'unit-01',
    name: 'Bambu Lab X1C #01',
    type: 'FDM',
    status: 'printing',
    currentJob: {
      orderNumber: 'FAL-2026-0891',
      itemTitle: 'Artisan Mechanical Keyboard Stand',
      filament: 'Matte Charcoal PLA',
      layerCurrent: 520,
      layerTotal: 680,
      nozzleTempC: 220,
      bedTempC: 60,
      etaMinutes: 42,
    },
  },
  {
    id: 'unit-02',
    name: 'Prusa MK4 #01',
    type: 'FDM',
    status: 'printing',
    currentJob: {
      orderNumber: 'FAL-2026-0892',
      itemTitle: 'Parametric Hexagonal Desk Planter',
      filament: 'PETG Stone Gray',
      layerCurrent: 210,
      layerTotal: 450,
      nozzleTempC: 240,
      bedTempC: 85,
      etaMinutes: 115,
    },
  },
  {
    id: 'unit-03',
    name: 'Formlabs Form 3+ #01',
    type: 'SLA Resin',
    status: 'printing',
    currentJob: {
      orderNumber: 'FAL-2026-0893',
      itemTitle: 'Gargoyle Stone Guardian 75mm',
      filament: 'Standard Gray Resin (50µm)',
      layerCurrent: 1450,
      layerTotal: 1800,
      nozzleTempC: 35,
      bedTempC: 0,
      etaMinutes: 65,
    },
  },
  {
    id: 'unit-04',
    name: 'Bambu Lab X1C #02',
    type: 'FDM',
    status: 'idle',
  },
];

export default function AdminQueuePage() {
  const { orders, updateOrderStatus } = useOrders();
  const { activeStaff } = useStaffRole();
  const [machines, setMachines] = useState<PrintFarmMachine[]>(INITIAL_MACHINES);
  const [qcActionNote, setQcActionNote] = useState<string | null>(null);

  const queuedOrders = orders.filter((o) =>
    ['queued', 'printing', 'finishing', 'quality_check', 'reprint_required'].includes(o.status)
  );

  const canOperateFarm = ['owner', 'production_operator'].includes(activeStaff.role);

  const handleTriggerReprint = (orderId: string, itemTitle: string) => {
    if (!canOperateFarm) {
      alert(`Access Restricted: Staff role "${activeStaff.role}" cannot trigger machine reprints.`);
      return;
    }
    updateOrderStatus(
      orderId,
      'reprint_required',
      `QC Inspection Failed: Layer adhesion delamination flagged by ${activeStaff.name}. Machine reprint queued.`
    );
    setQcActionNote(`QC Flag Recorded: Reprints triggered for order ${orderId}. Priority slot assigned.`);
    setTimeout(() => setQcActionNote(null), 5000);
  };

  const handlePassQC = (orderId: string) => {
    if (!canOperateFarm) {
      alert(`Access Restricted: Staff role "${activeStaff.role}" cannot log QC passes.`);
      return;
    }
    updateOrderStatus(
      orderId,
      'ready',
      `Passed Quality Tolerance Check (±0.2mm verified) by ${activeStaff.name}. Cleared for packaging.`
    );
    setQcActionNote(`QC Pass Logged: Order ${orderId} moved to 'Ready for Dispatch'.`);
    setTimeout(() => setQcActionNote(null), 5000);
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Nashik Additive Print Farm
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
          Print Farm Fleet & QC Station
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Real-time hardware telemetry, bed thermals, layer counts, and post-processing quality control.
        </p>
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

      {/* Fleet telemetry grid */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Activity size={18} color="var(--primary-action)" /> Hardware Machine Telemetry
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {machines.map((unit) => {
            const isPrinting = unit.status === 'printing' && unit.currentJob;
            const progressPct = isPrinting
              ? Math.round((unit.currentJob!.layerCurrent / unit.currentJob!.layerTotal) * 100)
              : 0;

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
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 2px', color: 'var(--text-primary)' }}>{unit.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Tech: {unit.type}
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

                {isPrinting && unit.currentJob ? (
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {unit.currentJob.itemTitle}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      Job {unit.currentJob.orderNumber} • {unit.currentJob.filament}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Layer {unit.currentJob.layerCurrent}/{unit.currentJob.layerTotal}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progressPct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-decor)' }}>
                        <div
                          style={{
                            width: `${progressPct}%`,
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
                        Nozzle: {unit.currentJob.nozzleTempC}°C
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-decor)' }}>
                        Bed: {unit.currentJob.bedTempC}°C • ETA: {unit.currentJob.etaMinutes}m
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    Machine idle. Ready to accept next sliced G-code batch.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* QC & Manufacturing pipeline table */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <ShieldCheck size={18} color="var(--primary-action)" /> Quality Control (QC) & Active Farm Orders ({queuedOrders.length})
        </h2>

        {queuedOrders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No orders currently in the active print or QC queue.
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
                {queuedOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-decor)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ord.orderNumber}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        {ord.customerName}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {ord.items.map((it) => (
                        <div key={it.id} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
                          onClick={() => handlePassQC(ord.id)}
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
                          onClick={() => handleTriggerReprint(ord.id, ord.items[0]?.productTitle || 'Item')}
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
