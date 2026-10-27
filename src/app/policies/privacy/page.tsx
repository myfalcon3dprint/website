import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Falcon 3D Prints',
  description: 'Privacy policy, data protection, and customer information handling at Falcon 3D Prints.',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
              Falcon 3D Prints • Customer Data & Digital File Protection • Nashik, Maharashtra
            </p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
          Falcon 3D Prints respects your privacy and is committed to protecting your personal data, shipping information, and proprietary 3D CAD models.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.92rem' }}>
        <section className="card">
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem' }}>
            1. Information We Collect
          </h2>
          <p>
            When you purchase items or request a custom 3D printing quotation, we collect your name, contact phone number, email address, delivery address, and uploaded digital assets (STL, OBJ, 3MF, STEP files).
          </p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem' }}>
            2. Intellectual Property & Digital File Security
          </h2>
          <p>
            Your proprietary 3D models and CAD designs remain your exclusive intellectual property. Uploaded files are used solely to generate slice estimates and manufacture your requested order. We never publish, sell, or share customer CAD designs with third parties.
          </p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem' }}>
            3. Payment Processing
          </h2>
          <p>
            Payments are securely processed through Razorpay. Falcon 3D Prints does not store or process debit/credit card numbers or UPI PINs on our servers. All financial transactions adhere to PCI-DSS compliance standards.
          </p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem' }}>
            4. Shipping & Logistics Partners
          </h2>
          <p>
            Your delivery address and phone number are shared solely with our integrated courier partners (including Delhivery and India Post) for order dispatch and real-time transit tracking updates.
          </p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem' }}>
            5. Contact Our Privacy Officer
          </h2>
          <p>
            For privacy inquiries, data deletion requests, or questions regarding digital asset handling, contact us at <a href="mailto:contact@falcon3dprints.com" style={{ color: 'var(--brand-accent)' }}>contact@falcon3dprints.com</a> or visit our Nashik studio.
          </p>
        </section>
      </div>
    </div>
  );
}
