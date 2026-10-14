# Task Template — Falcon 3D Prints

> Standard template for creating, executing, and recording implementation tasks.

## Task Details

- **Task ID**: `TASK-[PHASE]-[NUMBER]` (e.g., `TASK-01-001`)
- **Title**: Brief, imperative task summary (e.g., "Implement Razorpay Webhook Signature Verification")
- **Assigned Skill**: `falcon-[skill-name]` (e.g., `falcon-commerce`)
- **Associated Workflow**: `implement-feature.md` / `fix-defect.md` / `review-security.md`
- **Status**: `PROPOSED` | `IN_PROGRESS` | `VERIFIED` | `BLOCKED`

---

## 1. Acceptance Criteria

Explicit, testable conditions required to consider this task complete:
1. [ ] Criteria 1 (e.g., Returns HTTP 400 when HMAC signature fails)
2. [ ] Criteria 2 (e.g., Successfully updates order status to `confirmed` on valid payment event)
3. [ ] Criteria 3 (e.g., Dispatches order confirmation email via background job)

---

## 2. Invariants & Guardrails

- [ ] Do not violate server-authoritative money rules (integer paise minor units).
- [ ] Do not expose secrets or sensitive customer PII.
- [ ] Preserve existing unrelated code and tests.
- [ ] No Git operations.

---

## 3. Implementation Plan

1. **Inspect**: Examine target files and existing dependencies.
2. **Define**: Formulate unit test or integration test assertions.
3. **Plan**: Outline exact file edits and new modules.
4. **Implement**: Execute atomic code modifications.
5. **Verify**: Execute test runner and capture output.
6. **Review**: Check against security and performance baselines.
7. **Report**: Log results in `docs/agent/status.md` and evidence in `docs/agent/evidence.md`.

---

## 4. Verification Evidence

```markdown
- **Execution Command**: `npm run test:integration -- -t "Razorpay Webhook"`
- **Execution Date**: YYYY-MM-DD HH:MM
- **Test Results**: N passed, 0 failed
- **Log / Artifact**: `tests/fixtures/output/webhook-test.log`
```
