import type { Metadata } from 'next';
import './globals.css';
import PreviewBanner from '@/components/layout/PreviewBanner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Falcon 3D Prints — Where ideas take shapes | Nashik 3D Printing Studio',
  description:
    'High-precision 3D printing studio in Nashik, Maharashtra. Custom 3D quotations, architectural scale models, articulated miniatures, desk accessories, and bespoke planters. FDM & SLA resin printing.',
  keywords: [
    '3D printing Nashik',
    'Custom 3D prints India',
    'Falcon 3D Prints',
    'Architectural models Maharashtra',
    'PLA PETG resin 3D printing',
  ],
  authors: [{ name: 'Falcon 3D Prints' }],
  metadataBase: new URL('http://localhost:3001'),
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Falcon 3D Prints — Where ideas take shapes',
    description:
      'Precision 3D printing studio based in Nashik, Maharashtra. Engineering custom commissions and premium retail prints.',
    type: 'website',
    images: [{ url: '/logo-full.png', width: 1080, height: 1080, alt: 'Falcon 3D Prints Logo' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PreviewBanner />
        <Header />
        <main style={{ minHeight: 'calc(100vh - 12rem)', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
