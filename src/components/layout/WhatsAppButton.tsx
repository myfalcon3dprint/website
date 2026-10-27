'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

const WHATSAPP_NUMBER = '919850607144';
const DEFAULT_MESSAGE = 'Hi Falcon 3D Prints, I have an inquiry about 3D printing services and custom models.';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <aside
      aria-label="Direct WhatsApp Contact"
      className="whatsapp-floating-aside"
      style={{
        position: 'fixed',
        bottom: 'var(--whatsapp-bottom, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
        right: '1.5rem',
        zIndex: 65,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexDirection: 'row-reverse',
      }}
    >
      {/* WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Falcon 3D Prints on WhatsApp"
        className="whatsapp-floating-btn"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3.6rem',
          height: '3.6rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366 0%, #1EBE5D 100%)',
          boxShadow: isHovered
            ? '0 12px 28px rgba(37, 211, 102, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 8px 20px rgba(37, 211, 102, 0.35), 0 2px 6px rgba(0, 0, 0, 0.1)',
          color: '#FFFFFF',
          textDecoration: 'none',
          cursor: 'pointer',
          transform: isHovered ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
          transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Subtle Ambient Pulse Ring */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            border: '2px solid rgba(37, 211, 102, 0.5)',
            animation: 'whatsappRingPulse 2.4s ease-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* WhatsApp Official Logo SVG */}
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="#FFFFFF"
          aria-hidden="true"
          style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.57 14.36C16.32 14.24 15.1 13.64 14.88 13.55C14.65 13.47 14.49 13.43 14.32 13.67C14.16 13.92 13.69 14.47 13.55 14.63C13.41 14.79 13.27 14.81 13.02 14.69C12.78 14.57 11.98 14.31 11.04 13.47C10.31 12.81 9.81 12 9.67 11.75C9.52 11.51 9.65 11.37 9.78 11.25C9.89 11.14 10.02 10.96 10.14 10.82C10.27 10.68 10.31 10.58 10.39 10.42C10.47 10.25 10.43 10.11 10.37 9.99C10.31 9.87 9.81 8.65 9.61 8.15C9.41 7.66 9.21 7.73 9.06 7.72C8.92 7.71 8.76 7.71 8.59 7.71C8.43 7.71 8.16 7.77 7.94 8.01C7.71 8.26 7.08 8.85 7.08 10.05C7.08 11.25 7.96 12.41 8.08 12.57C8.2 12.74 9.8 15.2 12.24 16.25C12.82 16.5 13.27 16.65 13.63 16.76C14.22 16.95 14.76 16.92 15.18 16.86C15.66 16.79 16.65 16.26 16.86 15.68C17.06 15.09 17.06 14.59 17 14.49C16.94 14.4 16.82 14.36 16.57 14.24V14.36Z" />
        </svg>

        {/* Studio Online Indicator Dot */}
        <span
          title="Studio Online"
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
            }}
          />
        </span>
      </a>

      {/* Floating Info Tooltip on Desktop */}
      <div
        className="whatsapp-tooltip"
        style={{
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          padding: '0.55rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(8px)',
          transition: 'opacity 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.15rem',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>Chat on WhatsApp</span>
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Nashik Hub • Typically replies instantly
        </span>
      </div>

      <style>{`
        @keyframes whatsappRingPulse {
          0% {
            transform: scale(0.96);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.35);
            opacity: 0;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
        @media (max-width: 640px) {
          aside[aria-label="Direct WhatsApp Contact"] {
            --whatsapp-bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
            right: 1rem !important;
          }
          aside[aria-label="Direct WhatsApp Contact"] a {
            width: 3.1rem !important;
            height: 3.1rem !important;
          }
          .whatsapp-tooltip {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
}
