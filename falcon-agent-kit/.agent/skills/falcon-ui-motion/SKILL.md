---
name: falcon-ui-motion
description: UI animation, micro-interactions, transition timing tokens, and reduced-motion standards for Falcon 3D Prints.
---

# Falcon UI Motion & Micro-Interactions Skill

> Implements purposeful, restrained, and accessible micro-animations that enhance spatial orientation and tactile responsiveness.

## Task Triggers
- Implementing page transitions, modal dialog animations, or cart drawer slide-ins.
- Adding feedback animations for "Add to Cart", form validations, or order status progression.
- Configuring reduced-motion alternatives for accessibility compliance.

## Required Inputs & Source Paths
- Design System: [`docs/brand/design-system.md`](../../../docs/brand/design-system.md).
- Accessibility Standards: [`docs/quality/accessibility-checklist.md`](../../../docs/quality/accessibility-checklist.md).
- Performance Budgets: [`docs/quality/performance-budgets.md`](../../../docs/quality/performance-budgets.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Determine whether animation is achievable via pure CSS transitions (`transition: transform, opacity`) before introducing a motion library.
2. **Define Acceptance Criteria**: Define duration (<= 250ms for micro-interactions, <= 350ms for larger surfaces like drawers), easing curve, and zero jank (60fps).
3. **Plan**: Establish motion tokens:
   ```css
   --duration-fast: 150ms;
   --duration-normal: 250ms;
   --duration-slow: 350ms;
   --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
   --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
   ```
4. **Implement**:
   - Animate cart drawer with smooth hardware-accelerated slide (`transform: translateX(...)`).
   - Implement micro-bounce on cart badge count update.
   - Implement progressive skeleton loading shimmer for catalog cards.
   - **Crucial**: Implement `prefers-reduced-motion` override:
     ```css
     @media (prefers-reduced-motion: reduce) {
       *, *::before, *::after {
         animation-duration: 0.01ms !important;
         animation-iteration-count: 1 !important;
         transition-duration: 0.01ms !important;
       }
     }
     ```
5. **Verify**: Test with Chrome DevTools "Emulate CSS prefers-reduced-motion: reduce" enabled. Verify instantaneous transitions.
6. **Review**: Ensure no animation delays customer checkout or interferes with form input focus.
7. **Report**: Document motion tokens and accessibility validation in task records.

---

## Invariants & Prohibited Shortcuts
- **No Heavy Overlapping Libraries**: Do not install both Framer Motion and GSAP simultaneously. Prefer CSS transitions or a single lightweight solution.
- **No Parallax / Scroll Hijacking**: Never hijack user scroll behavior or delay essential content reveal.
- **No Checkout Latency**: Animations must never delay payment button responsiveness.
