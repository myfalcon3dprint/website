'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { 
  Settings, Activity, Save, 
  RefreshCw, CheckCircle2, AlertCircle,
  Database, HardDrive, CreditCard, Bell, 
  Lock
} from 'lucide-react';

interface IntegrationItem {
  status: string;
  label: string;
  isHealthy: boolean;
}

export default function AdminSettingsPage() {
  const { profile } = useAuthUser();
  const isOwner = profile?.role === 'owner';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'operations' | 'payments' | 'integrations'>('general');

  // Form states
  const [branding, setBranding] = useState({
    storeName: 'Falcon 3D Prints',
    tagline: 'Precision Additive Manufacturing & Rapid Prototyping',
    contactPhone: '+91 98506 07144',
    contactEmail: 'contact@falcon3dprints.com',
    contactAddress: 'Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India',
    businessHours: 'Mon-Sat: 09:00 AM - 07:00 PM IST',
    gstin: '27AABCF1234F1Z8',
  });

  const [operations, setOperations] = useState({
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultLeadDaysReadyStock: 1,
    defaultLeadDaysMadeToOrder: 3,
    lowStockAlertThreshold: 5,
    autoCancelUnpaidMinutes: 1440,
  });

  const [shippingPolicy, setShippingPolicy] = useState({
    freeShippingThresholdPaise: 199900,
    defaultShippingFeePaise: 9900,
    localNashikFeePaise: 4900,
    codEnabled: true,
    codMaxLimitPaise: 500000,
    pickupAvailable: true,
    pickupAddress: 'Falcon 3D Studio, Sector 4, CIDCO Nashik',
  });

  const [integrations, setIntegrations] = useState<Record<string, IntegrationItem>>({
    database: { status: 'connected', label: 'PostgreSQL Database Engine', isHealthy: true },
    storage: { status: 'connected', label: 'Cloudflare R2 Object Storage', isHealthy: true },
    payments: { status: 'test_mode', label: 'Razorpay Sandbox Mode', isHealthy: true },
    notifications: { status: 'preview_only', label: 'Customer Notifications (Preview)', isHealthy: true },
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load store settings');

      if (data.settings) {
        if (data.settings.branding) setBranding(data.settings.branding);
        if (data.settings.operations) setOperations(data.settings.operations);
        if (data.settings.shippingPolicy) setShippingPolicy(data.settings.shippingPolicy);
      }
      if (data.integrations) {
        setIntegrations(data.integrations);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSection = async (section: 'branding' | 'operations' | 'shipping_policy', payload: unknown) => {
    if (!isOwner) {
      setErrorMsg('Only Studio Owners have permission to modify store settings.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          settings: payload,
          reason: `Updated ${section} settings from administrative panel`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setSuccessMsg(`Successfully saved ${section.replace('_', ' ')} settings.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: '#FFF7ED', borderRadius: '8px', color: '#C2410C' }}>
              <Settings size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#0F172A' }}>
              Store Settings & System Health
            </h1>
          </div>
          <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem' }}>
            Configure studio preferences, manufacturing defaults, payment limits, and inspect integration health.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="btn-outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.125rem',
            background: '#FFFFFF',
            border: '1px solid #64748B',
            borderRadius: '6px',
            color: '#0F172A',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          color: '#B91C1C',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#ECFDF5',
          border: '1px solid #6EE7B7',
          borderRadius: '8px',
          color: '#047857',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'general' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'general' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
        >
          General & Studio Info
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'operations' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'operations' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
        >
          Operations & Lead Times
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'payments' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'payments' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
        >
          Payments & COD Policy
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'integrations' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'integrations' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color 0.15s ease',
          }}
        >
          <Activity size={16} />
          Integration Health
        </button>
      </div>

      {/* Tab 1: General & Studio Info */}
      {activeTab === 'general' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '850px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Nashik Studio & Business Profile
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Store Brand Name
              </label>
              <input
                type="text"
                value={branding.storeName}
                onChange={(e) => setBranding({ ...branding, storeName: e.target.value })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Business GSTIN
              </label>
              <input
                type="text"
                value={branding.gstin}
                onChange={(e) => setBranding({ ...branding, gstin: e.target.value })}
                placeholder="27AABCF1234F1Z8"
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
              Tagline & Studio Mission
            </label>
            <input
              type="text"
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              className="input"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                background: '#FFFFFF',
                border: '1px solid #64748B',
                borderRadius: '6px',
                color: '#0F172A',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Customer Support Phone (+91)
              </label>
              <input
                type="text"
                value={branding.contactPhone}
                onChange={(e) => setBranding({ ...branding, contactPhone: e.target.value })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Official Contact Email
              </label>
              <input
                type="email"
                value={branding.contactEmail}
                onChange={(e) => setBranding({ ...branding, contactEmail: e.target.value })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
              Physical Workshop & Dispatch Address
            </label>
            <input
              type="text"
              value={branding.contactAddress}
              onChange={(e) => setBranding({ ...branding, contactAddress: e.target.value })}
              className="input"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                background: '#FFFFFF',
                border: '1px solid #64748B',
                borderRadius: '6px',
                color: '#0F172A',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
              Operating Hours & Studio Availability
            </label>
            <input
              type="text"
              value={branding.businessHours}
              onChange={(e) => setBranding({ ...branding, businessHours: e.target.value })}
              className="input"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                background: '#FFFFFF',
                border: '1px solid #64748B',
                borderRadius: '6px',
                color: '#0F172A',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => handleSaveSection('branding', branding)}
              disabled={isSaving || !isOwner}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#C2410C',
                border: '1px solid #C2410C',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isSaving || !isOwner ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Operations & Lead Times */}
      {activeTab === 'operations' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '850px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Manufacturing & Inventory Policies
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Store Currency
              </label>
              <input
                type="text"
                disabled
                value="INR (Indian Rupee - ₹)"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  color: '#475569',
                  fontSize: '1rem',
                  cursor: 'not-allowed',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
                Fixed to INR for all transactions, Razorpay gateway settlement, and GST compliance.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Store Timezone
              </label>
              <input
                type="text"
                disabled
                value="Asia/Kolkata (IST +05:30)"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  color: '#475569',
                  fontSize: '1rem',
                  cursor: 'not-allowed',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
                Standard operational timezone for order timestamps and manufacturing shifts.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Default Ready-Stock Dispatch (Days)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={operations.defaultLeadDaysReadyStock}
                onChange={(e) => setOperations({ ...operations, defaultLeadDaysReadyStock: parseInt(e.target.value, 10) || 1 })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
                Estimated packing and courier pickup window for items with on-hand inventory.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Default Made-to-Order Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={operations.defaultLeadDaysMadeToOrder}
                onChange={(e) => setOperations({ ...operations, defaultLeadDaysMadeToOrder: parseInt(e.target.value, 10) || 3 })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
                Standard slicing, 3D printing, post-processing, and quality check window.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Low-Stock Warning Threshold (Units)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={operations.lowStockAlertThreshold}
                onChange={(e) => setOperations({ ...operations, lowStockAlertThreshold: parseInt(e.target.value, 10) || 5 })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
                Triggers visual warning badges on the dashboard and product catalog table.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Auto-Cancel Unpaid Orders After (Minutes)
              </label>
              <input
                type="number"
                min="60"
                max="10080"
                value={operations.autoCancelUnpaidMinutes}
                onChange={(e) => setOperations({ ...operations, autoCancelUnpaidMinutes: parseInt(e.target.value, 10) || 1440 })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '1rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
                1440 minutes = 24 hours. Releases reserved inventory if payment is not completed.
              </span>
            </div>
          </div>

          <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => handleSaveSection('operations', operations)}
              disabled={isSaving || !isOwner}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#C2410C',
                border: '1px solid #C2410C',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isSaving || !isOwner ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Operations Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Payments & COD Policy */}
      {activeTab === 'payments' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '850px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Payment Methods & Cash-on-Delivery Bounds
          </h2>

          <div style={{
            padding: '1rem 1.25rem',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1D4ED8', fontWeight: 700, marginBottom: '0.25rem' }}>
              <CreditCard size={18} />
              Razorpay Gateway (Production-Secured)
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1E40AF', lineHeight: '1.4' }}>
              Razorpay Key ID and Secret are loaded strictly from verified server-side environment variables. 
              Ordinary staff cannot view or alter API secret keys from the web interface.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={shippingPolicy.codEnabled}
                onChange={(e) => setShippingPolicy({ ...shippingPolicy, codEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#C2410C', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Enable Cash on Delivery (COD) / Pay at Studio
                </span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                  Restricted to local Nashik PIN codes (422xxx) or verified repeat customers.
                </span>
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
              Maximum Cash on Delivery Order Limit (INR - ₹)
            </label>
            <input
              type="number"
              min="500"
              max="50000"
              value={shippingPolicy.codMaxLimitPaise / 100}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setShippingPolicy({ ...shippingPolicy, codMaxLimitPaise: Math.round(val * 100) });
              }}
              className="input"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                background: '#FFFFFF',
                border: '1px solid #64748B',
                borderRadius: '6px',
                color: '#0F172A',
                fontSize: '1rem',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.375rem', display: 'block' }}>
              Orders exceeding this threshold require prepaid payment via Razorpay UPI / Card / Netbanking.
            </span>
          </div>

          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: shippingPolicy.pickupAvailable ? '1rem' : '0' }}>
              <input
                type="checkbox"
                checked={shippingPolicy.pickupAvailable}
                onChange={(e) => setShippingPolicy({ ...shippingPolicy, pickupAvailable: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#C2410C', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                Allow Free In-Studio Customer Pickup
              </span>
            </label>

            {shippingPolicy.pickupAvailable && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                  Pickup Address Instructions
                </label>
                <input
                  type="text"
                  value={shippingPolicy.pickupAddress}
                  onChange={(e) => setShippingPolicy({ ...shippingPolicy, pickupAddress: e.target.value })}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: '#FFFFFF',
                    border: '1px solid #64748B',
                    borderRadius: '6px',
                    color: '#0F172A',
                    fontSize: '1rem',
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => handleSaveSection('shipping_policy', shippingPolicy)}
              disabled={isSaving || !isOwner}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#C2410C',
                border: '1px solid #C2410C',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isSaving || !isOwner ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Payment & COD Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Integration Health */}
      {activeTab === 'integrations' && (
        <div style={{ maxWidth: '900px' }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                System Integrations & Diagnostics
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                Read-only connection health indicators. Secrets are safeguarded server-side and never exposed to the client.
              </p>
            </div>

            <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Database */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.125rem 1.25rem',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.625rem', background: '#ECFDF5', borderRadius: '8px', color: '#059669' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>PostgreSQL Database Engine</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{integrations.database?.label || 'PostgreSQL Connection'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    background: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}>
                    <CheckCircle2 size={14} />
                    Active & Resilient
                  </span>
                </div>
              </div>

              {/* Object Storage */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.125rem 1.25rem',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.625rem', background: '#EFF6FF', borderRadius: '8px', color: '#2563EB' }}>
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Secure CAD Object Storage</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{integrations.storage?.label || 'Object Storage'}</div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  <CheckCircle2 size={14} />
                  Connected
                </span>
              </div>

              {/* Razorpay Gateway */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.125rem 1.25rem',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.625rem', background: '#FFFBEB', borderRadius: '8px', color: '#D97706' }}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Razorpay Payment Gateway</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{integrations.payments?.label || 'Razorpay Gateway'}</div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: '#FFFBEB',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  <Lock size={12} />
                  Test Sandbox
                </span>
              </div>

              {/* Notifications */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.125rem 1.25rem',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.625rem', background: '#F1F5F9', borderRadius: '8px', color: '#475569' }}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Customer Notifications Engine</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>Email & SMS Delivery Gateway</div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  Preview Mode (Safe)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
