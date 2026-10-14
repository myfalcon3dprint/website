---
name: falcon-auth-security
description: Authentication flows, customer session security, RBAC authorization, and threat model verification for Falcon 3D Prints.
---

# Falcon Auth & Security Skill

> Implements secure customer authentication, session management, staff role-based authorization, and threat model defenses.

## Task Triggers
- Implementing customer login, registration, password recovery, or session validation.
- Configuring Next.js middleware route protection or Supabase RLS security policies.
- Conducting security code reviews, vulnerability assessments, or penetration test rehearsals.

## Required Inputs & Source Paths
- Threat Model: [`docs/quality/threat-model.md`](../../../docs/quality/threat-model.md).
- Security Matrix: [`docs/quality/security-matrix.md`](../../../docs/quality/security-matrix.md).
- Environments Guide: [`docs/operations/environments.md`](../../../docs/operations/environments.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review current auth cookies, middleware routes, and Supabase RLS policies.
2. **Define Acceptance Criteria**: Verify all checks in `security-matrix.md` are accounted for. Ensure customer-to-customer data isolation.
3. **Plan**:
   - Customer Auth: Supabase Auth (email + password, magic links, or OTP).
   - Staff Auth: Strict multi-factor / email auth with server-verified role checks stored in `staff_roles` table.
   - Middleware: Next.js middleware acts as first defense layer; server actions perform second defense layer.
4. **Implement**:
   - Secure cookie configuration (`HttpOnly`, `Secure`, `SameSite=Lax`).
   - Implement rate limiting on auth endpoints (max 5 failed attempts per IP/account window).
   - Enforce RLS on all customer-accessible tables:
     ```sql
     CREATE POLICY "Customers view own orders"
     ON orders FOR SELECT
     USING (auth.uid() = customer_id);
     ```
   - Validate and sanitize all user input before queries or HTML output to block injection and XSS.
5. **Verify**:
   - Test IDOR attack: Attempt to query order of User B with session of User A. Must return HTTP 404 or empty.
   - Test admin route with customer session: Must return HTTP 403 Forbidden.
   - Test client bundle: Search build output for `SERVICE_ROLE_KEY` or secrets; must return 0 matches.
6. **Review**: Ensure no old-client identities, default demo passwords, or debug test users remain in migrations or code.
7. **Report**: Log verification outcomes in `docs/agent/evidence.md`.

---

## Invariants & Prohibited Shortcuts
- **Never Rely Solely on Client Gates**: Never hide an admin button with CSS or React conditions without enforcing identical checks server-side.
- **Never Expose Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_` or bundled in client JS.
- **Clean Falcon Identity**: Ensure zero credentials, email templates, or names from previous or third-party projects leak into Falcon.
