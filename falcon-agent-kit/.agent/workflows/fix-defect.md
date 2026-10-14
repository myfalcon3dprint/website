# Workflow: Defect Triage & Resolution

> Systematic workflow for diagnosing, reproducing, fixing, and verifying bug reports and test failures without regressions.

## Purpose
Ensures bugs are addressed at root cause with reproduction tests, minimal maintainable edits, and auditable verification evidence.

## Primary Skills Coordinated
- `falcon-engineering`
- `falcon-testing`
- `falcon-gsd-delivery`

---

## Workflow Sequence

### Step 1: Diagnose & Reproduce
1. Inspect bug report, error logs, and stack traces.
2. Formulate a minimal automated reproduction test (unit test or integration test) that reliably fails.
3. Verify test fails with the reported symptoms before modifying application code.

### Step 2: Root Cause Analysis
1. Trace root cause through the call stack: data inconsistency, race condition, boundary condition, or typing error.
2. Determine if similar patterns exist elsewhere in the codebase (systemic defect vs. isolated bug).
3. If defect touches money or permissions, reference `docs/quality/threat-model.md`.

### Step 3: Implement Minimal Fix
1. Apply the smallest, cleanest maintainable fix that addresses the root cause.
2. Preserve all existing unrelated comments, docstrings, and architectural patterns.
3. Do not perform sweeping refactors or upgrade unrelated dependencies.

### Step 4: Verify Fix & Regression Guard
1. Re-run reproduction test: Confirm test passes cleanly.
2. Run full regression test suite (`npm run test`) to ensure zero collateral regressions.
3. Run compiler and linter (`tsc --noEmit && npm run lint`).

### Step 5: Report & Document
1. Record defect cause, reproduction test path, and resolution in `docs/agent/status.md`.
2. Record test output evidence in `docs/agent/evidence.md`.
