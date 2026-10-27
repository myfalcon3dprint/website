# Storefront Design Guide

This guide establishes the visual direction, design tokens, component standards, and motion rules for the Falcon 3D Prints storefront. Software maintainers and UI designers must reference these rules when authoring storefront features.

## 1. Visual Direction

The storefront conveys additive manufacturing craftsmanship through an editorial physical aesthetic. Surfaces resemble warm archival paper and studio drafting tables rather than generic software interfaces.

### Core Principles
- Warm ivory backgrounds paired with deep charcoal typography.
- Restrained Falcon Orange highlights reserved for key actions and status markers.
- Strong editorial type contrast pairing an expressive serif display with a precise grotesque body.
- Generous white space balanced with practical commercial density.
- Smooth tactile physics with hardware-accelerated transforms.

## 2. Design Tokens

### Color Palette

| Token | Hex Value | Role | Contrast vs Ivory |
| :--- | :--- | :--- | :--- |
| `--page-bg` | `#FBF9F5` | Primary canvas ivory | Canvas baseline |
| `--surface` | `#FFFFFF` | Elevated cards and sheets | 1.05:1 |
| `--surface-alt` | `#F4F0E8` | Secondary containers and chips | 1.1:1 |
| `--surface-hover` | `#ECE7DC` | Interactive element hover | 1.2:1 |
| `--text-primary` | `#1A1816` | Headings, titles, prices | 15.6:1 (AAA) |
| `--text-secondary` | `#58544D` | Body text, captions, subtitles | 6.8:1 (AA) |
| `--text-muted` | `#827D74` | Field placeholders, breadcrumbs | 4.6:1 (AA) |
| `--brand-accent` | `#E8590C` | Primary buttons, brand mark | 4.5:1 (AA Large) |
| `--brand-accent-hover` | `#CF4E0A` | Button hover and active states | 5.2:1 (AA) |
| `--brand-accent-subtle` | `#FFF3EB` | Pill backgrounds, focus tints | 1.2:1 |
| `--border-subtle` | `#E8E4DA` | Card outlines, dividers | 1.15:1 |
| `--border-control` | `#878277` | Form inputs, unselected buttons | 3.2:1 |
| `--border-focus` | `#1A1816` | Keyboard focus ring base | 15.6:1 |

### Commerce Status Tokens

| Status | Background | Text Color | Border | Usage |
| :--- | :--- | :--- | :--- | :--- |
| Ready Stock | `#ECFDF5` | `#047857` | `#A7F3D0` | Dispatches within 24 hours |
| Made to Order | `#FFFBEB` | `#B45309` | `#FDE68A` | 2 to 4 days production |
| Critical Alert | `#FEF2F2` | `#B91C1C` | `#FECACA` | Form errors, out of stock |

### Typography

| Hierarchy | Font Family | Size | Weight | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| Editorial Display | Playfair Display, serif | 2.5rem to 4.0rem | 600 / 700 | -0.02em |
| Section Headings | Plus Jakarta Sans, sans-serif | 1.75rem to 2.25rem | 700 | -0.025em |
| Product Headings | Plus Jakarta Sans, sans-serif | 1.15rem to 1.35rem | 600 | -0.015em |
| Body Prose | Plus Jakarta Sans, sans-serif | 0.925rem | 400 / 500 | Normal |
| Numerical Figures | Tabular Numbers (tnum) | 1.1rem to 1.75rem | 700 | Normal |
| Eyebrow Labels | Plus Jakarta Sans, sans-serif | 0.72rem | 700 | 0.08em (Uppercase) |

## 3. Motion System

The motion system provides immediate spatial orientation without delaying customer tasks. All transitions use hardware-accelerated CSS properties (`transform`, `opacity`).

### Motion Tokens
```css
--duration-instant: 140ms;
--duration-fast: 200ms;
--duration-normal: 280ms;
--duration-drawer: 320ms;
--duration-entrance: 500ms;
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

### Component Timing Guidelines
- Button click and hover states: 140ms with `transform: translateY(-1px)`.
- Dropdown menus and inline tooltips: 200ms with scale and opacity changes.
- Cart drawer slide and modal entrances: 300ms using `translateX` and backdrop blur.
- Catalog card hover: 240ms with image scale inside overflow hidden.
- Section scroll entrance: 450ms staggered by 60ms per child item.

### Accessibility Requirement
When a user sets `prefers-reduced-motion: reduce`, the browser forces animation and transition durations to 0.01ms. Content remains instantly visible.

## 4. Component Rules

### Interactive Cards
- Product cards must clip images within a 4:3 or 1:1 aspect ratio container.
- The image scales by 1.03 on hover while the card lifts by 3 pixels.
- The card maintains a 1-pixel border halo with subtle shadow expansion.

### Buttons and Controls
- Minimum clickable touch targets must measure at least 44 pixels by 44 pixels.
- Buttons display explicit loading spinners and checkmark feedback states.
- Disabled controls use 45 percent opacity and display cursor not-allowed.

### Form Inputs
- Every form field requires an explicit label and autocomplete attribute.
- Validation errors display beneath fields with specific guidance.
