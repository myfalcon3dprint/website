'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Compass, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Layers, 
  Cpu, 
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="about-page" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(232, 89, 12, 0.08)',
              border: '1px solid rgba(232, 89, 12, 0.25)',
              color: 'var(--brand-accent)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={13} />
            <span>Nashik Additive Manufacturing Studio</span>
          </div>

          <h1
            className="font-editorial"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Where ideas take shapes.
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              margin: '0 auto',
            }}
          >
            Falcon 3D Prints is a contemporary 3D design and additive engineering studio based in Nashik, Maharashtra. We merge timeless Indian architectural heritage with cutting-edge 3D printing technology.
          </p>
        </div>

        {/* Narrative Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem',
          }}
        >
          <div
            className="card"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--surface)',
            }}
          >
            <div>
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '10px',
                  background: 'rgba(232, 89, 12, 0.1)',
                  color: 'var(--brand-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Compass size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Our Studio Story
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.95rem' }}>
                Born in Nashik, a city renowned for ancient temple architecture and engineering spirit, Falcon 3D Prints was founded to give physical life to digital imagination. What started with precision tabletop scale models has blossomed into an atelier designing sacred temple replicas, organic planters, ergonomic desk accessories, and bespoke functional prototypes for collectors and creators worldwide.
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--surface)',
            }}
          >
            <div>
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '10px',
                  background: 'rgba(232, 89, 12, 0.1)',
                  color: 'var(--brand-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Layers size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Precision Layer by Layer
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.95rem' }}>
                Every single print is calibrated with industrial micron accuracy. Using state-of-the-art SLA photopolymer resin printing capable of 50-micron resolution alongside multi-material FDM engineering, each creation is meticulously sliced, printed, deburred, cured, and finished by hand in our CIDCO atelier.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Excellence */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--brand-accent)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              CRAFTSMANSHIP PRINCIPLES
            </span>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              Why Collectors Choose Falcon
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              {
                icon: <Cpu size={20} />,
                title: '50-Micron Detail',
                desc: 'Intricate temple shikhara, jaali lattices, and sculpted details with razor-sharp definition.',
              },
              {
                icon: <ShieldCheck size={20} />,
                title: 'Eco-Friendly PLA & PETG',
                desc: 'Premium bio-sourced and recyclable filaments formulated for structural durability and finish.',
              },
              {
                icon: <HeartHandshake size={20} />,
                title: 'Hand-Finished in Nashik',
                desc: 'Every piece is hand-inspected, cleaned, and quality checked before leaving our studio benches.',
              },
              {
                icon: <CheckCircle2 size={20} />,
                title: 'Zero-Breakage Packaging',
                desc: 'Custom-fitted shock-proof foam boxes guarantee safe delivery across India.',
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '1.65rem 1.4rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    color: 'var(--brand-accent)',
                    marginBottom: '0.85rem',
                    display: 'inline-flex',
                  }}
                >
                  {pillar.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Studio Visit & Call To Action Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #181513 0%, #100E0D 100%)',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#FAF7F2',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#D4AF37',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            <MapPin size={15} />
            <span>CIDCO, Nashik, Maharashtra 422009</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)',
              color: '#FFFFFF',
              marginBottom: '0.85rem',
              letterSpacing: '-0.02em',
            }}
          >
            Bring Your Vision to Life
          </h2>

          <p
            style={{
              maxWidth: '580px',
              margin: '0 auto 2rem',
              fontSize: '0.96rem',
              color: 'rgba(250, 247, 242, 0.76)',
              lineHeight: 1.6,
            }}
          >
            Whether you want an architectural replica of a sacred heritage site or a custom prototype from your CAD file, our team is ready to fabricate.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/catalog"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.92rem',
              }}
            >
              <span>Explore Shop</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/quote"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.92rem',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FAF7F2',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <span>Custom 3D Quote</span>
            </Link>

            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.92rem',
                color: '#D4AF37',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>Contact Atelier &rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

