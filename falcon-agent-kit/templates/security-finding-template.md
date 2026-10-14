# Security Vulnerability Finding Record — Falcon 3D Prints

> Standard format for documenting, evaluating, and remediating discovered security vulnerabilities.

## Finding Overview

- **Finding ID**: `SEC-FIND-[YYYY]-[NUMBER]` (e.g. `SEC-FIND-2026-001`)
- **Severity**: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW` | `INFORMATIONAL`
- **CVSS Score (Estimated)**: e.g. 8.2 (CVSS:3.1/...)
- **Threat Model Category**: T1 (Auth) / T2 (Access Control) / T3 (Payment) / T4 (Injection) / T5 (Exposure)
- **Status**: `OPEN` | `FIX_IN_PROGRESS` | `VERIFIED_RESOLVED` | `ACCEPTED_RISK`
- **Discovered Date**: YYYY-MM-DD
- **Target Component / Endpoint**: e.g., `/api/admin/orders/[id]/update-status`

---

## 1. Vulnerability Description

Concise description of the flaw, underlying mechanism, and potential exploit vector:
- Example: "Admin order status transition endpoint did not verify staff session role, allowing unauthenticated caller to trigger arbitrary status transitions."

---

## 2. Proof of Concept (PoC) / Reproduction Steps

Exact reproduction commands or code required to replicate the vulnerability locally:
```bash
# Example curl triggering unauthenticated status update
curl -X POST http://localhost:3000/api/admin/orders/ord_123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

**Observed Result**: HTTP 200 OK (Status transitioned).
**Expected Result**: HTTP 401 Unauthorized or HTTP 403 Forbidden.

---

## 3. Impact Assessment

- **Confidentiality Impact**: None / Partial / Complete
- **Integrity Impact**: High (orders can be marked shipped without fulfillment)
- **Availability Impact**: None

---

## 4. Remediation Plan & Resolution

1. **Root Cause**: Missing role middleware guard on route handler.
2. **Fix Applied**: Wrap route handler in `withStaffAuth(['admin', 'operator'])` middleware.
3. **Verification Command**:
   ```bash
   npm run test:integration -- -t "Admin Orders Auth Guard"
   ```
4. **Resolution Date**: YYYY-MM-DD
5. **Verified By**: Security Reviewer
