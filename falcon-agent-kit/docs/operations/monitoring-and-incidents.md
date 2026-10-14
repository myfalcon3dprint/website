# Monitoring, Alerting & Incident Response — Falcon 3D Prints

> Operational monitoring, redacted structured logging, metrics, alerting thresholds, and incident management procedures.

## Observability Architecture

The observability stack monitors storefront health, checkout success, payment webhooks, database connection saturation, and administrative activities.

---

## 1. Structured Logging & PII Masking Standards

All application logs must be emitted as structured JSON to stdout, formatted with context fields:
```json
{
  "timestamp": "2026-10-11T19:15:00.000Z",
  "level": "info",
  "service": "falcon-storefront",
  "context": "checkout.process_payment",
  "order_id": "ord_102938475",
  "amount_paise": 149900,
  "currency": "INR",
  "razorpay_order_id": "order_EKfMRda892hf",
  "status": "success"
}
```

### Redaction Rules
> [!IMPORTANT]
> The logger middleware must sanitize and strip sensitive information before log emission:
- **Cardholder Data**: Full card numbers, CVVs, expiry dates must never touch server logs (handled entirely by Razorpay frontend elements).
- **Credentials**: Passwords, auth tokens, session cookies, and API keys redacted with `[REDACTED]`.
- **Customer PII**: Phone numbers, full postal addresses, and customer names omitted from routine debug logs; only non-identifying IDs (`order_id`, `customer_id`) permitted.

---

## 2. Key Operational Metrics & Alerting Thresholds

| Metric | Target | Warning Threshold | Critical Alert Threshold | Channel |
|---|---|---|---|---|
| **5xx Error Rate** | < 0.1% of requests | > 1.0% over 5m | > 3.0% over 2m | Ops WhatsApp / Email |
| **Checkout Failure Rate** | < 2.0% | > 5.0% over 15m | > 10.0% over 10m | Immediate SMS / Alert |
| **Razorpay Webhook Failures** | 0 failures | >= 1 failed verification | >= 3 consecutive failed webhooks | Ops Urgent Channel |
| **Database Pool Saturation** | < 60% active | > 80% active | > 90% active connections | Database Monitor |
| **LCP (Mobile p75)** | <= 2.0s | > 2.5s | > 3.5s | Weekly Perf Report |

---

## 3. Incident Severity Levels & Response Protocols

### Severity 1: Critical Emergency (Down / Data Loss / Payment Broken)
- **Examples**: Checkout failing universally, Razorpay webhooks dropping, database inaccessible, security breach.
- **Response Time**: < 15 minutes.
- **Protocol**:
  1. Notify Lead Engineer and Business Owner.
  2. Implement mitigation (failover, maintenance mode, or rollback).
  3. Reconcile transactions immediately once restored.
  4. Publish Post-Incident Review (PIR) within 48 hours.

### Severity 2: Major Degradation
- **Examples**: Admin panel unreachable while storefront operates, search degradation, email dispatch delayed.
- **Response Time**: < 1 hour.
- **Protocol**: Route around issue, investigate error traces, deploy patch.

### Severity 3: Minor Defect
- **Examples**: Visual glitch on specific mobile browser, minor non-blocking filter defect.
- **Response Time**: Next business day / routine sprint task.

---

## 4. Post-Incident Review (PIR) Template

Every Sev 1 or Sev 2 incident requires a documented PIR in `docs/operations/incidents/`:
- **Incident Summary & Timeline**
- **Root Cause Analysis (5 Whys)**
- **Customer Impact Assessment**
- **Action Items & Preventive Controls**
