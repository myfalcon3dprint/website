# Workflow: Release Verification & Quality Gates

> Comprehensive release evaluation workflow for validating candidate readiness, verifying release evidence, and obtaining deployment sign-off.

## Purpose
Enforces honest release gates. Validates that all static, functional, security, accessibility, and performance requirements have verifiable evidence before production cutover.

## Primary Skills Coordinated
- `falcon-release-operations`
- `falcon-testing`
- `falcon-auth-security`
- `falcon-performance-accessibility`

---

## Workflow Sequence

### Step 1: Execute Full Verification Suite
1. Run static checks:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```
2. Run test suites:
   ```bash
   npm run test:unit
   npm run test:integration
   npx playwright test
   ```
3. Run security and dependency audit:
   ```bash
   npm audit
   ```

### Step 2: Quality & Performance Audits
1. Run Lighthouse audit on production build: Verify Performance score >= 90, LCP <= 2.0s, CLS <= 0.05.
2. Run axe-core accessibility scan: Verify 0 critical WCAG violations.
3. Verify client bundle sizes: Verify initial storefront JS <= 180 KB gzipped.

### Step 3: Staging Operational Rehearsal
1. Deploy release candidate to isolated Staging environment.
2. Execute smoke tests against staging endpoints.
3. Rehearse database migration script using `docs/operations/migration-strategy.md`.

### Step 4: Compile & Validate Release Evidence
1. Compile release evidence JSON using schema in `templates/release-evidence.example.json`.
2. Execute the release evidence validator:
   ```bash
   python scripts/validate-release-evidence.py path/to/release-evidence.json
   ```
3. Confirm validator outputs `PASS` with exit code 0.

### Step 5: Document Release Sign-off
1. Record final evaluation results in `docs/quality/release-checklist.md`.
2. Confirm no Critical or High severity issues remain open.
3. Sign off candidate as `Ready for Authorised Release`.
