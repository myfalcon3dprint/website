# Falcon 3D Prints — Shared Agent Rules

> Concise shared rules and routing for all agents working on this project.

## Routing

| Task class | Skill | Workflow |
|---|---|---|
| Engineering standards, code review | `falcon-engineering` | — |
| Planning, task tracking, handoffs | `falcon-gsd-delivery` | — |
| Architecture mapping, dependency analysis | `falcon-architecture-mapping` | `discover.md` |
| Brand application, logo usage | `falcon-brand` | — |
| Premium UX, visual design | `falcon-premium-experience` | — |
| Animation, transitions, motion | `falcon-ui-motion` | — |
| Storefront pages, catalog, product detail | `falcon-storefront` | `implement-feature.md` |
| Cart, checkout, payment, orders | `falcon-commerce` | `implement-feature.md` |
| Admin panel, production, staff tools | `falcon-admin` | `implement-feature.md` |
| Auth, security, access control | `falcon-auth-security` | `review-security.md` |
| Database, Supabase, Razorpay, APIs | `falcon-data-integrations` | — |
| Testing, quality evidence | `falcon-testing` | — |
| Performance, accessibility | `falcon-performance-accessibility` | — |
| Tool evaluation, dependency decisions | `falcon-tool-selection` | — |
| Release preparation, deployment | `falcon-release-operations` | `verify-release.md` |
| Bug investigation and fix | — | `fix-defect.md` |

## Shared rules

### Code standards

- TypeScript strict mode. No `any` unless explicitly justified and commented.
- React Server Components by default. Client components only when interactivity requires it.
- All monetary values in integer minor units (paise for INR). Type alias: `MoneyPaise`.
- Explicit error boundaries and loading states for every route segment.
- Meaningful variable names. No single-letter names except loop counters.
- One export per file for components. Named exports for utilities.

### File organisation

- Feature code in `src/features/<feature>/`.
- Shared UI primitives in `src/components/ui/`.
- Server-only code in `src/server/`.
- Route handlers must be thin — delegate to feature services.
- No cross-feature imports except through shared types or UI primitives.
- See `docs/architecture/folder-structure.md` for the complete structure.

### Security baseline

- All mutations require authentication verification on the server.
- Admin routes require role verification on the server, not just UI hiding.
- RLS policies on every table. No `service_role` key in client bundles.
- Validate and sanitise all inputs server-side.
- CSRF protection on all state-changing operations.
- Rate limiting on authentication and payment endpoints.
- See `docs/quality/security-matrix.md` for the full matrix.

### Quality baseline

- Every feature needs at least one happy-path and one failure-path test.
- Price calculations need unit tests with edge cases.
- Database constraints need integration tests.
- Admin permissions need tests with multiple role contexts.
- Accessibility: WCAG 2.1 AA minimum.
- Performance: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- See `docs/quality/test-matrix.md` for the full matrix.

### Status tracking

After every work session, update:
- `docs/agent/status.md` — current task, progress, blockers.
- `docs/agent/evidence.md` — verification results for completed work.

### Decision records

When making a non-trivial decision, record it in `docs/project/decisions.md` using the template in `templates/decision-template.md`.

When encountering a question that requires business owner input, add it to `docs/project/open-questions.md`.
