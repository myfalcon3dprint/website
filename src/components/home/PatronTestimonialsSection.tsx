'use client';

import React from 'react';
import { Star, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';

interface PatronReview {
  id: string;
  name: string;
  title: string;
  location: string;
  productCommissioned: string;
  quote: string;
  rating: number;
}

const REVIEWS: PatronReview[] = [
  {
    id: 'rev-01',
    name: 'Ar. Rajesh Kulkarni',
    title: 'Principal Architect, Heritage Studio',
    location: 'Nashik, Maharashtra',
    productCommissioned: 'Trimbakeshwar Temple Architectural Replica (SLA 50µm)',
    quote:
      'The Trimbakeshwar Temple replica captured all shikhara pillars and stone relief details at 1:250 scale. The 50-micron photopolymer resin provided the sharp edge definition required for our client presentation.',
    rating: 5,
  },
  {
    id: 'rev-02',
    name: 'Rohan Deshmukh',
    title: 'Automotive Design Engineer',
    location: 'Pune, Maharashtra',
    productCommissioned: 'Functional Sensor Brackets (Carbon PETG)',
    quote:
      'We fabricated functional sensor mounting brackets for field testing. Dimensional tolerance remained strictly within ±0.1mm, and the parts withstood continuous vibration and summer under-hood temperatures without deflection.',
    rating: 5,
  },
  {
    id: 'rev-03',
    name: 'Sneha Mukherjee',
    title: 'Fantasy Miniature Collector',
    location: 'Mumbai, Maharashtra',
    productCommissioned: 'Cyber Gryphon Articulated Figure',
    quote:
      'The Cyber Gryphon articulated figure moved smoothly straight from the courier box with zero manual assembly. The matte obsidian finish looks striking against natural desk lighting.',
    rating: 5,
  },
];

export default function PatronTestimonialsSection() {
  return (
    <section className="container" aria-label="Patron and Client Testimonials">
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
          <MessageSquare size={15} style={{ color: 'var(--brand-accent)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            VERIFIED STUDIO PATRONS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="font-editorial" style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.45rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Craftsmanship Trusted by Creators
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginTop: '0.35rem', maxWidth: '640px', lineHeight: 1.55 }}>
              From bespoke architectural scale models to articulated mechanical prototypes, read how our Nashik workshop delivers precision across Maharashtra and pan-India.
            </p>
          </div>

          {/* Aggregate Rating Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                4.9 / 5.0
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Across 350+ Commissions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Testimonials */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.75rem' }}>
        {REVIEWS.map((review) => (
          <div key={review.id} className="quote-card">
            <div>
              {/* Star Rating & Verified Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--status-ready)', fontWeight: 600 }}>
                  <ShieldCheck size={13} />
                  <span>Verified Patron</span>
                </div>
              </div>

              {/* Commissioned Work Title */}
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-accent)', fontWeight: 700 }}>
                  Commissioned Piece:
                </span>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {review.productCommissioned}
                </p>
              </div>

              {/* Quote Body */}
              <p className="font-editorial" style={{ fontSize: '1.02rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                &ldquo;{review.quote}&rdquo;
              </p>
            </div>

            {/* Author Footer */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                {review.name}
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {review.title} &bull; {review.location}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
