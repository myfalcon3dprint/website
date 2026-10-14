---
name: falcon-brand
description: Brand identity enforcement, logo usage, tone of voice, and visual assets for Falcon 3D Prints.
---

# Falcon Brand Application Skill

> Ensures accurate, respectful, and consistent application of the Falcon 3D Prints brand identity across storefront, transactional emails, and admin interfaces.

## Task Triggers
- Designing storefront pages, headers, footers, or marketing components.
- Composing copy, product titles, descriptions, care guides, or microcopy.
- Integrating or updating logo files, favicons, or social share graphics.

## Verified Brand Facts
- **Business Name**: Falcon 3D Prints
- **Exact Tagline**: "Where ideas take shapes" (plural "shapes")
- **Phone**: +91 98506 07144
- **Address**: Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India
- **Primary Accent Color**: Falcon Orange (Warm energetic orange paired with charcoal neutrals)

## Required Inputs & Source Paths
- Brand Guidelines: [`docs/brand/brand-guidelines.md`](../../../docs/brand/brand-guidelines.md).
- Design System: [`docs/brand/design-system.md`](../../../docs/brand/design-system.md).
- Content Guidelines: [`docs/brand/content-guidelines.md`](../../../docs/brand/content-guidelines.md).
- Asset Manifest: [`docs/brand/asset-manifest.json`](../../../docs/brand/asset-manifest.json).
- Originals Directory: [`assets/brand/originals/`](../../../assets/brand/originals/).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review `docs/brand/brand-guidelines.md` and check `docs/brand/asset-manifest.json`.
2. **Define Acceptance Criteria**: Verify tagline matches exact wording ("Where ideas take shapes"); ensure logo clear space and aspect ratio.
3. **Plan**: Select appropriate logo variant:
   - Light backgrounds: Standard primary logo with dark wordmark.
   - Dark backgrounds: Logo variant with white/light wordmark.
   - Constrained spaces (favicon, mobile header): Icon-only falcon mark.
4. **Implement**:
   - Apply brand tokens (colors, typography, spacing) via design system tokens.
   - Craft customer-facing copy reflecting craftsmanship, precision 3D printing, and local Nashik pride.
   - Maintain product safety truth: Clarify whether miniature kitchen sets are decorative display pieces or functional toys. Never claim food safety or heat resistance for standard PLA without certified testing evidence.
5. **Verify**: Check WCAG contrast of orange accent text against backgrounds (must meet 4.5:1 for body, 3:1 for large headings).
6. **Review**: Ensure no invented facts (no fake opening hours, no unconfirmed social handles, no unauthorized WhatsApp badges).
7. **Report**: Log asset usage and copy updates in task records.

---

## Invariants & Prohibited Shortcuts
- **Never Modify Originals**: Original assets in `assets/brand/originals/` must never be altered or overwritten.
- **No Tagline Alterations**: Never change "shapes" to singular "shape".
- **No Unsubstantiated Claims**: Never claim food-contact safety or toy safety without engineering proof.
