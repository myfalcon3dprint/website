'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What is the difference between FDM and SLA resin 3D printing?',
    answer:
      'FDM (Fused Deposition Modeling) extrudes bio-based filaments such as PLA and carbon PETG layer-by-layer, making it ideal for impact-resistant desk organizers, low-poly planters, and mechanical mounts. SLA (Stereolithography) cures liquid photopolymers with ultra-violet light down to 50 microns (0.05mm), producing smooth surfaces without visible layer lines for sacred architectural replicas and miniature collectibles.',
  },
  {
    id: 'faq-2',
    question: 'How fast do orders dispatch from your Nashik studio?',
    answer:
      'Items marked with the "Ready Stock" badge dispatch within 24 business hours from our CIDCO studio in Nashik. "Made to Order" editions require 2 to 4 business days for precision slicing, overnight printing, manual deburring, and optical quality verification before courier handover.',
  },
  {
    id: 'faq-3',
    question: 'Can I provide my own 3D CAD model for printing?',
    answer:
      'Yes. Our bespoke portal accepts .STL, .OBJ, .3MF, and .STEP files up to 50MB. Our engineers inspect polygon manifolds, calculate infill density, and issue an itemized estimate within 4 business hours.',
  },
  {
    id: 'faq-4',
    question: 'Are your desk planters safe for plants and water?',
    answer:
      'Yes. Falcon geometric planters feature internal drainage channels and matching low-profile catch trays that protect wood and laminate desk surfaces. They are printed with non-toxic PLA biopolymer derived from renewable cornstarches.',
  },
  {
    id: 'faq-5',
    question: 'Can I pick up my order in person at the CIDCO Nashik facility?',
    answer:
      'Yes. Patrons in Nashik can choose "Studio Pickup" during checkout to collect their fabricated prints directly from our CIDCO studio at no shipping charge.',
  },
];

export default function FAQAccordionSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="container" aria-label="Frequently Asked Questions">
      {/* Ornamental Header */}
      <div className="ornamental-header">
        <div className="ornamental-line">
          <span>&diams; CLARITY &amp; SPECIFICATIONS &diams;</span>
        </div>
        <h2
          className="font-editorial"
          style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            color: '#1C1917',
            letterSpacing: '-0.025em',
            margin: '0.25rem 0 0.5rem',
            fontWeight: 700,
          }}
        >
          Frequently Asked Questions
        </h2>
        <p style={{ color: '#57534E', fontSize: '0.96rem', lineHeight: 1.6, margin: 0 }}>
          Everything you need to know regarding materials, dispatch speeds, and custom file uploads.
        </p>
      </div>

      {/* Accordion Stack */}
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className={`faq-item-box ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                onClick={() => toggle(faq.id)}
                className="faq-question-btn"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={18}
                  style={{
                    color: isOpen ? 'var(--gold-primary)' : 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease',
                    flexShrink: 0,
                  }}
                />
              </button>

              {isOpen && (
                <div className="faq-answer-pane">
                  <p style={{ margin: 0 }}>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MurtiHub-Style Payment & Trust Assurance Strip */}
      <div
        style={{
          maxWidth: '820px',
          margin: '3rem auto 0',
          padding: '1.25rem 1.75rem',
          borderRadius: 'var(--radius-sm)',
          background: '#FAF8F4',
          border: '1px solid #ECE7DE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--gold-primary)' }} />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1C1917' }}>
            100% Encrypted &amp; Secure Checkout
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: '#78716C', fontWeight: 600 }}>
            Accepted Payment Methods:
          </span>
          <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.72rem', fontWeight: 700, color: '#44403C' }}>
            <span style={{ padding: '0.2rem 0.5rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E7E5E4' }}>UPI / QR</span>
            <span style={{ padding: '0.2rem 0.5rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E7E5E4' }}>RuPay</span>
            <span style={{ padding: '0.2rem 0.5rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E7E5E4' }}>Visa</span>
            <span style={{ padding: '0.2rem 0.5rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E7E5E4' }}>Mastercard</span>
            <span style={{ padding: '0.2rem 0.5rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E7E5E4' }}>Net Banking</span>
            <span style={{ padding: '0.2rem 0.5rem', background: '#FFFBEB', borderRadius: '4px', border: '1px solid #FDE68A', color: '#B45309' }}>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
}
