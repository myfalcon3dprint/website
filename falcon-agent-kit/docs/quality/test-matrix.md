# Quality & Test Verification Matrix — Falcon 3D Prints

> Comprehensive testing standards, test tiers, and concrete acceptance tests across customer and admin journeys.

## Testing Philosophy

1. **Deterministic & Reproducible**: Tests must run locally without external side-effects on production databases or payment accounts.
2. **Server-Authoritative**: Never rely on client-side assertions alone for money, stock, or permissions.
3. **Evidence-Based**: Test results are only valid when accompanied by command output, exit codes, and timestamps.

---

## 1. Test Pyramid & Execution Tiers

| Tier | Scope | Framework / Runner | Target Coverage / Scope | Execution Frequency |
|---|---|---|---|---|
| **Unit** | Price calculations, minor unit conversions, validation rules, formatting | Vitest / Jest | Pure functions, domain rules, calculation logic | Pre-save / fast local |
| **Integration** | Server actions, route handlers, DB operations with Supabase Local, Razorpay HMAC | Vitest + Supabase Local CLI | API routes, transactional integrity, RLS policies | Pre-PR / feature complete |
| **E2E Customer** | Catalog browse, variant selection, cart persistence, checkout mock, order history | Playwright | Critical user paths (desktop & mobile viewport) | Pre-release gate |
| **E2E Admin** | Role gates, order management, status transitions, stock adjustments | Playwright | Staff and owner critical workflows | Pre-release gate |
| **Security** | Auth bypass, IDOR, signature forgery, parameter tampering | Automated curl / test suite | Matrix defined in `security-matrix.md` | Pre-release gate |

---

## 2. Storefront Test Cases

### 2.1 Catalog & Product Selection
- `TEST-CAT-01`: Browse categories (Miniatures, Desk Accessories, Planters, Architectural Models, Kitchen Miniatures).
- `TEST-CAT-02`: Filter by material (PLA, PETG, Resin), finish (Raw, Sanded, Painted), and stock status (Ready Stock vs. Made-to-Order).
- `TEST-CAT-03`: Selecting product variants dynamically updates price (displayed in INR `₹`), lead time, and dimensions.
- `TEST-CAT-04`: Products with zero stock in ready-stock mode switch to "Made to Order" with appropriate lead time banner.

### 2.2 Cart & Checkout
- `TEST-CART-01`: Add items to cart; cart persists across browser reload via secure cookie/storage.
- `TEST-CART-02`: Alter line item quantity; line totals and subtotal recalculate with correct INR minor unit precision (paise).
- `TEST-CART-03`: Shipping tier calculation based on delivery pin code (Maharashtra vs. Rest of India).
- `TEST-CART-04`: Checkout form validation: Indian 6-digit PIN code format, 10-digit mobile number (+91), valid delivery address.

### 2.3 Payment & Order Creation
- `TEST-PAY-01`: Client submits checkout; server creates pending order and generates Razorpay Order ID.
- `TEST-PAY-02`: Razorpay mock payment success webhook received with valid HMAC; order status transitions to `confirmed`.
- `TEST-PAY-03`: Stock reservation is atomically decremented upon payment confirmation; out-of-stock race condition handled gracefully.
- `TEST-PAY-04`: Payment failure event records failure reason; customer given option to retry payment without losing cart items.

---

## 3. Production & Admin Panel Test Cases

### 3.1 Order Lifecycle & Status Progression
- `TEST-ADM-01`: Admin order view displays mixed-product orders (ready stock + custom made-to-order).
- `TEST-ADM-02`: Order status transitions strictly adhere to state machine:
  - Ready Stock: `Confirmed → Packed → Shipped → Delivered`
  - Made-to-Order: `Confirmed → Queued → Printing → Finishing → Quality Check → Ready → Packed → Shipped → Delivered`
- `TEST-ADM-03`: Failed Quality Check triggers mandatory reprint or customer notification log.
- `TEST-ADM-04`: Address correction allowed only prior to `Packed` stage; changes logged in audit table.

### 3.2 Staff Roles & Permissions
- `TEST-ROLE-01`: `production_operator` can update printing queue and QC status, but cannot issue refunds or alter catalog prices.
- `TEST-ROLE-02`: `catalog_editor` can update product descriptions, photos, and materials, but cannot view customer financial records.
- `TEST-ROLE-03`: `owner` can perform all actions including refund authorization, user role management, and export operations.

---

## 4. Test Reporting & Evidence Requirements

When executing tests, the agent must output records in the format specified in [`templates/task-template.md`](../../templates/task-template.md):
```markdown
- Test Run Date: YYYY-MM-DD
- Test Command: npm run test / npx playwright test
- Environment: Local Node.js v20.x, Supabase Local v1.x
- Total Tests: N | Passed: N | Failed: 0
- Artifacts: test-results/junit.xml or screenshot logs
```
No releases may proceed with unverified or skipped tests.
