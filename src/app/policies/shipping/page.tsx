import React from 'react';
import Link from 'next/link';
import { Truck, MapPin, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Shipping & Delivery Policy | Falcon 3D Prints Nashik',
  description: 'Verified shipping timelines, rates and packaging standards for Falcon 3D Prints orders in Nashik and across India.',
};

export default function ShippingPolicyPage() {
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
            <Truck size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Shipping & Delivery Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
              Last updated: October 2026 • Studio Location: Nashik, Maharashtra
            </p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
          Every manufactured item from Falcon 3D Prints is inspected for dimensional integrity, wrapped in protective bubble lining, and dispatched from our local print farm in Nashik, Maharashtra.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Shipping Rates */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
            <MapPin size={18} style={{ color: 'var(--brand-accent)' }} /> Delivery Tiers & Shipping Rates
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                Local Nashik
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>₹49 Flat</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                PIN Codes starting with <strong>422xxx</strong>. Delivered within 24–48 hours of print completion.
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Rest of India
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>₹99 Flat</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                All domestic states via reputed surface/express couriers (DTDC, Delhivery, Blue Dart).
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'var(--status-ready-bg)', border: '1px solid var(--status-ready-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-ready)', fontWeight: 700, textTransform: 'uppercase' }}>
                Orders ₹999 & Above
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: 'var(--status-ready)' }}>
                FREE
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Free standard shipping automatically applied at checkout anywhere in India.
              </div>
            </div>
          </div>
        </div>

        {/* Lead Times */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
            <Clock size={18} style={{ color: 'var(--brand-accent)' }} /> Manufacturing & Dispatch Lead Times
          </h2>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Ready Stock Items:</strong> Dispatched from our inventory within <strong>24 business hours</strong> of payment capture.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Made-to-Order FDM Prints (PLA / PETG):</strong> Require <strong>2 to 4 business days</strong> for slicing, farm allocation, manufacturing, and support removal.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>SLA High-Detail Resin Miniatures:</strong> Require <strong>3 to 5 business days</strong> for precision layer exposure, ultrasonic alcohol wash, UV post-cure, and support trimming.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Custom Quotations & Architectural Prototypes:</strong> Lead times are confirmed individually on your approved quotation sheet.
            </li>
          </ul>
        </div>

        {/* Packaging Standards */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--brand-accent)' }} /> Shock-Absorbent Packaging Standards
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.88rem' }}>
            Additive manufacturing models can feature fine cantilevers and delicate geometry. Every parcel dispatched from Falcon 3D Prints follows strict packing protocols:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>Layered multi-wrap high-density air bubble sheet around each distinct model.</li>
            <li>Rigid corrugated cardboard outer boxes with edge-crush resistance.</li>
            <li>Fragile / Handle With Care cautionary labels on every parcel.</li>
            <li>Weather-sealed outer polywrap to prevent moisture ingress during monsoon transit.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
