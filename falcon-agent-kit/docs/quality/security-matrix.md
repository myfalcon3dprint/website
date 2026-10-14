# Security Verification Matrix — Falcon 3D Prints

> Practical verification procedures mapped to the [Threat Model](./threat-model.md). Every security claim must be verifiable by concrete evidence.

## Verification Protocol

For each verification check, record:
- **Test ID**: Cross-referenced to Threat Model (e.g., `SEC-T1.1`)
- **Category**: Auth, Access Control, Payment, Injection, Exposure
- **Target Component**: Middleware, API Route, Server Action, DB Policy
- **Method**: Automated integration test, curl simulation, manual audit
- **Pass Criteria**: Concrete HTTP status, error code, or data state
- **Status**: `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`

---

## 1. Authentication & Session Management (T1)

| Check ID | Threat Ref | Verification Procedure | Pass Criteria | Mandatory Context |
|---|---|---|---|---|
| `SEC-AUTH-01` | T1.1 | Send 10 rapid failed login requests to `/api/auth/login` | HTTP 429 after threshold (e.g. 5 attempts); rate limit headers present | Automated test |
| `SEC-AUTH-02` | T1.2 | Inspect cookies returned from auth endpoints | `Secure`, `HttpOnly`, `SameSite=Lax` or `Strict` flags present; no JWT in localStorage | Header inspection |
| `SEC-AUTH-03` | T1.3 | Authenticate and verify session token regeneration | New session identifier issued upon credential validation | Automated test |
| `SEC-AUTH-04` | T1.4 | Request password reset token; attempt re-use after single consumption | Second attempt returns HTTP 400/410; token expired after 15m | Automated test |
| `SEC-AUTH-05` | T1.5 | Attempt user registration with password `< 8` chars or common dictionary word | Rejected with validation error before Supabase persistence | Unit test |

---

## 2. Authorization & Access Control (T2)

| Check ID | Threat Ref | Verification Procedure | Pass Criteria | Mandatory Context |
|---|---|---|---|---|
| `SEC-AUTHZ-01` | T2.1 | Anonymous request to `/admin/*` and `/api/admin/*` | HTTP 401 or redirect to `/login?next=...` | Middleware test |
| `SEC-AUTHZ-02` | T2.1 | Authenticated customer role request to `/admin/*` and `/api/admin/*` | HTTP 403 Forbidden; no admin HTML/JSON leaked | Integration test |
| `SEC-AUTHZ-03` | T2.2 | Staff operator attempting role escalation (modify permissions or refunds) | HTTP 403; only `role: owner` permitted for refunds and role changes | Integration test |
| `SEC-AUTHZ-04` | T2.3 | Customer A querying orders of Customer B via direct ID | HTTP 404 or HTTP 403; RLS filters out other tenant rows | Supabase test |
| `SEC-AUTHZ-05` | T2.4 | Direct POST/PATCH to server actions bypassing UI buttons | Server action validates session role independently of client state | API test |
| `SEC-AUTHZ-06` | T2.5 | IDOR check on custom quotation files and private STL uploads | Signed URL only generated if caller owns the quotation or is staff | Integration test |

---

## 3. Payment & Transaction Integrity (T3)

| Check ID | Threat Ref | Verification Procedure | Pass Criteria | Mandatory Context |
|---|---|---|---|---|
| `SEC-PAY-01` | T3.1 | Send checkout request with altered line-item unit price | Server recalculates total from catalog DB; client price ignored | Integration test |
| `SEC-PAY-02` | T3.2 | Post fake success payload to payment verification route without Razorpay signature | HTTP 400; order status remains `pending_payment` | Integration test |
| `SEC-PAY-03` | T3.3 | Post valid Razorpay webhook with forged `X-Razorpay-Signature` HMAC | HTTP 400 Signature Mismatch; event discarded | Webhook test |
| `SEC-PAY-04` | T3.3 | Send identical valid webhook payload twice (replay attack) | First: 200 (processed); Second: 200 (idempotent no-op; no double fulfillment) | Webhook test |
| `SEC-PAY-05` | T3.5 | Alter currency from `INR` to `USD` or change amount minor units | Verification fails; amount/currency mismatch logged; transaction rejected | Integration test |
| `SEC-PAY-06` | T3.6 | Execute refund server action with non-owner session | HTTP 403 Forbidden; audit log records unauthorized refund attempt | Integration test |

---

## 4. Injection, XSS & Request Forgery (T4)

| Check ID | Threat Ref | Verification Procedure | Pass Criteria | Mandatory Context |
|---|---|---|---|---|
| `SEC-INJ-01` | T4.1 | Inject SQL metacharacters (`' OR 1=1 --`) into search and filter params | Parameterized query handles input safely; syntax errors zero; no data leak | Integration test |
| `SEC-INJ-02` | T4.2 | Submit product review / custom enquiry with `<script>alert(1)</script>` | React renders escaped text node; script does not execute in DOM | E2E test |
| `SEC-INJ-03` | T4.3 | Submit reflected XSS in URL query parameters (`?q=<svg onload=alert(1)>`) | Query value properly escaped in search results heading and input value | E2E test |
| `SEC-INJ-04` | T4.4 | Post state-changing form from external origin | Blocked by CORS/Origin header check and CSRF protection | Integration test |

---

## 5. Data Exposure & Secrets Management (T5)

| Check ID | Threat Ref | Verification Procedure | Pass Criteria | Mandatory Context |
|---|---|---|---|---|
| `SEC-EXP-01` | T5.1 | Grep client-side bundle output for `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` | 0 occurrences in client chunks; only public keys exposed | Build audit |
| `SEC-EXP-02` | T5.2 | Inspect server logs during checkout and login flows | Passwords, card numbers, Razorpay secrets, and full PII redacted | Log review |
| `SEC-EXP-03` | T5.3 | Fetch public customer profile API endpoint | Returns only public fields (displayName); email, phone, address omitted | API test |
| `SEC-EXP-04` | T5.4 | Inspect storage bucket permissions for quotation STLs and customer uploads | Private bucket; public access blocked; accessed solely via timed signed URLs | Storage audit |

---

## Verification Artifacts

All verification runs must be recorded in [`docs/agent/evidence.md`](../agent/evidence.md) with exact dates, commands, environment snapshots, and pass/fail evidence logs.
