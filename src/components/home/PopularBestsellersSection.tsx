'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, useProducts, openCartDrawer } from '@/lib/store';
import { formatINR } from '@/lib/money';
import { Star, Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import type { Product } from '@/lib/types';

interface BestsellerDisplayItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  pricePaise: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
}

export default function PopularBestsellersSection() {
  const { products } = useProducts();
  const { addToCart } = useCart();

  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Sync wishlist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('falcon_wishlist');
      if (stored) setWishlist(JSON.parse(stored));
    } catch {}
  }, []);

  const displayItems = React.useMemo(() => {
    const published = products.filter((p) => p.isPublished && !p.archivedAt);
    return published.slice(0, 10).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.title,
      category: p.category || 'Studio Collection',
      pricePaise: p.variants?.[0]?.pricePaise ?? p.basePricePaise,
      rating: p.rating || 5.0,
      reviewsCount: p.reviewCount || 0,
      imageUrl: p.images?.[0] || '/products/planter-obsidian-black.jpg',
    }));
  }, [products]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('falcon_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddToCart = (item: BestsellerDisplayItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const realProduct = products.find((p) => p.slug === item.slug || p.id === item.id);
    if (!realProduct) return;

    setAddingId(item.id);
    const variantId = realProduct.variants?.[0]?.id || 'default';

    setTimeout(() => {
      addToCart(realProduct, variantId, 1);
      setAddingId(null);
      setAddedId(item.id);
      openCartDrawer();
      setTimeout(() => setAddedId(null), 1600);
    }, 150);
  };

  return (
    <section className="bestsellers-section" aria-label="Popular Bestselling Creations">
      {/* Background Jaali Texture */}
      <div className="bestsellers-jaali-texture" aria-hidden="true" />

      <div className="container relative-z">
        {/* Section Header */}
        <div className="bestsellers-header-row">
          <div>
            <div className="ornamental-eyebrow-row">
              <span className="ornamental-diamond">♦</span>
              <span className="bestsellers-eyebrow">POPULAR RIGHT NOW</span>
              <span className="ornamental-diamond">♦</span>
            </div>
            <h2 className="bestsellers-heading">Bestsellers</h2>
          </div>

          <Link href="/catalog?sort=bestselling" className="bestsellers-view-all">
            <span>View all</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* 5-Column Responsive Product Grid or Empty State */}
        {displayItems.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '1rem',
              margin: '1rem 0',
            }}
          >
            <p
              style={{
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '0.95rem',
                maxWidth: '460px',
                margin: '0 auto 1.25rem',
                lineHeight: 1.6,
              }}
            >
              Fresh studio prints are currently being queued and prepared. Explore our full catalog or submit a custom CAD manufacturing inquiry.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/catalog" className="btn-secondary" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>
                Browse Catalog
              </Link>
              <Link href="/quote" className="btn-primary" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>
                Instant 3D Quote
              </Link>
            </div>
          </div>
        ) : (
          <div className="bestsellers-grid">
          {displayItems.map((item) => {
            const isWished = !!wishlist[item.id];
            const isAdding = addingId === item.id;
            const isAdded = addedId === item.id;

            return (
              <div key={item.id} className="bestseller-card">
                {/* Visual Plinth & Image */}
                <div className="bestseller-img-stage">
                  <Link href={`/catalog/${item.slug}`} className="bestseller-img-link">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw"
                      className="bestseller-img"
                    />
                  </Link>

                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(item.id, e)}
                    className={`bestseller-wish-btn ${isWished ? 'wished' : ''}`}
                    aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={isWished ? 'Saved to wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Card Details Body */}
                <div className="bestseller-body">
                  <Link href={`/catalog/${item.slug}`}>
                    <h3 className="bestseller-title">{item.name}</h3>
                  </Link>

                  {/* Price & Star Rating Row */}
                  <div className="bestseller-meta-row">
                    <div className="bestseller-price-col">
                      <span className="bestseller-price">{formatINR(item.pricePaise)}</span>
                      <div className="bestseller-rating">
                        <Star size={12} fill="#F45112" color="#F45112" />
                        <span className="rating-val">{item.rating}</span>
                        <span className="rating-count">({item.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Quick Add to Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(item, e)}
                      disabled={isAdding}
                      className={`bestseller-cart-btn ${isAdded ? 'added' : ''}`}
                      aria-label={`Add ${item.name} to cart`}
                      title="Add to cart"
                    >
                      {isAdded ? (
                        <Check size={16} />
                      ) : (
                        <ShoppingBag size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
