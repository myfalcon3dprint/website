import React from 'react';
import LuxuryCinematicHero from '@/components/home/LuxuryCinematicHero';
import SandstoneCategorySection from '@/components/home/SandstoneCategorySection';
import StudioCraftsmanshipSection from '@/components/home/StudioCraftsmanshipSection';
import PopularBestsellersSection from '@/components/home/PopularBestsellersSection';
import FeaturedArchitecturalBanner from '@/components/home/FeaturedArchitecturalBanner';
import MadeLayerByLayerSection from '@/components/home/MadeLayerByLayerSection';
import PrecisionLayerBanner from '@/components/home/PrecisionLayerBanner';
import LuxuryFAQSection from '@/components/home/LuxuryFAQSection';
import './homepage.css';

export default function HomePage() {
  return (
    <div className="studio-home luxury-storefront">
      {/* 1. Cinematic Temple Hero with Trimbakeshwar Scale Model */}
      <LuxuryCinematicHero />

      {/* 2. Shop by Category — Texture 02 Sandstone Relief with Jaali Lattice */}
      <SandstoneCategorySection />

      {/* 3. Studio Craftsmanship Story — Texture 01 Obsidian Architecture with Nataraja Arch */}
      <StudioCraftsmanshipSection />

      {/* 4. Bestsellers — Real 5 Products on Stone Plinths with Instant Cart Integration */}
      <PopularBestsellersSection />

      {/* 5. Featured Collection Banner — Architectural Masterpieces */}
      <FeaturedArchitecturalBanner />

      {/* 6. Made Layer by Layer — 4-Step Media & Craftsmanship Process */}
      <MadeLayerByLayerSection />

      {/* 7. Brand Trust & Reassurance Banner — Precision in Every Layer */}
      <PrecisionLayerBanner />

      {/* 8. Luxury FAQ Accordion + Architectural Arch Quote Frame */}
      <LuxuryFAQSection />
    </div>
  );
}
