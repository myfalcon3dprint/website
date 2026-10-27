'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Play, X } from 'lucide-react';

interface ProcessStep {
  step: string;
  title: string;
  subtitle: string;
  image: string;
}

const STEPS: ProcessStep[] = [
  {
    step: '01',
    title: 'Design & Modeling',
    subtitle: 'From concept to 3D model',
    image: '/products/cyber-gryphon-figure.jpg',
  },
  {
    step: '02',
    title: '3D Printing Process',
    subtitle: 'Layer by layer perfection',
    image: '/products/hexagrid-desk-organizer.jpg',
  },
  {
    step: '03',
    title: 'Post Processing',
    subtitle: 'Detailing for perfection',
    image: '/artisan-crafting-hands.jpg',
  },
  {
    step: '04',
    title: 'Final Product',
    subtitle: 'Ready for your space',
    image: '/products/vintage-jeep-model.jpg',
  },
];

export default function MadeLayerByLayerSection() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section className="layer-process-section" aria-label="Crafted with Precision Process">
      <div className="container">
        {/* Section Header */}
        <div className="layer-header-row">
          <div>
            <span className="layer-eyebrow">MADE LAYER BY LAYER</span>
            <h2 className="layer-heading">Crafted with Precision</h2>
            <p className="layer-desc">
              Watch the process, meet the makers, and see how ideas become detailed, durable 3D prints.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="layer-btn-video"
            aria-label="Watch Studio Process Video"
          >
            <Play size={13} fill="currentColor" aria-hidden="true" />
            <span>Watch Studio Video</span>
          </button>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="layer-cards-grid">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="layer-step-card"
              role="button"
              tabIndex={0}
              onClick={() => setShowVideoModal(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowVideoModal(true); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="layer-img-wrap">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="layer-img"
                />
                <div className="layer-step-badge">
                  <Play size={12} fill="currentColor" />
                </div>
              </div>

              <div className="layer-step-body">
                <h3 className="layer-step-title">{step.title}</h3>
                <p className="layer-step-sub">{step.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Studio Process Video Modal */}
      {showVideoModal && (
        <div
          className="luxury-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Studio 3D Print Process Video"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="luxury-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="luxury-modal-header">
              <h3>Made Layer by Layer — Nashik Studio Craft</h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="luxury-modal-close"
                aria-label="Close video player"
              >
                <X size={20} />
              </button>
            </div>
            <div className="luxury-modal-video-wrap">
              <Image
                src="/artisan-crafting-hands.jpg"
                alt="3D printing post processing and deburring in Nashik workshop"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className="luxury-video-caption-bar">
                <span>✦ Step-by-step additive fabrication · 50-micron SLA &amp; Precision FDM</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
