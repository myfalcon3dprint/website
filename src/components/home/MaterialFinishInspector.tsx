'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Layers, Award, Check, Eye } from 'lucide-react';

interface FinishOption {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  colorHex: string;
  gradient: string;
  previewImage: string;
  layerMicrons: number;
  cureTimeHours: number;
  description: string;
}

const LUXURY_FINISHES: FinishOption[] = [
  {
    id: 'antique-bronze',
    name: 'Antique Bronze & Gold Patina',
    badge: 'Artisan Collector Edition',
    tagline: 'Hand-rubbed metallic leaf with dual-tone shading',
    colorHex: '#D4AF37',
    gradient: 'linear-gradient(135deg, #2A241F 0%, #D4AF37 50%, #1A1714 100%)',
    previewImage: '/products/cyber-gryphon-figure.jpg',
    layerMicrons: 50,
    cureTimeHours: 14,
    description:
      'Individually inspected and dry-brushed with gold-bronze wax. Gives deep shadows and high-contrast contour highlights on resin crests.',
  },
  {
    id: 'obsidian-matte',
    name: 'Stealth Obsidian Resin',
    badge: 'Architectural Grade',
    tagline: 'Zero-specular light absorbing velvety black',
    colorHex: '#1F1E1D',
    gradient: 'linear-gradient(135deg, #100F0E 0%, #2A2825 50%, #0D0C0B 100%)',
    previewImage: '/products/planter-obsidian-black.jpg',
    layerMicrons: 50,
    cureTimeHours: 12,
    description:
      'Matte micro-textured polymer providing an ultra-crisp silhouette. Resistant to fingerprints and engineered for executive workspaces.',
  },
  {
    id: 'marble-terracotta',
    name: 'Sculptural Marble White',
    badge: 'Heritage Gallery Finish',
    tagline: 'High-density mineral composite touch',
    colorHex: '#EDE6DA',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #EDE6DA 60%, #C4B9A8 100%)',
    previewImage: '/products/trimbakeshwar-temple-model.jpg',
    layerMicrons: 25,
    cureTimeHours: 18,
    description:
      'Ultra-fine 25-micron SLA printing reproducing intricate temple friezes and pillar carvings with authentic stone feel.',
  },
];

export default function MaterialFinishInspector() {
  const [selectedFinish, setSelectedFinish] = useState<FinishOption>(LUXURY_FINISHES[0]);

  return (
    <section
      className="container"
      style={{
        margin: 'clamp(2.5rem, 5vw, 4.5rem) auto',
      }}
      aria-label="Atelier Material & Finish Inspector"
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #1A1715 0%, #12100E 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(212, 175, 55, 0.28)',
          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          padding: 'clamp(1.5rem, 3.5vw, 3rem)',
          color: '#F7F3EB',
        }}
      >
        {/* Top Header */}
        <div style={{ maxWidth: '640px', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
            <span className="gallery-gold-badge">
              <Sparkles size={11} />
              ATELIER MATERIAL LAB
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              • STUDIO SPECS
            </span>
          </div>

          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)',
              color: '#FFFFFF',
              fontWeight: 500,
              lineHeight: 1.25,
              margin: '0.2rem 0 0.5rem',
            }}
          >
            The Art of Precision Resin & Patina
          </h2>

          <p style={{ color: '#D4CDC3', fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>
            Every Falcon piece is cured with UV lasers, calibrated to sub-millimeter tolerances, and finished by hand for heirloom durability.
          </p>
        </div>

        {/* Interactive Split View */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Left: Interactive Finish Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {LUXURY_FINISHES.map((finish) => {
              const isSelected = selectedFinish.id === finish.id;

              return (
                <button
                  key={finish.id}
                  type="button"
                  onClick={() => setSelectedFinish(finish)}
                  style={{
                    textAlign: 'left',
                    padding: '1rem 1.15rem',
                    background: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid var(--gallery-gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    position: 'relative',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: finish.colorHex,
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          display: 'inline-block',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.96rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--gallery-gold)' : '#FFFFFF',
                          fontFamily: 'var(--font-serif)',
                        }}
                      >
                        {finish.name}
                      </span>
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'var(--gallery-gold)',
                          color: '#161412',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#B5AEA4', margin: 0, paddingLeft: '1.5rem', lineHeight: 1.4 }}>
                    {finish.tagline}
                  </p>
                </button>
              );
            })}

            {/* Studio Guarantee Seal */}
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem 1rem',
                border: '1px dashed rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(0, 0, 0, 0.25)',
              }}
            >
              <ShieldCheck size={24} style={{ color: 'var(--gallery-gold)', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', display: 'block' }}>
                  Certificate of Curation & Authenticity
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9E978C' }}>
                  Includes hand-stamped edition card, batch number, and protective felt display base.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Spec Stage & Visualizer */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: '#0B0A09',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '360px',
            }}
          >
            {/* Image Preview Stage */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '220px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                marginBottom: '1rem',
              }}
            >
              <Image
                src={selectedFinish.previewImage}
                alt={selectedFinish.name}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                style={{ objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(11, 10, 9, 0.85) 100%)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: '0.75rem',
                  left: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <span className="gallery-gold-badge" style={{ fontSize: '0.65rem' }}>
                  {selectedFinish.badge}
                </span>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.75)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.72rem',
                    color: 'var(--gallery-gold)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Layers size={12} />
                  <span>{selectedFinish.layerMicrons}µ Layer Precision</span>
                </div>
              </div>
            </div>

            {/* Description & Technical Readout */}
            <div>
              <p style={{ fontSize: '0.84rem', color: '#D4CDC3', lineHeight: 1.5, margin: '0 0 1rem' }}>
                {selectedFinish.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#8A847B', textTransform: 'uppercase', display: 'block' }}>
                      Cure Cycle
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {selectedFinish.cureTimeHours} Hours Chamber
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#8A847B', textTransform: 'uppercase', display: 'block' }}>
                      Surface Density
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                      1.18 g/cm³ Solid
                    </span>
                  </div>
                </div>

                <Link
                  href="/catalog"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--gallery-gold)',
                  }}
                >
                  <Eye size={13} />
                  <span>View Catalog</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
