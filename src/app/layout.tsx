import type { Metadata, Viewport } from 'next';
import './globals.css';
import StorefrontShell from '@/components/layout/StorefrontShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://falcon3dprints.in'),
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
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StorefrontShell>
          {children}
        </StorefrontShell>
      </body>
    </html>
  );
}
