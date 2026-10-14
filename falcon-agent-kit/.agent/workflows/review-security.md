# Workflow: Security Review & Vulnerability Verification

> Structured procedure for auditing authentication, role authorization, payment integrity, data exposure, and penetration attack vectors.

## Purpose
Validates the application against the Falcon 3D Prints Threat Model and Security Matrix before any staging or production promotion.

## Primary Skills Coordinated
- `falcon-auth-security`
- `falcon-commerce`
- `falcon-data-integrations`
- `falcon-testing`

---

## Workflow Sequence

### Step 1: Threat Model Alignment & Scope
1. Open `docs/quality/threat-model.md` and `docs/quality/security-matrix.md`.
2. Identify target scope: New endpoints, modified auth middleware, payment webhooks, or updated RLS policies.

### Step 2: Static Analysis & Secret Scanning
1. Search client bundle and source tree for sensitive environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`).
2. Verify `.gitignore` contains `.env.local` and all private secrets files.
3. Run dependency vulnerability scan: `npm audit`.

### Step 3: Authorization & Access Control Verification
1. Test route gates: Send unauthenticated requests to `/admin/*` and customer endpoints. Verify HTTP 401/403.
2. Test IDOR vectors: Verify that querying customer order by ID (`/api/orders/[id]`) rejects callers who are not the order owner or authenticated staff.
3. Verify Supabase RLS policies: Run direct SQL test scripts verifying row filtering behavior.

### Step 4: Payment Integrity Verification
1. Test client-side price tampering: Send checkout request with altered line item price. Confirm server rejects or recalculates canonical total.
2. Test Razorpay webhook signature verification: Submit simulated webhook with invalid HMAC signature; confirm server rejects with HTTP 400.
3. Test replay attack: Submit identical valid webhook payload twice; confirm idempotent handling with no duplicate order fulfillment.

### Step 5: Document Findings & Sign-off
1. For any discovered vulnerabilities, create a finding record in `docs/quality/findings/` using `templates/security-finding-template.md`.
2. Block release promotion if any Critical or High severity findings remain unresolved.
3. Record passing security checks in `docs/agent/evidence.md`.
