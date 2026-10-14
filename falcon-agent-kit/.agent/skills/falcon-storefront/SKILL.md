---
name: falcon-storefront
description: Customer-facing catalog, product detail pages, filters, custom enquiry forms, and reviews for Falcon 3D Prints.
---

# Falcon Storefront Development Skill

> Implements performant, SEO-optimized, and conversion-focused public storefront pages for Falcon 3D Prints.

## Task Triggers
- Developing homepage, category catalog, product detail pages (PDP), or search interfaces.
- Implementing product filters (material, finish, size, price, availability).
- Building the custom 3D print commission quotation request form.

## Required Inputs & Source Paths
- Requirements: [`docs/project/requirements.md`](../../../docs/project/requirements.md).
- Acceptance Criteria: [`docs/project/acceptance-criteria.md`](../../../docs/project/acceptance-criteria.md).
- Data Model: [`docs/architecture/data-model.md`](../../../docs/architecture/data-model.md).
- Performance Budgets: [`docs/quality/performance-budgets.md`](../../../docs/quality/performance-budgets.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Check Supabase schema for `products`, `variants`, `categories`, and `custom_quotations`.
2. **Define Acceptance Criteria**: Define SSR/ISR rendering strategy, URL search param synchronization (`?material=pla&sort=price_asc`), and mobile responsiveness.
3. **Plan**:
   - Layout modular components: `ProductCard`, `ProductGallery`, `VariantSelector`, `PriceDisplay`, `LeadTimeBadge`.
   - Keep interactive 3D viewer lazy-loaded on explicit click to protect mobile performance.
4. **Implement**:
   - Implement category views (Miniatures, Planters, Desk Accessories, Architectural, Kitchen Miniatures).
   - Display clear variant options (Colors, Infill/Durability, Finish: Raw vs. Sanded/Painted).
   - Implement custom quotation form: Customer enters dimensions (L x W x H in mm), desired material, infill %, and uploads STL/3MF file.
   - Enforce server-side file upload limits (max 50 MB, validate MIME/magic bytes for STL/3MF/OBJ).
5. **Verify**:
   - Verify all prices format correctly in Indian Rupees (`₹`, e.g. `₹1,499`).
   - Run Lighthouse audit to confirm mobile performance >= 90 and LCP < 2.0s.
6. **Review**: Ensure product descriptions avoid unverified claims (e.g. food safety or heat resistance on standard PLA).
7. **Report**: Log page routes and components in `docs/agent/status.md`.

---

## Invariants & Prohibited Shortcuts
- **Integer Minor Units**: Always store and compute product prices in paise (minor units); divide by 100 solely for UI display.
- **Accessible Forms**: Every input on the quotation form must have explicit `<label>` tags and error feedback.
- **No Heavy 3D Bundles in Critical Path**: Never import Three.js directly in the initial bundle.
