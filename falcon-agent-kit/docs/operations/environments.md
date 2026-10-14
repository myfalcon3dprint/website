# Environment Architecture & Configuration — Falcon 3D Prints

> Definitions, separation rules, and credential requirements across Local, Staging, and Production environments.

## Environment Separation Principle

> [!CAUTION]
> Under no circumstances may development or local testing connect to the production Supabase database, production Razorpay account, or production storage buckets.
> Localhost alone is not isolation. Separate isolated projects/accounts must be used.

---

## 1. Environments Overview

| Environment | Purpose | Database | Payments | Storage | URL / Access |
|---|---|---|---|---|---|
| **Local Development** | Daily development, unit & integration tests | Supabase CLI local Docker instance (`127.0.0.1:54322`) | Razorpay Test Mode Mock / Test Key | Local Supabase storage emulated | `http://localhost:3000` |
| **Staging / Preview** | PR reviews, QA testing, client acceptance | Supabase dedicated Staging project | Razorpay Test Mode live credentials | Supabase Staging bucket | `https://staging.falcon3dprints.in` (example preview URL) |
| **Production** | Live commerce storefront and admin operations | Supabase dedicated Production project (High Availability) | Razorpay Live Mode credentials | Supabase Production bucket (CDN backed) | `https://falcon3dprints.in` |

---

## 2. Environment Variables Configuration

### 2.1 Public Variables (`NEXT_PUBLIC_*`)
Exposed to the browser. Must NEVER contain sensitive credentials.

```bash
# Public App Configuration
NEXT_PUBLIC_SITE_URL=https://falcon3dprints.in
NEXT_PUBLIC_APP_NAME="Falcon 3D Prints"

# Supabase Public API (Scoped by Row Level Security)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# Razorpay Client Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

### 2.2 Server-Only Secrets
Accessible ONLY in Node.js server runtime, API Route handlers, and Server Actions.

```bash
# Supabase Privileged Service Role (Bypasses RLS - NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Razorpay Webhook & Payment Verification Secret
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Admin / System Config
ADMIN_SESSION_SECRET=strong_random_secret_32_chars
ENCRYPTION_KEY=strong_aes_key_32_chars
```

---

## 3. Secret Rotation & Hygiene Procedures

1. **Secret Scanning**: Use automated pre-commit scanners or static analysis scripts to detect hardcoded API keys.
2. **Key Rotation Schedule**:
   - Razorpay Webhook secrets rotated annually or immediately upon suspected leak.
   - Supabase Service Role key rotated via Supabase Dashboard with zero-downtime grace period.
3. **Environment Audit Checklist**:
   - Verify all variables in `.env.example` are documented with placeholder descriptions.
   - Verify `.env.local` and `.env*.local` are explicitly listed in `.gitignore`.
