'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { AnnouncementItem } from '@/lib/types';

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'default-01',
    text: 'Handcrafted 3D printed collectibles, planters, and desk essentials. Free Shipping Above ₹999',
    linkLabel: 'Shop Catalog',
    linkUrl: '/catalog',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'default-02',
    text: 'Zero Transit Breakage Guarantee · Custom shock-proof keepsake packaging',
    linkLabel: 'Shipping Policy',
    linkUrl: '/policies/shipping',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'default-03',
    text: 'Custom 3D Printing & Scale Models · Dispatched directly from our Nashik atelier',
    linkLabel: 'Instant Quote',
    linkUrl: '/quote',
    isActive: true,
    displayOrder: 3,
  },
];

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [transitionState, setTransitionState] = useState<'entering' | 'active'>('active');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/announcements', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.announcements && Array.isArray(data.announcements)) {
          const active = (data.announcements as AnnouncementItem[])
            .filter((item) => item.isActive !== false)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          if (active.length > 0) {
            setAnnouncements(active);
            setCurrentIndex(0);
          }
        }
      })
      .catch(() => {
        // Silently preserve DEFAULT_ANNOUNCEMENTS fallback
      });

    return () => controller.abort();
  }, []);

  const count = announcements.length;

  const nextAnnouncement = useCallback(() => {
    if (count <= 1) return;
    setTransitionState('entering');
    setCurrentIndex((prev) => (prev + 1) % count);
    setTimeout(() => setTransitionState('active'), 250);
  }, [count]);

  const prevAnnouncement = useCallback(() => {
    if (count <= 1) return;
    setTransitionState('entering');
    setCurrentIndex((prev) => (prev - 1 + count) % count);
    setTimeout(() => setTransitionState('active'), 250);
  }, [count]);

  // Tab visibility detection to pause autoplay when tab is inactive
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Autoplay rotation every 5500ms
  useEffect(() => {
    if (isPaused || count <= 1 || isDismissed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(nextAnnouncement, 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, count, isDismissed, nextAnnouncement]);

  if (count === 0 || isDismissed) {
    return null;
  }

  const activeItem = announcements[currentIndex] || announcements[0];

  return (
    <aside
      aria-label="Studio Announcements"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prevAnnouncement();
        if (e.key === 'ArrowRight') nextAnnouncement();
      }}
      tabIndex={0}
      style={{
        background: 'linear-gradient(90deg, #12100E 0%, #1D1A17 50%, #12100E 100%)',
        color: '#FAF7F2',
        fontSize: '0.78rem',
        padding: '0.45rem 1rem',
        borderBottom: '1px solid rgba(232, 89, 12, 0.22)',
        position: 'relative',
        zIndex: 50,
        transition: 'all 200ms ease',
        letterSpacing: '0.03em',
        outline: 'none',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          minHeight: '1.65rem',
        }}
      >
        {/* Navigation arrow (left) */}
        {count > 1 ? (
          <button
            type="button"
            onClick={prevAnnouncement}
            aria-label="Previous announcement"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
              cursor: 'pointer',
              borderRadius: 'var(--radius-xs)',
              transition: 'color 140ms ease, transform 140ms ease',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={15} />
          </button>
        ) : (
          <div style={{ width: '15px', flexShrink: 0 }} />
        )}

        {/* Animated Message Stage */}
        <div
          className="announcement-message"
          style={{
            flex: 1,
            textAlign: 'center',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: transitionState === 'entering' ? 0 : 1,
            transform: transitionState === 'entering' ? 'translateY(4px)' : 'translateY(0)',
            transition: 'opacity 220ms ease, transform 220ms ease',
          }}
        >
          <span
            className="announcement-copy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            <Sparkles size={13} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
            <span className="announcement-text">{activeItem.text}</span>
          </span>

          {activeItem.linkUrl && (
            <Link
              className="announcement-link"
              href={activeItem.linkUrl}
              style={{
                color: 'var(--brand-accent)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                marginLeft: '0.35rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span>{activeItem.linkLabel || 'Explore'}</span>
              <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {/* Right Controls: Next & Dismiss */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {count > 1 && (
            <button
              type="button"
              onClick={nextAnnouncement}
              aria-label="Next announcement"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                cursor: 'pointer',
                borderRadius: 'var(--radius-xs)',
                transition: 'color 140ms ease, transform 140ms ease',
              }}
            >
              <ChevronRight size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss announcement bar"
            title="Dismiss announcement bar"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
              cursor: 'pointer',
              borderRadius: 'var(--radius-xs)',
              transition: 'color 140ms ease',
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
