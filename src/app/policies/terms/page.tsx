import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Falcon 3D Prints',
  description: 'Terms of service, intellectual property guidelines, and manufacturing agreements for Falcon 3D Prints.',
};

export default function TermsPolicyPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--surface-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Terms of Service
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
              Falcon 3D Prints • Operational & IP Terms • Nashik, Maharashtra
            </p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
          By placing an order or submitting a 3D digital model for quotation with Falcon 3D Prints, you agree to the terms, intellectual property protections, and manufacturing specifications outlined below.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            1. Custom CAD / STL Intellectual Property
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.88rem' }}>
            When you upload custom 3D model files (STL, OBJ, 3MF, STEP) through our quotation portal:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>You retain 100% ownership:</strong> Falcon 3D Prints acts solely as a contract additive manufacturing bureau. We do not distribute, sell, or claim ownership of your proprietary designs.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Non-Disclosure & Confidentiality:</strong> Your digital geometry is stored securely and used exclusively for slicing, generating machine toolpaths (G-code), and printing your ordered units.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Customer Warranties:</strong> You affirm that you possess the necessary intellectual property rights, licenses, or authorizations to fabricate the uploaded digital file.
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            2. Prohibited Manufacturing Content
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.88rem' }}>
            Falcon 3D Prints strictly prohibits the printing of:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>Firearms, weapon components, receiver blanks, silencer baffles, or lethal projectile devices.</li>
            <li>Items that violate Indian statutory laws, public safety codes, or civil defense regulations.</li>
            <li>Unlicensed trademark counterfeits.</li>
          </ul>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            3. Tolerances & Additive Nature
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.88rem' }}>
            Additive manufacturing builds objects layer by layer. Visual micro-layer lines are natural characteristics of FDM (Fused Deposition Modeling) technology and do not represent manufacturing defects. Standard engineering tolerances are ±0.2 mm for FDM and ±0.05 mm for SLA resin. If your assembly requires tighter interference fits, please specify this in your custom quotation notes.
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            4. Governing Law & Jurisdiction
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.88rem' }}>
            All disputes and contracts arising out of or related to transactions with Falcon 3D Prints shall be governed by the laws of India and subject to the exclusive jurisdiction of the competent courts in <strong>Nashik, Maharashtra</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
