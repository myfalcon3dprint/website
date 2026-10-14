# Brand Guidelines — Falcon 3D Prints

> Separating verified facts from proposed design recommendations.

## Verified brand elements

These are confirmed by the business owner:

| Element | Value |
|---|---|
| **Business name** | Falcon 3D Prints |
| **Tagline** | "Where ideas take shapes" |
| **Logo concept** | Orange falcon (bird), with wordmark variants |
| **Phone** | +91 98506 07144 |
| **Address** | Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India |

### Logo

**Status**: Logo files not yet supplied to workspace (see Q-005).

**Known from description**:
- Orange falcon (bird) logo
- Wordmark variants exist
- Multiple variants may exist (icon-only, icon+wordmark, light/dark background)

**Rules (apply when assets arrive)**:
- Preserve original logo proportions — never stretch or distort.
- Maintain clear space around the logo (minimum: height of the falcon's head on all sides).
- Do not recolour, add effects, or modify the logo.
- Store originals in `falcon-agent-kit/assets/brand/originals/` — never modify these files.
- Create optimised web versions (SVG, WebP) in `public/brand/`.
- Test on both light and dark backgrounds.
- Ensure the logo meets minimum size for legibility (suggest 32px height minimum for icon, 120px width minimum for wordmark).

---

## Proposed design system

> Everything below is a **recommendation**, not a verified brand standard. Subject to owner approval.

### Colour palette

Derived from the orange falcon brand identity. Designed for accessibility (WCAG 2.1 AA contrast ratios).

#### Primary — Falcon Orange

| Token | Value | Usage |
|---|---|---|
| `--color-primary-50` | `#FFF7ED` | Backgrounds, subtle highlights |
| `--color-primary-100` | `#FFEDD5` | Hover backgrounds |
| `--color-primary-200` | `#FED7AA` | Borders, dividers |
| `--color-primary-300` | `#FDBA74` | Inactive states |
| `--color-primary-400` | `#FB923C` | Secondary buttons |
| `--color-primary-500` | `#F97316` | Primary brand colour (**proposed**) |
| `--color-primary-600` | `#EA580C` | Primary buttons, links |
| `--color-primary-700` | `#C2410C` | Hover states on primary |
| `--color-primary-800` | `#9A3412` | Active/pressed states |
| `--color-primary-900` | `#7C2D12` | Dark accents |

**Usage guidance**: Use orange **selectively**. It should draw attention to primary actions (CTA buttons, key highlights), not overwhelm the page. Most of the UI should use the neutral palette.

#### Neutrals — Slate

| Token | Value | Usage |
|---|---|---|
| `--color-neutral-50` | `#F8FAFC` | Page backgrounds |
| `--color-neutral-100` | `#F1F5F9` | Card backgrounds |
| `--color-neutral-200` | `#E2E8F0` | Borders, dividers |
| `--color-neutral-300` | `#CBD5E1` | Placeholder text |
| `--color-neutral-400` | `#94A3B8` | Muted text |
| `--color-neutral-500` | `#64748B` | Secondary text |
| `--color-neutral-600` | `#475569` | Body text |
| `--color-neutral-700` | `#334155` | Headings |
| `--color-neutral-800` | `#1E293B` | Dark backgrounds |
| `--color-neutral-900` | `#0F172A` | Darkest backgrounds |
| `--color-neutral-950` | `#020617` | Near-black |

#### Semantic colours

| Token | Value | Usage |
|---|---|---|
| `--color-success-500` | `#22C55E` | Success states, "in stock" |
| `--color-success-600` | `#16A34A` | Success buttons |
| `--color-warning-500` | `#EAB308` | Warnings, "made to order" |
| `--color-warning-600` | `#CA8A04` | Warning emphasis |
| `--color-error-500` | `#EF4444` | Errors, "out of stock" |
| `--color-error-600` | `#DC2626` | Error emphasis |
| `--color-info-500` | `#3B82F6` | Information, links |
| `--color-info-600` | `#2563EB` | Info emphasis |

#### Contrast verification

| Combination | Ratio | WCAG AA |
|---|---|---|
| Primary-600 on white | 4.6:1 | ✅ Pass (normal text) |
| Primary-700 on white | 5.9:1 | ✅ Pass |
| Neutral-600 on neutral-50 | 5.7:1 | ✅ Pass |
| Neutral-700 on neutral-50 | 8.2:1 | ✅ Pass |
| White on primary-600 | 4.6:1 | ✅ Pass |
| White on neutral-800 | 13.6:1 | ✅ Pass |

*Note: Contrast ratios are approximate and should be verified with a tool like WebAIM Contrast Checker when colours are finalised.*

### Typography

**No official font has been identified from the brand.** Proposed:

| Role | Font | Fallback | Weight |
|---|---|---|---|
| Headings | Inter | system-ui, sans-serif | 600, 700 |
| Body | Inter | system-ui, sans-serif | 400, 500 |
| Monospace (admin) | JetBrains Mono | monospace | 400 |

Load via `next/font/google` for optimal performance (no FOUT, no external requests).

#### Type scale

| Token | Size | Line height | Usage |
|---|---|---|---|
| `--text-xs` | 0.75rem (12px) | 1rem | Badges, captions |
| `--text-sm` | 0.875rem (14px) | 1.25rem | Secondary text, labels |
| `--text-base` | 1rem (16px) | 1.5rem | Body text |
| `--text-lg` | 1.125rem (18px) | 1.75rem | Large body, card titles |
| `--text-xl` | 1.25rem (20px) | 1.75rem | Section headers |
| `--text-2xl` | 1.5rem (24px) | 2rem | Page subtitles |
| `--text-3xl` | 1.875rem (30px) | 2.25rem | Page titles |
| `--text-4xl` | 2.25rem (36px) | 2.5rem | Hero headings |
| `--text-5xl` | 3rem (48px) | 1 | Display headings |

### Spacing

Use a 4px base unit:

| Token | Value |
|---|---|
| `--space-1` | 0.25rem (4px) |
| `--space-2` | 0.5rem (8px) |
| `--space-3` | 0.75rem (12px) |
| `--space-4` | 1rem (16px) |
| `--space-5` | 1.25rem (20px) |
| `--space-6` | 1.5rem (24px) |
| `--space-8` | 2rem (32px) |
| `--space-10` | 2.5rem (40px) |
| `--space-12` | 3rem (48px) |
| `--space-16` | 4rem (64px) |
| `--space-20` | 5rem (80px) |
| `--space-24` | 6rem (96px) |

### Border radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 0.25rem | Small elements, badges |
| `--radius-md` | 0.5rem | Buttons, inputs |
| `--radius-lg` | 0.75rem | Cards |
| `--radius-xl` | 1rem | Modals, large cards |
| `--radius-full` | 9999px | Avatars, pills |

---

## Content guidelines

### Voice

- **Confident** but not boastful.
- **Helpful** — guide the customer, don't overwhelm.
- **Clear** — no jargon unless technical specs are requested.
- **Honest** — no false claims about materials, safety, or capabilities.

### Product descriptions

- Lead with the use case or benefit, not the material.
- Include material, dimensions, weight, and finish.
- Mention "3D printed" as a feature, not an apology.
- If made to order, state the lead time clearly.
- DO NOT claim food safety, child safety, or heat resistance unless certified.
- DO NOT use "premium" or "luxury" without substantiation.

### Microcopy

| Context | Example |
|---|---|
| Add to cart | "Add to cart" (not "Buy now" unless it skips cart) |
| Out of stock | "Currently unavailable" |
| Made to order | "Made to order · Ships in X days" |
| Empty cart | "Your cart is empty. Browse our collection." |
| Order placed | "Order confirmed! We'll update you at each step." |
| Payment failed | "Payment couldn't be completed. Please try again." |

### What NOT to write

- Fake reviews or testimonials
- Claims about certifications not held
- Delivery time promises not verified with the owner
- Social media links to accounts that don't exist
- "24/7 support" or response time guarantees without evidence
