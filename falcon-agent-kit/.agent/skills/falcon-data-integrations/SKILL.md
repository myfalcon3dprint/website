---
name: falcon-data-integrations
description: Supabase database client, migrations, storage buckets, and Razorpay API integrations for Falcon 3D Prints.
---

# Falcon Data & Integrations Skill

> Manages data persistence, Supabase client initialization, storage bucket operations, external payment APIs, and transaction boundaries.

## Task Triggers
- Writing or updating Supabase PostgreSQL queries, RPC functions, or schema migrations.
- Managing Supabase Storage buckets for customer STL uploads or product photography.
- Integrating Razorpay payment gateway API or third-party logistics/shipping APIs.

## Required Inputs & Source Paths
- Data Model: [`docs/architecture/data-model.md`](../../../docs/architecture/data-model.md).
- Migration Strategy: [`docs/operations/migration-strategy.md`](../../../docs/operations/migration-strategy.md).
- Integration Boundaries: [`docs/architecture/integration-boundaries.md`](../../../docs/architecture/integration-boundaries.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Examine existing database schema and Supabase client factories in `src/server/db/`.
2. **Define Acceptance Criteria**: Define query parameterization, RLS policy compatibility, and error handling for external service timeouts.
3. **Plan**:
   - Establish two distinct Supabase clients:
     - Scoped Client: Initialized with user session cookie / anon key, respecting RLS.
     - Admin Client: Initialized with `SUPABASE_SERVICE_ROLE_KEY`, used strictly inside background jobs and verified webhook handlers.
   - Configure Storage bucket policies for custom quotation files (private, accessible only via signed URLs with 15-minute TTL).
4. **Implement**:
   - Write schema migration files following the timestamped naming convention in `supabase/migrations/`.
   - Wrap multi-table updates (e.g. order creation + inventory deduction) in PostgreSQL transactions.
   - Add database indexes on frequently queried columns (`category_id`, `created_at`, `status`).
5. **Verify**:
   - Run `supabase migration up` on local database. Verify zero errors.
   - Test signed URL generation: Confirm URL expires after designated TTL.
6. **Review**: Ensure no raw user input is ever concatenated into SQL strings.
7. **Report**: Document database changes in `docs/agent/status.md`.

---

## Invariants & Prohibited Shortcuts
- **Never Run Destructive Migrations in One Step**: Follow the expand-and-contract migration strategy.
- **Never Bypass RLS Unnecessarily**: Use the scoped client for all customer-facing routes; reserve the service role client solely for webhooks and background jobs.
