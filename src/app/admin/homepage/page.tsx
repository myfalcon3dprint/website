'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthUser } from '@/lib/supabase/auth';
import { HeroSlide, HomepageSection, AnnouncementItem } from '@/lib/types';
import { 
  Home, Plus, Eye, EyeOff, Save, Upload, 
  Trash2, Edit3, ArrowUp, ArrowDown, CheckCircle2, 
  RotateCcw, Sparkles, Layers, Sliders, AlertCircle, RefreshCw, X,
  Megaphone, Monitor, Smartphone, ExternalLink, Image as ImageIcon,
  Check, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';

const FOCAL_OPTIONS = [
  { value: 'center center', label: 'Center (Balanced)' },
  { value: 'top center', label: 'Top Center' },
  { value: 'bottom center', label: 'Bottom Center' },
  { value: 'center left', label: 'Left Aligned' },
  { value: 'center right', label: 'Right Aligned' },
];

const PRESET_HERO_IMAGES = [
  { label: 'Obsidian Planter', desktop: '/products/planter-obsidian-black.jpg', mobile: '/products/planter-orange-variant.jpg' },
  { label: 'Cyber Gryphon', desktop: '/products/cyber-gryphon-figure.jpg', mobile: '/products/figurine-mecha-gryphon.jpg' },
  { label: 'Trimbakeshwar Temple', desktop: '/products/trimbakeshwar-temple-model.jpg', mobile: '/products/trimbakeshwar-temple-model.jpg' },
  { label: 'HexaGrid Desk Caddy', desktop: '/products/hexagrid-desk-organizer.jpg', mobile: '/products/aerostand-black.jpg' },
];

export default function HomepageManagementPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';
  const canEdit = ['owner', 'catalog_editor'].includes(staffRole);

  const [activeTab, setActiveTab] = useState<'announcements' | 'slides' | 'categories' | 'sections'>('slides');
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; image_url?: string; icon?: string; sort_order: number; is_active: boolean }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preview device mode in hero slides tab
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Announcement Modal State
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annFormData, setAnnFormData] = useState({
    text: '',
    linkUrl: '/catalog',
    linkLabel: 'Shop Catalog',
    displayOrder: 1,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  // Slide Modal State
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideFormData, setSlideFormData] = useState<Partial<HeroSlide>>({
    title: '',
    headline: '',
    subheadline: '',
    category: 'Planters & Decor',
    desktopImageUrl: '/products/planter-obsidian-black.jpg',
    mobileImageUrl: '/products/planter-orange-variant.jpg',
    desktopFocalPoint: 'center center',
    mobileFocalPoint: 'center center',
    textAlignment: 'left',
    overlayOpacity: 0.44,
    transitionPreset: 'crossfade',
    transitionDurationMs: 500,
    primaryButtonText: 'Shop Collection',
    primaryButtonLink: '/catalog',
    secondaryButtonText: 'View All',
    secondaryButtonLink: '/catalog',
    accentTag: 'In Stock • Nashik Studio',
    badge: 'From ₹499',
    displayOrder: 1,
    isActive: true,
  });

  // Fetch Homepage Data
  const fetchHomepageData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch slides & sections
      const homeRes = await fetch('/api/admin/homepage');
      if (homeRes.ok) {
        const homeData = await homeRes.json();
        setSlides(homeData.slides || []);
        setSections(homeData.sections || []);
      }

      // 2. Fetch announcements
      const annRes = await fetch('/api/announcements?all=true');
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData.announcements || []);
      }

      // 3. Fetch categories
      const catRes = await fetch('/api/categories?all=true');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve storefront data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomepageData();
  }, [fetchHomepageData]);

  // Flash message helper
  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // --- ANNOUNCEMENT HANDLERS ---
  const openNewAnnouncementModal = () => {
    setEditingAnnId(null);
    setAnnFormData({
      text: '',
      linkUrl: '/catalog',
      linkLabel: 'Shop Catalog',
      displayOrder: (announcements.length + 1) * 10,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setIsAnnModalOpen(true);
  };

  const openEditAnnouncementModal = (ann: AnnouncementItem) => {
    setEditingAnnId(ann.id);
    setAnnFormData({
      text: ann.text,
      linkUrl: ann.linkUrl || '',
      linkLabel: ann.linkLabel || '',
      displayOrder: ann.displayOrder,
      isActive: ann.isActive,
      startDate: ann.startDate || '',
      endDate: ann.endDate || '',
    });
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annFormData.text.trim()) {
      alert('Announcement text is required');
      return;
    }

    try {
      if (editingAnnId) {
        const res = await fetch('/api/announcements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAnnId,
            updates: {
              text: annFormData.text.trim(),
              linkUrl: annFormData.linkUrl.trim() || undefined,
              linkLabel: annFormData.linkLabel.trim() || undefined,
              displayOrder: Number(annFormData.displayOrder) || 1,
              isActive: annFormData.isActive,
              startDate: annFormData.startDate ? new Date(annFormData.startDate).toISOString() : null,
              endDate: annFormData.endDate ? new Date(annFormData.endDate).toISOString() : null,
            },
          }),
        });
        if (!res.ok) throw new Error('Failed to update announcement');
        showFeedback('Announcement updated successfully!');
      } else {
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: annFormData.text.trim(),
            linkUrl: annFormData.linkUrl.trim() || undefined,
            linkLabel: annFormData.linkLabel.trim() || undefined,
            displayOrder: Number(annFormData.displayOrder) || 1,
            isActive: annFormData.isActive,
            startDate: annFormData.startDate ? new Date(annFormData.startDate).toISOString() : null,
            endDate: annFormData.endDate ? new Date(annFormData.endDate).toISOString() : null,
          }),
        });
        if (!res.ok) throw new Error('Failed to create announcement');
        showFeedback('Announcement created and activated!');
      }

      setIsAnnModalOpen(false);
      fetchHomepageData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Announcement save failed');
    }
  };

  const handleToggleAnnouncementActive = async (ann: AnnouncementItem) => {
    try {
      await fetch('/api/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ann.id,
          updates: { isActive: !ann.isActive },
        }),
      });
      fetchHomepageData();
      showFeedback(`Announcement marked as ${!ann.isActive ? 'Active' : 'Inactive'}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Toggle failed');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchHomepageData();
      showFeedback('Announcement removed from rotation.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // --- HERO SLIDE HANDLERS ---
  const openNewSlideModal = () => {
    setEditingSlideId(null);
    setSlideFormData({
      title: '',
      headline: '',
      subheadline: '',
      category: 'Planters & Decor',
      desktopImageUrl: '/products/planter-obsidian-black.jpg',
      mobileImageUrl: '/products/planter-orange-variant.jpg',
      desktopFocalPoint: 'center center',
      mobileFocalPoint: 'center center',
      textAlignment: 'left',
      overlayOpacity: 0.44,
      transitionPreset: 'crossfade',
      transitionDurationMs: 500,
      primaryButtonText: 'Shop Collection',
      primaryButtonLink: '/catalog',
      secondaryButtonText: 'View All',
      secondaryButtonLink: '/catalog',
      accentTag: 'In Stock • Nashik',
      badge: 'From ₹499',
      displayOrder: (slides.length + 1) * 10,
      isActive: true,
    });
    setIsSlideModalOpen(true);
  };

  const openEditSlideModal = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setSlideFormData({ ...slide });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFormData.headline?.trim()) {
      alert('Slide headline is required');
      return;
    }

    try {
      if (editingSlideId) {
        const res = await fetch('/api/admin/homepage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slideId: editingSlideId,
            slideUpdates: slideFormData,
          }),
        });
        if (!res.ok) throw new Error('Failed to update slide');
        showFeedback('Hero slide updated with separate responsive assets!');
      } else {
        const res = await fetch('/api/admin/homepage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_slide',
            ...slideFormData,
          }),
        });
        if (!res.ok) throw new Error('Failed to create slide');
        showFeedback('New hero slide added to carousel!');
      }

      setIsSlideModalOpen(false);
      fetchHomepageData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Slide save failed');
    }
  };

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    try {
      await fetch('/api/admin/homepage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideId: slide.id,
          slideUpdates: { isActive: !slide.isActive },
        }),
      });
      fetchHomepageData();
      showFeedback(`Slide marked as ${!slide.isActive ? 'Active' : 'Draft'}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Toggle failed');
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to remove this hero slide?')) return;
    try {
      const res = await fetch(`/api/admin/homepage?slideId=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchHomepageData();
      showFeedback('Hero slide deleted from carousel.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // --- SECTIONS PUBLISH HANDLERS ---
  const handlePublishSection = async (section: HomepageSection) => {
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_section',
          sectionId: section.id,
        }),
      });

      if (!res.ok) throw new Error('Publishing failed');
      showFeedback(`Published section "${section.title}" (v${section.version + 1}) to live storefront!`);
      fetchHomepageData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    }
  };

  const handleToggleSectionVisibility = async (section: HomepageSection) => {
    try {
      await fetch('/api/admin/homepage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          sectionUpdates: { isPublished: !section.isPublished },
        }),
      });
      fetchHomepageData();
      showFeedback(`Section "${section.title}" is now ${!section.isPublished ? 'Live' : 'Hidden'}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Top Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FALCON 3D STOREFRONT ENGINE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Storefront Presentation & Banners
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Manage animated announcement messages, separate desktop & mobile hero slides, category visuals, and layout sections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchHomepageData}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Storefront Data
          </button>
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

      {errorMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            color: '#F87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Editor Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('slides')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'slides' ? '3px solid var(--brand-accent)' : '3px solid transparent',
            color: activeTab === 'slides' ? 'var(--text-primary)' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Monitor size={16} />
          <span>Hero Slides ({slides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'announcements' ? '3px solid var(--brand-accent)' : '3px solid transparent',
            color: activeTab === 'announcements' ? 'var(--text-primary)' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Megaphone size={16} />
          <span>Announcements ({announcements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'categories' ? '3px solid var(--brand-accent)' : '3px solid transparent',
            color: activeTab === 'categories' ? 'var(--text-primary)' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ImageIcon size={16} />
          <span>Category Visuals ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'sections' ? '3px solid var(--brand-accent)' : '3px solid transparent',
            color: activeTab === 'sections' ? 'var(--text-primary)' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Layers size={16} />
          <span>Sections Layout ({sections.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: HERO CAROUSEL SLIDES */}
      {/* ========================================================= */}
      {activeTab === 'slides' && (
        <div>
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Hero Carousel Slides
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Independent desktop (16:9) and mobile (4:5) image assets, focal point adjustment, and transition presets.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Preview device toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    cursor: 'pointer',
                    background: previewDevice === 'desktop' ? 'var(--surface)' : 'transparent',
                    color: previewDevice === 'desktop' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: previewDevice === 'desktop' ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  <Monitor size={13} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    cursor: 'pointer',
                    background: previewDevice === 'mobile' ? 'var(--surface)' : 'transparent',
                    color: previewDevice === 'mobile' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: previewDevice === 'mobile' ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  <Smartphone size={13} /> Mobile
                </button>
              </div>

              {canEdit && (
                <button
                  onClick={openNewSlideModal}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Hero Slide
                </button>
              )}
            </div>
          </div>

          {/* Slides Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {slides.map((slide, idx) => {
              const activeImg = previewDevice === 'desktop' ? slide.desktopImageUrl : (slide.mobileImageUrl || slide.desktopImageUrl);
              const focal = previewDevice === 'desktop' ? (slide.desktopFocalPoint || 'center center') : (slide.mobileFocalPoint || 'center center');

              return (
                <div
                  key={slide.id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: slide.isActive ? '1px solid var(--border-subtle)' : '1px dashed var(--border-subtle)',
                    opacity: slide.isActive ? 1 : 0.72,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Visual Preview Frame */}
                  <div
                    style={{
                      height: previewDevice === 'desktop' ? '180px' : '230px',
                      background: '#1F1B18',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={activeImg}
                      alt={slide.title || 'Slide preview'}
                      fill
                      sizes="400px"
                      style={{
                        objectFit: 'cover',
                        objectPosition: focal,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(180deg, rgba(18,16,14,0.2) 0%, rgba(18,16,14,${(slide.overlayOpacity ?? 0.44) + 0.35}) 100%)`,
                      }}
                    />

                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem', zIndex: 2 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        #{idx + 1}
                      </span>
                      {slide.category && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: 'var(--brand-accent)',
                            color: '#FFFFFF',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          {slide.category}
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem', zIndex: 2, color: '#FFFFFF' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.15rem', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
                        {slide.headline}
                      </h3>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {slide.subheadline}
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Controls */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>
                        <strong>Transition:</strong> <code>{slide.transitionPreset || 'crossfade'}</code> ({slide.transitionDurationMs || 500}ms) • <strong>Align:</strong> {slide.textAlignment || 'left'}
                      </div>
                      <div>
                        <strong>CTA:</strong> {slide.primaryButtonText} → <code>{slide.primaryButtonLink}</code>
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>Desktop Asset:</strong> <code>{slide.desktopImageUrl}</code>
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>Mobile Asset:</strong> <code>{slide.mobileImageUrl || 'Inherits desktop'}</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSlideActive(slide)}
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.35rem 0.65rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: slide.isActive ? '#10B981' : 'var(--text-muted)',
                        }}
                      >
                        {slide.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                        {slide.isActive ? 'Active on Storefront' : 'Draft / Hidden'}
                      </button>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditSlideModal(slide)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                              title="Edit slide properties"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.55rem', color: '#EF4444' }}
                              title="Delete slide"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PROMOTIONAL ANNOUNCEMENT BAR */}
      {/* ========================================================= */}
      {activeTab === 'announcements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Promotional Announcement Bar
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Slim top bar with gentle vertical transitions. Pauses on hover, focus, and background tabs.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={openNewAnnouncementModal}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Announcement
              </button>
            )}
          </div>

          {/* Announcements Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.85rem 1.15rem', width: '70px' }}>Order</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Message Text</th>
                  <th style={{ padding: '0.85rem 1.15rem', width: '220px' }}>Link & Label</th>
                  <th style={{ padding: '0.85rem 1.15rem', width: '110px' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No announcements configured. The announcement bar remains hidden on the storefront.
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1.15rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        #{ann.displayOrder}
                      </td>
                      <td style={{ padding: '0.85rem 1.15rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {ann.text}
                      </td>
                      <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.78rem' }}>
                        {ann.linkUrl ? (
                          <span style={{ color: 'var(--brand-accent)' }}>
                            {ann.linkLabel || 'Link'} → <code>{ann.linkUrl}</code>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1.15rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: ann.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                            color: ann.isActive ? '#10B981' : '#94A3B8',
                          }}
                        >
                          {ann.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                          {ann.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAnnouncementActive(ann)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title={ann.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {ann.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditAnnouncementModal(ann)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title="Edit announcement"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.55rem', color: '#EF4444' }}
                            title="Delete announcement"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CATEGORY APPEARANCE */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Category Visual Appearance
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Assigned cover images, icons, and hover lift cards for storefront visual domain discovery.
              </p>
            </div>

            <Link
              href="/admin/categories"
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} /> Full Category Manager
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '140px', background: '#1F1B18', position: 'relative' }}>
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} fill sizes="300px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,16,14,0.85) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: '0.65rem', left: '0.75rem', right: '0.75rem', color: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Icon: {cat.icon || 'Compass'}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{cat.name}</div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Sort Priority: <strong>#{cat.sort_order}</strong>
                  </span>
                  <Link
                    href="/admin/categories"
                    style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Edit Image <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SECTIONS LAYOUT */}
      {/* ========================================================= */}
      {activeTab === 'sections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Homepage Sections Layout & Publishing
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Draft vs Published separation preserves staging workflows before live storefront publication.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="card"
                style={{
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {idx + 1}. {sec.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      ({sec.sectionKey})
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: sec.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: sec.isPublished ? '#10B981' : '#EF4444',
                      }}
                    >
                      {sec.isPublished ? 'LIVE' : 'HIDDEN'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Current Version: <strong>v{sec.version}</strong> • Last Published:{' '}
                    {sec.publishedAt ? new Date(sec.publishedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleSectionVisibility(sec)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {sec.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                    {sec.isPublished ? 'Hide from Store' : 'Enable Section'}
                  </button>

                  <button
                    onClick={() => handlePublishSection(sec)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Sparkles size={13} /> Publish to Storefront
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT ANNOUNCEMENT */}
      {/* ========================================================= */}
      {isAnnModalOpen && (
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
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {editingAnnId ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <button onClick={() => setIsAnnModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Announcement Message Text *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Complimentary express surface courier shipping on orders above ₹999."
                  value={annFormData.text}
                  onChange={(e) => setAnnFormData((prev) => ({ ...prev, text: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Optional Action Link URL
                  </label>
                  <input
                    type="text"
                    placeholder="/catalog"
                    value={annFormData.linkUrl}
                    onChange={(e) => setAnnFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
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
                    Action Link Label
                  </label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={annFormData.linkLabel}
                    onChange={(e) => setAnnFormData((prev) => ({ ...prev, linkLabel: e.target.value }))}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={annFormData.displayOrder}
                    onChange={(e) => setAnnFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))}
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

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={annFormData.isActive}
                      onChange={(e) => setAnnFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Active on Storefront
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAnnModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnnId ? 'Save Changes' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT HERO SLIDE */}
      {/* ========================================================= */}
      {isSlideModalOpen && (
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
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingSlideId ? 'Edit Hero Carousel Slide' : 'Add Hero Carousel Slide'}
                </h2>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Configure responsive assets, motion presets, and call-to-actions.
                </p>
              </div>
              <button onClick={() => setIsSlideModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Slide Title / Reference
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Geometric Origami Planter"
                    value={slideFormData.title || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Planters & Decor"
                    value={slideFormData.category || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, category: e.target.value }))}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Main Headline (Use \n for line break) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Architectural Geometric\nPlanter Series"
                  value={slideFormData.headline || ''}
                  onChange={(e) => setSlideFormData((prev) => ({ ...prev, headline: e.target.value }))}
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
                  Sub-headline / Supporting Prose
                </label>
                <textarea
                  rows={2}
                  value={slideFormData.subheadline || ''}
                  onChange={(e) => setSlideFormData((prev) => ({ ...prev, subheadline: e.target.value }))}
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

              {/* Responsive Images & Focal Points */}
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="var(--brand-accent)" />
                  Responsive Image Assets & Focal Points
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Desktop Image URL (16:9)
                    </label>
                    <input
                      type="text"
                      required
                      value={slideFormData.desktopImageUrl || ''}
                      onChange={(e) => setSlideFormData((prev) => ({ ...prev, desktopImageUrl: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Desktop Focal Point
                    </label>
                    <select
                      value={slideFormData.desktopFocalPoint || 'center center'}
                      onChange={(e) => setSlideFormData((prev) => ({ ...prev, desktopFocalPoint: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {FOCAL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Mobile Image URL (4:5)
                    </label>
                    <input
                      type="text"
                      value={slideFormData.mobileImageUrl || ''}
                      onChange={(e) => setSlideFormData((prev) => ({ ...prev, mobileImageUrl: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Mobile Focal Point
                    </label>
                    <select
                      value={slideFormData.mobileFocalPoint || 'center center'}
                      onChange={(e) => setSlideFormData((prev) => ({ ...prev, mobileFocalPoint: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {FOCAL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preset suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
                  {PRESET_HERO_IMAGES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSlideFormData((prev) => ({ ...prev, desktopImageUrl: p.desktop, mobileImageUrl: p.mobile }))}
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Preset & Presentation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Transition Preset
                  </label>
                  <select
                    value={slideFormData.transitionPreset || 'crossfade'}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, transitionPreset: e.target.value as 'crossfade' | 'slide' | 'blur' }))}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="crossfade">Crossfade (Default)</option>
                    <option value="slide">Fade + Subtle Slide</option>
                    <option value="blur">Gentle Blur-to-Clear</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Text Alignment
                  </label>
                  <select
                    value={slideFormData.textAlignment || 'left'}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, textAlignment: e.target.value as 'left' | 'center' | 'right' }))}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Overlay Darkening
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="0.8"
                    value={slideFormData.overlayOpacity ?? 0.44}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, overlayOpacity: parseFloat(e.target.value) || 0.44 }))}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              {/* Primary & Secondary Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    required
                    value={slideFormData.primaryButtonText || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, primaryButtonText: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Primary Destination Link
                  </label>
                  <input
                    type="text"
                    required
                    value={slideFormData.primaryButtonLink || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, primaryButtonLink: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Secondary Button (Optional)
                  </label>
                  <input
                    type="text"
                    value={slideFormData.secondaryButtonText || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, secondaryButtonText: e.target.value }))}
                    placeholder="e.g. Explore Catalog"
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Secondary Destination Link
                  </label>
                  <input
                    type="text"
                    value={slideFormData.secondaryButtonLink || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, secondaryButtonLink: e.target.value }))}
                    placeholder="/catalog"
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Accent Tag
                  </label>
                  <input
                    type="text"
                    value={slideFormData.accentTag || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, accentTag: e.target.value }))}
                    placeholder="Ready to Ship"
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={slideFormData.badge || ''}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="From ₹499"
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={slideFormData.displayOrder || 1}
                    onChange={(e) => setSlideFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsSlideModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSlideId ? 'Save Changes' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
