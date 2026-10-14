# Workflow: Feature Implementation

> Step-by-step workflow for implementing new functionality while preserving system integrity and code quality.

## Purpose
Guides end-to-end implementation of roadmap features (storefront catalog, cart, checkout, admin queues, custom quotations) following the strict execution cycle.

## Primary Skills Coordinated
- `falcon-gsd-delivery`
- `falcon-engineering`
- `falcon-storefront` / `falcon-commerce` / `falcon-admin`
- `falcon-testing`
- `falcon-performance-accessibility`

---

## Workflow Sequence

### Step 1: Requirements & Acceptance Definition
1. Review feature requirements in `docs/project/requirements.md` and acceptance criteria in `docs/project/acceptance-criteria.md`.
2. Create a new task record in `docs/agent/task.md` using `templates/task-template.md`.
3. Define explicit, automated test criteria (unit, integration, and UI acceptance).

### Step 2: Architecture & Data Modeling Plan
1. Check if database schema changes are required. If yes, plan a new migration using `docs/operations/migration-strategy.md`.
2. Define server actions and route handlers with strict TypeScript types and ReturnType definitions.
3. Keep server-only operations isolated from client-rendered React components.

### Step 3: Test-First Scaffolding
1. Write failing unit or integration tests expressing the acceptance criteria in `tests/`.
2. Run test runner to confirm test fails for expected reasons (red stage).

### Step 4: Core Implementation
1. Implement business logic and data persistence.
2. Build UI primitives and view components adhering to the design system (`docs/brand/design-system.md`).
3. Add accessible form labels, keyboard navigation, and micro-interactions with reduced-motion fallbacks.

### Step 5: Verification & Gate Checks
1. Run TypeScript compiler: `tsc --noEmit` (exit code 0).
2. Run linter: `npm run lint` (exit code 0).
3. Run test runner: All unit and integration tests must pass (green stage).
4. Run accessibility and performance audit on feature pages.

### Step 6: Review & Local Handoff
1. Review diff to ensure no dead code, placeholder strings, or hardcoded secrets were committed.
2. Update task status in `docs/agent/task.md` and `docs/agent/status.md` to `VERIFIED`.
3. Record test run evidence in `docs/agent/evidence.md`.
