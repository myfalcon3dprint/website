# Requirements — Falcon 3D Prints

## Notation

- **MUST** — mandatory for the requirement category
- **SHOULD** — expected unless explicitly descoped with justification
- **MAY** — nice-to-have, implement if time/budget permits

---

## R1. Storefront — Catalog & discovery

### R1.1 Product listing

- MUST display products in a responsive grid with image, name, price, and availability badge.
- MUST support category-based navigation (categories defined by business owner).
- MUST support text search across product name and description.
- SHOULD support sorting by price (low-high, high-low), newest, and popularity.
- SHOULD support filtering by material, colour, price range, and availability.
- MAY support tag-based filtering.

### R1.2 Product detail

- MUST show product images (multiple), name, price, description, material, and dimensions.
- MUST show availability status (in stock, made to order, out of stock).
- MUST show lead time for made-to-order items.
- MUST display care/handling information where applicable.
- SHOULD support colour/finish variant selection with visual preview.
- SHOULD show related products.
- MAY support an interactive 3D model viewer (pending business case and performance budget — see `decisions.md`).

### R1.3 Categories

- MUST support hierarchical categories (top-level and subcategories).
- MUST have SEO-friendly URLs per category.
- SHOULD show category descriptions and images.

---

## R2. Storefront — Cart & checkout

### R2.1 Cart

- MUST persist cart across sessions for logged-in users (server-side).
- MUST persist cart in localStorage for guest users.
- MUST merge guest cart with account cart on login.
- MUST validate quantities against available stock on cart view and before checkout.
- MUST show per-item subtotals, total, and any applicable taxes/shipping.
- MUST allow quantity changes and item removal.
- MUST show a cart summary accessible from any page (drawer or mini-cart).

### R2.2 Checkout

- MUST require valid shipping address.
- MUST calculate shipping cost server-side based on address and cart contents.
- MUST calculate taxes server-side (GST — pending Q-007).
- MUST show complete order summary with itemised pricing before payment.
- MUST support Razorpay payment (UPI, cards, wallets, netbanking).
- MUST handle payment success, failure, and pending states.
- MUST create order only after verified payment confirmation (webhook, not redirect).
- MUST show a clear confirmation page with order number on success.
- MUST show a clear failure page with retry option on payment failure.
- SHOULD support guest checkout (shipping address + email, no account required).
- SHOULD support adding order notes.

### R2.3 Payment integrity (invariants)

- MUST calculate all prices, discounts, shipping, and taxes on the server. Client calculations are for display only.
- MUST use integer minor units (paise) for all monetary values.
- MUST include explicit currency code (INR) with all monetary values.
- MUST document rounding rules.
- MUST validate quantity > 0 and variant combinations are valid server-side.
- MUST create immutable snapshots of purchased item details at order time.
- MUST handle stock atomically — reserve on checkout initiation, release on failure/expiry.
- MUST verify Razorpay payment signature server-side.
- MUST bind order ID, amount, and currency in the payment verification.
- MUST handle duplicate webhooks idempotently.
- MUST never charge, refund, ship, or notify twice for the same event.
- MUST reconcile payment state before retrying uncertain operations.

---

## R3. Customer accounts

### R3.1 Authentication

- MUST support email/password registration and login.
- MUST support secure password reset flow.
- MUST support email verification.
- SHOULD support OAuth login (Google) — pending decision.
- MUST enforce session expiry and secure logout.

### R3.2 Account features

- MUST show order history with status.
- MUST allow viewing order details.
- MUST allow managing shipping addresses (add, edit, delete, set default).
- SHOULD allow changing password and email.
- MAY support wishlists.
- MAY support reorder from previous orders.

---

## R4. Custom orders & enquiries

### R4.1 Enquiry flow

- MUST provide a contact/enquiry form accessible from storefront.
- MUST capture name, email/phone, and message.
- SHOULD support file attachment for custom design requests (with size/type limits).
- MUST store enquiries in database, visible in admin.
- MUST send notification to admin on new enquiry.

### R4.2 Quoting (SHOULD — pending Q-008)

