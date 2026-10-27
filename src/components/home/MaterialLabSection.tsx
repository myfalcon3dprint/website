'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Flame, Gauge, Sparkles } from 'lucide-react';

interface MaterialSpecimen {
  id: string;
  name: string;
  tech: string;
  category: string;
  tagline: string;
  layerResolution: string;
  heatDeflection: string;
  tensileStrength: string;
  finishType: string;
  description: string;
  palette: { name: string; hex: string }[];
  recommendedUses: string[];
  sampleSlug: string;
  sampleName: string;
  swatchGradient: string;
}

const SPECIMENS: MaterialSpecimen[] = [
  {
    id: 'mat-pla',
    name: 'Matte Obsidian Bio-PLA',
    tech: 'Precision FDM',
    category: 'Planters & Decor',
    tagline: 'Velvety non-reflective biopolymer derived from renewable cornstarches',
    layerResolution: '0.16mm (160 microns)',
    heatDeflection: '55°C (Desk Ambient)',
    tensileStrength: '52 MPa (Rigid Structural)',
    finishType: 'Matte micro-textured, zero glare',
    description:
      'Engineered specifically to eliminate plastic shine. The micro-textured surface diffuses ambient light across geometric facets, producing clean shadow transitions on desk accessories and low-poly planters.',
    palette: [
      { name: 'Obsidian Black', hex: '#1C1A17' },
      { name: 'Falcon Orange', hex: '#E8590C' },
      { name: 'Terracotta', hex: '#C25E3E' },
    ],
    recommendedUses: [
      'Self-draining architectural planters',
      'Minimalist geometric organizers',
      'Acoustic desk stands',
    ],
    sampleSlug: 'falcon-heavy-geometric-planter',
    sampleName: 'Origami Planter Series',
    swatchGradient: 'linear-gradient(135deg, #1C1A17 0%, #383430 50%, #1C1A17 100%)',
  },
  {
    id: 'mat-resin',
    name: '50-Micron SLA Photopolymer',
    tech: 'Stereolithography (UV 405nm)',
    category: 'Architectural Models',
    tagline: 'Microscopic layer resolution capturing delicate heritage geometries',
    layerResolution: '0.05mm (50 microns)',
    heatDeflection: '60°C (UV Stabilized)',
    tensileStrength: '65 MPa (High Detail)',
    finishType: 'Monolithic smooth, zero layer lines',
    description:
      'Liquid photopolymer cured layer-by-layer with ultra-violet light. This method captures 50-micron features, including temple shikhara engravings and microscopic ball-socket hinges that traditional filament cannot reproduce.',
    palette: [
      { name: 'Stone Grey', hex: '#6B7280' },
      { name: 'Ceramic Ivory', hex: '#F3EFE6' },
      { name: 'Translucent Amber', hex: '#D97706' },
    ],
    recommendedUses: [
      'Heritage scale replicas (e.g. Trimbakeshwar)',
      'Intricate articulated collectibles',
      'Master investment casting patterns',
    ],
    sampleSlug: 'trimbakeshwar-temple-architectural-replica',
    sampleName: 'Temple Architecture Replica',
    swatchGradient: 'linear-gradient(135deg, #4B5563 0%, #9CA3AF 50%, #374151 100%)',
  },
  {
    id: 'mat-petg',
    name: 'Carbon-Fiber Reinforced PETG',
    tech: 'Industrial Hardened FDM',
    category: 'Desk Accessories',
    tagline: 'Chopped carbon strands providing high thermal and structural rigidity',
    layerResolution: '0.20mm (200 microns)',
    heatDeflection: '85°C (High-Temperature)',
    tensileStrength: '78 MPa (High Modulus)',
    finishType: 'Textured graphite matte',
    description:
      'Micro-carbon fibers distributed through a glycol-modified polyester matrix. This composite resists mechanical flexion under continuous load and withstands ambient temperatures inside parked vehicles or industrial enclosures.',
    palette: [
      { name: 'Carbon Graphite', hex: '#111827' },
      { name: 'Industrial Slate', hex: '#334155' },
    ],
    recommendedUses: [
      'Heavy-duty headphone hangers',
      'Robotics brackets and mounts',
      'Electronic sensor housings',
    ],
    sampleSlug: 'modular-hex-desk-organizer',
    sampleName: 'HexaGrid Desk Caddy',
    swatchGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #020617 100%)',
  },
  {
    id: 'mat-silk',
    name: 'Artisan Silk Dual-Color Blend',
    tech: 'Dual-Extrusion FDM',
    category: 'Miniatures & Collectibles',
    tagline: 'Dichromatic filaments with directional light-shifting metallic luster',
    layerResolution: '0.12mm (120 microns)',
    heatDeflection: '52°C (Display Accent)',
    tensileStrength: '48 MPa (Decorative)',
    finishType: 'High-gloss metallic sheen',
    description:
      'Two complementary pigment streams extrude simultaneously through a single calibrated nozzle. As daylight shifts across the sculpted curves, the surface reveals alternating copper and bronze reflections.',
    palette: [
      { name: 'Copper-Bronze Shift', hex: '#B45309' },
      { name: 'Imperial Gold', hex: '#D97706' },
    ],
    recommendedUses: [
      'Print-in-place dragon and gryphon figures',
      'Centerpiece display sculptures',
      'Commemorative plaques and awards',
    ],
    sampleSlug: 'mecha-gryphon-articulated-figurine',
    sampleName: 'Cyber Gryphon Figure',
    swatchGradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #78350F 100%)',
  },
];

