'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { ProductionJob, PrinterEquipment } from '@/lib/types';
import { 
  Cpu, Layers, CheckCircle2, AlertTriangle, 
  RefreshCw, Plus, Clock, User, ShieldCheck, 
  AlertCircle, ChevronRight, X, Sparkles, Filter, 
  ExternalLink, RotateCcw, Wrench
} from 'lucide-react';

const WORKFLOW_STAGES = [
  { key: 'all', label: 'All Jobs' },
  { key: 'waiting_to_print', label: 'Waiting to Print' },
  { key: 'printing', label: 'Printing' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'ready_to_pack', label: 'Ready to Pack' },
  { key: 'printers', label: 'Printers & Suppliers' },
];

export default function ProductionQualityCheckPage() {
  const { user, profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';
  const staffName = profile?.full_name || user?.email?.split('@')[0] || 'Operator';

  const [activeTab, setActiveTab] = useState<string>('all');
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [printers, setPrinters] = useState<PrinterEquipment[]>([]);
  const [readyStockOrders, setReadyStockOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [isAddPrinterModalOpen, setIsAddPrinterModalOpen] = useState(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);

  // Assign job form
  const [assignedPrinterId, setAssignedPrinterId] = useState('');
  const [externalSupplier, setExternalSupplier] = useState('');
  const [operator, setOperator] = useState(staffName);
  const [estMinutes, setEstMinutes] = useState(180);

  // QC form
  const [qcPassed, setQcPassed] = useState(true);
  const [qcReason, setQcReason] = useState('Layer shift at 60% print height');
  const [reworkQty, setReworkQty] = useState(1);
  const [qcNotes, setQcNotes] = useState('');

  // Printer form
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterModel, setNewPrinterModel] = useState('');
  const [newPrinterTech, setNewPrinterTech] = useState<'FDM' | 'SLA'>('FDM');
  const [newPrinterLocation, setNewPrinterLocation] = useState('Nashik Hub - Bay A');

  // Manual Job Creation Form
  const [manualItemTitle, setManualItemTitle] = useState('');
  const [manualSku, setManualSku] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualMaterial, setManualMaterial] = useState('PLA');
  const [manualColor, setManualColor] = useState('Obsidian Black');

  const canOperate = ['owner', 'production_operator', 'order_manager'].includes(staffRole);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/production');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setJobs(data.jobs || []);
      setPrinters(data.printers || []);
      setReadyStockOrders(data.readyStockOrders || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve production data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle stage transitions
  const handleAdvanceStatus = async (job: ProductionJob, nextStatus: ProductionJob['status']) => {
    if (!canOperate) {
      alert(`Access Restricted: Role '${staffRole}' cannot update production jobs.`);
      return;
    }

    try {
      const res = await fetch('/api/admin/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          updates: {
            status: nextStatus,
            completedQuantity: nextStatus === 'ready_to_pack' ? job.quantity : job.completedQuantity,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update job status');
      }

      setSuccessMessage(`Job ${job.jobNumber} advanced to ${nextStatus.replace(/_/g, ' ')}`);
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  // Assign Printer or External Supplier
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const selectedPrn = printers.find((p) => p.id === assignedPrinterId);
      const res = await fetch('/api/admin/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          updates: {
            status: 'printing',
            printerId: assignedPrinterId || null,
            externalSupplierName: externalSupplier || null,
            operatorName: operator,
            estimatedPrintMinutes: Number(estMinutes),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign printer');
      }

      // Also set printer status to printing if local machine assigned
      if (assignedPrinterId) {
        await fetch('/api/admin/production', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerId: assignedPrinterId,
            updates: { status: 'printing' },
          }),
        });
      }

      setIsAssignModalOpen(false);
      setSelectedJob(null);
      fetchData();
      setSuccessMessage(`Job assigned to ${selectedPrn?.name || externalSupplier || 'Operator'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Assignment failed');
    }
  };

  // Quality Check Pass / Fail
  const handleQcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const res = await fetch('/api/admin/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quality_check',
          jobId: selectedJob.id,
          passed: qcPassed,
          reason: qcPassed ? null : qcReason,
          reworkQuantity: qcPassed ? 0 : reworkQty,
          staffNotes: qcNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'QC update failed');
      }

      // If QC failed and reprint needed, create a reprint job automatically
      if (!qcPassed) {
        await fetch('/api/admin/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_job',
            orderId: selectedJob.orderId,
            orderNumber: selectedJob.orderNumber,
            orderItemId: selectedJob.orderItemId,
            itemTitle: `${selectedJob.itemTitle} (Reprint)`,
            variantSku: selectedJob.variantSku,
            quantity: reworkQty,
            material: selectedJob.material,
            color: selectedJob.color,
            technology: selectedJob.technology,
            priority: 'urgent',
          }),
        });
      }

      setIsQcModalOpen(false);
      setSelectedJob(null);
      fetchData();
      setSuccessMessage(qcPassed ? 'Quality Check Passed! Item ready to pack.' : 'QC Failed recorded. Reprint job dispatched.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'QC submission failed');
    }
  };

  // Printer status toggle (e.g. Set to Maintenance)
  const handleTogglePrinterMaintenance = async (printer: PrinterEquipment) => {
    const nextStatus = printer.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await fetch('/api/admin/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: printer.id,
          updates: { status: nextStatus },
        }),
      });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Printer update failed');
    }
  };

  // Add new printer
  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_printer',
          name: newPrinterName,
          model: newPrinterModel,
          technology: newPrinterTech,
          location: newPrinterLocation,
          status: 'available',
        }),
      });

      if (!res.ok) throw new Error('Failed to register printer');
      setIsAddPrinterModalOpen(false);
      setNewPrinterName('');
      setNewPrinterModel('');
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'all') return true;
    return j.status === activeTab;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Header */}
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
              OPERATIONS & FABRICATION DESK
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Production & Quality Check
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Manage order line-item manufacturing: Waiting to Print → Printing → Finishing → Quality Check → Ready to Pack.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
          <button
            onClick={() => setIsAddPrinterModalOpen(true)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Add Printer
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

      {/* Workflow Stage Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {WORKFLOW_STAGES.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.key === 'printers' ? printers.length : tab.key === 'all' ? jobs.length : jobs.filter((j) => j.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? 'var(--brand-accent)' : 'var(--surface)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: isActive ? 'var(--brand-accent)' : 'var(--border-subtle)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(0, 0, 0, 0.25)' : 'var(--surface-alt)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW: PRINTER FLEET & SUPPLIERS */}
      {activeTab === 'printers' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {printers.map((p) => {
              const isMaint = p.status === 'maintenance';
              const isPrinting = p.status === 'printing';
              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderLeft: `4px solid ${isMaint ? '#EF4444' : isPrinting ? '#00E5FF' : '#10B981'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.model} • {p.technology}</div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isMaint ? 'rgba(239, 68, 68, 0.15)' : isPrinting ? 'rgba(0, 229, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isMaint ? '#EF4444' : isPrinting ? '#00E5FF' : '#10B981',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    <div><strong>Location:</strong> {p.location}</div>
                    <div><strong>Build Plate:</strong> {p.bedSizeMm.x} × {p.bedSizeMm.y} × {p.bedSizeMm.z} mm</div>
                    <div><strong>Materials:</strong> {p.materialsSupported.join(', ')}</div>
                    {p.notes && <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}><em>&ldquo;{p.notes}&rdquo;</em></div>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => handleTogglePrinterMaintenance(p)}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Wrench size={13} />
                      {isMaint ? 'Mark Operational' : 'Set to Maintenance'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW: JOBS TABLE & CARDS */
        <div>
          {/* Notice for Ready-Stock Items bypassing printing */}
          {activeTab === 'ready_to_pack' && readyStockOrders.length > 0 && (
            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={16} />
                <span>Ready-Stock Order Bypassed Printing</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {readyStockOrders.length} order(s) contain exclusively ready-stock catalog items. They bypass the print queue and proceed straight to the packing desk.
              </p>
            </div>
          )}

          {filteredJobs.length === 0 ? (
            <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No jobs in stage &ldquo;{activeTab.replace(/_/g, ' ')}&rdquo;
              </div>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                When customers place made-to-order items or custom prints, they appear here automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredJobs.map((job) => {
                const isUrgent = job.priority === 'urgent';
                return (
                  <div
                    key={job.id}
                    className="card"
                    style={{
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      borderLeft: `4px solid ${
                        job.status === 'ready_to_pack'
                          ? '#10B981'
                          : job.status === 'qc_failed'
                          ? '#EF4444'
                          : job.status === 'printing'
                          ? '#00E5FF'
                          : 'var(--brand-accent)'
                      }`,
                    }}
                  >
                    {/* Job Details */}
                    <div style={{ minWidth: '260px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {job.jobNumber}
                        </span>
                        {job.orderNumber && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                            Order #{job.orderNumber}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 87, 34, 0.15)',
                            color: isUrgent ? '#EF4444' : 'var(--brand-accent)',
                          }}
                        >
                          {job.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {job.itemTitle}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span><strong>SKU:</strong> {job.variantSku}</span>
                        <span><strong>Quantity:</strong> {job.quantity} units</span>
                        <span><strong>Material:</strong> {job.material} ({job.color})</span>
                        <span><strong>Technology:</strong> {job.technology}</span>
                        {job.dueDate && <span><strong>Due:</strong> {job.dueDate}</span>}
                      </div>

                      {/* Equipment or Supplier */}
                      <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {job.printerName ? (
                          <span>Assigned Machine: <strong>{job.printerName}</strong></span>
                        ) : job.externalSupplierName ? (
                          <span>External Partner: <strong>{job.externalSupplierName}</strong></span>
                        ) : (
                          <span style={{ color: '#F59E0B' }}>Unassigned (Awaiting equipment assignment)</span>
                        )}
                        {job.operatorName && <span> • Operator: {job.operatorName}</span>}
                      </div>

                      {/* QC notes if present */}
                      {job.qcFailedReason && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                          ⚠ QC Defect: {job.qcFailedReason} (Rework: {job.reworkQuantity} units)
                        </div>
                      )}
                    </div>

                    {/* Stage Transition Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {job.status === 'waiting_to_print' && (
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsAssignModalOpen(true);
                          }}
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                        >
                          Assign Machine & Print
                        </button>
                      )}

                      {job.status === 'printing' && (
                        <button
                          onClick={() => handleAdvanceStatus(job, 'finishing')}
                          className="btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                        >
                          Mark Print Finished → Post-Process
                        </button>
                      )}

                      {job.status === 'finishing' && (
                        <button
                          onClick={() => handleAdvanceStatus(job, 'quality_check')}
                          className="btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                        >
                          Send to Quality Check
                        </button>
                      )}

                      {job.status === 'quality_check' && (
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsQcModalOpen(true);
                          }}
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', background: '#A855F7', borderColor: '#A855F7' }}
                        >
                          Conduct Quality Inspection
                        </button>
                      )}

                      {job.status === 'ready_to_pack' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10B981',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={16} /> Ready for Packing
                        </span>
                      )}

                      {job.status === 'qc_failed' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#EF4444',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          <AlertTriangle size={16} /> Rework in Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ASSIGN PRINTER OR EXTERNAL SUPPLIER */}
      {isAssignModalOpen && selectedJob && (
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
                Assign Equipment: {selectedJob.jobNumber}
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Assign to Studio Workshop Printer
                </label>
                <select
                  value={assignedPrinterId}
                  onChange={(e) => {
                    setAssignedPrinterId(e.target.value);
                    if (e.target.value) setExternalSupplier('');
                  }}
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
                  <option value="">-- Or choose external supplier below --</option>
                  {printers.map((p) => {
                    const isMaint = p.status === 'maintenance';
                    return (
                      <option key={p.id} value={p.id} disabled={isMaint}>
                        {p.name} ({p.status}){isMaint ? ' - UNDER MAINTENANCE' : ''}
                      </option>
                    );
                  })}
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Printers under maintenance cannot be assigned new jobs.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Or Outsource to External Supplier Partner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune SLA Rapid Lab, Nashik Metal Works"
                  value={externalSupplier}
                  onChange={(e) => {
                    setExternalSupplier(e.target.value);
                    if (e.target.value) setAssignedPrinterId('');
                  }}
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
                  Assigned Operator
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
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
                  Estimated Print Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={estMinutes}
                  onChange={(e) => setEstMinutes(Number(e.target.value))}
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
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Start Printing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUALITY CHECK PASS / FAIL */}
      {isQcModalOpen && selectedJob && (
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
                Quality Inspection: {selectedJob.jobNumber}
              </h2>
              <button onClick={() => setIsQcModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQcSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Inspection Result
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setQcPassed(true)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: qcPassed ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface-alt)',
                      border: `2px solid ${qcPassed ? '#10B981' : 'var(--border-subtle)'}`,
                      color: qcPassed ? '#10B981' : 'var(--text-secondary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={16} /> PASS (Ready to Pack)
                  </button>

                  <button
                    type="button"
                    onClick={() => setQcPassed(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: !qcPassed ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface-alt)',
                      border: `2px solid ${!qcPassed ? '#EF4444' : 'var(--border-subtle)'}`,
                      color: !qcPassed ? '#EF4444' : 'var(--text-secondary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={16} /> FAIL (Rework / Reprint)
                  </button>
                </div>
              </div>

              {!qcPassed && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Defect Reason
                    </label>
                    <select
                      value={qcReason}
                      onChange={(e) => setQcReason(e.target.value)}
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
                      <option value="Layer shift at print height">Layer shift / Stepper motor skip</option>
                      <option value="Warping / Bed detachment">Warping / Bed detachment</option>
                      <option value="Under-extrusion / Clogged nozzle">Under-extrusion / Clogged nozzle</option>
                      <option value="Dimensional tolerance out of spec">Dimensional tolerance out of spec (&gt;0.2mm)</option>
                      <option value="Severe stringing or blob defects">Severe stringing or blob defects</option>
                      <option value="Support scarring on cosmetic surface">Support scarring on cosmetic surface</option>
                      <option value="Curing defect / Sticky resin surface">Curing defect / Sticky resin surface</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Quantity to Reprint (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedJob.quantity}
                      value={reworkQty}
                      onChange={(e) => setReworkQty(Number(e.target.value))}
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
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '0.25rem' }}>
                      Failing QC automatically dispatches a prioritized reprint job to the queue.
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Inspector Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Dimensional notes, caliper measurements, or surface remarks..."
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
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
                <button type="button" onClick={() => setIsQcModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTER NEW PRINTER */}
      {isAddPrinterModalOpen && (
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
                Register Workshop Equipment
              </h2>
              <button onClick={() => setIsAddPrinterModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPrinter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Equipment Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bambu Lab X1-Carbon #03"
                  value={newPrinterName}
                  onChange={(e) => setNewPrinterName(e.target.value)}
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
                  Hardware Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bambu Lab X1C / Prusa MK4 / Elegoo Saturn 4"
                  value={newPrinterModel}
                  onChange={(e) => setNewPrinterModel(e.target.value)}
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
                  Printing Technology
                </label>
                <select
                  value={newPrinterTech}
                  onChange={(e) => setNewPrinterTech(e.target.value as 'FDM' | 'SLA')}
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
                  <option value="FDM">FDM (Fused Deposition Modeling - Spool Filament)</option>
                  <option value="SLA">SLA (Stereolithography - UV Liquid Resin)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Workshop Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nashik Hub - Bay B"
                  value={newPrinterLocation}
                  onChange={(e) => setNewPrinterLocation(e.target.value)}
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
                <button type="button" onClick={() => setIsAddPrinterModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
