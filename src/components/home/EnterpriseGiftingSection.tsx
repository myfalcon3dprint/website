'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, ArrowRight, MessageSquareCode, Sparkles } from 'lucide-react';

export default function EnterpriseGiftingSection() {
  return (
    <section className="container" aria-label="Architectural and Corporate Bulk Fabrication">
      <div
        style={{
          background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
          borderRadius: 'var(--radius-md)',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          color: '#FAF8F4',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 20px 45px -12px rgba(28, 25, 23, 0.45)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Gold Ambient Radial Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <Sparkles size={14} style={{ color: 'var(--gold-accent)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-accent)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ARCHITECTURAL &amp; CORPORATE COMMISSIONS
              </span>
            </div>

            <h2
              className="font-editorial"
              style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.65rem)',
                color: '#FFFFFF',
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                marginBottom: '1rem',
                fontWeight: 700,
              }}
            >
              Scale Models, Bespoke Gifting &amp; Bulk Fabrications.
            </h2>

            <p style={{ color: '#D6D3D1', fontSize: '0.96rem', lineHeight: 1.65, marginBottom: '1.75rem', maxWidth: '580px' }}>
              We partner with architecture studios, automotive teams, and corporate organizations across India. From multi-story scale models with 50-micron columns to customized engraved desk gifts, we manage volume fabrication with strict dimensional consistency.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/quote"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gold-gradient)',
                  color: '#1C1917',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(197, 155, 39, 0.35)',
                }}
              >
                <span>Request Enterprise Quotation</span>
                <ArrowRight size={16} />
              </Link>

              <a
                href="https://wa.me/919850607144?text=Hi%20Falcon%203D%20Prints%2C%20I%20am%20inquiring%20about%20a%20corporate%20bulk%20order%20or%20architectural%20model."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.35rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <MessageSquareCode size={16} style={{ color: 'var(--gold-accent)' }} />
                <span>WhatsApp Enterprise Desk</span>
              </a>
            </div>
          </div>

          {/* Right Highlights Box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--gold-accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', color: '#E7E5E4' }}>
                <strong>Tiered Volume Discounts:</strong> Scalable pricing for orders from 20 to 1,000+ units.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--gold-accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', color: '#E7E5E4' }}>
                <strong>Custom Pantone Matching:</strong> Silk metallics, matte charcoal, and custom colors.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--gold-accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', color: '#E7E5E4' }}>
                <strong>Multi-Destination Logistics:</strong> Individual direct shipping to clients pan-India.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--gold-accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', color: '#E7E5E4' }}>
                <strong>GST Compliant Invoicing:</strong> Official business billing with full ITC benefit.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
