---
name: falcon-commerce
description: Cart state, checkout calculations, Razorpay payment processing, and order lifecycle for Falcon 3D Prints.
---

# Falcon Commerce & Payment Skill

> Implements server-authoritative cart management, transparent checkout, Razorpay payment integration, and atomic order creation.

## Task Triggers
- Developing or modifying cart logic, line item calculations, or shipping tiers.
- Integrating Razorpay payment gateway, order creation, and webhook signature verification.
- Handling payment success, failure, retry, or refund reconciliation.

## Required Inputs & Source Paths
- Requirements: [`docs/project/requirements.md`](../../../docs/project/requirements.md).
- Threat Model: [`docs/quality/threat-model.md`](../../../docs/quality/threat-model.md) (T3: Payment Integrity).
- Security Matrix: [`docs/quality/security-matrix.md`](../../../docs/quality/security-matrix.md).
- Data Model: [`docs/architecture/data-model.md`](../../../docs/architecture/data-model.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review `orders`, `order_items`, and `payment_transactions` tables in data model.
2. **Define Acceptance Criteria**:
   - Zero floating-point rounding errors (integer paise).
   - Server re-calculates all totals from catalog database upon checkout.
   - Razorpay webhook signature cryptographically validated using HMAC SHA256.
   - Browser redirect is NEVER treated as proof of payment.
3. **Plan**:
   - Step 1: Customer initiates checkout → Server computes order total → Server calls Razorpay API to create `order_id` → Server creates pending order record.
   - Step 2: Customer completes payment on Razorpay modal → Razorpay dispatches `payment.captured` webhook.
   - Step 3: Server webhook handler validates HMAC signature → Server transitions order to `confirmed` → Server atomically decrements ready-stock inventory or queues print job.
4. **Implement**:
   - Implement checkout API route / server action with server-side price lookup.
   - Bind order ID, amount, and currency (`INR`) in verification.
   - Implement webhook handler with idempotency check (check if `payment_id` already processed).
   - Handle failed payments: Order marked `payment_failed`, user offered retry with preserved cart.
5. **Verify**:
   - Test with altered client price: Confirm server rejects or overwrites with canonical price.
   - Test webhook with forged HMAC signature: Confirm server rejects with HTTP 400.
   - Test replay webhook: Confirm server returns HTTP 200 without duplicate fulfillment.
6. **Review**: Ensure no secret keys (`RAZORPAY_KEY_SECRET`) are imported into browser components.
7. **Report**: Log test results in `docs/agent/evidence.md`.

---

## Invariants & Prohibited Shortcuts
- **Redirect != Payment**: Never mark an order paid based solely on frontend redirect parameters.
- **Atomic Stock decrement**: Use database transactions or Postgres stored procedures to prevent race conditions.
- **Immutable Item Snapshots**: Order items must store captured product name, variant title, and unit price at time of purchase.
