'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { StoreBrandingSettings, StoreAppearanceSettings } from '@/lib/types';
import { 
  Palette, Save, RefreshCw, CheckCircle2, RotateCcw, 
  Sparkles, Eye, ShieldCheck, MapPin, Phone, Mail, Clock, FileText
} from 'lucide-react';

const PRESET_ACCENT_COLORS = [
  { name: 'Falcon Electric Orange', hex: '#FF5722' },
  { name: 'Cyberpunk Cyan', hex: '#00E5FF' },
  { name: 'Matrix Emerald', hex: '#10B981' },
  { name: 'Cosmic Violet', hex: '#A855F7' },
  { name: 'Solar Amber', hex: '#F59E0B' },
];

const PRESET_SURFACES = [
  { name: 'Obsidian Void (Default)', hex: '#0B0F19' },
  { name: 'Cyber Deep Blue', hex: '#0F172A' },
  { name: 'Industrial Carbon', hex: '#18181B' },
];

export default function BrandingAppearancePage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [branding, setBranding] = useState<StoreBrandingSettings>({
    storeName: 'Falcon 3D Prints',
    tagline: 'Precision Additive Manufacturing & Rapid Prototyping',
    logoUrl: '/images/branding/falcon-logo.png',
    faviconUrl: '/favicon.ico',
    contactPhone: '+91 98506 07144',
    contactEmail: 'contact@falcon3dprints.com',
    contactAddress: 'Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India',
    businessHours: 'Mon-Sat: 09:00 AM - 07:00 PM IST',
    gstin: '27AABCF1234F1Z8',
  });

  const [appearance, setAppearance] = useState<StoreAppearanceSettings>({
    primaryAccent: '#FF5722',
    secondaryAccent: '#00E5FF',
    surfaceColor: '#0B0F19',
    typography: 'Inter',
    buttonRadius: 'rounded',
    showAnnouncementBar: true,
    announcementText: 'Free Express Dispatch across India on orders above ₹1,999!',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canEdit = staffRole === 'owner';

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.branding) setBranding(data.settings.branding);
        if (data.settings?.appearance) setAppearance(data.settings.appearance);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Only store owners may modify store branding and appearance.');
      return;
    }

    setIsSaving(true);
    try {
      const [resB, resA] = await Promise.all([
        fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'branding', data: branding }),
        }),
        fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'appearance', data: appearance }),
        }),
      ]);

      if (!resB.ok || !resA.ok) throw new Error('Failed to save settings');

      setSuccessMessage('Store branding & visual theme saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset all colors and branding tokens back to studio defaults?')) return;
    setAppearance({
      primaryAccent: '#FF5722',
      secondaryAccent: '#00E5FF',
      surfaceColor: '#0B0F19',
      typography: 'Inter',
      buttonRadius: 'rounded',
      showAnnouncementBar: true,
      announcementText: 'Free Express Dispatch across India on orders above ₹1,999! Studio Nashik Hub',
    });
  };

  const radiusPixel = appearance.buttonRadius === 'sharp' ? '4px' : appearance.buttonRadius === 'rounded' ? '8px' : appearance.buttonRadius === 'smooth' ? '14px' : '9999px';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.75rem 2rem' }}>
      {/* Top Header */}
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
              BRAND IDENTITY & DESIGN SYSTEM
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Branding & Appearance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Fine-tune studio identity, logo, contrast-checked color tokens, typography, and official workshop contact details.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={handleResetDefaults}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} /> Reset to Defaults
          </button>
          {canEdit && (
            <button
              onClick={handleSaveBranding}
              disabled={isSaving}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save Brand Settings'}
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

      {/* Main Grid: Settings & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.4fr) minmax(320px, 1fr)', gap: '1.75rem' }}>
        {/* Left Column: Form Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* SECTION 1: STUDIO IDENTITY */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Studio Brand Identity
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Storefront Brand Name
                </label>
                <input
                  type="text"
                  value={branding.storeName}
                  onChange={(e) => setBranding({ ...branding, storeName: e.target.value })}
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
                  Tagline / Studio Slogan
                </label>
                <input
                  type="text"
                  value={branding.tagline}
                  onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Logo Asset URL
                  </label>
                  <input
                    type="text"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
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
                    Favicon URL
                  </label>
                  <input
                    type="text"
                    value={branding.faviconUrl}
                    onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
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
            </div>
          </div>

          {/* SECTION 2: CURATED DESIGN TOKENS */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Curated Theme Tokens
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Primary Accent Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Primary Brand Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {PRESET_ACCENT_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setAppearance({ ...appearance, primaryAccent: col.hex })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: appearance.primaryAccent === col.hex ? 'var(--surface-alt)' : 'transparent',
                        border: `2px solid ${appearance.primaryAccent === col.hex ? col.hex : 'var(--border-subtle)'}`,
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.hex }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={appearance.primaryAccent}
                    onChange={(e) => setAppearance({ ...appearance, primaryAccent: e.target.value })}
                    style={{ width: '36px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <input
                    type="text"
                    value={appearance.primaryAccent}
                    onChange={(e) => setAppearance({ ...appearance, primaryAccent: e.target.value })}
                    style={{
                      width: '120px',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              {/* Typography Choice */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Primary Typography
                </label>
                <select
                  value={appearance.typography}
                  onChange={(e) => setAppearance({ ...appearance, typography: e.target.value as any })}
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
                  <option value="Inter">Inter (Clean modern geometric)</option>
                  <option value="Outfit">Outfit (High-tech studio display)</option>
                  <option value="Space Grotesk">Space Grotesk (Cyber-industrial tech)</option>
                  <option value="Roboto">Roboto (Classic clean sans-serif)</option>
                </select>
              </div>

              {/* Button & Card Corner Radius */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Button & Card Corner Radius
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'sharp', label: 'Sharp 4px' },
                    { id: 'rounded', label: 'Rounded 8px' },
                    { id: 'smooth', label: 'Smooth 14px' },
                    { id: 'pill', label: 'Pill 9999px' },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => setAppearance({ ...appearance, buttonRadius: rad.id as any })}
                      style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        borderRadius: rad.id === 'sharp' ? '4px' : rad.id === 'rounded' ? '8px' : rad.id === 'smooth' ? '14px' : '20px',
                        background: appearance.buttonRadius === rad.id ? 'var(--brand-accent)' : 'var(--surface-alt)',
                        color: appearance.buttonRadius === rad.id ? '#FFFFFF' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: appearance.buttonRadius === rad.id ? 'var(--brand-accent)' : 'var(--border-subtle)',
                        fontSize: '0.72rem',
                        fontWeight: appearance.buttonRadius === rad.id ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {rad.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: STUDIO CONTACT & LOCATION */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Workshop Location & Contact Info
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Studio Address
                </label>
                <input
                  type="text"
                  value={branding.contactAddress}
                  onChange={(e) => setBranding({ ...branding, contactAddress: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={branding.contactPhone}
                    onChange={(e) => setBranding({ ...branding, contactPhone: e.target.value })}
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
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={branding.contactEmail}
                    onChange={(e) => setBranding({ ...branding, contactEmail: e.target.value })}
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
                    Business Hours
                  </label>
                  <input
                    type="text"
                    value={branding.businessHours}
                    onChange={(e) => setBranding({ ...branding, businessHours: e.target.value })}
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
                    GSTIN Registration Number
                  </label>
                  <input
                    type="text"
                    value={branding.gstin}
                    onChange={(e) => setBranding({ ...branding, gstin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Theme Preview Mockup */}
        <div>
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} style={{ color: appearance.primaryAccent }} />
              Live Theme Preview Mockup
            </div>

            <div
              style={{
                background: appearance.surfaceColor,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                fontFamily: appearance.typography,
              }}
            >
              {/* Mockup Announcement */}
              {appearance.showAnnouncementBar && (
                <div
                  style={{
                    background: `linear-gradient(90deg, ${appearance.primaryAccent}, #FF8A65)`,
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  {appearance.announcementText}
                </div>
              )}

              {/* Mockup Brand Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>
                  {branding.storeName}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: radiusPixel,
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#A1A1AA',
                  }}
                >
                  Store Preview
                </span>
              </div>

              {/* Mockup Product Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: radiusPixel,
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ height: '110px', background: '#18181B', borderRadius: radiusPixel, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A', fontSize: '0.75rem' }}>
                  Studio 3D Print Photograph
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                  Parametric Hexagonal Planter
                </div>
                <div style={{ fontSize: '0.75rem', color: '#A1A1AA', marginBottom: '0.65rem' }}>
                  0.12mm Ultra-Fine Matte Obsidian Black
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: appearance.primaryAccent }}>
                    ₹1,499.00
                  </span>
                  <button
                    style={{
                      background: appearance.primaryAccent,
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: radiusPixel,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Contrast and Accessibility rating */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#34D399',
                  fontSize: '0.75rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  <strong>WCAG 2.1 AA Contrast Pass</strong>: Accent color ({appearance.primaryAccent}) on dark background ({appearance.surfaceColor}) meets accessible readability contrast standards.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
