import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Box, Layers3, PenTool } from 'lucide-react';

export default function CompactCustomizationBanner() {
  return (
    <section className="home-container home-section home-custom-section" aria-labelledby="home-custom-title">
      <div className="home-custom">
        <div className="home-custom-visual">
          <Image src="/products/trimbakeshwar-temple-model.jpg" alt="Intricate Trimbakeshwar Temple scale model, an example of the studio’s 3D printing work" fill sizes="(max-width: 800px) 100vw, 45vw" />
          <span className="home-custom-caption"><Layers3 size={16} aria-hidden="true" /> From 3D file to finished piece.</span>
        </div>
        <div className="home-custom-copy">
          <span className="home-eyebrow">Nashik Studio Craftsmanship</span>
          <h2 id="home-custom-title">PRECISION PRINTED.<br /><span>MADE TO STAND OUT.</span></h2>
          <p>From 18-joint articulated collectibles to heritage architectural replicas and self-draining origami planters. Every piece in our collection is precision 3D printed and hand-finished in our Nashik studio.</p>
          <ol className="home-process">
            <li><Layers3 size={19} aria-hidden="true" /><div><strong>01 / Precision Additive Craft</strong><span>High-grade matte PLA and 50-micron SLA photopolymer resin.</span></div></li>
            <li><Box size={19} aria-hidden="true" /><div><strong>02 / Hand-Inspected &amp; Finished</strong><span>Inspected for layer consistency, surface smoothness, and joint movement.</span></div></li>
            <li><PenTool size={19} aria-hidden="true" /><div><strong>03 / Express Pan-India Courier</strong><span>Shock-cushioned packaging dispatched direct from our Nashik hub.</span></div></li>
          </ol>
          <div className="home-custom-actions"><Link href="/catalog" className="home-button home-button-primary">Explore All Products <ArrowUpRight size={18} /></Link><Link href="/contact" className="home-text-link">Visit Nashik Studio <ArrowUpRight size={16} /></Link></div>
        </div>
      </div>
    </section>
  );
}