- SHOULD allow admin to create quotes from enquiries.
- SHOULD allow customer to view and approve/reject quotes.
- SHOULD convert approved quotes to orders.

---

## R5. Admin panel

### R5.1 Product management

- MUST support CRUD for products with: name, description, price, images, category, material, dimensions, weight, stock quantity, availability status, variants.
- MUST support image upload to Supabase Storage.
- MUST support marking products as draft/published.
- MUST support category management (CRUD).
- SHOULD support bulk status changes (publish, unpublish, archive).
- SHOULD support duplicate product.

### R5.2 Order management

- MUST show orders list with filters: status, date range, customer, product/SKU.
- MUST show order detail with all items, payment status, shipping info, and timeline.
- MUST support order status updates.
- MUST support item-level status for mixed-product orders.
- MUST enforce rules for paid/packed/shipped order modifications (no price changes after payment, address corrections with audit trail).
- SHOULD support printing packing slips/invoices.
- SHOULD support order notes and internal comments.

### R5.3 Production tracking

- MUST support production status pipeline for made-to-order items:
  **Queued → Printing → Finishing → Quality Check → Ready → Packed → Shipped**
- MUST handle failed quality checks (requeue for reprint).
- MUST handle partial fulfilment (some items ready, others in production).
- MUST not apply production stages to ready-stock items unnecessarily.
- SHOULD support production queue view (what needs printing today).
- MAY support estimated completion dates.

### R5.4 Customer management

- MUST show customer list with search.
- MUST show customer detail with order history.
- MUST allow controlled contact/address corrections (with audit trail).
- MUST NOT allow admin to see or reset customer passwords.

### R5.5 Enquiry & quote management

- MUST show enquiry list with status (new, responded, quoted, closed).
- MUST allow responding to enquiries.
- SHOULD support quote creation and tracking (pending Q-008).

### R5.6 Staff & permissions

- MUST support role-based access with server-enforced capabilities.
- MUST support at minimum these roles:
  - **Owner**: Full access
  - **Order Manager**: Orders, production, customers, enquiries
  - **Production Operator**: Production queue, order item status updates
  - **Support**: Customer enquiries, order viewing (read-only orders)
  - **Catalog Editor**: Products, categories, images
- MUST enforce permissions on the server, not just UI.
- MUST log admin actions (who did what, when) in an audit trail.
- MUST detect stale-edit conflicts (optimistic locking).

### R5.7 Reporting

- SHOULD show sales summary (daily, weekly, monthly).
- SHOULD show orders by status.
- SHOULD show top-selling products.
- MAY support CSV/Excel export.

---

## R6. Brand & design

### R6.1 Brand application

- MUST use the Falcon 3D Prints orange falcon logo correctly (see `brand-guidelines.md`).
- MUST use the exact tagline "Where ideas take shapes".
- MUST display correct contact information.
- MUST NOT invent reviews, testimonials, certifications, or social proof.

### R6.2 Design quality

- MUST feel premium — refined colours, typography, spacing, and imagery.
- MUST be responsive (mobile, tablet, desktop).
- MUST meet WCAG 2.1 AA accessibility.
- SHOULD use subtle, purposeful animations (see `falcon-ui-motion` skill).
- MUST support `prefers-reduced-motion`.
- MUST NOT use scroll hijacking, forced intros, or cursor replacements.

---

## R7. Performance

- MUST achieve Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- MUST optimise images (WebP/AVIF, responsive sizes, lazy loading).
- MUST use appropriate caching strategies.
- SHOULD implement ISR/SSG for product pages where appropriate.
- MUST NOT load 3D viewer libraries on pages that don't use them.

---

## R8. Security

- See `docs/quality/threat-model.md` and `docs/quality/security-matrix.md` for the full security requirements.
- Summary invariants:
  - Server-authoritative auth and authorisation
  - RLS on all database tables
  - No secrets in client bundles
  - Payment webhook signature verification
  - Input validation and sanitisation
  - Rate limiting on sensitive endpoints
  - CSRF protection
  - Customer data isolation
