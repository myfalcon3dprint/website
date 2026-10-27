'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Truck, Star, ArrowUpRight } from 'lucide-react';

interface TrustItem {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  description: string;
  tag: string;
  href?: string;
  accentClass: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: <Sparkles size={21} aria-hidden="true" />,
    kicker: 'Studio Craft',
    title: 'Hand-Detailed Finishing',
    description: 'Every print hand-deburred and inspected by studio artisans',
    tag: '50μm & FDM Precision',
    href: '/catalog',
    accentClass: 'trust-accent-amber',
  },
  {
    icon: <ShieldCheck size={21} aria-hidden="true" />,
    kicker: 'Safe Delivery',
    title: 'Safe Transit Packaging',
    description: 'Shock-proof foam enclosures and drop-tested keepsake boxes',
    tag: 'Zero Breakage Guarantee',
    href: '/policies/shipping',
    accentClass: 'trust-accent-teal',
  },
  {
    icon: <Truck size={21} aria-hidden="true" />,
    kicker: 'Fast Logistics',
    title: 'Pan-India Express Shipping',
    description: 'Tracked courier to 25,000+ pincodes across India',
    tag: 'Free Above ₹999',
    href: '/policies/shipping',
    accentClass: 'trust-accent-orange',
  },
  {
    icon: <Star size={21} fill="currentColor" aria-hidden="true" />,
    kicker: 'Verified Rating',
    title: '4.9/5 Customer Love',
    description: 'Trusted by 1,200+ decor lovers, collectors & architects',
    tag: 'Studio Excellence',
    href: '/contact',
    accentClass: 'trust-accent-gold',
  },
];

export default function StorefrontTrustStrip() {
  return (
    <section className="home-trust-strip-wrap" aria-label="Why Shop With Falcon 3D Studio">
      <div className="home-container">
        <div className="home-trust-grid">
          {TRUST_ITEMS.map((item, idx) => {
            const Content = (
              <>
                <div className={`home-trust-icon-box ${item.accentClass}`}>
                  {item.icon}
                </div>
                <div className="home-trust-content">
                  <div className="home-trust-kicker-row">
                    <span className="home-trust-kicker">{item.kicker}</span>
                    <span className="home-trust-tag">{item.tag}</span>
                  </div>
                  <h3 className="home-trust-title">
                    {item.title}
                    {item.href && (
                      <ArrowUpRight size={13} className="home-trust-link-arrow" aria-hidden="true" />
                    )}
                  </h3>
                  <p className="home-trust-desc">{item.description}</p>
                </div>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="home-trust-card home-trust-card-interactive"
                  aria-label={`${item.title} — ${item.description}`}
                >
                  {Content}
                </Link>
              );
            }

            return (
              <div key={idx} className="home-trust-card">
                {Content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
