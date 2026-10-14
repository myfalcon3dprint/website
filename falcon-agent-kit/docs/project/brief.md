# Project Brief — Falcon 3D Prints

## Business

**Falcon 3D Prints** is a 3D printing business based in Nashik, Maharashtra, India that produces custom and ready-made 3D printed products. They sell decorative items, functional prototypes, and specialty products manufactured using FDM/FFF 3D printing technology.

### Verified facts

| Field | Value | Source |
|---|---|---|
| Business name | Falcon 3D Prints | Supplied by owner |
| Tagline | "Where ideas take shapes" | Supplied by owner |
| Phone | +91 98506 07144 | Supplied by owner |
| Address | Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India | Supplied by owner |
| Country | India | Implied from address |
| Currency | INR (₹) | Implied from Indian location |

### Not verified — do not assume

- Domain name, email address, or social media accounts
- Business registration, GST number, or certifications
- Operating hours or response times
- WhatsApp availability (phone number alone is not evidence)
- Delivery areas, shipping partners, or delivery time promises
- Product safety certifications (food safe, child safe, heat resistant)
- Return/refund/exchange policy
- Whether "kitchen sets" are decorative miniatures or functional kitchen items

## What we are building

A premium e-commerce website with an integrated admin panel:

1. **Public storefront** — Product catalog, search, filtering, product detail pages with material/variant information, cart, checkout with Razorpay payment, order tracking, and customer accounts.

2. **Admin panel** — Product management, order management with production tracking, customer management, enquiry/quote handling, staff roles and permissions, sales reporting.

## Technology decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR/SSG for SEO, React Server Components for performance, established ecosystem |
| Language | TypeScript (strict) | Type safety for commerce logic, better DX |
| Backend/Auth/DB | Supabase | Managed PostgreSQL, built-in auth, RLS, storage, real-time capabilities |
| Payments | Razorpay | Indian payment gateway, supports UPI/cards/wallets/netbanking |
| Hosting | TBD | See open-questions.md |
| Styling | TBD | See decisions.md — likely Tailwind CSS or vanilla CSS with design tokens |

## Audience

- **Primary customers**: Individuals and businesses in India looking for 3D printed products — decorative items, gifts, prototypes, custom orders
- **Admin users**: Business owner and potential small staff team
- **Geography**: India-first, INR-only initially

## Success criteria

1. Customer can browse, search, and filter products
2. Customer can add items to cart and complete checkout with Razorpay
3. Customer can track their order status
4. Admin can manage products, process orders, and track production
5. Site loads fast (LCP < 2.5s) and is accessible (WCAG 2.1 AA)
6. Payment handling is correct — no double charges, proper failure handling
7. Brand presentation feels premium and trustworthy
