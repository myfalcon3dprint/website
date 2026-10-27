'use client';

import React from 'react';
import { Cpu, Layers, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CraftStep {
  number: string;
  title: string;
  tagline: string;
  description: string;
}

const STEPS: CraftStep[] = [
  {
    number: '01',
    title: 'Parametric CAD Verification',
    tagline: 'Manifold & Geometry Audit',
    description:
      'We inspect polygon meshes for non-manifold edges, optimal print orientation, and wall thicknesses down to 0.8mm to ensure structural stability.',
  },
  {
    number: '02',
    title: 'Specialized Polymer Slicing',
    tagline: 'Gyroid & Honeycomb Densities',
    description:
      'Our slicing algorithms calculate custom infill densities and stress-tested layer patterns tailored specifically for PLA biopolymers or SLA resins.',
  },
  {
    number: '03',
    title: 'Multi-Axis Studio Fabrication',
    tagline: '50µm to 0.16mm Precision',
    description:
      'Operating calibrated Bambu Lab and Prusa multi-material machines with active vibration compensation and PEI spring-steel thermal beds.',
  },
  {
    number: '04',
    title: 'Hand-Finishing & Optical QC',
    tagline: 'Nashik Workshop Inspection',
    description:
      'Every completed piece is hand-deburred, cleaned with micro-abrasives, and optically inspected before placement into shockproof protective packaging.',
  },
];

export default function AdditiveHeritageSection() {
  return (
    <section className="container" aria-label="Additive Craftsmanship Process">
      {/* Ornamental Section Header */}
      <div className="ornamental-header">
        <div className="ornamental-line">
          <span>&diams; OUR ADDITIVE CRAFT &diams;</span>
        </div>
        <h2
          className="font-editorial"
          style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            color: '#1C1917',
            letterSpacing: '-0.025em',
            margin: '0.25rem 0 0.5rem',
            fontWeight: 700,
          }}
        >
          Where Code Finds Solid Form
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.96rem', lineHeight: 1.6, margin: 0 }}>
          Four deliberate stages of additive manufacturing practiced inside our Nashik atelier.
        </p>
      </div>

      {/* 4 Process Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '3.5rem' }}>
        {STEPS.map((step) => (
          <div key={step.number} className="process-step-tile">
            <span className="process-step-num">{step.number}</span>
            <h3 style={{ fontSize: '1.12rem', color: '#1C1917', fontWeight: 700, margin: '0 0 0.25rem' }}>
              {step.title}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {step.tagline}
            </span>
            <p style={{ fontSize: '0.86rem', color: '#57534E', lineHeight: 1.6, margin: 0 }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* MurtiHub-Style Trust Metric Counters Bar */}
      <div
        style={{
          background: '#FAF8F4',
          border: '1px solid #ECE7DE',
          borderRadius: 'var(--radius-md)',
          padding: '2rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '2rem',
          textAlign: 'center',
        }}
      >
        <div>
          <span className="font-editorial" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold-primary)', lineHeight: 1, display: 'block' }}>
            12+
          </span>
          <strong style={{ fontSize: '0.84rem', color: '#1C1917', display: 'block', marginTop: '0.35rem' }}>
            Active Extruders Online
          </strong>
          <span style={{ fontSize: '0.74rem', color: '#78716C' }}>Bambu &amp; Prusa Studio Farm</span>
        </div>

        <div>
          <span className="font-editorial" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold-primary)', lineHeight: 1, display: 'block' }}>
            50µm
          </span>
          <strong style={{ fontSize: '0.84rem', color: '#1C1917', display: 'block', marginTop: '0.35rem' }}>
            Micro-Layer Fidelity
          </strong>
          <span style={{ fontSize: '0.74rem', color: '#78716C' }}>4K Monochrome SLA Resin</span>
        </div>

        <div>
          <span className="font-editorial" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold-primary)', lineHeight: 1, display: 'block' }}>
            100%
          </span>
          <strong style={{ fontSize: '0.84rem', color: '#1C1917', display: 'block', marginTop: '0.35rem' }}>
            Hand QC Inspected
          </strong>
          <span style={{ fontSize: '0.74rem', color: '#78716C' }}>Optical Deburring Verification</span>
        </div>

        <div>
          <span className="font-editorial" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold-primary)', lineHeight: 1, display: 'block' }}>
            350+
          </span>
          <strong style={{ fontSize: '0.84rem', color: '#1C1917', display: 'block', marginTop: '0.35rem' }}>
            Commissions Delivered
          </strong>
          <span style={{ fontSize: '0.74rem', color: '#78716C' }}>Architects, Collectors &amp; Patrons</span>
        </div>
      </div>
    </section>
  );
}
