'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Box, Plus, Star } from 'lucide-react';
import { useCart, useProducts } from '@/lib/store';
import { formatINR } from '@/lib/money';
import type { Product } from '@/lib/types';
import SectionHeading from './SectionHeading';

export function HomeProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const variant = product.variants[0];
  const available = product.variants.some(item => item.leadTimeDays > 0 || item.stockQuantity > 0);
  const price = product.variants.length ? Math.min(...product.variants.map(item => item.pricePaise)) : product.basePricePaise;
  const canQuickAdd = product.variants.length === 1 && available;
  return (
    <article className="home-product-card">
      <Link href={`/catalog/${product.slug}`} className="home-product-image" aria-label={`View ${product.title}`}>
        {product.images[0] ? <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 640px) 46vw, (max-width: 1000px) 44vw, 23vw" /> : <Box size={48} aria-hidden="true" />}
        <span className={`home-stock-tag ${available && product.stockType === 'ready_stock' ? 'is-ready' : ''}`}><span />{!available ? 'Currently unavailable' : product.stockType === 'ready_stock' ? 'Ready to ship' : 'Made to order'}</span>
        <span className="home-product-peek"><ArrowUpRight size={19} aria-hidden="true" /></span>
      </Link>
      <div className="home-product-info">
        <span className="home-product-category">{product.category}</span>
        <h3><Link href={`/catalog/${product.slug}`}>{product.title}</Link></h3>
        <p>{product.subtitle}</p>
        {product.reviewCount > 0 && <span className="home-product-rating"><Star size={12} fill="currentColor" aria-hidden="true" /> {product.rating.toFixed(1)} <span>({product.reviewCount} reviews)</span></span>}
        <div className="home-product-bottom">
          <div><span>{product.variants.length > 1 ? 'From' : 'Price'}</span><strong>{formatINR(price)}</strong></div>
          {canQuickAdd ? <button type="button" className="home-product-action" onClick={() => addToCart(product, variant.id, 1)} aria-label={`Add ${product.title} to bag`}><span>Add to bag</span><Plus size={17} aria-hidden="true" /></button> :
            <Link className="home-product-action" href={`/catalog/${product.slug}`} aria-label={`${available ? 'Choose options for' : 'View'} ${product.title}`}><span>{available ? 'Choose options' : 'View details'}</span><ArrowUpRight size={17} aria-hidden="true" /></Link>}
        </div>
      </div>
    </article>
  );
}

const filters = [{ id: 'all', label: 'All picks' }, { id: 'ready_stock', label: 'Ready to ship' }, { id: 'made_to_order', label: 'Made to order' }] as const;

export default function FeaturedProductPicks() {
  const { products } = useProducts();
  const [filter, setFilter] = useState<string>('all');
  const published = products.filter(product => product.isPublished !== false && !product.archivedAt);
  const sorted = [...published].sort((a, b) => Number(b.featured) - Number(a.featured));
  const visible = sorted.filter(product => filter === 'all' || product.stockType === filter).slice(0, 4);
  return (
    <section className="home-products-section" id="studio-picks" aria-label="Featured products">
      <div className="home-container home-section">
        <SectionHeading eyebrow="The Falcon selection" title="Fresh off the printer" description="Distinctive designs. Everyday upgrades. Find your next favourite." href="/catalog" linkText="Shop the collection" />
        <div className="home-product-toolbar"><div className="home-filters" role="group" aria-label="Filter featured products">{filters.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><span className="home-result-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'object' : 'objects'} to discover</span></div>
        <div className="home-product-grid" data-count={visible.length}>{visible.map(product => <HomeProductCard key={product.id} product={product} />)}
          {visible.length > 0 && visible.length < 3 && <aside className="home-picks-note"><div><span className="home-eyebrow">Have your own idea?</span><h3>YOUR NEXT<br />BIG THING.<br /><span>3D PRINTED.</span></h3><p>One-off gifts, custom parts, and original designs. Let us turn your idea into your next print.</p><Link href="/quote" className="home-button home-button-dark">Start a custom print <ArrowUpRight size={18} /></Link></div><Image src="/products/planter-orange-variant.jpg" alt="Orange geometric planter showing a custom colour option" fill sizes="(max-width: 800px) 100vw, 45vw" /></aside>}
        </div>
        {visible.length === 0 && <div className="home-empty-state"><Box size={28} aria-hidden="true" /><h3>More prints are on the way.</h3><p>Explore another collection or ask us about a custom piece.</p><Link href="/quote" className="home-text-link">Start a custom print <ArrowUpRight size={16} /></Link></div>}
      </div>
    </section>
  );
}
