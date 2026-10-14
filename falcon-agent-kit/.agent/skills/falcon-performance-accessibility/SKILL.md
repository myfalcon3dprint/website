---
name: falcon-performance-accessibility
description: Web performance optimization, Core Web Vitals, and WCAG 2.1 AA accessibility auditing for Falcon 3D Prints.
---

# Falcon Performance & Accessibility Auditing Skill

> Evaluates and enforces Core Web Vitals performance budgets and WCAG 2.1 AA accessibility standards.

## Task Triggers
- Auditing public storefront or admin panel for performance bottlenecks or bundle bloat.
- Running accessibility checks (`axe-core`, Lighthouse, keyboard navigation rehearsals).
- Optimizing images, client bundle sizes, or rendering latency.

## Required Inputs & Source Paths
- Performance Budgets: [`docs/quality/performance-budgets.md`](../../../docs/quality/performance-budgets.md).
- Accessibility Checklist: [`docs/quality/accessibility-checklist.md`](../../../docs/quality/accessibility-checklist.md).
- Evidence Log: [`docs/agent/evidence.md`](../../../docs/agent/evidence.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review bundle sizes using `@next/bundle-analyzer` or inspecting `.next/` build output. Check HTML markup for semantic accessibility elements.
2. **Define Acceptance Criteria**: Verify CWV targets (LCP <= 2.0s, INP <= 150ms, CLS <= 0.05) and WCAG AA contrast (4.5:1 body, 3:1 headings).
3. **Plan**: Identify areas exceeding budgets (unoptimized images, render-blocking scripts, missing form labels, insufficient contrast).
4. **Implement**:
   - Apply Next.js `<Image>` optimizations with modern formats (AVIF/WebP) and explicit aspect ratios.
   - Add dynamic imports for heavy non-critical components (e.g. 3D canvas viewers, rich text editors).
   - Add accessible labels, ARIA landmarks, and visible keyboard focus rings.
   - Ensure all color pairings adhere to contrast thresholds.
5. **Verify**:
   - Run automated Lighthouse CLI or axe-core scanner on production build:
     ```bash
     npx lighthouse http://localhost:3000 --chrome-flags="--headless" --output=json --output-path=reports/lighthouse.json
     ```
   - Rehearse keyboard navigation: Confirm full traversal via `Tab`, modal focus traps, and `Escape` to close.
6. **Review**: Ensure no visual regression was introduced during accessibility refactoring.
7. **Report**: Log audit scores and metric measurements in `docs/agent/evidence.md`.

---

## Invariants & Prohibited Shortcuts
- **No Bundle Exceeding**: Total client-side JS bundle must not exceed 180 KB gzipped on initial storefront load.
- **No Hidden Outlines**: Never remove keyboard focus rings (`outline: none`) without an explicit high-contrast replacement.
- **Always Test on Mobile Emulation**: Performance must be verified under simulated 4G mobile conditions.
