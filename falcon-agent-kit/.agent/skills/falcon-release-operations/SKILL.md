---
name: falcon-release-operations
description: Production release gating, evidence collection, operational rehearsals, and rollback procedures for Falcon 3D Prints.
---

# Falcon Release Operations Skill

> Coordinates production release gating, verification evidence validation, deployment execution, and emergency rollback readiness.

## Task Triggers
- Preparing a release candidate for deployment promotion.
- Validating release evidence completeness using automated validation scripts.
- Executing post-deployment smoke tests or rehearsing disaster recovery rollbacks.

## Required Inputs & Source Paths
- Release Checklist: [`docs/quality/release-checklist.md`](../../../docs/quality/release-checklist.md).
- Deployment & Rollback Guide: [`docs/operations/deployment-and-rollback.md`](../../../docs/operations/deployment-and-rollback.md).
- Evidence Log: [`docs/agent/evidence.md`](../../../docs/agent/evidence.md).
- Evidence Schema: [`templates/release-evidence.example.json`](../../../templates/release-evidence.example.json).
- Release Validator Script: [`scripts/validate-release-evidence.py`](../../../scripts/validate-release-evidence.py).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review all required release gates in `docs/quality/release-checklist.md`.
2. **Define Acceptance Criteria**: Verify 0 critical/high security findings, 100% test pass rate, and full payment integrity verification.
3. **Plan**: Sequence release rehearsal: Static checks → Test suite execution → Staging deployment smoke tests → Evidence compilation.
4. **Implement**:
   - Run production build: `npm run build`.
   - Run typecheck and linting: `npm run typecheck && npm run lint`.
   - Run complete test suite: `npm run test`.
   - Generate release evidence JSON summarizing all gate outcomes.
5. **Verify**:
   - Run release evidence validator script:
     ```bash
     python scripts/validate-release-evidence.py path/to/release-evidence.json
     ```
   - Verify script returns exit code 0 and confirms all mandatory gates are `PASS`.
6. **Review**: Ensure sign-off is documented by authorized evaluator. Confirm staging rehearsal was completed without manual interventions.
7. **Report**: Archive release evidence in `docs/agent/evidence.md` and mark release candidate as `Ready for Authorised Release`.

---

## Invariants & Prohibited Shortcuts
- **Do Not Deploy During Kit Development**: Current task is local instruction kit construction. Do not trigger actual live deployments.
- **Never Equate Build Success With Release Readiness**: A green build does not prove payment security, RLS isolation, or accessibility compliance.
- **Honest Evidence Validator**: The validator script validates report completeness, not live security truth. Do not invent synthetic passing logs.
