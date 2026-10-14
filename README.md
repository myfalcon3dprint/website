# Falcon 3D Prints

Precision additive manufacturing, custom CAD quoting, and rapid on-demand 3D printing engineering studio based in Nashik, Maharashtra.

## Overview

Falcon 3D Prints provides a full-stack digital manufacturing storefront, real-time parametric slicing quote calculator, production queue manager, and customer order tracking portal.

### Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI & State**: React 19, Lucide React, Vanilla CSS custom design system
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Storage**: Supabase Storage (`cad-models` bucket for STL/OBJ/STEP files)
- **Payments**: [Razorpay](https://razorpay.com/) (UPI, Netbanking, Cards, COD fallback)
- **Language**: TypeScript (Strict Mode)

## Getting Started

### Prerequisites

- Node.js 18.17+ or Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/myfalcon3dprint/website.git

# Enter the directory
cd website

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
```

### Environment Variables

Configure your local credentials in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Falcon 3D Prints"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Checks

```bash
# TypeScript verification
npm run typecheck

# Production build
npm run build
```

## License

Private repository. Copyright © Falcon 3D Prints. All rights reserved.
