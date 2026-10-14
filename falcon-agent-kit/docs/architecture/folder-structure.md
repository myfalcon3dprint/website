# Folder Structure — Falcon 3D Prints

> Proposed application structure for Next.js 14+ App Router with feature-based organisation.

## Structure

```text
falcon-3d-prints/                    # Project root
├── .env.example                     # Environment variable template (no secrets)
├── .env.local                       # Local environment (gitignored)
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration (if ADR-007 selects Tailwind)
├── tsconfig.json                    # TypeScript configuration (strict mode)
├── package.json
├── package-lock.json
│
├── public/                          # Static assets served at /
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml                  # Generated or static
│   └── brand/                       # Optimised brand assets for web
│       ├── logo.svg
│       ├── logo-dark.svg
│       └── og-image.jpg
│
├── supabase/                        # Supabase project files
│   ├── config.toml                  # Supabase CLI config
│   ├── migrations/                  # Database migrations (sequential)
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   ├── 00003_storage_policies.sql
│   │   └── ...
│   └── seed.sql                     # Development seed data (NOT production data)
│
├── src/
│   ├── app/                         # Next.js App Router — routes only
│   │   ├── layout.tsx               # Root layout (HTML shell, fonts, providers)
│   │   ├── page.tsx                 # Homepage
│   │   ├── not-found.tsx            # 404 page
│   │   ├── error.tsx                # Global error boundary
│   │   ├── loading.tsx              # Global loading state
│   │   │
│   │   ├── (storefront)/            # Route group: public pages
│   │   │   ├── layout.tsx           # Storefront layout (header, footer)
│   │   │   ├── product/
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   ├── category/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── search/
│   │   │   │   └── page.tsx
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   ├── order-confirmation/
│   │   │   │   └── [orderId]/
│   │   │   │       └── page.tsx
│   │   │   ├── contact/
│   │   │   │   └── page.tsx
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (account)/               # Route group: authenticated customer
│   │   │   ├── layout.tsx           # Account layout (sidebar nav)
│   │   │   ├── account/
│   │   │   │   ├── page.tsx         # Dashboard / order history
│   │   │   │   ├── orders/
│   │   │   │   │   └── [orderId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── addresses/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │
│   │   ├── (auth)/                  # Route group: auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/                   # Admin panel (protected)
│   │   │   ├── layout.tsx           # Admin layout (sidebar, role check)
│   │   │   ├── page.tsx             # Admin dashboard
│   │   │   ├── products/
│   │   │   │   ├── page.tsx         # Product list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Edit product
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── production/
│   │   │   │   └── page.tsx         # Production queue
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── enquiries/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── staff/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                     # API routes (webhooks, external integrations)
│   │       ├── webhooks/
│   │       │   └── razorpay/
│   │       │       └── route.ts
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── features/                    # Feature modules — business logic
│   │   ├── catalog/
│   │   │   ├── actions.ts           # Server actions
│   │   │   ├── queries.ts           # Data fetching functions
│   │   │   ├── types.ts             # Feature-specific types
│   │   │   ├── utils.ts             # Feature-specific utilities
│   │   │   └── components/          # Feature-specific components
│   │   │       ├── ProductCard.tsx
│   │   │       ├── ProductGrid.tsx
│   │   │       ├── ProductGallery.tsx
│   │   │       ├── CategoryNav.tsx
│   │   │       └── SearchBar.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   ├── types.ts
│   │   │   ├── hooks.ts             # Client-side hooks (useCart)
│   │   │   └── components/
│   │   │       ├── CartDrawer.tsx
│   │   │       ├── CartItem.tsx
│   │   │       └── CartSummary.tsx
│   │   │
│   │   ├── checkout/
│   │   │   ├── actions.ts           # Create order, verify payment
│   │   │   ├── types.ts
│   │   │   ├── validation.ts        # Address, form validation
│   │   │   └── components/
│   │   │       ├── CheckoutForm.tsx
│   │   │       ├── OrderSummary.tsx
│   │   │       ├── AddressForm.tsx
│   │   │       └── PaymentButton.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── OrderList.tsx
│   │   │       ├── OrderDetail.tsx
│   │   │       └── OrderTimeline.tsx
│   │   │
│   │   ├── production/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── ProductionQueue.tsx
│   │   │       └── StatusPipeline.tsx
│   │   │
│   │   ├── customers/
│   │   │   ├── queries.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       └── CustomerList.tsx
│   │   │
│   │   ├── enquiries/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── EnquiryForm.tsx
│   │   │       └── EnquiryList.tsx
│   │   │
│   │   └── admin/
│   │       ├── actions.ts           # Admin-specific actions (bulk ops, staff mgmt)
│   │       ├── queries.ts
│   │       ├── types.ts
│   │       └── components/
│   │           ├── AdminSidebar.tsx
│   │           ├── AdminHeader.tsx
│   │           ├── DataTable.tsx
│   │           └── StatsCard.tsx
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Reusable primitives (no business logic)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── Pagination.tsx
│   │   │
│   │   └── layout/                  # Layout components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Logo.tsx
│   │       └── Container.tsx
│   │
│   ├── server/                      # Server-only code (never imported client-side)
│   │   ├── auth/
│   │   │   ├── middleware.ts        # Auth middleware
│   │   │   ├── roles.ts            # Role definitions and checks
│   │   │   └── session.ts          # Session utilities
│   │   ├── db/
│   │   │   ├── client.ts           # Supabase server client (service role)
│   │   │   └── types.ts            # Generated database types
│   │   ├── integrations/
│   │   │   ├── razorpay.ts         # Razorpay server SDK wrapper
│   │   │   └── email.ts            # Email service wrapper
│   │   └── jobs/
│   │       └── stock-release.ts    # Stock reservation cleanup
│   │
│   ├── lib/                         # Small, genuinely shared utilities
│   │   ├── money.ts                # MoneyPaise type, formatting, rounding
│   │   ├── dates.ts                # Date formatting utilities
│   │   ├── validation.ts           # Shared validation schemas (zod)
│   │   ├── constants.ts            # App-wide constants
│   │   └── supabase/
│   │       ├── client.ts           # Browser Supabase client
│   │       ├── server.ts           # Server component Supabase client
│   │       └── middleware.ts       # Middleware Supabase client
│   │
│   ├── styles/                      # Global styles
│   │   ├── globals.css             # Global CSS, design tokens
│   │   └── fonts.ts                # Font configuration (next/font)
│   │
│   └── types/                       # Shared types (cross-feature)
│       ├── database.ts             # Generated Supabase types
│       ├── money.ts                # MoneyPaise, Currency
│       └── roles.ts                # Role enum, Permission type
│
├── tests/
│   ├── unit/                        # Unit tests (business logic, utils)
│   │   ├── money.test.ts
│   │   ├── validation.test.ts
│   │   └── features/
│   │       ├── checkout.test.ts
│   │       └── cart.test.ts
│   ├── integration/                 # Integration tests (API routes, DB)
│   │   ├── api/
│   │   │   └── razorpay-webhook.test.ts
│   │   └── db/
│   │       └── rls-policies.test.ts
│   ├── e2e/                         # End-to-end tests (Playwright)
│   │   ├── checkout.spec.ts
│   │   ├── admin-products.spec.ts
│   │   └── auth.spec.ts
│   └── fixtures/                    # Test data
│       ├── products.json
│       └── orders.json
│
└── falcon-agent-kit/                # This kit (development reference)
    └── ...
```

