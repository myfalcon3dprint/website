'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, MapPin, CheckCircle2, Phone, Mail, ArrowRight, Cpu, Wrench } from 'lucide-react';

interface FleetMachine {
  name: string;
  type: string;
  buildVolume: string;
  minLayerHeight: string;
  primaryUse: string;
  status: string;
}

const FLEET: FleetMachine[] = [
  {
    name: 'Bambu Lab X1-Carbon',
    type: 'CoreXY Enclosed FDM',
    buildVolume: '256 × 256 × 256 mm',
    minLayerHeight: '0.08 mm (80 µm)',
    primaryUse: 'High-speed technical prototyping, multi-color silk accents, and carbon PETG brackets',
    status: 'Operational • Calibrated',
  },
  {
    name: 'Prusa MK4 Nextruder',
    type: 'Precision Bed-Slinger FDM',
    buildVolume: '250 × 210 × 220 mm',
    minLayerHeight: '0.10 mm (100 µm)',
    primaryUse: 'Architectural scale facades, low-poly planters, and loadcell-verified first layers',
    status: 'Operational • Active',
  },
  {
    name: 'Monochrome 4K SLA Station',
    type: 'UV Photopolymer Resin',
    buildVolume: '197 × 122 × 200 mm',
    minLayerHeight: '0.025 mm (25 µm)',
    primaryUse: 'Heritage temple replicas, fine jewelry masters, and articulated tabletop figurines',
    status: 'Operational • Ready',
  },
];

export default function StudioFleetSection() {
  return (
    <section className="container" aria-label="Falcon Studio Fleet and Nashik Facility">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Column: Workshop Story & Facility Specs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
            <Cpu size={15} style={{ color: 'var(--brand-accent)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              NASHIK WORKSHOP FACILITY
            </span>
          </div>

          <h2 className="font-editorial" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.45rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.85rem' }}>
            Additive Engineering Rooted in Maharashtra.
          </h2>

          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            Falcon 3D Prints bridges CAD blueprints with solid reality. From our CIDCO workshop in Nashik, we operate a calibrated fleet of multi-material 3D printers serving architectural firms, mechanical design teams, artists, and retail patrons.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--status-ready)', flexShrink: 0 }} />
              <span>Multi-point automatic bed leveling and loadcell force calibration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--status-ready)', flexShrink: 0 }} />
              <span>Multi-material palette: PLA biopolymers, durable PETG, and 4K photopolymers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--status-ready)', flexShrink: 0 }} />
              <span>Studio pickups in CIDCO Nashik and insured door-to-door courier shipping</span>
            </div>
          </div>

          {/* Contact Card */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <MapPin size={16} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
              <span>CIDCO, Nashik, Maharashtra 422009</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <Phone size={16} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
              <span>+91 98506 07144 (Direct studio consultations)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <Mail size={16} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
              <span>contact@falcon3dprints.in</span>
            </div>

            <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem' }}>
              <Link href="/contact" className="btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}>
                <span>Studio Directions</span>
              </Link>
              <Link href="/quote" className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}>
                <span>Request Custom Print</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Fleet Telemetry Cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Extrusion Fleet Specifications
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--status-ready)', fontWeight: 600 }}>
              All Stations Online
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FLEET.map((machine, idx) => (
              <div
                key={idx}
                className="falcon-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pulse-beacon" aria-hidden="true" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {machine.name}
                    </h3>
                  </div>
                  <span className="badge-precision" style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                    {machine.type}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {machine.primaryUse}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>
                    <strong>Envelope:</strong> {machine.buildVolume}
                  </div>
                  <div>
                    <strong>Resolution:</strong> {machine.minLayerHeight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
