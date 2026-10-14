# Design System — Falcon 3D Prints

> UI component specifications. All values reference tokens from `brand-guidelines.md`.

## Buttons

### Primary button

```css
.btn-primary {
  background: var(--color-primary-600);
  color: white;
  font-weight: 500;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: background 150ms ease, transform 100ms ease;
  cursor: pointer;
  border: none;
}
.btn-primary:hover { background: var(--color-primary-700); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
```

### Secondary button

Background: transparent. Border: `var(--color-neutral-300)`. Text: `var(--color-neutral-700)`.
Hover: background `var(--color-neutral-100)`.

### Destructive button

Background: `var(--color-error-600)`. Text: white. Used for delete actions.

### Ghost button

Background: transparent. No border. Text: `var(--color-neutral-600)`.
Hover: background `var(--color-neutral-100)`.

### Button sizes

| Size | Padding | Font size |
|---|---|---|
| `sm` | `var(--space-2) var(--space-4)` | `var(--text-sm)` |
| `md` (default) | `var(--space-3) var(--space-6)` | `var(--text-base)` |
| `lg` | `var(--space-4) var(--space-8)` | `var(--text-lg)` |

---

## Inputs

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-neutral-700);
  background: white;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  outline: none;
}
.input:invalid, .input[aria-invalid="true"] {
  border-color: var(--color-error-500);
}
.input::placeholder { color: var(--color-neutral-400); }
```

- Labels: `var(--text-sm)`, `font-weight: 500`, `var(--color-neutral-700)`.
- Error messages: `var(--text-sm)`, `var(--color-error-600)`.
- Helper text: `var(--text-sm)`, `var(--color-neutral-500)`.

---

## Cards

### Product card

```css
.product-card {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-neutral-200);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
```

- Image: aspect-ratio 4/3 or 1/1, `object-fit: cover`.
- Content padding: `var(--space-4)`.
- Title: `var(--text-lg)`, `font-weight: 600`.
- Price: `var(--text-lg)`, `font-weight: 700`, `var(--color-neutral-900)`.
- Availability badge: small coloured badge in top-right corner.

### Admin card (stats)

Simpler design. Neutral background `var(--color-neutral-50)`. No hover effects. Content-focused.

---

## Badges

| Variant | Background | Text | Usage |
|---|---|---|---|
| `in-stock` | `var(--color-success-500)` + 10% opacity | `var(--color-success-600)` | In stock |
| `made-to-order` | `var(--color-warning-500)` + 10% opacity | `var(--color-warning-600)` | Made to order |
| `out-of-stock` | `var(--color-error-500)` + 10% opacity | `var(--color-error-600)` | Out of stock |
| `draft` | `var(--color-neutral-200)` | `var(--color-neutral-600)` | Admin draft |
| `info` | `var(--color-info-500)` + 10% opacity | `var(--color-info-600)` | General info |

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}
```

---

## Modals

- Overlay: `rgba(0, 0, 0, 0.5)` with backdrop-blur.
- Container: `max-width: 32rem`, `border-radius: var(--radius-xl)`, `padding: var(--space-6)`.
- Close button in top-right corner.
- Focus trapped inside modal when open.
- Dismiss on overlay click and Escape key.
- Entry animation: fade + scale from 95% to 100%.
- Exit animation: fade out.

---

## Toast notifications

- Position: top-right on desktop, top-centre on mobile.
- Auto-dismiss after 5 seconds (configurable).
- Types: success (green), error (red), warning (yellow), info (blue).
- Slide-in animation from right (desktop) or top (mobile).
- Dismiss on click or swipe.

---

## Data tables (admin)

- Header: `var(--color-neutral-50)` background, `font-weight: 600`.
- Rows: alternating white / `var(--color-neutral-50)`.
- Hover: `var(--color-primary-50)`.
- Borders: `var(--color-neutral-200)`.
- Sortable columns: clickable header with sort indicator.
- Responsive: horizontal scroll on mobile, or card layout for narrow screens.

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Full-page modals |

---

## Responsive breakpoints

| Name | Min-width | Usage |
|---|---|---|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

Mobile-first approach: base styles for mobile, override with `@media (min-width: ...)`.
