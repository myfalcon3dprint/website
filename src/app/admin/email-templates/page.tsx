'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { EmailTemplate } from '@/lib/types';
import { 
  Mail, Save, RefreshCw, CheckCircle2, 
  Eye, Code, AlertTriangle, ShieldCheck, 
  FileText, Copy, Sparkles, Send
} from 'lucide-react';

export default function EmailTemplatesPage() {
  const { profile } = useAuthUser();
  const staffRole = profile?.role || 'owner';

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [isActiveToggle, setIsActiveToggle] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canEdit = ['owner', 'order_manager'].includes(staffRole);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        const list = data.templates || [];
        setTemplates(list);
        if (list.length > 0 && !selectedTemplate) {
          setSelectedTemplate(list[0]);
          setSubjectInput(list[0].subjectTemplate);
          setBodyInput(list[0].bodyTemplate);
          setIsActiveToggle(list[0].isActive);
        }
      }
    } catch (err) {
      console.error('Failed to load email templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelectTemplate = (tmpl: EmailTemplate) => {
    setSelectedTemplate(tmpl);
    setSubjectInput(tmpl.subjectTemplate);
    setBodyInput(tmpl.bodyTemplate);
    setIsActiveToggle(tmpl.isActive);
  };

  const handleInsertVariable = (varName: string) => {
    setBodyInput((prev) => `${prev} {{${varName}}}`);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          subjectTemplate: subjectInput,
          bodyTemplate: bodyInput,
          isActive: isActiveToggle,
        }),
      });

      if (!res.ok) throw new Error('Failed to save email template');
      setSuccessMessage(`Saved changes to template "${selectedTemplate.name}"`);
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchTemplates();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Render Live Preview with Sample Data
  const renderPreviewSubject = () => {
    if (!selectedTemplate) return '';
    let rendered = subjectInput;
    const sample = selectedTemplate.sampleData || {};
    Object.keys(sample).forEach((k) => {
      rendered = rendered.replace(new RegExp(`{{${k}}}`, 'g'), sample[k]);
    });
    return rendered;
  };

  const renderPreviewBody = () => {
    if (!selectedTemplate) return '';
    let rendered = bodyInput;
    const sample = selectedTemplate.sampleData || {};
    Object.keys(sample).forEach((k) => {
      rendered = rendered.replace(new RegExp(`{{${k}}}`, 'g'), sample[k]);
    });
    return rendered;
  };

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
              TRANSACTIONAL NOTIFICATIONS & MESSAGING
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Email Templates
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Customize transactional customer emails for confirmations, quotations, production milestones, and dispatches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchTemplates}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Sandbox Delivery Safeguard Banner */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#FBBF24',
          fontSize: '0.82rem',
        }}
      >
        <AlertTriangle size={18} />
        <span>
          <strong>Sandbox Delivery Mode Active</strong>: Outbound customer messaging is currently in preview-only mode. No real emails will be delivered to customers during development or testing.
        </span>
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

      {/* Main Layout: Template Sidebar + Editor & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Template List Selector */}
        <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.5rem 0.65rem' }}>
            System Templates
          </div>
          {templates.map((tmpl) => {
            const isSelected = selectedTemplate?.id === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(255, 87, 34, 0.14)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isSelected ? 'var(--brand-accent)' : 'transparent'}`,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tmpl.name}
              </button>
            );
          })}
        </div>

        {/* Editor Column */}
        {selectedTemplate ? (
          <form onSubmit={handleSaveTemplate} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Edit: {selectedTemplate.name}
              </h2>
              {canEdit && (
                <button type="submit" disabled={isSaving} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Save size={13} /> {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Subject Line
              </label>
              <input
                type="text"
                required
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
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

            {/* Variable Chips */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Click to Insert Placeholders:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedTemplate.availableVariables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      color: 'var(--brand-accent)',
                      cursor: 'pointer',
                    }}
                  >
                    +{`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Email Body Text (Plain text & Markdown)
              </label>
              <textarea
                rows={12}
                required
                value={bodyInput}
                onChange={(e) => setBodyInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </form>
        ) : (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a template from the left to edit.
          </div>
        )}

        {/* Live Preview Column */}
        {selectedTemplate && (
          <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', color: '#111827', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem' }}>
              <Eye size={16} style={{ color: '#FF5722' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>
                Real-Time Rendered Preview
              </span>
            </div>

            {/* Email Header Mockup */}
            <div style={{ background: '#F9FAFB', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
              <div><strong>From:</strong> Falcon 3D Prints &lt;contact@falcon3dprints.com&gt;</div>
              <div><strong>To:</strong> rahul.sharma@gmail.com</div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                Subject: {renderPreviewSubject()}
              </div>
            </div>

            {/* Email Body Preview */}
            <div
              style={{
                fontSize: '0.84rem',
                lineHeight: 1.6,
                color: '#374151',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {renderPreviewBody()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
