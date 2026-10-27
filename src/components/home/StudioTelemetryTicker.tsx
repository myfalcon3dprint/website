'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck, Clock, MapPin, Sparkles, Layers } from 'lucide-react';

export default function StudioTelemetryTicker() {
  return (
    <div className="studio-telemetry-bar" aria-label="Falcon Studio Live Telemetry">
      <div className="container" style={{ padding: 0 }}>
        <div className="studio-telemetry-inner">
          <div className="telemetry-item">
            <span className="pulse-beacon" aria-hidden="true" />
            <span>
              <strong style={{ color: '#FFFFFF' }}>Studio Fleet Online:</strong> 12 Multi-Material Extruders Active
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)' }} aria-hidden="true" />

          <div className="telemetry-item">
            <Layers size={14} style={{ color: 'var(--brand-accent)' }} />
            <span>
              <strong style={{ color: '#FFFFFF' }}>Micro-Layer Fidelity:</strong> 50µm SLA Resin &amp; 0.12mm FDM
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)' }} aria-hidden="true" />

          <div className="telemetry-item">
            <Clock size={14} style={{ color: 'var(--brand-accent)' }} />
            <span>
              <strong style={{ color: '#FFFFFF' }}>Rapid Quotation:</strong> Slicing Analysis in Under 4 Hours
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)' }} aria-hidden="true" />

          <div className="telemetry-item">
            <MapPin size={14} style={{ color: 'var(--brand-accent)' }} />
            <span>
              <strong style={{ color: '#FFFFFF' }}>Origin Atelier:</strong> CIDCO, Nashik • Pan-India Courier
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)' }} aria-hidden="true" />

          <Link
            href="/quote"
            className="telemetry-item"
            style={{
              color: 'var(--brand-accent)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={13} />
            <span>Submit 3D File for Instant Analysis &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
