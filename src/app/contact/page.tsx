'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, Phone, Mail, Clock, Send, CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--brand-accent)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          NASHIK STUDIO DESK
        </span>
        <h1 style={{ fontSize: '2.2rem', margin: '0.35rem 0 0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          Contact Falcon 3D Prints
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Have questions about materials, custom bulk prototyping, or active orders? Visit our CIDCO studio or message our engineering team directly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left: Contact Info & Workshop details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Studio & Workshop Location
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-accent)',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <MapPin size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    Falcon 3D Prints Workshop
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Uttam Nagar, CIDCO,<br />
                    Nashik, Maharashtra 422009, India
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-accent)',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Phone size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    Direct Hotline & WhatsApp
                  </div>
                  <a
                    href="tel:+919850607144"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    +91 98506 07144
                  </a>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '0.15rem' }}>
                    Available for technical consultations & instant inquiries
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-accent)',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    Electronic Mail
                  </div>
                  <a
                    href="mailto:contact@falcon3dprints.com"
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    contact@falcon3dprints.com
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-accent)',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    Operational Hours (IST)
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Monday – Saturday: 9:30 AM – 7:30 PM<br />
                    Sunday: Production Active (Visits by Appointment)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick link to custom quote */}
          <div className="card" style={{ background: 'var(--surface-alt)' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>
              Have a 3D digital model ready?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Skip the general contact form and upload your STL directly to our automated quotation slicer for precision pricing within 4 hours.
            </p>
            <Link href="/quote" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              Submit Instant STL Quotation
            </Link>
          </div>
        </div>

        {/* Right: Message Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            Send a Direct Message
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            We typically respond within 2 to 4 business hours.
          </p>

          {submitted ? (
            <div
              style={{
                padding: '2rem 1.5rem',
                textAlign: 'center',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--status-ready-bg)',
                border: '1px solid var(--status-ready-border)',
              }}
            >
              <CheckCircle2 size={36} color="var(--status-ready)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Message Sent</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Thank you, {formData.name}. Our Nashik team has received your inquiry and will reach out to <strong>{formData.phone || formData.email}</strong> promptly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                }}
                className="btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98xxx xxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                  Inquiry Topic
                </label>
                <select
                  className="input"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="General Inquiry">General Product Inquiry</option>
                  <option value="Custom Printing">Custom 3D Printing / Prototyping</option>
                  <option value="Existing Order">Existing Order Status</option>
                  <option value="Bulk Order">B2B / Bulk Architectural Models</option>
                  <option value="Workshop Visit">Studio Visit in CIDCO Nashik</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                  Message or Project Details *
                </label>
                <textarea
                  required
                  rows={4}
                  className="input"
                  placeholder="Describe your design specifications or question..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem',
                  marginTop: '0.5rem',
                }}
              >
                <Send size={15} /> <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
