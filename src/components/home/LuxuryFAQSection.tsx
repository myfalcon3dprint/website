'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, ArrowRight, MessageSquare } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What materials do you use for 3D printing?',
    answer:
      'We use eco-friendly bio-based PLA for botanical decor, high-impact PETG for articulated mechanical figures, and 50-micron ultra-high resolution photopolymer SLA resin for intricate heritage architectural replicas.',
  },
  {
    question: 'Do you offer custom designs and commissions?',
    answer:
      'Yes. You can upload 3D CAD files (STL, OBJ, 3MF, STEP) or share your concept through our Custom Quote portal. Our studio team provides printability evaluations and estimates within 24 hours.',
  },
  {
    question: 'How long does shipping take across India?',
    answer:
      'Ready-stock pieces dispatch within 24 hours from our Nashik workshop. Made-to-order prints take 2 to 3 days for fabrication and manual deburring. Tracked courier transit typically takes 2 to 5 business days. Free shipping applies above ₹999.',
  },
  {
    question: 'What is your transit breakage guarantee?',
    answer:
      'Every delicate piece is secured in custom shock-proof foam enclosures and reinforced keepsake boxes. If any item arrives damaged during transit, share photos with our team within 48 hours for an immediate complimentary replacement.',
  },
  {
    question: 'Do you ship internationally?',
    answer:
      'We currently ship pan-India across 25,000+ pincodes. For international architectural scale models or bulk corporate orders, please contact our studio team directly.',
  },
];

export default function LuxuryFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="luxury-faq-section" aria-label="Frequently Asked Questions">
      <div className="container">
        <div className="luxury-faq-grid">
          {/* Left Column: Heading & Accordion List */}
          <div className="luxury-faq-main">
            <div className="luxury-faq-header">
              <span className="luxury-faq-eyebrow">HAVE QUESTIONS?</span>
              <h2
                className="luxury-faq-heading"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: '#FAF7F2',
                }}
              >
                We&apos;re Here to Help
              </h2>
              <p
                className="luxury-faq-sub"
                style={{
                  color: 'rgba(250, 247, 242, 0.82)',
                }}
              >
                Find answers to common questions about our products, shipping, materials, and custom commissions.
              </p>

              <div className="luxury-faq-actions">
                <Link href="/contact" className="luxury-faq-btn">
                  <MessageSquare size={15} />
                  <span>Talk to Studio Team</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Accordion List */}
            <div className="luxury-accordion">
              {FAQS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`luxury-accordion-item ${isOpen ? 'open' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(idx)}
                      className="luxury-accordion-trigger"
                      aria-expanded={isOpen}
                    >
                      <span className="faq-q-text">{faq.question}</span>
                      <span className="faq-icon-box" aria-hidden="true">
                        {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="luxury-accordion-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Architectural Arch Quote Card */}
          <div className="luxury-faq-quote-col">
            <div className="luxury-arch-quote-card">
              <div className="arch-quote-glow" aria-hidden="true" />
              <div className="arch-quote-inner">
                <div className="arch-quote-bird-box">
                  <Image
                    src="/brand-bird.png"
                    alt="Falcon emblem"
                    width={52}
                    height={52}
                    className="arch-bird-icon"
                  />
                </div>

                <blockquote className="arch-quote-text">
                  &ldquo;Not just products,
                  <br />
                  but pieces of art.&rdquo;
                </blockquote>

                <cite className="arch-quote-author">
                  — Falcon 3D Prints
                </cite>

                <div className="arch-quote-bottom-tag">
                  <span>✦ NASHIK, MAHARASHTRA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
