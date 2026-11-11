import React from 'react';
import LuxuryCinematicHero from '@/components/home/LuxuryCinematicHero';
import ReelsSection from '@/components/ReelsSection';
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
      {/* 1. Cinematic Hero Banner */}
      <LuxuryCinematicHero />

      {/* 2. Studio Reels Section — Watch 3D Prints in Motion */}
      <ReelsSection />

      {/* 3. Shop by Category — Texture 02 Sandstone Relief with Jaali Lattice */}
      <SandstoneCategorySection />

      {/* 4. Popular Right Now — Bestselling Products with Instant Cart Integration */}
      <PopularBestsellersSection />

      {/* 5. Studio Craftsmanship Story — Texture 01 Obsidian Architecture with Nataraja Arch */}
      <StudioCraftsmanshipSection />

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
