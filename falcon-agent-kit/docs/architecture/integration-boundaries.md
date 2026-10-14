# Integration Boundaries — Falcon 3D Prints

> Defines how the application interacts with external services and the rules governing each boundary.

## Supabase

### Auth

| Boundary | Direction | Transport | Auth |
|---|---|---|---|
| Sign up / Login | Client → Supabase Auth | HTTPS (supabase-js) | Public anon key |
| Session refresh | Client → Supabase Auth | HTTPS | Refresh token |
| Password reset | Client → Supabase Auth | HTTPS + Email | Magic link |
| Admin role check | Server → Supabase Auth | HTTPS | Service role key |

**Rules**:
- Never expose the service role key to the client.
- Always verify sessions server-side before trusting claims.
- Use `@supabase/ssr` for cookie-based session management in Next.js.

### Database

| Boundary | Direction | Transport | Auth |
|---|---|---|---|
| Public reads (products) | Server Component → Supabase | HTTPS | Anon key + RLS |
| Authenticated reads | Server Component → Supabase | HTTPS | User JWT + RLS |
| Mutations | Server Action → Supabase | HTTPS | User JWT + RLS or Service role |
| Admin operations | Server Action → Supabase | HTTPS | Service role + app-level role check |

**Rules**:
- RLS must be enabled on every table.
- Service role key usage requires an application-level role check BEFORE the database call.
- Never pass raw user input into SQL fragments. Always use parameterised queries via supabase-js.
- Use `supabase.rpc()` for complex operations that need atomicity.

### Storage

| Boundary | Direction | Transport | Auth |
|---|---|---|---|
| Product image upload | Admin → Supabase Storage | HTTPS (multipart) | Admin JWT + storage policy |
| Product image read | Any → Supabase Storage | HTTPS (public URL) | Public bucket policy |
| Enquiry attachments | Customer → Supabase Storage | HTTPS (multipart) | Auth JWT + storage policy |
| Enquiry attachment read | Admin → Supabase Storage | HTTPS (signed URL) | Admin JWT + storage policy |

**Rules**:
- Product images bucket: public read, admin-only write.
- Enquiry attachments bucket: private. Signed URLs for admin read. Customer can upload only their own.
- Validate file type and size on upload (server-side, not just client-side).
- Maximum file sizes: images 5MB, attachments 10MB.
- Allowed image types: JPEG, PNG, WebP.
- Allowed attachment types: JPEG, PNG, PDF, STL, OBJ, 3MF.

---

## Razorpay

| Boundary | Direction | Transport | Auth |
|---|---|---|---|
| Create order | Server → Razorpay API | HTTPS REST | Key ID + Key Secret (Basic Auth) |
| Checkout modal | Client → Razorpay JS | Razorpay Script | Key ID (public) |
| Verify payment | Server (in-process) | HMAC computation | Key Secret |
| Webhook | Razorpay → Server API route | HTTPS POST | Webhook Secret (HMAC signature) |
| Refund | Server → Razorpay API | HTTPS REST | Key ID + Key Secret |

### Order creation flow

```
Server: POST https://api.razorpay.com/v1/orders
Body: { amount: <paise>, currency: "INR", receipt: <order_number> }
Response: { id: "order_xxx", ... }
```

### Payment verification

```typescript
// Server-side HMAC verification
const generated_signature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');

if (generated_signature !== razorpay_signature) {
  throw new Error('Payment verification failed');
}
```

### Webhook handling

```
POST /api/webhooks/razorpay
Header: X-Razorpay-Signature
Body: JSON event payload
```

**Rules**:
- Razorpay Key Secret and Webhook Secret are server-only. Never in client bundles.
- Key ID is safe for client (used in checkout modal configuration).
- Always verify webhook signature before processing.
- Process webhooks idempotently — check if the event has already been processed.
- Log webhook events for debugging but redact sensitive fields.
- Handle these webhook events at minimum:
  - `payment.captured` — confirm order
  - `payment.failed` — update order status
  - `refund.processed` — update refund status
- Return 200 to Razorpay quickly; process asynchronously if needed.
- Use sandbox/test mode for development (test key ID starts with `rzp_test_`).

---

## Email (TBD — pending Q-014)

| Boundary | Direction | Transport | Auth |
|---|---|---|---|
| Auth emails | Supabase → Customer email | SMTP (Supabase built-in) | Supabase config |
| Order confirmation | Server → Customer email | TBD | TBD |
| Admin notification | Server → Admin email | TBD | TBD |

**Rules**:
- Supabase handles auth emails (verification, password reset) by default.
- Transactional emails (order confirmation, shipping updates) need a dedicated service.
- Candidates: Resend, SendGrid, AWS SES, or Supabase Edge Functions with SMTP.
- Do not send emails from the client.
- All emails must be tested in development without hitting real inboxes.

---

## Environment variables

```bash
# .env.example — template, NO real values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only Supabase (never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email (when chosen)
# EMAIL_SERVICE_API_KEY=your-email-api-key
```

**Rules**:
- `NEXT_PUBLIC_` prefix = exposed to client browser. Only safe for public keys.
- No `NEXT_PUBLIC_` prefix = server-only. Never in client bundles.
- `.env.local` is gitignored. `.env.example` is committed with placeholder values.
- Validate all required env vars at startup (fail fast, not at first use).
