'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play, VideoOff, X, Check, ShoppingCart } from 'lucide-react';
import type { ProductVideo, Product } from '@/lib/types';
import { useCart, useProducts } from '@/lib/store';
import { INITIAL_PRODUCT_VIDEOS } from '@/lib/mock-data';
import { formatINR } from '@/lib/money';

export default function ReelsSection() {
  const [videos, setVideos] = useState<ProductVideo[]>(() =>
    INITIAL_PRODUCT_VIDEOS.filter((v) => v.isActive).sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 4)
  );
  const [active, setActive] = useState<ProductVideo | null>(null);
  const [failed, setFailed] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const { products } = useProducts();
  const { addToCart } = useCart();

  // Fetch updated videos from API if available
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/videos', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.videos) && data.videos.length > 0) {
          const activeVideos = (data.videos as ProductVideo[])
            .filter((v) => v.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .slice(0, 4);
          if (activeVideos.length > 0) {
            setVideos(activeVideos);
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Handle modal open/close
  useEffect(() => {
    if (!active) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [active]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const variantId = product.variants[0]?.id || '';
    addToCart(product, variantId, 1, true);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  if (!videos.length) return null;

  const linkedProductForActive =
    active &&
    products.find(
      (p) =>
        active.linkedProductIds?.includes(p.id) ||
        active.linkedProductIds?.includes(p.slug)
    );

  return (
    <section className="watch-shop-section" aria-label="Watch & Tap to Shop Reels">
      <div className="container">
        {/* Section Header: Eyebrow + Title + All Videos Link */}
        <div className="watch-shop-header">
          <div>
            <span className="watch-shop-eyebrow">SEEN ON INSTAGRAM &amp; STUDIO</span>
            <h2 className="watch-shop-title">Watch &amp; Tap to Shop</h2>
          </div>

          <Link href="/catalog" className="watch-shop-all-link">
            <span>All Videos</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 9:16 Vertical Reels Cards Grid */}
        <div className="watch-shop-grid">
          {videos.map((video) => {
            const linkedProduct =
              products.find(
                (p) =>
                  video.linkedProductIds?.includes(p.id) ||
                  video.linkedProductIds?.includes(p.slug)
              ) || products[0];

            return (
              <div
                key={video.id}
                className="watch-shop-card"
                onClick={() => {
                  setFailed(false);
                  setActive(video);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setFailed(false);
                    setActive(video);
                  }
                }}
                aria-label={`Watch reel: ${video.title}`}
              >
                {/* Background Image / Video Poster (9:16) */}
                <div className="watch-shop-media-wrap">
                  <Image
                    src={video.thumbnailUrl || '/products/trimbakeshwar-temple-model.jpg'}
                    alt={video.title}
                    fill
                    sizes="(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 24vw"
                    className="watch-shop-img"
                  />

                  {/* Top-Left Watermark Tag */}
                  <span className="watch-shop-watermark">FALCON 3D</span>

                  {/* Top-Right Circular Play Icon */}
                  <div className="watch-shop-play-btn" aria-hidden="true">
                    <Play size={13} fill="currentColor" />
                  </div>

                  {/* Optional Duration Badge */}
                  {video.durationSeconds && (
                    <span className="watch-shop-duration">{video.durationSeconds}s</span>
                  )}

                  {/* Bottom Vignette for Contrast */}
                  <div className="watch-shop-vignette" />
                </div>

                {/* Bottom Product Overlay Card (Tap to Shop) */}
                {linkedProduct && (
                  <div
                    className="watch-shop-product-dock"
                    style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/catalog/${linkedProduct.slug}`}
                      className="watch-shop-product-info"
                      title={linkedProduct.title}
                    >
                      <div className="watch-shop-thumb">
                        <Image
                          src={
                            linkedProduct.images?.[0] ||
                            video.thumbnailUrl ||
                            '/products/trimbakeshwar-temple-model.jpg'
                          }
                          alt={linkedProduct.title}
                          width={36}
                          height={36}
                          className="watch-shop-thumb-img"
                        />
                      </div>
                      <div className="watch-shop-text">
                        <span className="watch-shop-item-name">{linkedProduct.title}</span>
                        <span className="watch-shop-item-price">
                          {formatINR(linkedProduct.basePricePaise)}
                        </span>
                      </div>
                    </Link>

                    {/* Direct Add To Cart Button */}
                    <button
                      type="button"
                      className={`watch-shop-add-btn ${addedId === linkedProduct.id ? 'added' : ''}`}
                      onClick={(e) => handleAddToCart(linkedProduct, e)}
                      aria-label={`Add ${linkedProduct.title} to cart`}
                    >
                      {addedId === linkedProduct.id ? (
                        <>
                          <Check size={13} />
                          <span>Added</span>
                        </>
                      ) : (
                        <span>Add To Cart</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Lightbox Player Dialog */}
      <dialog
        ref={dialog}
        className="home-reel-dialog"
        aria-labelledby="home-video-title"
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            ) {
              dialog.current?.close();
            }
          }
        }}
      >
        {active && (
          <>
            <div className="home-video-header">
              <h3 id="home-video-title">{active.title}</h3>
              <button
                type="button"
                autoFocus
                onClick={() => dialog.current?.close()}
                aria-label="Close studio video"
              >
                <X size={20} />
              </button>
            </div>

            {failed ? (
              <div className="home-video-unavailable" role="status">
                <VideoOff size={32} aria-hidden="true" />
                <h4>Studio Video Stream Loading</h4>
                <p>You can still explore this 3D print in our catalog or request a live clip.</p>
                <Link
                  href="/contact"
                  className="btn-primary"
                  onClick={() => dialog.current?.close()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <span>Contact Workshop</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <video
                key={active.id}
                src={active.videoUrl}
                poster={active.thumbnailUrl}
                controls
                autoPlay
                muted
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
              />
            )}

            <div className="home-video-caption">
              <p>{active.caption}</p>
              {linkedProductForActive && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Link
                    href={`/catalog/${linkedProductForActive.slug}`}
                    className="btn-primary"
                    onClick={() => dialog.current?.close()}
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                  >
                    <span>View Product Details</span>
                    <ArrowRight size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(linkedProductForActive, e)}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                  >
                    <span>Add to Cart ({formatINR(linkedProductForActive.basePricePaise)})</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
