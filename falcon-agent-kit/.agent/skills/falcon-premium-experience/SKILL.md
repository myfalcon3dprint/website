---
name: falcon-premium-experience
description: Premium UX, visual design excellence, typography, and responsive aesthetics for Falcon 3D Prints.
---

# Falcon Premium Experience Skill

> Guides the creation of high-end, tactile, and visually compelling e-commerce interfaces that showcase 3D printed craftsmanship.

## Task Triggers
- Designing new user interfaces, product cards, detail pages, or checkout components.
- Improving visual polish, component states (hover, focus, active, disabled), and micro-interactions.
- Refining responsive typography, spacing rhythms, and depth.

## Required Inputs & Source Paths
- Design System: [`docs/brand/design-system.md`](../../../docs/brand/design-system.md).
- Accessibility Standards: [`docs/quality/accessibility-checklist.md`](../../../docs/quality/accessibility-checklist.md).
- Performance Budgets: [`docs/quality/performance-budgets.md`](../../../docs/quality/performance-budgets.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Examine existing UI primitives in `components/ui/` to ensure design token reusability.
2. **Define Acceptance Criteria**: Define visual hierarchy, responsive viewports (Mobile 375px, Tablet 768px, Desktop 1280px), and tactile feedback states.
3. **Plan**: Structure layout using a 4px/8px baseline grid with sophisticated neutral palettes (Zinc/Slate) contrasted by warm Falcon orange highlights.
4. **Implement**:
   - Establish modern typography (e.g. Outfit / Inter) with optical sizing and generous line-heights.
   - Craft elevated tactile cards with subtle border halos (`1px solid rgba(255,255,255,0.08)` in dark mode, `1px solid rgba(0,0,0,0.06)` in light mode).
   - Implement clear status indicators for Ready-Stock (emerald badge) vs. Made-to-Order (amber badge with lead time estimation).
   - Ensure interactive states feel immediate and snappy with subtle scale or elevation cues.
5. **Verify**: Check across mobile and desktop viewport emulations. Verify no text truncation or broken flex wraps.
6. **Review**: Ensure aesthetics serve conversion—no distracting visual noise that obscures price, product dimensions, or the primary "Add to Cart" call to action.
7. **Report**: Document visual changes with screenshots or component fixture logs.

---

## Invariants & Prohibited Shortcuts
- **No Generic Color Schemes**: Avoid harsh default primary blues or uncalibrated reds. Use curated HSL tokens.
- **Never Compromise Clarity for Style**: Key commerce details (price, dimensions, material, shipping timeframe) must never be hidden behind obscure icons.
