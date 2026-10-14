import React from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Returns & Replacement Policy | Falcon 3D Prints Nashik',
  description: 'Verified return, replacement and transit damage claims guidelines for custom 3D printed items and ready stock.',
};

export default function ReturnsPolicyPage() {
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
            <RotateCcw size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Returns & Replacement Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
              Applicable to all orders from Falcon 3D Prints • Updated October 2026
            </p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
          Because 3D printing involves made-to-order fabrication with bespoke materials, dimensions, and colors, specific guidelines apply to returns, cancellations, and damage replacements.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Made to order vs ready stock */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Custom Prints vs. Ready Stock Items
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                1. Custom & Made-to-Order Prints
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                Items manufactured upon your order with specified filament colors, scale, or custom STL files cannot be returned for preference changes once printing has begun. However, if there is a verified print defect or dimensional failure exceeding agreed tolerances (±0.2mm for FDM, ±0.05mm for SLA), we will reprint and replace the piece free of charge.
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--status-ready)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                2. Ready Stock Catalog Items
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                Standard off-the-shelf items (unaltered desk accessories, standard planters) can be returned within <strong>5 days of receipt</strong> provided they are unused, in original packaging, and undamaged. Customer covers return shipping to our Nashik facility.
              </p>
            </div>
          </div>
        </div>

        {/* Transit damage replacements */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
            <ShieldAlert size={18} style={{ color: 'var(--brand-accent)' }} /> Transit Damage & Defect Replacements
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.88rem' }}>
            If your package arrives crushed or printed parts inside are damaged during courier transit:
          </p>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>
              Please record a continuous <strong>unboxing video</strong> showing the outer parcel label, condition of the package, and the damaged printed model.
            </li>
            <li>
              Email the video or photos to <strong>contact@falcon3dprints.com</strong> or WhatsApp our Nashik workshop at <strong>+91 98506 07144</strong> within <strong>48 hours of delivery</strong>.
            </li>
            <li>
              Upon verification, our Nashik print farm will prioritize a <strong>free rush reprint</strong> and dispatch it via express courier.
            </li>
          </ol>
        </div>

        {/* Food safety & thermal disclaimer */}
        <div className="card" style={{ borderLeft: '3px solid var(--brand-accent)' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Material Characteristics & Usage Notice
          </h2>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Food Safety:</strong> Standard FDM 3D prints (PLA/PETG) have microscopic layer grooves that can harbor bacteria. Unless explicitly post-treated with certified food-grade epoxy resin, decorative prints must NOT be used for direct contact with food or beverages.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Heat Resistance:</strong> Standard PLA begins softening at 55°C–60°C. Do not leave PLA prints inside hot vehicles in direct sun, or expose them to boiling liquids. For higher thermal resistance, choose our PETG or ABS options.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