## Import rules

| From | Can import from | Cannot import from |
|---|---|---|
| `src/app/` routes | `src/features/`, `src/components/`, `src/lib/`, `src/types/` | `src/server/` (only via Server Components/Actions) |
| `src/features/<X>/` | Own feature, `src/components/ui/`, `src/lib/`, `src/types/` | Other features (`src/features/<Y>/`) |
| `src/components/ui/` | `src/lib/`, `src/types/` | `src/features/`, `src/server/` |
| `src/server/` | `src/lib/`, `src/types/` | `src/components/`, `src/features/` (feature imports server via actions) |
| `src/lib/` | `src/types/` | Everything else |

### Key constraint: Server isolation

The `src/server/` directory contains:
- Supabase service role client (has admin access, bypasses RLS)
- Razorpay secret key usage
- Email service credentials

These modules must **never** be imported in Client Components or any module that ends up in the browser bundle. Next.js App Router enforces this via the `'use server'` boundary, but the folder structure provides an additional organisational signal.

## Migration plan

Since this is a greenfield project, no migration from an existing structure is needed. If code is later reorganised:

1. Move one feature at a time, starting with the least-depended-on feature.
2. Update all imports in the moved feature's consumers.
3. Run the full test suite after each move.
4. Never move more than one feature per task.

## Where things belong

| Content | Location |
|---|---|
| Database migrations | `supabase/migrations/` |
| Static assets (favicon, robots) | `public/` |
| Optimised brand assets | `public/brand/` |
| Original brand assets | `falcon-agent-kit/assets/brand/originals/` |
| Environment config | `.env.local` (gitignored), `.env.example` (committed) |
| Generated types | `src/types/database.ts` (from `supabase gen types`) |
| Test data | `tests/fixtures/` |
| Documentation | `falcon-agent-kit/docs/` |
