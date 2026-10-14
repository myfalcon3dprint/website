# Acceptance Criteria — Falcon 3D Prints

> Each criterion maps to a requirement ID from `requirements.md`. A feature is not "done" until all its MUST criteria pass.

## AC-1: Catalog & discovery

### AC-1.1: Product listing page

- [ ] Products render in a responsive grid (1 col mobile, 2 col tablet, 3-4 col desktop).
- [ ] Each card shows: image (lazy loaded), name, price (formatted ₹X,XXX), availability badge.
- [ ] Category navigation filters products correctly.
- [ ] Text search returns relevant results within 500ms for up to 500 products.
- [ ] Empty states show a helpful message, not a blank page.
- [ ] Page is accessible: all images have alt text, cards are keyboard-navigable.

### AC-1.2: Product detail page

- [ ] Shows all product fields: images, name, price, description, material, dimensions.
- [ ] Multiple images render in a gallery with navigation.
- [ ] Availability status is clearly indicated with appropriate colour coding.
- [ ] Made-to-order items show estimated lead time.
- [ ] Variant selection (if applicable) updates price and availability.
- [ ] "Add to cart" button is prominent and works.
- [ ] Page has unique `<title>` and `<meta description>` for SEO.
- [ ] OG and Twitter card meta tags are present.

### AC-1.3: Categories

- [ ] Category pages have clean URLs (`/category/category-slug`).
- [ ] Subcategory navigation works.
- [ ] Breadcrumbs show category hierarchy.
- [ ] Category pages have unique title and description.

---

## AC-2: Cart & checkout

### AC-2.1: Cart

- [ ] Adding item to cart shows visual confirmation (animation, toast, drawer).
- [ ] Cart persists across page navigations.
- [ ] Logged-in user: cart persists across sessions (server-side).
- [ ] Guest: cart persists via localStorage.
- [ ] Login merges guest cart with existing server cart without losing items.
- [ ] Quantity changes update subtotals immediately.
- [ ] Invalid quantity (0, negative, > stock) shows validation error.
- [ ] Item removal works and shows confirmation.
- [ ] Cart shows per-item subtotal and grand total.

### AC-2.2: Checkout

- [ ] Checkout requires shipping address with all mandatory fields validated.
- [ ] Shipping cost is calculated server-side and displayed before payment.
- [ ] Tax (GST) is calculated server-side and displayed before payment.
- [ ] Order summary shows every line item, shipping, tax, and total.
- [ ] Razorpay checkout opens with correct amount, currency (INR), and order ID.
- [ ] On payment success: order is created, confirmation page shows order number.
- [ ] On payment failure: clear error message, option to retry, no charge recorded.
- [ ] On payment pending: appropriate pending state shown, webhook resolves it.
- [ ] Stock is reserved on checkout initiation and released if payment fails or expires.
- [ ] Double-clicking "Pay" does not create duplicate orders.

### AC-2.3: Payment integrity

- [ ] Server-calculated total matches Razorpay order amount exactly (in paise).
- [ ] Razorpay signature is verified server-side before order confirmation.
- [ ] Order ID, amount, and currency are bound in verification.
- [ ] Duplicate webhook calls are handled idempotently (no state change on replay).
- [ ] Manually calling the success URL without valid payment does not create an order.

---

## AC-3: Customer accounts

- [ ] Registration with email/password works; email verification sent.
- [ ] Login works and creates a valid session.
- [ ] Password reset flow sends email with secure link.
- [ ] Session expires after configured period.
- [ ] Logout invalidates session.
- [ ] Order history shows all past orders with status.
- [ ] Address management (add, edit, delete, set default) works.

---

## AC-4: Custom orders & enquiries

- [ ] Enquiry form submits successfully with name, email/phone, message.
- [ ] File attachment works with size limit (e.g., 10MB) and type restriction.
- [ ] Enquiry appears in admin within 30 seconds.
- [ ] Admin receives notification of new enquiry.

---

## AC-5: Admin panel

### AC-5.1: Product management

- [ ] Create product with all fields; product appears on storefront after publish.
- [ ] Edit product; changes reflect on storefront.
- [ ] Upload images; images display correctly.
- [ ] Delete/archive product; product no longer appears on storefront.
- [ ] Draft products do not appear on storefront.
- [ ] Category CRUD works; products are correctly categorised.

### AC-5.2: Order management

- [ ] Orders list shows all orders with correct status.
- [ ] Filters work: by status, date range, customer, product/SKU.
- [ ] Order detail shows all items, payment status, shipping info.
- [ ] Status update records who changed it and when.
- [ ] Cannot change price or items on a paid order.
- [ ] Address corrections are logged in audit trail.

### AC-5.3: Production tracking

- [ ] Made-to-order items show in production queue.
- [ ] Status transitions follow the pipeline; invalid transitions are rejected.
- [ ] Failed QC requeues the item for reprint.
- [ ] Ready-stock items skip production stages.
- [ ] Partial fulfilment: some items can be "Ready" while others are "Printing".

### AC-5.4: Permissions

- [ ] Owner can access everything.
- [ ] Order Manager cannot edit products.
- [ ] Production Operator can only update production status.
- [ ] Support can view orders but not modify them.
- [ ] Catalog Editor can manage products but not orders.
- [ ] Permissions are enforced server-side (API returns 403, not just UI hidden).
- [ ] Attempting direct API calls without permission returns 403.

### AC-5.5: Audit & conflicts

- [ ] All admin actions are logged with user, timestamp, and change details.
- [ ] If two admins edit the same record, the second sees a conflict warning.

---

## AC-6: Brand & design

- [ ] Logo renders correctly on both light and dark backgrounds.
- [ ] Tagline reads exactly "Where ideas take shapes".
- [ ] Contact info matches verified facts.
- [ ] No invented reviews, testimonials, or certifications appear anywhere.
- [ ] Design feels premium (subjective — review with stakeholder).

---

## AC-7: Performance

- [ ] Lighthouse Performance score ≥ 90 on product listing page.
- [ ] LCP < 2.5s on 3G connection simulation.
- [ ] INP < 200ms on product interactions.
- [ ] CLS < 0.1 on all pages.
- [ ] Images serve in WebP/AVIF format.
- [ ] No layout shifts from late-loading images or fonts.

---

## AC-8: Accessibility

- [ ] All pages pass axe-core automated scan with 0 critical/serious violations.
- [ ] Keyboard navigation works for all interactive elements.
- [ ] Focus indicators are visible.
- [ ] Colour contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for large text).
- [ ] `prefers-reduced-motion` disables all non-essential animations.
- [ ] Screen reader announces cart updates, form errors, and status changes.

---

## AC-9: Security

- [ ] See `security-matrix.md` for the full verification matrix.
- [ ] No secrets in client JavaScript bundles.
- [ ] All API routes validate authentication.
- [ ] Admin routes validate role permissions.
- [ ] RLS policies prevent cross-customer data access.
