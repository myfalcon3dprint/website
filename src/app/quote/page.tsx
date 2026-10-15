'use client';

import React, { useState } from 'react';
import { useQuotes } from '@/lib/store';
import { MaterialType, CustomQuoteRequest } from '@/lib/types';
import { formatINR } from '@/lib/money';
import { Upload, CheckCircle2, Ruler, FileCode, Sparkles, AlertCircle, Trash2, ShieldCheck, Clock } from 'lucide-react';

export default function CustomQuotePage() {
  const { addQuote } = useQuotes();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [material, setMaterial] = useState<MaterialType>('PLA');
  const [infill, setInfill] = useState<number>(20);
  const [quantity, setQuantity] = useState<number>(1);
  const [dimX, setDimX] = useState<number>(100);
  const [dimY, setDimY] = useState<number>(100);
  const [dimZ, setDimZ] = useState<number>(80);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time indicative slicing estimate calculation
  const envelopeVolumeCm3 = Math.max(1, Math.round((dimX * dimY * dimZ) / 1000));
  const estimatedSolidVolumeCm3 = Math.max(1, Math.round(envelopeVolumeCm3 * ((infill / 100) * 0.35 + 0.1)));
  const materialRatePerCm3: Record<MaterialType, number> = {
    PLA: 4.5,
    PETG: 5.5,
    Resin: 12.0,
    ABS: 6.0,
    TPU: 8.5,
  };
  const unitEstimatedPrice = Math.max(299, Math.round(estimatedSolidVolumeCm3 * (materialRatePerCm3[material] || 4.5)));
  const totalEstimatedPricePaise = unitEstimatedPrice * quantity * 100;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileObject(file);
      setFileName(file.name);
      setFileSize(file.size);
      setFormError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileObject(file);
      setFileName(file.name);
      setFileSize(file.size);
      setFormError('');
    }
  };

  const clearFile = () => {
    setFileObject(null);
    setFileName('');
    setFileSize(0);
  };

  const loadSampleModel = () => {
    setFileObject(null);
    setFileName('sample_bracket_v2.stl');
    setFileSize(14500000);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fileName) {
      setFormError('Please select or drop a 3D digital model file (.STL, .3MF, .OBJ, .STEP)');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('Uploading 3D mesh model...');

    let storagePath: string | undefined;

    if (fileObject) {
      try {
        const { uploadCadModelFile } = await import('@/lib/supabase/storage');
        const uploadResult = await uploadCadModelFile(fileObject);
        if (uploadResult.success && uploadResult.storagePath) {
          storagePath = uploadResult.storagePath;
        }
      } catch (err) {
        console.warn('Supabase storage upload fallback:', err);
      }
    }

    setUploadStatus('Recording quotation enquiry...');
    const refNum = `RFQ-FAL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newQuote: CustomQuoteRequest = {
      id: `quote-${Date.now()}`,
      referenceNumber: refNum,
      createdAt: new Date().toISOString(),
      fullName,
      email,
      phone,
      fileName,
      fileSizeBytes: fileSize || 1000000,
      storagePath,
      dimensionsMm: { x: dimX, y: dimY, z: dimZ },
      materialPreference: material,
      colorPreference: 'Standard Studio Grey/Black',
      infillPercentage: infill,
      quantity,
      customerNotes: notes,
      status: 'submitted',
    };

    try {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuote),
      });
    } catch (err) {
      console.warn('API quote persistence fallback:', err);
    }

    addQuote(newQuote);
    setSubmittedRef(refNum);
    setIsSubmitting(false);
    setUploadStatus('');
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: '820px' }}>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          CUSTOM CAD / STL SERVICE
        </span>
        <h1 style={{ fontSize: '2.25rem', color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
          Request a Custom 3D Print Quote
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.55 }}>
          Submit your 3D digital model for professional slicing review. Our Nashik engineering team verifies wall tolerances and returns a formal estimate within 4 working hours.
        </p>
      </div>

      {submittedRef ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '3.75rem',
              height: '3.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--status-ready-bg)',
              color: 'var(--status-ready)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '1px solid var(--status-ready-border)',
            }}
          >
            <CheckCircle2 size={30} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Quote Request Recorded
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Reference Number: <strong style={{ color: 'var(--text-primary)' }}>{submittedRef}</strong>
          </p>

          <div
            style={{
              background: 'var(--surface-alt)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              maxWidth: '480px',
              margin: '0 auto 1.75rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            <p style={{ margin: '0 0 0.35rem' }}>
              <strong>Asset:</strong> {fileName} {fileSize > 0 ? `(~${(fileSize / 1024 / 1024).toFixed(1)} MB)` : ''}
            </p>
            <p style={{ margin: '0 0 0.35rem' }}>
              <strong>Material:</strong> {material} ({infill}% Infill)
            </p>
            <p style={{ margin: '0 0 0.35rem' }}>
              <strong>Quantity:</strong> {quantity} unit(s)
            </p>
            <p style={{ margin: '0 0 0.35rem' }}>
              <strong>Indicative Estimate:</strong> ~{formatINR(totalEstimatedPricePaise)}
            </p>
            <p style={{ margin: 0, color: 'var(--status-ready)', fontWeight: 600 }}>
              Status: In engineering slicing queue at Nashik Hub.
            </p>
          </div>

          <button
            onClick={() => {
              setSubmittedRef(null);
              clearFile();
            }}
            className="btn-secondary"
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
          >
            Submit Another Model
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
          {formError && (
            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--status-danger)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* File Upload Box */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                1. 3D Digital File (.STL, .3MF, .OBJ, .STEP — Max 50 MB) *
              </label>
              {!fileName && (
                <button
                  type="button"
                  onClick={loadSampleModel}
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--brand-accent)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Load sample CAD model
                </button>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--brand-accent)' : '1px dashed var(--border-control)',
                borderRadius: 'var(--radius-sm)',
                padding: '2.25rem 1.5rem',
                textAlign: 'center',
                background: isDragging ? 'var(--brand-accent-subtle)' : 'var(--surface-alt)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast), background var(--transition-fast)',
              }}
            >
              <input
                type="file"
                accept=".stl,.3mf,.obj,.step,.stp"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              />
              <Upload size={32} style={{ color: isDragging ? 'var(--brand-accent)' : 'var(--text-secondary)', margin: '0 auto 0.6rem' }} />
              {fileName ? (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', marginBottom: '0.35rem' }}>
                    <FileCode size={16} style={{ color: 'var(--brand-accent)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fileName}</span>
                    {fileSize > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({(fileSize / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--status-danger)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Remove / Select Different File</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Click to browse or drag and drop your 3D CAD mesh here
                  </p>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                    Supports binary & ASCII STL, 3MF, OBJ, STEP • Confidential NDA engineering review
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model Dimensions */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Ruler size={16} style={{ color: 'var(--brand-accent)' }} />
              <span>2. Approximate Bounding Box Dimensions (mm)</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Length (X mm)</label>
                <input
                  type="number"
                  className="input"
                  min={5}
                  max={500}
                  value={dimX}
                  onChange={(e) => setDimX(Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Width (Y mm)</label>
                <input
                  type="number"
                  className="input"
                  min={5}
                  max={500}
                  value={dimY}
                  onChange={(e) => setDimY(Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Height (Z mm)</label>
                <input
                  type="number"
                  className="input"
                  min={5}
                  max={500}
                  value={dimZ}
                  onChange={(e) => setDimZ(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Material & Infill */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.45rem', display: 'block' }}>
                3. Material Preference *
              </label>
              <select
                className="input"
                value={material}
                onChange={(e) => setMaterial(e.target.value as MaterialType)}
              >
                <option value="PLA">PLA (Biodegradable Rigid Prototyping)</option>
                <option value="PETG">PETG (Impact & Heat Resistant)</option>
                <option value="Resin">SLA Resin (50µm Ultra-High Detail)</option>
                <option value="ABS">ABS (Tough Engineering Enclosures)</option>
                <option value="TPU">TPU (Flexible Elastomer Shock-Mounts)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  4. Infill Density
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-accent)' }}>{infill}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={infill}
                onChange={(e) => setInfill(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)', height: '2rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
                15–20% standard display • 40%+ mechanical load
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.45rem', display: 'block' }}>
                5. Quantity Units
              </label>
              <input
                type="number"
                min={1}
                max={500}
                className="input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* Interactive Live Slicing Estimator Widget */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-accent)', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Sparkles size={14} />
                <span>Instant Slicing Price Guide</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                ~{formatINR(totalEstimatedPricePaise)}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Est. volume: ~{estimatedSolidVolumeCm3} cm³ • Exact quote verified within 4 hours.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={13} style={{ color: 'var(--status-ready)' }} /> 4h engineering turnaround
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={13} style={{ color: 'var(--status-ready)' }} /> Wall tolerance verification
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.85rem', fontWeight: 600 }}>
              6. Contact Information (for Formal Estimate Delivery)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Sneha Patil"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="sneha@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Phone (+91) *</label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="98230 88990"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                Technical Notes / Tolerance Constraints (Optional)
              </label>
              <textarea
                rows={3}
                className="input"
                placeholder="Specify assembly press-fit tolerances, surface sanding, or required delivery deadline..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', height: '2.85rem' }}
          >
            <span>{isSubmitting ? (uploadStatus || 'Analyzing CAD Mesh...') : 'Submit 3D Quotation Request'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
