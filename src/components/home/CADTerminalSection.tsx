'use client';

import React from 'react';
import Link from 'next/link';
import { FileCode, UploadCloud, Clock, CheckCircle2, ShieldAlert, ArrowRight, MessageSquareCode } from 'lucide-react';

export default function CADTerminalSection() {
  return (
    <section className="container" aria-label="Bespoke Additive Manufacturing and CAD Quotation">
      <div className="blueprint-card" style={{ padding: 'clamp(2rem, 4.5vw, 3.5rem)', color: '#F3EFE6' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          {/* Left Column: Slicer Terminal Overview */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <span className="pulse-beacon-orange" aria-hidden="true" />
              <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                DIRECT CAD &amp; STL FABRICATION TERMINAL
              </span>
            </div>

            <h2
              className="font-editorial"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                color: '#FFFFFF',
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                marginBottom: '1rem',
              }}
            >
              Bring Your Digital Solid into Physical Form.
            </h2>

            <p style={{ color: '#C5C0B6', fontSize: '0.96rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
              Upload your 3D models directly to our Nashik studio. Our additive engineers inspect geometric manifolds, calculate optimal layer orientations, and return an itemized quote within 4 business hours.
            </p>

            {/* Supported Format Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#9E998E', textTransform: 'uppercase', fontWeight: 600, marginRight: '0.35rem' }}>
                Supported Formats:
              </span>
              {['.STL', '.OBJ', '.3MF', '.STEP'].map((ext) => (
                <span
                  key={ext}
                  style={{
                    padding: '0.25rem 0.6rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                  }}
                >
                  {ext}
                </span>
              ))}
              <span style={{ fontSize: '0.75rem', color: '#9E998E' }}>
                (Files up to 50MB)
              </span>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/quote"
                className="btn-accent"
                style={{
                  padding: '0.85rem 1.65rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 20px rgba(232, 89, 12, 0.4)',
                }}
              >
                <UploadCloud size={18} />
                <span>Upload 3D CAD Model (Get Quote)</span>
              </Link>

              <a
                href="https://wa.me/919850607144?text=Hi%20Falcon%203D%20Prints%2C%20I%20have%20a%20custom%20CAD%20file%20for%203D%20printing."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#FFFFFF',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  transition: 'background 160ms ease',
                }}
              >
                <MessageSquareCode size={16} style={{ color: 'var(--brand-accent)' }} />
                <span>WhatsApp Engineer</span>
              </a>
            </div>
          </div>

          {/* Right Column: 4-Step Technical Pipeline */}
          <div
            style={{
              background: 'rgba(23, 21, 19, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', color: '#9E998E', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Fabrication Pipeline
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                Average Response: 2.8 Hours
              </span>
            </div>

            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232, 89, 12, 0.15)', border: '1px solid var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                1
              </div>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', display: 'block' }}>
                  Model Upload &amp; Mesh Check
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#C5C0B6', lineHeight: 1.45 }}>
                  We evaluate wall thicknesses, overhang angles, and non-manifold edges to prevent print defects.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232, 89, 12, 0.15)', border: '1px solid var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                2
              </div>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', display: 'block' }}>
                  Slicing &amp; Infill Calculation
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#C5C0B6', lineHeight: 1.45 }}>
                  Our software computes precise filament gram weight, print duration, and machine runtime.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232, 89, 12, 0.15)', border: '1px solid var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                3
              </div>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', display: 'block' }}>
                  Firm Quoting within 4 Hours
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#C5C0B6', lineHeight: 1.45 }}>
                  Receive an all-inclusive estimate covering material options, post-processing, and tax.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                4
              </div>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', display: 'block' }}>
                  Fabrication &amp; Nashik Dispatch
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#C5C0B6', lineHeight: 1.45 }}>
                  Printed on calibrated Prusa or Bambu machines with tracked pan-India courier delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
