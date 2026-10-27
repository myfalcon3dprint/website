'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/image';
import { Cpu, Layers, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface ProcessPhase {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  technicalSpecs: string[];
}

const PHASES: ProcessPhase[] = [
  {
    step: '01',
    title: 'Parametric Mesh & Slicing Analysis',
    subtitle: 'Digital Polygon Inspection',
    description:
      'We evaluate wall thicknesses down to 0.8mm, verify manifold closed meshes, and calculate stress-bearing gyroid infill to eliminate internal shear stress.',
    technicalSpecs: ['Polygon Mesh Audit', 'Gyroid Stress Infill', 'Wall Thickness ≥0.8mm'],
  },
  {
    step: '02',
    title: 'Calibrated Multi-Axis Thermal Extrusion',
    subtitle: 'Sub-Millimeter Studio Deposition',
    description:
      'Operating Bambu Lab and Prusa multi-material systems. Active vibration compensation and heated PEI spring-steel beds guarantee zero corner curl or layer shifting.',
    technicalSpecs: ['50µm to 0.16mm Layering', 'Multi-Material AMS Farm', 'PEI Spring-Steel Bed'],
  },
  {
    step: '03',
    title: 'Manual Deburring & Optical Inspection',
    subtitle: 'Nashik Workshop Finishing',
    description:
      'Every printed piece is removed from the build plate, hand-deburred with micro-abrasives, optically inspected under studio lighting, and packed in shockproof materials.',
    technicalSpecs: ['Manual Seam Smoothing', '100% Dimensional QC', 'Insured Shockproof Box'],
  },
];

export default function FromDesignToObjectSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const currentPhase = PHASES[activeStep] || PHASES[0];

  return (
    <section
      ref={sectionRef}
      aria-label="From Design to Object Process"
      style={{
        background: '#141311',
        color: '#F4F1EA',
        padding: 'clamp(3.5rem, 6vw, 5.5rem) 0',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Controlled Amber Ambient Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(232, 89, 12, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        {/* Section Header */}
        <div style={{ maxWidth: '640px', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
            <span className="pulse-beacon-orange" aria-hidden="true" />
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              THE MAKING PROCESS
            </span>
          </div>

          <h2
            className="font-editorial"
            style={{
              fontSize: 'clamp(2.15rem, 3.8vw, 2.95rem)',
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginBottom: '1rem',
              fontWeight: 700,
            }}
          >
            From Design to Physical Object.
          </h2>

          <p style={{ color: '#C5C0B6', fontSize: '0.96rem', lineHeight: 1.65, margin: 0 }}>
            Three grounded stages of additive manufacturing executed inside our CIDCO studio in Nashik, Maharashtra.
          </p>
        </div>

        {/* 3 Step Interactive Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Interactive 3-Step Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {PHASES.map((phase, idx) => {
              const isActive = idx === activeStep;
              return (
                <button
                  key={phase.step}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '1px solid var(--brand-accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.35rem 1.65rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    boxShadow: isActive ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none',
                  }}
                  aria-pressed={isActive}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: isActive ? 'var(--brand-accent)' : 'rgba(255, 255, 255, 0.35)',
                      }}
                    >
                      {phase.step}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: isActive ? '#FDE68A' : '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      {phase.subtitle}
                    </span>
                  </div>

                  <strong style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'block', marginBottom: '0.35rem' }}>
                    {phase.title}
                  </strong>

                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#C5C0B6', lineHeight: 1.55 }}>
                    {phase.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Visual Stage with Real Workshop Image */}
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '4/3',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#1B1916',
              boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Image
              src="/logo-making.jpg"
              alt="Falcon 3D Studio Additive Manufacturing in Progress"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 55%, rgba(20, 18, 16, 0.88) 100%)',
              }}
            />

            {/* Dynamic Phase Spec Badge Overlay */}
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                {currentPhase.technicalSpecs.map((spec, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      padding: '0.2rem 0.55rem',
                      background: 'rgba(23, 21, 19, 0.85)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#FDE68A',
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>

              <strong style={{ fontSize: '1.02rem', color: '#FFFFFF', display: 'block', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                Stage {currentPhase.step}: {currentPhase.title}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
