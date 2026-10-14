---
name: falcon-testing
description: Quality assurance, unit testing, integration tests, E2E user journeys, and test evidence collection for Falcon 3D Prints.
---

# Falcon Testing & Verification Skill

> Executes deterministic testing across all tiers (unit, integration, E2E, security) and records verifiable evidence.

## Task Triggers
- Writing new test suites for features, bug fixes, or security patches.
- Executing regression tests before completing a task or milestone.
- Validating money calculations, state machines, or RLS policies.

## Required Inputs & Source Paths
- Test Matrix: [`docs/quality/test-matrix.md`](../../../docs/quality/test-matrix.md).
- Security Matrix: [`docs/quality/security-matrix.md`](../../../docs/quality/security-matrix.md).
- Evidence Log: [`docs/agent/evidence.md`](../../../docs/agent/evidence.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review existing test files in `tests/unit/`, `tests/integration/`, `tests/e2e/`. Identify untested code paths.
2. **Define Acceptance Criteria**: Specify exact input scenarios, edge cases (zero inventory, payment dropouts, boundary numbers), and assertions.
3. **Plan**: Select appropriate test runner (Vitest for fast unit/integration tests; Playwright for browser E2E journeys).
4. **Implement**:
   - Write deterministic unit tests for pricing, taxes, discount logic, and state transitions.
   - Write integration tests for API routes and server actions with local mock database contexts.
   - Write E2E tests covering the complete checkout and admin order progression flows.
   - Avoid test interdependencies; ensure tests can run in parallel without shared state pollution.
5. **Verify**:
   - Execute test suites locally:
     ```bash
     npm run test:unit
     npm run test:integration
     npx playwright test
     ```
   - Capture exact exit codes, pass counts, and failure traces.
6. **Review**: Ensure no assertions were disabled, commented out, or weakened to make tests artificially green.
7. **Report**: Log complete test outputs in `docs/agent/evidence.md`.

---

## Invariants & Prohibited Shortcuts
- **Never Fake Test Results**: Never fabricate test output logs or mark checks passed without execution evidence.
- **Never Test Against Production**: All automated tests must run against isolated local or staging environments.
- **Zero Flakiness**: Flaky tests must be investigated and resolved at root cause (race conditions, timing issues), not suppressed with arbitrary timeouts.
