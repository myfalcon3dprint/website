# Deployment and Rollback Procedures — Falcon 3D Prints

> Release orchestration, zero-downtime deployment workflows, smoke testing, and emergency rollback protocols.

## Deployment Strategy Overview

- **Hosting Platform**: Vercel (or comparable Node.js Edge / Serverless host) paired with Supabase PostgreSQL and Storage.
- **Model**: Immutable atomic preview builds with instant production domain alias switching.
- **Rule**: No Git operations during current task (local instruction kit development). This document specifies production release operational procedures for subsequent authorized execution.

---

## 1. Pre-Deployment Verification

Before triggering any production deployment:
1. **Gate Verification**: Ensure all criteria in [`release-checklist.md`](../quality/release-checklist.md) are marked `PASS`.
2. **Environment Synchronization**: Ensure all new environment variables required by the new release are populated in the production host console prior to deployment.
3. **Database Migration Completed**: Any backward-compatible schema changes applied and verified on staging database.

---

## 2. Zero-Downtime Deployment Sequence

```text
[1. Build & Test] ──> [2. Staging Validation] ──> [3. Pre-migration (Expand)] ──> [4. Atomic Deploy] ──> [5. Post-deploy Smoke] ──> [6. Traffic Cutover]
```

1. **Build Step**: Build container or serverless bundle; static assets deployed to CDN with cache busting hashes.
2. **Preview Smoke Test**:
   - Access preview deployment URL directly.
   - Run automated HTTP health-check:
     - `GET /api/health` returns `HTTP 200 { "status": "ok", "db": "healthy" }`.
   - Perform end-to-end synthetic transaction on sandbox gateway.
3. **Domain Promotion**: Promote preview build to production custom domain (`falcon3dprints.in`).
4. **Cache Invalidation**: Purge Edge CDN cache for static HTML routes while retaining immutable hashed CSS/JS chunks.

---

## 3. Post-Deployment Verification (Smoke Tests)

Run non-destructive synthetic checks within 5 minutes of cutover:
- [ ] Homepage loads in < 2.0s with correct branding and hero image.
- [ ] Catalog search and category filtering functional.
- [ ] Product detail page loads variants (material, color, size) with correct INR pricing.
- [ ] Test item can be added to cart and persists in cart drawer.
- [ ] Checkout page loads and mounts Razorpay test modal cleanly.
- [ ] Admin login page responds; staff session authentication operational.
- [ ] Error tracking tool (e.g. Sentry) reports zero spikes in unhandled runtime errors.

---

## 4. Emergency Rollback Protocol

If critical defects or payment failures occur post-deployment:

### Immediate Rollback (Within 60 Seconds)
1. **Instant Alias Revert**: In the hosting dashboard (e.g. Vercel), click "Rollback" to revert the production domain alias to the previous verified stable deployment ID.
2. **Purge Edge CDN**: Force cache invalidation to ensure customers receive previous stable assets immediately.
3. **Database Compatibility Check**: Because all migrations follow the two-phase expand-and-contract model (`migration-strategy.md`), the database remains fully compatible with the rolled-back application version.
4. **Post-Rollback Audit**:
   - Verify health-check on production domain returns `HTTP 200`.
   - Confirm active checkout transactions proceed without errors.
   - Assemble engineering team for post-mortem analysis.
