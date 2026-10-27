'use client';

import { useRecentlyViewed } from '@/lib/store';
import { HomeProductCard } from './FeaturedProductPicks';
import SectionHeading from './SectionHeading';

export default function RecentlyViewedSection() {
  const { recentlyViewedProducts } = useRecentlyViewed();
  const products = recentlyViewedProducts.filter(product => product.isPublished !== false && !product.archivedAt).slice(0, 4);
  if (!products.length) return null;
  return <section className="home-container home-section" aria-label="Recently viewed products"><SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" /><div className="home-product-grid">{products.map(product => <HomeProductCard key={product.id} product={product} />)}</div></section>;
}
