'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { ProductVideo, Product } from '@/lib/types';
import { formatINR } from '@/lib/money';
import { 
  Video, Plus, Eye, EyeOff, Play, Pause, 
  Volume2, VolumeX, Trash2, Edit3, X, RefreshCw, 
  Smartphone, ShoppingBag, ExternalLink, CheckCircle2
} from 'lucide-react';

export default function ProductVideosPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal & Preview state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<ProductVideo | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formLinkedProductId, setFormLinkedProductId] = useState('');

  const canEdit = ['owner', 'catalog_editor'].includes(staffRole);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch('/api/admin/videos'),
        fetch('/api/products?all=true&limit=100'),
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVideos(vData.videos || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products || []);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          caption: formCaption,
          videoUrl: formVideoUrl,
          thumbnailUrl: formThumbnailUrl || '/products/hero-desktop-showcase.jpg',
          linkedProductIds: formLinkedProductId ? [formLinkedProductId] : [],
        }),
      });

      if (!res.ok) throw new Error('Failed to create video reel');
      setIsAddModalOpen(false);
      setFormTitle('');
      setFormCaption('');
      setFormVideoUrl('');
      setFormThumbnailUrl('');
      setSuccessMessage('Shoppable video reel created successfully!');
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error adding video');
    }
  };

  const handleToggleActive = async (video: ProductVideo) => {
    try {
      await fetch('/api/admin/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: video.id,
          updates: { isActive: !video.isActive },
        }),
      });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video reel?')) return;
    try {
      await fetch(`/api/admin/videos?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STOREFRONT MEDIA & REELS CMS
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Product Videos & Shoppable Reels
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Curate vertical 9:16 workshop videos, timelapse prints, and link them directly to catalog products.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add Video Reel
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            color: '#34D399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Videos Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {videos.map((vid) => {
          const linkedProduct = products.find((p) => vid.linkedProductIds.includes(p.id));
          return (
            <div
              key={vid.id}
              className="card"
              style={{
                padding: '0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: vid.isActive ? '1px solid var(--border-subtle)' : '1px dashed var(--border-subtle)',
                opacity: vid.isActive ? 1 : 0.7,
              }}
            >
              {/* Thumbnail Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  background: 'var(--surface-alt)',
                  backgroundImage: `url(${vid.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.35)' }} />

                <button
                  onClick={() => {
                    setPreviewVideo(vid);
                    setIsPreviewPlaying(true);
                  }}
                  title="Preview on Smartphone Frame"
                  style={{
                    position: 'relative',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(255, 87, 34, 0.9)',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Play size={22} style={{ marginLeft: '2px' }} />
                </button>

                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {vid.aspectRatio} • {vid.durationSeconds || 30}s
                </div>
              </div>

              {/* Video Info */}
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                    {vid.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                    {vid.caption}
                  </p>

                  {/* Linked Product Card Tag */}
                  {linkedProduct ? (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'var(--surface-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShoppingBag size={13} style={{ color: 'var(--brand-accent)' }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{linkedProduct.title}</span>
                      </div>
                      <span style={{ color: 'var(--brand-accent)', fontWeight: 700 }}>
                        {formatINR(linkedProduct.basePricePaise)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No linked product attached
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleToggleActive(vid)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: vid.isActive ? '#10B981' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {vid.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {vid.isActive ? 'Active on Store' : 'Hidden'}
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setPreviewVideo(vid);
                        setIsPreviewPlaying(true);
                      }}
                      className="btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      <Smartphone size={12} /> Test Reel
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(vid.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD VIDEO REEL */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Add Shoppable Video Reel
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVideoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Printing Cyber Gryphon on Bambu X1-Carbon"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Caption & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 0.08mm layer deposition in Titanium Gray PETG..."
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Video Source URL (MP4 / WebM)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://assets.falcon3dprints.com/videos/demo.mp4"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Thumbnail Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="/products/figurine-mecha-gryphon.jpg"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Attach Catalog Product for 1-Click Purchase
                </label>
                <select
                  value={formLinkedProductId}
                  onChange={(e) => setFormLinkedProductId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">-- No linked product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatINR(p.basePricePaise)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Video Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE MOBILE SMARTPHONE PREVIEW */}
      {previewVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          {/* Phone Frame Simulator */}
          <div
            style={{
              width: '320px',
              height: '620px',
              background: '#0B0F19',
              borderRadius: '36px',
              border: '6px solid #27272A',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Camera cutout */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '70px',
                height: '18px',
                background: '#27272A',
                borderRadius: '10px',
                zIndex: 20,
              }}
            />

            {/* Video / Background presentation */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${previewVideo.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)' }} />
            </div>

            {/* Top controls in phone */}
            <div style={{ position: 'relative', zIndex: 10, padding: '28px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                FALCON REELS
              </span>
              <button
                onClick={() => setPreviewVideo(null)}
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Bottom Overlay & Product Card */}
            <div style={{ position: 'relative', zIndex: 10, padding: '16px' }}>
              <div style={{ color: '#FFFFFF', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                  {previewVideo.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.3 }}>
                  {previewVideo.caption}
                </div>
              </div>

              {/* Sound & Play Toggle buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
                <button
                  onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isPreviewPlaying ? <Pause size={12} /> : <Play size={12} />}
                  {isPreviewPlaying ? 'Playing' : 'Paused'}
                </button>

                <button
                  onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isPreviewMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {isPreviewMuted ? 'Muted' : 'Sound On'}
                </button>
              </div>

              {/* Bottom Linked Product Card */}
              {previewVideo.linkedProductIds.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#0B0F19',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#FF5722',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>Parametric Planter</div>
                      <div style={{ fontSize: '0.72rem', color: '#FF5722', fontWeight: 700 }}>₹1,499.00</div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Opens catalog product page with instant Add to Cart')}
                    style={{
                      background: '#FF5722',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
