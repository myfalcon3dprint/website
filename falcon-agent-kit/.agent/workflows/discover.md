# Workflow: Project Discovery & Architecture Baseline

> Step-by-step workflow for discovering an existing project, mapping architecture boundaries, and generating a verified baseline audit.

## Purpose
Establishes truth about the current state of code, dependencies, routes, security policies, and brand assets before planning or making code modifications.

## Primary Skills Coordinated
- `falcon-architecture-mapping`
- `falcon-engineering`
- `falcon-brand`
- `falcon-gsd-delivery`

---

## Workflow Sequence

### Step 1: Inventory Filesystem & Package Manifests
1. Inspect root directory for configuration files (`package.json`, `tsconfig.json`, `.env.example`, Supabase config).
2. Record exact framework version, runtime, and major installed dependencies.
3. Check for lockfile presence and consistency (`package-lock.json` or `pnpm-lock.yaml`).
4. Note confirmed implementations vs. unverified code vs. missing files.

### Step 2: Route & Component Architecture Discovery
1. Map application entry points in `src/app/` (Next.js App Router) or `pages/`.
2. Trace routes to their underlying UI components, layout wrappers, and server data fetchers.
3. Check Graphify tool availability: If present, run Graphify discovery commands. If absent, construct explicit Mermaid component hierarchies manually.
4. Record findings in `docs/architecture/system-overview.md` and `docs/architecture/folder-structure.md`.

### Step 3: Data & Authentication Boundary Discovery
1. Inspect database schema files or Supabase migrations in `supabase/migrations/`.
2. Verify Row Level Security (RLS) status across all tables: Identify whether tables have RLS enabled and whether policies exist.
3. Trace authentication flows: Supabase Auth client initialization, middleware session validation, and cookie handling.
4. Record findings in `docs/architecture/data-model.md` and `docs/architecture/integration-boundaries.md`.

### Step 4: Brand & Asset Verification
1. Inspect `assets/brand/originals/` and `public/` for logos and images.
2. Verify brand text matches Falcon 3D Prints standards ("Where ideas take shapes", Nashik address, +91 phone).
3. Record asset inventory and checksums in `docs/brand/asset-manifest.json`.

### Step 5: Synthesize Baseline Audit Report
1. Classify all findings into:
   - Confirmed implementation
   - Documented but unverified behavior
   - Evidence-backed problems
   - Proposed improvements
   - Missing business decisions
2. Update `docs/project/baseline-audit.md` with cited source paths and verifiable facts.
3. Update `docs/agent/status.md` with completed discovery status.
