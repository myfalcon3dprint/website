'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import PreviewBanner from './PreviewBanner';

interface StorefrontShellProps {
  children: React.ReactNode;
}

export default function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <PreviewBanner />
      <Header />
      <main id="main-content" style={{ minHeight: 'calc(100vh - 12rem)', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
