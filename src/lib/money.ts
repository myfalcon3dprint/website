// Money & Currency Formatting — Falcon 3D Prints
// All internal transactions and prices are integer minor units (paise).

/**
 * Converts integer paise into a formatted Indian Rupee string (e.g. 149900 -> "₹1,499").
 */
export function formatINR(paise: number, includeDecimals = false): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Computes cart line subtotal strictly with integer minor units.
 */
export function calculateLineTotal(unitPricePaise: number, quantity: number): number {
  return Math.round(unitPricePaise * Math.max(1, quantity));
}

/**
 * Calculates delivery shipping fee based on PIN code and order subtotal.
 * Free delivery above ₹999 across India.
 * Local Nashik (PINs starting with 422): Flat ₹49 for orders below ₹999.
 * Rest of India: Flat ₹99 for orders below ₹999.
 */
export function calculateShippingFeePaise(subtotalPaise: number, pinCode?: string): number {
  if (subtotalPaise >= 99900) return 0; // Free shipping over ₹999
  
  if (pinCode && pinCode.trim().startsWith('422')) {
    return 4900; // Local Nashik delivery ₹49
  }
  return 9900; // Standard domestic courier ₹99
}

/**
 * Calculates standard GST (18%) on taxable goods.
 */
export function calculateTaxPaise(subtotalPaise: number): number {
  // Prices in storefront are inclusive of GST per standard Indian retail norms.
  // Breakdown portion for display:
  return Math.round(subtotalPaise * (18 / 118));
}
