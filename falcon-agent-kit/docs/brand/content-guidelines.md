# Content Guidelines — Falcon 3D Prints

> Writing standards for all text in the application. See `brand-guidelines.md` for voice and tone.

## Page titles and SEO

| Page | Title format | Meta description guidance |
|---|---|---|
| Homepage | Falcon 3D Prints — Where ideas take shapes | Business description, key product categories, location |
| Category | [Category Name] — Falcon 3D Prints | Category description, what's available |
| Product | [Product Name] — Falcon 3D Prints | Product summary, material, price range |
| Cart | Your Cart — Falcon 3D Prints | — (noindex) |
| Checkout | Checkout — Falcon 3D Prints | — (noindex) |
| Account | My Account — Falcon 3D Prints | — (noindex) |
| Admin | Admin — Falcon 3D Prints | — (noindex, nofollow) |
| Contact | Contact Us — Falcon 3D Prints | Business address, phone, enquiry form |

## Heading hierarchy

- One `<h1>` per page (the page title).
- Use `<h2>` for major sections, `<h3>` for subsections.
- Never skip heading levels.

## Product content structure

### Required fields

1. **Product name** — clear, descriptive, no ALL CAPS.
2. **Price** — formatted as ₹X,XXX (commas for Indian numbering: ₹1,00,000 for lakhs).
3. **Availability** — "In stock", "Made to order (X days)", or "Currently unavailable".
4. **Material** — PLA, PETG, ABS, etc. with brief explanation for non-technical customers.
5. **Dimensions** — Height × Width × Depth in centimetres.

### Optional fields

6. **Short description** — 1-2 sentences for listing cards.
7. **Full description** — detailed, benefit-led, honest.
8. **Weight** — in grams.
9. **Care instructions** — how to clean, what to avoid.
10. **Finish** — matte, glossy, painted, etc.

### Price formatting

```typescript
function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}
// 49900 → "₹499"
// 149950 → "₹1,499.50"
// 10000000 → "₹1,00,000"
```

## Error messages

| Context | Bad | Good |
|---|---|---|
| Form validation | "Invalid input" | "Please enter a valid email address" |
| Stock | "Error" | "Sorry, only 2 left in stock" |
| Payment | "Transaction failed" | "Payment couldn't be completed. Your card was not charged. Please try again or use a different payment method." |
| 404 | "Page not found" | "We couldn't find that page. It may have been moved or removed." |
| 500 | "Internal server error" | "Something went wrong on our end. Please try again in a moment." |

## Empty states

Every list/grid must have a meaningful empty state:

| Context | Message |
|---|---|
| Empty cart | "Your cart is empty. Browse our collection to find something you'll love." |
| No search results | "No products found for '[query]'. Try a different search or browse our categories." |
| No orders | "You haven't placed any orders yet." |
| No enquiries (admin) | "No enquiries yet." |
| No products in category | "No products in this category yet. Check back soon!" |

## Admin content

- Use clear, concise labels.
- Use sentence case for labels (not Title Case).
- Use placeholder text that shows the expected format: "e.g., 15cm × 10cm × 8cm".
- Use confirmation dialogs for destructive actions: "Delete [Product Name]? This cannot be undone."
- Show success feedback: "Product saved" / "Order updated".
