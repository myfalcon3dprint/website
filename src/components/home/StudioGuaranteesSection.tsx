'use client';

import React from 'react';
import { ShieldCheck, Target, Leaf, Sparkles } from 'lucide-react';

interface GuaranteeItem {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
}

const GUARANTEES: GuaranteeItem[] = [
  {
    icon: <ShieldCheck size={22} style={{ color: 'var(--brand-accent)' }} />,
    title: 'Zero Warpage Guarantee',
    tagline: 'PEI magnetic build surfaces',
    description:
      'We cure and cool all prints on calibrated spring-steel sheets to eliminate base corner curling and preserve flat mating planes.',
  },
  {
    icon: <Target size={22} style={{ color: 'var(--brand-accent)' }} />,
    title: 'Micron Tolerance Adherence',
    tagline: 'Precision within ±0.1mm',
    description:
      'Every mechanical bracket, ball-socket joint, and architectural facade is verified against CAD dimensions prior to dispatch.',
  },
  {
    icon: <Leaf size={22} style={{ color: 'var(--brand-accent)' }} />,
    title: 'Clean Biopolymer Integrity',
    tagline: 'Eco-conscious PLA materials',
    description:
      'Our retail decor uses renewable starch-derived PLA plastics, ensuring non-toxic and odor-free objects safe for home workdesks.',
  },
  {
    icon: <Sparkles size={22} style={{ color: 'var(--brand-accent)' }} />,
    title: 'Direct Atelier Pricing',
    tagline: 'CIDCO Nashik fabrication',
    description:
      'Fabricated directly inside our Maharashtra studio with zero middleman markups or outsourced print broker fees.',
  },
];

export default function StudioGuaranteesSection() {
  return (
    <section className="container" aria-label="Falcon Studio Commitments">
      <div
        style={{
          background: 'var(--surface-alt)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'clamp(2rem, 3.5vw, 3rem)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            STUDIO QUALITY STANDARDS
          </span>
          <h2 className="font-editorial" style={{ fontSize: 'clamp(1.8rem, 2.8vw, 2.25rem)', color: 'var(--text-primary)', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            Four Commitments to Additive Excellence
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem', lineHeight: 1.55 }}>
            Every print dispatched from our Nashik facility undergoes manual surface deburring and optical inspection.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
          {GUARANTEES.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--brand-accent-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                {item.icon}
              </div>

              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.2rem' }}>
                {item.title}
              </h3>

              <span style={{ fontSize: '0.74rem', color: 'var(--brand-accent)', fontWeight: 600, marginBottom: '0.55rem' }}>
                {item.tagline}
              </span>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
