'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, ShieldCheck, Star, MapPin } from 'lucide-react';

export default function PrecisionLayerBanner() {
  return (
    <section className="precision-banner-section" aria-label="Studio Commitments & Guarantees">
      <div className="container">
        <div className="precision-banner-inner">
          {/* Left Text & CTA */}
          <div className="precision-banner-copy">
            <h2 className="precision-banner-title">Precision in Every Layer.</h2>
            <p className="precision-banner-desc">
              From heritage landmarks to modern collectibles, experience the art of 3D printing.
            </p>
            <Link href="/catalog" className="luxury-btn-solid">
              <span>Explore Collections</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {/* Right 4 Trust Pillars */}
          <div className="precision-trust-row">
            <div className="precision-trust-item">
              <Award size={22} className="precision-icon" aria-hidden="true" />
              <span>Premium Quality</span>
            </div>
            <div className="precision-trust-item">
              <ShieldCheck size={22} className="precision-icon" aria-hidden="true" />
              <span>Safe &amp; Secure Shopping</span>
            </div>
            <div className="precision-trust-item">
              <Star size={22} fill="currentColor" className="precision-icon" aria-hidden="true" />
              <span>4.9/5 Customer Love</span>
            </div>
            <div className="precision-trust-item">
              <MapPin size={22} className="precision-icon" aria-hidden="true" />
              <span>Made in India</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
