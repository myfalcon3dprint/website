# Open Questions — Falcon 3D Prints

> Questions requiring business owner input. Each has an ID, blocking status, and default assumption if unresolved.

## Critical — blocks Phase 0

### Q-005: Brand assets

- **Question**: Can you provide the Falcon 3D Prints logo files? SVG is preferred for web use, but high-resolution PNG is acceptable. Any specific colours, fonts, or brand guidelines?
- **Blocks**: Phase 0 (design system), all UI work
- **Default if unresolved**: Use orange (#F97316) as primary based on description of "orange falcon logos." Generate a placeholder wordmark. Replace when assets arrive.
- **Status**: OPEN

### Q-010: Styling framework preference

- **Question**: Do you prefer Tailwind CSS (utility-first, faster development) or vanilla CSS (full control)? Tailwind CSS is recommended for this project.
- **Blocks**: Phase 0 (design system setup)
- **Default if unresolved**: Use Tailwind CSS v3+
- **Status**: OPEN

### Q-011: Razorpay credentials

- **Question**: Do you have a Razorpay account? Can you provide sandbox/test API keys for development?
- **Blocks**: Phase 2 (checkout)
- **Default if unresolved**: Build payment integration code against Razorpay documentation. Test with mock responses until real credentials are available.
- **Status**: OPEN

## High — blocks specific phases

### Q-001: Product categories and catalog structure

- **Question**: What product categories do you sell? Examples: decorative items, functional parts, custom orders, kitchen sets? How should they be organised on the website?
- **Blocks**: Phase 1 (catalog navigation), database seeding
- **Default if unresolved**: Create a flexible category system and populate with placeholder categories that can be renamed.
- **Status**: OPEN

### Q-002: Shipping policy and delivery areas

- **Question**: Where do you ship? India only? Which courier/shipping partners? How is shipping cost calculated (flat rate, weight-based, free above threshold)? What are typical delivery times?
- **Blocks**: Phase 2 (checkout shipping calculation)
- **Default if unresolved**: Implement flat-rate shipping as a configurable value in admin. Add note "Shipping calculated at checkout."
- **Status**: OPEN

### Q-003: Return/refund policy

- **Question**: Do you accept returns? Under what conditions? What is the refund process? What about damaged items?
- **Blocks**: Phase 5 (order management), customer-facing policy page
- **Default if unresolved**: Create a policy page template that must be filled in by the owner before launch.
- **Status**: OPEN

### Q-006: Nature of "kitchen sets" products

- **Question**: Are the kitchen sets decorative miniatures (e.g., dollhouse furniture, display pieces) or functional kitchen items? This affects product descriptions, safety claims, and material disclosures.
- **Blocks**: Product descriptions, safety/compliance content
- **Default if unresolved**: Describe as "decorative" / "display" items. Do NOT claim food safety, heat resistance, or child safety.
- **Status**: OPEN

### Q-007: GST registration and tax handling

- **Question**: Is Falcon 3D Prints GST-registered? What is the GST number? What HSN codes apply to your products? What tax rates (5%, 12%, 18%, 28%)?
- **Blocks**: Phase 2 (tax calculation), invoicing
- **Default if unresolved**: Implement configurable tax rate per product/category. Show "Price inclusive of all taxes" or "Plus applicable GST" — must be decided.
- **Status**: OPEN

### Q-008: Custom order workflow

- **Question**: How do custom orders work today? Does the customer email/call with a design? Do you provide a quote? How is the quote approved? Is a deposit required?
- **Blocks**: Phase 7 (enquiry and quoting system)
- **Default if unresolved**: Build basic enquiry form. Admin can respond via the system. Full quoting deferred until workflow is clarified.
- **Status**: OPEN

### Q-009: Staff roles and team size

- **Question**: How many people will use the admin panel? What are their roles? Is it just you (the owner) initially, or do you have staff who handle orders, production, etc.?
- **Blocks**: Phase 6 (permissions system)
- **Default if unresolved**: Implement full role system but initially create only the Owner role. Additional roles can be activated when staff are added.
- **Status**: OPEN

## Medium — can proceed with defaults

### Q-004: Domain name and hosting

- **Question**: Do you have a domain name? Where should the site be hosted? Vercel is recommended for Next.js.
- **Blocks**: Phase 11 (deployment)
- **Default if unresolved**: Configure for Vercel deployment. Domain can be connected later.
- **Status**: OPEN

### Q-012: Guest checkout

- **Question**: Should customers be able to checkout without creating an account? (Recommended: yes, with option to create account after purchase.)
- **Blocks**: Phase 2/3 boundary
- **Default if unresolved**: Implement guest checkout.
- **Status**: OPEN

### Q-013: Social media and WhatsApp

- **Question**: Do you have official social media accounts (Instagram, Facebook)? Is the phone number available on WhatsApp for customer queries?
- **Blocks**: Footer content, contact page
- **Default if unresolved**: Show only verified phone number and address. No social links or WhatsApp button.
- **Status**: OPEN

### Q-014: Email service

- **Question**: What email address should be used for order confirmations, enquiry responses, and password resets? Do you have a business email domain?
- **Blocks**: Email notifications
- **Default if unresolved**: Use Supabase's built-in email for auth. Order notifications deferred until email is configured.
- **Status**: OPEN

### Q-015: Product photos

- **Question**: Do you have product photographs? Can you provide them, or will we need to use placeholder images initially?
- **Blocks**: Phase 1 (visual quality of catalog)
- **Default if unresolved**: Use placeholder images with clear labels. Replace with real photos when available.
- **Status**: OPEN

### Q-016: Pricing strategy

- **Question**: Are all prices fixed and shown publicly? Or do some products have "Request a quote" pricing? Is there a minimum order value?
- **Blocks**: Phase 1/2 pricing display and checkout logic
- **Default if unresolved**: All products have fixed public prices. "Request a quote" available via enquiry form for custom work.
- **Status**: OPEN