export default function MaterialLabSection() {
  const [selectedId, setSelectedId] = useState<string>('mat-pla');
  const activeSpecimen = SPECIMENS.find((s) => s.id === selectedId) || SPECIMENS[0];

  return (
    <section className="container" aria-label="Studio Material and Engineering Laboratory">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Sparkles size={15} style={{ color: 'var(--brand-accent)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ADDITIVE MATERIALS LABORATORY
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="font-editorial" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.45rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Engineered Polymers &amp; Resins
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '640px', lineHeight: 1.55 }}>
              Every Falcon creation matches a precise polymer formulation to its structural purpose. Explore how our Nashik studio calibrates materials for architectural models, articulated mechanisms, and daily desk wear.
            </p>
          </div>

          <Link
            href="/quote"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--brand-accent)',
              fontSize: '0.88rem',
              fontWeight: 700,
            }}
          >
            <span>Custom Material Inquiry</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* MATERIAL SELECTOR PILLS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '0.85rem',
          marginBottom: '2rem',
        }}
      >
        {SPECIMENS.map((specimen) => {
          const isActive = specimen.id === selectedId;
          return (
            <button
              key={specimen.id}
              type="button"
              onClick={() => setSelectedId(specimen.id)}
              className={`specimen-pill ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
            >
              <span
                className="specimen-dot"
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: specimen.swatchGradient,
                  display: 'inline-block',
                  flexShrink: 0,
                  transition: 'transform 200ms ease',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isActive ? '#FFFFFF' : 'var(--text-primary)' }}>
                  {specimen.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: isActive ? '#D1CDC4' : 'var(--text-muted)' }}>
                  {specimen.tech}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE SPECIMEN DETAILS SHOWCASE */}
      <div
        key={activeSpecimen.id}
        className="falcon-card specimen-showcase-enter"
        style={{
          padding: 'clamp(1.75rem, 3.5vw, 2.75rem)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Specimen Description & Applications */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge-precision" style={{ background: '#171513' }}>
              {activeSpecimen.tech}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
              Primary Domain: {activeSpecimen.category}
            </span>
          </div>

          <h3 style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
            {activeSpecimen.name}
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {activeSpecimen.description}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Recommended Additive Applications:
            </strong>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {activeSpecimen.recommendedUses.map((use, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--status-ready)', flexShrink: 0 }} />
                  <span>{use}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href={`/catalog/${activeSpecimen.sampleSlug}`}
              className="btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.85rem' }}
            >
              <span>Examine {activeSpecimen.sampleName}</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/catalog"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Browse {activeSpecimen.category}</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Technical Specimen Gauges & Swatches */}
        <div
          style={{
            background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Material Telemetry
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--status-ready)', fontWeight: 600 }}>
              Tested in Nashik Studio
            </span>
          </div>

          {/* Metric 1 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--brand-accent)' }}>
              <Gauge size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Layer Micro-Resolution
              </span>
              <p style={{ margin: '0.15rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeSpecimen.layerResolution}
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--brand-accent)' }}>
              <Flame size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Thermal Deflection Threshold
              </span>
              <p style={{ margin: '0.15rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeSpecimen.heatDeflection}
              </p>
            </div>
          </div>

          {/* Metric 3 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', color: 'var(--brand-accent)' }}>
              <Shield size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Tensile Rigidity &amp; Modulus
              </span>
              <p style={{ margin: '0.15rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeSpecimen.tensileStrength}
              </p>
            </div>
          </div>

          {/* Color Pigment Swatches */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Standard Studio Filament Shades:
            </span>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {activeSpecimen.palette.map((color, cIdx) => (
                <div
                  key={cIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'var(--surface)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: color.hex,
                      border: '1px solid rgba(0,0,0,0.1)',
                      display: 'inline-block',
                    }}
                  />
                  <span>{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
