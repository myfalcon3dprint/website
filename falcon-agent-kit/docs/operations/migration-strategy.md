# Database Migration Strategy & Versioning — Falcon 3D Prints

> Procedures for safe, repeatable, and non-destructive PostgreSQL migrations managed via Supabase CLI.

## Guiding Principles

1. **Forward-Only, Non-Destructive**: Never perform destructive schema changes (e.g. dropping columns or tables) in a single deployment step.
2. **Two-Phase Deployments for Schema Changes**:
   - Phase 1 (Expand): Add new nullable column or table; application code writes to both old and new.
   - Phase 2 (Contract): Backfill historical data, update reads to new column, deprecate and safely drop old column in subsequent release.
3. **Rehearsal Required**: Every migration script must run without errors against a clean local database and staging environment prior to production execution.

---

## 1. Migration File Structure

All migrations reside in `supabase/migrations/` using timestamped prefixes:
```text
supabase/migrations/
├── 20261011000001_initial_schema.sql
├── 20261011000002_enable_rls_policies.sql
├── 20261011000003_create_order_state_machine.sql
└── 20261011000004_catalog_search_indexes.sql
```

Each migration file must:
- Include a descriptive header comment documenting purpose and author.
- Contain pure SQL compatible with PostgreSQL 15+.
- Define idempotent operations where possible (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Explicitly configure Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

---

## 2. Migration Execution Workflow

### Step 1: Local Development
```bash
# Start local Supabase instance
supabase start

# Create new migration file
supabase migration new feature_name

# Edit SQL in supabase/migrations/<timestamp>_feature_name.sql

# Apply migration locally and test
supabase migration up
supabase db reset # Verify clean bootstrap from zero
```

### Step 2: Testing RLS Policies
Always run automated SQL tests or integration tests to verify:
- Unauthenticated users cannot read private tables (orders, customer addresses, audit logs).
- Authenticated customers can read only their own rows (`auth.uid() = customer_id`).
- Staff roles can access only their authorized views.

### Step 3: Staging Application
- Apply migration to Staging Supabase project using GitHub Actions or authorized migration command:
  ```bash
  supabase db push --linked
  ```
- Run integration test suite against staging database.

### Step 4: Production Deployment
- Take an on-demand database backup snapshot via Supabase Dashboard before applying migration.
- Execute migration during scheduled maintenance window or low-traffic window.
- Verify application health endpoints and database connection pools.

---

## 3. Rollback & Emergency Recovery Strategy

- Because automated down-migrations can be risky with relational data, create an explicit rollback SQL script for complex migrations:
  `supabase/migrations/reverts/<timestamp>_feature_name_rollback.sql`
- If a migration fails mid-flight, PostgreSQL transaction blocks roll back atomicity automatically.
- If data corruption occurs post-migration, restore from the pre-migration snapshot (see [`backup-and-restore.md`](./backup-and-restore.md)).
