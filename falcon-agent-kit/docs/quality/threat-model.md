# Threat Model — Falcon 3D Prints

> This is a threat analysis, not a certification or complete security audit. It identifies likely threats based on the application's architecture and guides verification work.

## System context

- **Application**: E-commerce storefront + admin panel
- **Users**: Customers (public), staff (admin roles), anonymous visitors
- **Data sensitivity**: Customer PII (name, address, phone, email), payment references, order history
- **Payment processing**: Razorpay (PCI-compliant gateway — we don't handle raw card data)
- **Database**: Supabase-hosted PostgreSQL with RLS
- **Hosting**: TBD (likely Vercel)

## Threat categories

### T1: Authentication & session

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T1.1 | Brute force login | Medium | High | Rate limiting on auth endpoints, account lockout after N failures |
| T1.2 | Session hijacking | Low | Critical | HTTPS-only, httpOnly secure cookies, session expiry |
| T1.3 | Session fixation | Low | High | Regenerate session on login |
| T1.4 | Password reset abuse | Medium | High | Rate limit reset requests, expire tokens quickly, one-time use |
| T1.5 | Weak passwords | Medium | Medium | Minimum password requirements enforced by Supabase |

### T2: Authorization & privilege escalation

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T2.1 | Customer accesses admin | Medium | Critical | Server-side role check in middleware and every admin action |
| T2.2 | Staff exceeds role | Medium | High | Granular permission checks per action, not just "is admin" |
| T2.3 | Customer accesses other customer's data | Medium | Critical | RLS policies, user_id checks in all queries |
| T2.4 | Direct API call bypasses UI restrictions | High | Critical | All permissions enforced server-side, never UI-only |
| T2.5 | IDOR (insecure direct object reference) | High | High | Verify ownership/permission for every resource access by ID |

### T3: Payment integrity

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T3.1 | Price tampering (client sends modified price) | High | Critical | Server calculates all prices. Client values are display only. |
| T3.2 | Payment spoofing (fake success redirect) | High | Critical | Verify Razorpay signature server-side. Never trust redirect alone. |
| T3.3 | Webhook replay/forgery | Medium | Critical | Verify webhook HMAC signature. Process idempotently. |
| T3.4 | Double charge | Low | High | Idempotent order creation. Check if payment already processed. |
| T3.5 | Amount mismatch | Medium | High | Bind order ID, amount, and currency in verification. |
| T3.6 | Unauthorised refund | Low | High | Refund only by owner role. Log all refund actions. |

### T4: Injection & XSS

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T4.1 | SQL injection | Low | Critical | Supabase-js uses parameterised queries. Never interpolate user input into SQL. |
| T4.2 | XSS (stored) | Medium | High | React auto-escapes. Never use `dangerouslySetInnerHTML` with user content. Sanitise admin-entered HTML/markdown. |
| T4.3 | XSS (reflected) | Medium | Medium | Sanitise search params, validate inputs |
| T4.4 | CSRF | Medium | High | CSRF tokens on all state-changing operations. SameSite cookies. |

### T5: Data exposure

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T5.1 | Secret keys in client bundle | High | Critical | No NEXT_PUBLIC_ prefix on service role keys or API secrets |
| T5.2 | Secrets in source control | Medium | Critical | .env in .gitignore, .env.example has placeholders only |
| T5.3 | Error messages leak internals | Medium | Medium | Generic error messages to client. Detailed errors server-side only. |
| T5.4 | API over-fetching (GraphQL/REST returns too much) | Medium | Medium | Select only needed columns. Don't return password hashes, service data. |
| T5.5 | Logs contain sensitive data | Medium | Medium | Redact PII and payment details from logs |

### T6: File upload abuse

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T6.1 | Malicious file upload | Medium | High | Validate file type (magic bytes, not just extension), size limits |
| T6.2 | Storage quota exhaustion | Medium | Medium | Per-user upload limits, total storage monitoring |
| T6.3 | Serving uploaded HTML/JS | Low | High | Serve user uploads with Content-Disposition: attachment or from a separate domain |

### T7: Infrastructure & operational

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T7.1 | Old client data leakage | High | Critical | Ensure no previous client's data, credentials, or branding in codebase |
| T7.2 | Dependency vulnerability | Medium | Varies | Regular `npm audit`, dependabot/renovate |
| T7.3 | Denial of service | Low | High | Rate limiting, CDN caching, Vercel/Supabase built-in protection |
| T7.4 | Missing HTTPS | Low | Critical | Enforce HTTPS redirect. HSTS header. |

### T8: Enumeration & scraping

| ID | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T8.1 | User enumeration via login/register | Medium | Medium | Consistent error messages ("Invalid credentials" not "User not found") |
| T8.2 | Order number enumeration | Medium | Medium | Non-sequential order numbers or UUID-based lookup |
| T8.3 | Product/price scraping | Low | Low | Accept as a cost of public catalog. Rate limit if abusive. |

## Priority matrix

| Priority | Threats |
|---|---|
| **Critical** — Fix before any deployment | T2.1, T2.3, T2.4, T3.1, T3.2, T3.3, T5.1, T7.1 |
| **High** — Fix before production launch | T1.1, T2.2, T2.5, T3.4, T3.5, T4.2, T4.4, T5.2, T6.1 |
| **Medium** — Fix before scale | T1.4, T4.1, T4.3, T5.3, T5.4, T5.5, T6.2, T7.2, T8.1, T8.2 |
| **Low** — Monitor and address | T1.2, T1.3, T6.3, T7.3, T7.4, T8.3 |
