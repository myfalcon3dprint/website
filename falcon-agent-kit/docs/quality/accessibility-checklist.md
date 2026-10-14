# Accessibility (a11y) Verification Checklist — Falcon 3D Prints

> Standards aligned with WCAG 2.1 Level AA to ensure the Falcon 3D Prints storefront and administrative interface are inclusive and accessible to all users.

## Scope & Target Standard

- **Target Standard**: WCAG 2.1 AA Compliance
- **Core Principles**: Perceivable, Operable, Understandable, Robust
- **Tools for Verification**: `axe-core`, Lighthouse Accessibility Audit, Keyboard-only navigation rehearsal, Screen reader verification (NVDA/VoiceOver).

---

## 1. Perceivable

### 1.1 Contrast Ratios
- [ ] **Text Contrast**: Normal text (< 18pt regular, < 14pt bold) maintains at least **4.5:1** contrast ratio against its background.
- [ ] **Large Text Contrast**: Headings (>= 18pt regular, >= 14pt bold) maintain at least **3.0:1** contrast ratio.
- [ ] **UI Components & Icons**: Form inputs, borders, buttons, and icons maintain at least **3.0:1** contrast against adjacent backgrounds.
- [ ] **Brand Orange Usage**: The Falcon orange primary accent must be paired with high-contrast text (dark charcoal `#18181B` or white `#FFFFFF` depending on lightness verification) and not used for low-contrast text on light backgrounds.

### 1.2 Non-Text Content & Alternatives
- [ ] **Product Imagery**: All 3D print product photographs include descriptive `alt` text detailing subject, material, and color (e.g., `alt="Falcon geometric planter printed in matte black PLA, 15cm height"`).
- [ ] **Decorative Elements**: Background textures, abstract 3D meshes, and decorative divider lines use `alt=""` or `aria-hidden="true"`.
- [ ] **Interactive 3D Previews**: If interactive WebGL/Three.js viewers are enabled, an accessible alternative (static multi-angle photos with textual descriptions of dimensions and finish) must be provided.

---

## 2. Operable

### 2.1 Keyboard Navigation
- [ ] **Full Tab Reachability**: Every interactive element (links, buttons, quantity steppers, filter accordions, dropdowns, modal dialogs) is reachable via `Tab` and `Shift+Tab`.
- [ ] **Visible Focus Indicators**: High-contrast, non-obtrusive focus ring (`outline: 2px solid var(--accent-orange); outline-offset: 2px;`) visible on all focused elements. Never `outline: none` without replacement.
- [ ] **No Keyboard Traps**: Modal dialogs (cart drawer, quotation request modal, image lightbox) trap focus while open and release cleanly upon `Escape` or close button press.
- [ ] **Skip Links**: "Skip to main content" link present as the first focusable element on every page.

### 2.2 Time & Motion
- [ ] **Reduced Motion Support**: All CSS and JavaScript transitions respect `@media (prefers-reduced-motion: reduce)`. Dynamic animations (card zooms, cart drawer slide) default to simple instant opacity shifts or zero-duration transitions.
- [ ] **No Uncontrolled Auto-play**: Carousels and product video loops must have clear pause/stop controls and never auto-scroll indefinitely.

---

## 3. Understandable

### 3.1 Forms & Error Handling
- [ ] **Explicit Form Labels**: Every input, select, and textarea has an associated `<label for="...">` or `aria-labelledby`. Placeholder text is not an acceptable substitute for a label.
- [ ] **Error Announcement**: Form errors (invalid phone number, missing address, card decline) are explicitly announced to assistive tech using `aria-invalid="true"` and `aria-describedby="error-id"`.
- [ ] **Clear Feedback**: Checkout order submission, cart additions, and quotation uploads trigger accessible live region announcements (`aria-live="polite"`).

### 3.2 Consistent Navigation
- [ ] Standardized navigation header across all storefront pages.
- [ ] Predictable breadcrumb trail on catalog and product detail pages.

---

## 4. Robust

- [ ] Valid semantic HTML5 markup (`<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<footer>`).
- [ ] Custom interactive controls implement correct WAI-ARIA design patterns (e.g., Tabs with `role="tablist"`, Accordions with `aria-expanded`).

---

## Verification Evidence Log

| Audit Date | Page / Route | Tool Used | Findings Count | Pass Status | Evidence Artifact |
|---|---|---|---|---|---|
| _Pending_ | `/` (Home) | Lighthouse / axe-core | 0 Critical | Planned | `reports/a11y-home.json` |
| _Pending_ | `/products/[slug]` | Manual Keyboard | 0 Traps | Planned | `reports/a11y-pdp.md` |
| _Pending_ | `/checkout` | Screen Reader | 0 Blockers | Planned | `reports/a11y-checkout.md` |
| _Pending_ | `/admin/*` | axe-core | 0 Critical | Planned | `reports/a11y-admin.json` |
