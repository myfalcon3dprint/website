# Architectural Decisions — Falcon 3D Prints

> Record format: see `templates/decision-template.md`

## ADR-001: Next.js App Router as framework

- **Status**: Accepted
- **Date**: 2026-10-11
- **Context**: Need a React framework with SSR/SSG for SEO, API routes for server logic, and good TypeScript support.
- **Decision**: Use Next.js 14+ with the App Router (not Pages Router).
- **Rationale**: App Router provides React Server Components (reduced client JS), nested layouts, streaming, and is the recommended approach for new Next.js projects. SSR/SSG is critical for product page SEO.
- **Alternatives considered**: Remix (good but smaller ecosystem in India), Vite + React (no SSR without extra setup), Vanilla HTML/JS (insufficient for the complexity).
- **Consequences**: Must use RSC-compatible patterns. Some libraries may not work in server components. Team must understand the server/client component boundary.

## ADR-002: Supabase for backend services

- **Status**: Accepted
- **Date**: 2026-10-11
- **Context**: Need managed database, authentication, file storage, and real-time capabilities.
- **Decision**: Use Supabase (hosted PostgreSQL + Auth + Storage + Realtime).
- **Rationale**: Managed PostgreSQL with RLS, built-in auth supporting email/password and OAuth, storage with access policies, generous free tier for development. Strong TypeScript SDK.
- **Alternatives considered**: Firebase (NoSQL less suitable for relational e-commerce data), self-hosted PostgreSQL (operational overhead), PlanetScale (MySQL, less RLS support).
- **Consequences**: Must write and maintain RLS policies for every table. Must use Supabase client libraries. Vendor lock-in on auth and storage APIs.

## ADR-003: Razorpay for payments

- **Status**: Accepted
- **Date**: 2026-10-11
- **Context**: Indian e-commerce requires Indian payment gateway supporting UPI, cards, wallets, netbanking.
- **Decision**: Use Razorpay.
- **Rationale**: Market leader in India, supports all major Indian payment methods, good documentation, webhook support, sandbox for testing.
- **Alternatives considered**: PayU, Cashfree, Stripe (limited Indian payment method support).
- **Consequences**: Must implement server-side signature verification. Must handle webhook-based payment confirmation. Must use Razorpay-specific order creation flow.

## ADR-004: TypeScript strict mode

- **Status**: Accepted
- **Date**: 2026-10-11
- **Context**: E-commerce involves money calculations, complex state, and security-sensitive operations.
- **Decision**: Enable TypeScript strict mode. No `any` unless explicitly justified with a comment.
- **Rationale**: Type safety catches bugs at compile time, especially important for money handling and API contracts.
- **Consequences**: Slightly more verbose code. Some third-party types may need augmentation.

## ADR-005: Integer minor units for money

- **Status**: Accepted
- **Date**: 2026-10-11
- **Context**: Floating-point arithmetic causes rounding errors in financial calculations.
- **Decision**: All monetary values stored and calculated as integer paise (1 INR = 100 paise). Type alias `MoneyPaise = number`. Display formatting is a presentation concern only.
- **Rationale**: Eliminates floating-point rounding errors. Matches Razorpay's expected input format. Standard practice in payment systems.
- **Consequences**: Must convert user-facing prices (rupees) to paise at input boundary. Must format paise back to rupees at display boundary. Must document rounding rules for division (e.g., tax calculation).

## ADR-006: Feature-based code organisation

- **Status**: Accepted
- **Date**: 2026-10-11
- **Context**: Need a scalable code organisation that keeps related code together and prevents cross-contamination.
- **Decision**: Organise business logic in `src/features/` with clear ownership boundaries. See `folder-structure.md`.
- **Rationale**: Feature folders keep related code together, making it easier to understand, test, and modify. Prevents the "everything in utils" anti-pattern.
- **Consequences**: Must enforce import boundaries (features can import from `components/ui` and `lib/` but not from other features). May need to extract shared types.

## ADR-007: Styling approach — PENDING

- **Status**: Pending (Q-010)
- **Date**: 2026-10-11
- **Context**: Need to choose CSS approach. Options are Tailwind CSS (utility-first, fast iteration) or vanilla CSS with design tokens (full control, no build dependency).
- **Decision**: TBD — awaiting owner preference.
- **Recommended**: Tailwind CSS v3+ for rapid development with design token configuration.
- **Consequences**: Affects all UI component implementation.

## ADR-008: 3D model viewer — DEFERRED

- **Status**: Deferred
- **Date**: 2026-10-11
- **Context**: Interactive 3D product previews could be a differentiator for a 3D printing business.
- **Decision**: Defer to Phase 8 (Polish). Implement only if business case is clear and performance budget allows.
- **Rationale**: 3D viewer libraries (Three.js, model-viewer) add significant bundle size. Most customers will be satisfied with good product photography. The 3D viewer should not block the core e-commerce functionality.
- **Consequences**: Product pages must work well with static images first. 3D viewer, if added, must be lazy-loaded and behind a "View in 3D" interaction.
