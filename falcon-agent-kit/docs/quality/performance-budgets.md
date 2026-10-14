# Performance Budgets & Core Web Vitals — Falcon 3D Prints

> Performance thresholds and budgets designed to keep the Falcon 3D Prints e-commerce storefront fast, responsive, and lightweight on both mobile and desktop networks in India.

## Performance Objectives & Target Network

- **Primary Audience Profile**: Mobile browsers on 4G/5G connections across India.
- **Device Profile**: Mid-tier mobile devices (e.g., Moto G, Samsung Galaxy A-series) and modern desktop browsers.
- **Reference Tooling**: Google Lighthouse (Mobile emulation: Moto G4, 4G Slow), Chrome DevTools Performance Profiler.

---

## 1. Core Web Vitals (CWV) Thresholds

| Metric | Target (Good) | Needs Improvement | Poor | Measurement Context |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | **<= 2.0s** | 2.1s - 3.5s | > 3.5s | Hero image or main product render on mobile |
| **INP** (Interaction to Next Paint) | **<= 150ms** | 151ms - 300ms | > 300ms | Quantity stepper, filter toggle, cart drawer |
| **CLS** (Cumulative Layout Shift) | **<= 0.05** | 0.06 - 0.15 | > 0.15 | Zero unexpected shift from images or fonts |
| **FCP** (First Contentful Paint) | **<= 1.2s** | 1.3s - 2.5s | > 2.5s | Initial paint of shell and typography |
| **TTFB** (Time to First Byte) | **<= 400ms** | 401ms - 800ms | > 800ms | Edge cached SSR / static HTML response |

---

## 2. Resource Budgets (Gzip / Brotli Compressed)

| Asset Class | Budget per Page (Max) | Enforcement Strategy |
|---|---|---|
| **Initial HTML** | **<= 35 KB** | Thin SSR payloads; avoid bloated inline JSON state |
| **Total JavaScript (Storefront)** | **<= 180 KB** | Route-based code splitting, dynamic imports for heavy components |
| **Total CSS** | **<= 40 KB** | Tailwind / Vanilla CSS purged build; zero unused rules |
| **Hero Image (LCP)** | **<= 120 KB** | Next.js Image with WebP/AVIF format and responsive `sizes` |
| **Product Gallery Image (Per item)** | **<= 80 KB** | Lazy loaded with progressive placeholder (blur-up) |
| **Web Fonts** | **<= 50 KB** | Self-hosted WOFF2, subsetted to Latin glyphs, `font-display: swap` |
| **3D Assets / STL Viewer (Optional)** | **Dynamic on-demand only** | Never bundle Three.js into the main bundle. Must be lazy-loaded on explicit user click ("View 3D"). Limit mesh to <= 2 MB. |

---

## 3. Optimization Rules & Guardrails

### 3.1 Script Execution
- No third-party analytics or tracker scripts in the critical rendering path.
- Razorpay Checkout SDK (`checkout.razorpay.com/v1/checkout.js`) must only load when user initiates the checkout flow, never on initial homepage or catalog load.

### 3.2 Image Delivery
- Always use `next/image` with explicit `width`, `height`, and `aspect-ratio` to eliminate layout shift (CLS = 0).
- Product images uploaded to Supabase Storage must be transformed via CDN image resizing parameters before delivery.

### 3.3 Database & Server Operations
- Database queries must execute within **<= 50ms** for 95th percentile requests.
- All product catalog queries must utilize composite indexes on `(status, category_id, created_at)`.
- Use Supabase caching or Next.js `unstable_cache` / ISR for catalog views.

---

## 4. Performance Audit Verification

Every pull request or release candidate must include an automated or recorded Lighthouse mobile audit report:
- Lighthouse Performance Score: **>= 90** on mobile.
- Zero budget violations.
- Recorded in [`docs/agent/evidence.md`](../agent/evidence.md).
