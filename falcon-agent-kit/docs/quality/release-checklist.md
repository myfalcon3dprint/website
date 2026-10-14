# Production Release Checklist & Gates — Falcon 3D Prints

> Strict criteria and verification gates that must be satisfied before any release candidate is promoted to production.

## Honest Release Principle

> [!IMPORTANT]
> Never equate a successful build or dependency scan with production readiness.
> Block readiness for unresolved critical/high security findings, payment-integrity defects, authorization failures, or missing mandatory evidence.

We distinguish four explicit stages:
1. **Implemented**: Code and assets exist in workspace.
2. **Locally Verified**: Automated test suites and manual rehearsals pass on developer machine with local services.
3. **Staging Verified**: Validated against staging Supabase instance and Razorpay sandbox.
4. **Ready for Authorised Release**: Sign-off from business owner and QA lead with complete release evidence artifact.

---

## Stage 1: Build & Static Integrity
- [ ] TypeScript compilation (`tsc --noEmit`) passes with zero errors and zero warnings.
- [ ] ESLint passes with zero warnings (`npm run lint`).
- [ ] Production build succeeds (`npm run build`) without dynamic route bailout errors.
- [ ] Bundle analyzer confirms no server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`) are bundled into client assets.
- [ ] Dependency security check (`npm audit`) shows 0 Critical and 0 High vulnerabilities.

---

## Stage 2: Functional & Integration Integrity
- [ ] Unit test suite passes 100% (`npm run test:unit`).
- [ ] Integration test suite with local Supabase passes 100% (`npm run test:integration`).
- [ ] Storefront customer flow E2E passes:
  - Browse catalog → Filter variants → Add to cart → Checkout with guest/account.
- [ ] Admin panel operations E2E passes:
  - Order review → Production stage update → Stock adjustment → Role permission enforcement.
- [ ] Money calculations verified:
  - Integer minor units (paise) used throughout; zero floating-point arithmetic drift.
  - Razorpay order amount strictly matches server-calculated cart total.

---

## Stage 3: Security & Data Protection Gates
- [ ] Threat model verification matrix checks passed (all checks in `security-matrix.md` status `PASS`).
- [ ] Razorpay webhook HMAC signature verification tested with valid and forged payloads.
- [ ] RLS policies verified: Tenant/customer isolation confirmed; direct SQL access tests pass.
- [ ] Authentication session expiry and CSRF protection active.
- [ ] No old-client or placeholder branding, dummy emails, or test credentials left in codebase.

---

## Stage 4: Operational Readiness
- [ ] Database migration script rehearsed on staging; backward-compatible rollbacks tested.
- [ ] Environment variable checklist verified for production target.
- [ ] Structured logging configured; PII and credit card numbers masked in logs.
- [ ] Error alerting configured (e.g. Sentry) with test exception triggered and acknowledged.
- [ ] Database backup snapshot scheduled and restore procedure rehearsed.

---

## Release Gate Sign-off Template

```markdown
### Release Gate Verification Record
- **Release Version**: v1.0.0-rc1
- **Target Environment**: Production
- **Evaluator**: Lead Architect & QA Lead
- **Evaluation Date**: YYYY-MM-DD
- **Security Check Status**: PASS (0 Critical, 0 High)
- **Payment Verification**: PASS (Razorpay signature & webhook HMAC verified)
- **Automated Tests**: Total 48 / Passed 48 / Failed 0
- **Release Status**: AUTHORISED / BLOCKED
- **Evidence File**: docs/agent/evidence.md
```
