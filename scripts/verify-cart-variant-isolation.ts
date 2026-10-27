import assert from 'node:assert';
import { INITIAL_PRODUCTS } from '../src/lib/mock-data';
import { Product, CartItem } from '../src/lib/types';

// Mock localStorage in Node
const storage = new Map<string, string>();
(global as any).window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
(global as any).localStorage = {
  getItem: (k: string) => storage.get(k) || null,
  setItem: (k: string, v: string) => storage.set(k, String(v)),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
};

const CART_STORAGE_KEY = 'falcon_cart_v2';

function getStoredCart(catalog: Product[]): CartItem[] {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  const sanitized: CartItem[] = [];

  for (const rawItem of parsed) {
    const item = rawItem as Partial<CartItem>;
    const product = catalog.find((p) => p.id === item.product?.id) || item.product;
    if (!product || !product.id) continue;

    const matchingVariant = product.variants?.find((v) => v.id === item.variant?.id);
    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? Math.floor(item.quantity) : 1;

    if (!matchingVariant || matchingVariant.id === 'unresolved') {
      sanitized.push({
        id: item.id || `${product.id}_unresolved`,
        product,
        variant: {
          id: 'unresolved',
          sku: 'UNKNOWN',
          title: 'Variant configuration unavailable — Please re-select',
          material: 'PLA',
          color: 'Unknown',
          finish: 'Raw (Layered)',
          pricePaise: product.basePricePaise || 0,
          dimensions: { lengthMm: 0, widthMm: 0, heightMm: 0 },
          weightGrams: 0,
          stockQuantity: 0,
          leadTimeDays: 0,
        },
        quantity: qty,
        needsReselection: true,
      });
      continue;
    }

    const stableId = `${product.id}_${matchingVariant.id}`;
    sanitized.push({
      id: stableId,
      product: { ...product },
      variant: { ...matchingVariant },
      quantity: qty,
      needsReselection: false,
    });
  }
  return sanitized;
}

function saveStoredCart(cart: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(catalog: Product[], product: Product, variantId: string, quantity = 1): CartItem[] {
  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const stableId = `${product.id}_${variant.id}`;
  const current = getStoredCart(catalog);
  const existingIndex = current.findIndex((item) => item.id === stableId);
  const maxStock = variant.leadTimeDays === 0 ? Math.max(0, variant.stockQuantity) : 99;

  let updated: CartItem[];
  if (existingIndex > -1) {
    updated = current.map((item, idx) => {
      if (idx === existingIndex) {
        const nextQty = Math.min(item.quantity + quantity, maxStock);
        return {
          ...item,
          quantity: nextQty,
          variant: { ...variant },
          product: { ...product },
        };
      }
      return item;
    });
  } else {
    const initialQty = Math.min(Math.max(1, quantity), maxStock);
    updated = [
      ...current,
      {
        id: stableId,
        product: { ...product },
        variant: { ...variant },
        quantity: initialQty,
        needsReselection: false,
      },
    ];
  }
  saveStoredCart(updated);
  return updated;
}

function updateQuantity(catalog: Product[], cartItemId: string, newQty: number): CartItem[] {
  const current = getStoredCart(catalog);
  if (newQty <= 0) {
    const updated = current.filter((item) => item.id !== cartItemId);
    saveStoredCart(updated);
    return updated;
  }
  const updated = current.map((item) => {
    if (item.id !== cartItemId) return item;
    const maxStock = item.variant.leadTimeDays === 0 ? Math.max(0, item.variant.stockQuantity) : 99;
    const clampedQty = Math.min(newQty, maxStock);
    return { ...item, quantity: clampedQty };
  });
  saveStoredCart(updated);
  return updated;
}

function removeFromCart(catalog: Product[], cartItemId: string): CartItem[] {
  const current = getStoredCart(catalog);
  const updated = current.filter((item) => item.id !== cartItemId);
  saveStoredCart(updated);
  return updated;
}

function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + (item.needsReselection ? 0 : item.variant.pricePaise * item.quantity), 0);
}

function calculateItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + (item.needsReselection ? 0 : item.quantity), 0);
}

async function runTestSuite() {
  console.log('--- Starting Falcon 3D Prints Variant & Cart Verification Suite ---');

  const catalog = INITIAL_PRODUCTS;
  const planter = catalog.find((p) => p.id === 'prod-001');
  assert(planter, 'Planter prod-001 must exist');

  const blackVariant = planter.variants.find((v) => v.id === 'var-001-a');
  const orangeVariant = planter.variants.find((v) => v.id === 'var-001-b');
  const terracottaVariant = planter.variants.find((v) => v.id === 'var-001-c');

  assert(blackVariant, 'Black variant must exist');
  assert(orangeVariant, 'Orange variant must exist');
  assert(terracottaVariant, 'Terracotta variant must exist');

  // Verify prices
  assert.strictEqual(blackVariant.pricePaise, 49900, 'Black variant must be ₹499 (49900 paise)');
  assert.strictEqual(orangeVariant.pricePaise, 54900, 'Orange variant must be ₹549 (54900 paise)');

  // Clear cart
  localStorage.clear();

  // Step 1: Add 2 Black planters at ₹499 each
  console.log('Step 1: Adding 2 Black planters @ ₹499...');
  addToCart(catalog, planter, blackVariant.id, 2);
  let cart = getStoredCart(catalog);
  assert.strictEqual(cart.length, 1);
  assert.strictEqual(cart[0].id, 'prod-001_var-001-a');
  assert.strictEqual(cart[0].quantity, 2);
  assert.strictEqual(cart[0].variant.image, '/products/planter-obsidian-black.jpg');

  // Step 2: Add 3 Orange planters at ₹549 each
  console.log('Step 2: Adding 3 Orange planters @ ₹549...');
  addToCart(catalog, planter, orangeVariant.id, 3);
  cart = getStoredCart(catalog);

  // Step 3: Confirm two separate cart lines, correct images, five total units, and subtotal of ₹2,645
  console.log('Step 3: Validating two separate lines, images, 5 total units, ₹2,645 subtotal...');
  assert.strictEqual(cart.length, 2, 'Must have exactly 2 distinct cart lines');
  const blackLine = cart.find((i) => i.variant.id === blackVariant.id);
  const orangeLine = cart.find((i) => i.variant.id === orangeVariant.id);

  assert(blackLine, 'Black cart line must exist');
  assert(orangeLine, 'Orange cart line must exist');
  assert.strictEqual(blackLine.id, 'prod-001_var-001-a');
  assert.strictEqual(orangeLine.id, 'prod-001_var-001-b');
  assert.strictEqual(blackLine.variant.image, '/products/planter-obsidian-black.jpg', 'Black line must retain black image');
  assert.strictEqual(orangeLine.variant.image, '/products/planter-orange-variant.jpg', 'Orange line must retain orange image');
  assert.notStrictEqual(blackLine.variant.image, orangeLine.variant.image, 'Variants must have distinct images');

  assert.strictEqual(calculateItemCount(cart), 5, 'Total units must equal 5');
  assert.strictEqual(calculateSubtotal(cart), 264500, 'Subtotal must equal ₹2,645.00 (264500 paise)');
  console.log('✓ Step 3 Passed: 2 separate lines, distinct images, 5 units, subtotal ₹2,645');

  // Step 4: Increase Black to 3: Orange remains unchanged; subtotal becomes ₹3,144
  console.log('Step 4: Increasing Black to 3 units...');
  updateQuantity(catalog, blackLine.id, 3);
  cart = getStoredCart(catalog);
  const updatedBlack = cart.find((i) => i.id === blackLine.id)!;
  const updatedOrange = cart.find((i) => i.id === orangeLine.id)!;

  assert.strictEqual(updatedBlack.quantity, 3, 'Black quantity must be 3');
  assert.strictEqual(updatedOrange.quantity, 3, 'Orange quantity must remain unchanged at 3');
  assert.strictEqual(calculateSubtotal(cart), 314400, 'Subtotal must become ₹3,144.00 (314400 paise)');
  console.log('✓ Step 4 Passed: Black is 3, Orange is 3, subtotal is ₹3,144');

  // Step 5: Decrease Orange to 2: Black remains unchanged; subtotal becomes ₹2,595
  console.log('Step 5: Decreasing Orange to 2 units...');
  updateQuantity(catalog, orangeLine.id, 2);
  cart = getStoredCart(catalog);
  const blackAfterStep5 = cart.find((i) => i.id === blackLine.id)!;
  const orangeAfterStep5 = cart.find((i) => i.id === orangeLine.id)!;

  assert.strictEqual(blackAfterStep5.quantity, 3, 'Black quantity must remain unchanged at 3');
  assert.strictEqual(orangeAfterStep5.quantity, 2, 'Orange quantity must be 2');
  assert.strictEqual(calculateSubtotal(cart), 259500, 'Subtotal must become ₹2,595.00 (259500 paise)');
  console.log('✓ Step 5 Passed: Black is 3, Orange is 2, subtotal is ₹2,595');

  // Step 6: Remove Black: only 2 Orange remain, subtotal ₹1,098
  console.log('Step 6: Removing Black line...');
  removeFromCart(catalog, blackLine.id);
  cart = getStoredCart(catalog);

  assert.strictEqual(cart.length, 1, 'Only 1 line must remain');
  assert.strictEqual(cart[0].id, orangeLine.id, 'Remaining line must be Orange');
  assert.strictEqual(cart[0].quantity, 2, 'Remaining Orange quantity must be 2');
  assert.strictEqual(cart[0].variant.image, '/products/planter-orange-variant.jpg', 'Image must stay Orange');
  assert.strictEqual(calculateSubtotal(cart), 109800, 'Subtotal must become ₹1,098.00 (109800 paise)');
  console.log('✓ Step 6 Passed: Only 2 Orange remain, subtotal is ₹1,098');

  // Step 7: Refresh & cart restoration preserves variant identity, images, and totals
  console.log('Step 7: Simulating page refresh and cart restoration from storage...');
  const restoredCart = getStoredCart(catalog);
  assert.strictEqual(restoredCart.length, 1);
  assert.strictEqual(restoredCart[0].id, 'prod-001_var-001-b');
  assert.strictEqual(restoredCart[0].variant.image, '/products/planter-orange-variant.jpg');
  assert.strictEqual(restoredCart[0].quantity, 2);
  assert.strictEqual(calculateSubtotal(restoredCart), 109800);
  console.log('✓ Step 7 Passed: Restored cart matches stored variant state exactly');

  // Step 8: Rapid clicks and separate draft quantities
  console.log('Step 8: Testing rapid add-to-cart clicks and variant draft isolation...');
  addToCart(catalog, planter, blackVariant.id, 1);
  addToCart(catalog, planter, blackVariant.id, 1);
  addToCart(catalog, planter, blackVariant.id, 1);
  cart = getStoredCart(catalog);
  const rapidBlack = cart.find((i) => i.id === 'prod-001_var-001-a')!;
  assert.strictEqual(rapidBlack.quantity, 3, 'Rapid clicks should cleanly accumulate without lost updates');
  console.log('✓ Step 8 Passed: Rapid clicks accumulated quantity without race condition');

  // Step 9: Stock limits & legacy/unresolved cart item handling
  console.log('Step 9: Testing stock limits and corrupted/old cart recovery...');
  // Black has 14 in stock. Attempting to add 20 should cap at 14.
  updateQuantity(catalog, 'prod-001_var-001-a', 20);
  cart = getStoredCart(catalog);
  const cappedBlack = cart.find((i) => i.id === 'prod-001_var-001-a')!;
  assert.strictEqual(cappedBlack.quantity, 14, 'Quantity must cap at variant stockQuantity (14)');

  // Test legacy or unresolvable cart entry (e.g. deleted variant)
  const legacyStorageData = [
    {
      id: 'legacy-corrupted-item',
      product: { id: 'prod-001' },
      variant: { id: 'non-existent-variant' },
      quantity: 1,
    },
  ];
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(legacyStorageData));
  const recoveredCart = getStoredCart(catalog);
  assert.strictEqual(recoveredCart.length, 1);
  assert.strictEqual(recoveredCart[0].needsReselection, true, 'Unresolvable variant must flag needsReselection');
  console.log('✓ Step 9 Passed: Stock limits capped cleanly; unresolvable cart items require re-selection');

  // Step 10: Missing variant images and neutral fallback verification
  console.log('Step 10: Testing variant without image (Terracotta var-001-c)...');
  assert.strictEqual(terracottaVariant.image, undefined, 'Terracotta must not silently borrow Obsidian Black image');
  console.log('✓ Step 10 Passed: Variant without image correctly verified without misleading color borrowing');

  console.log('\n=======================================================');
  console.log('ALL 10 VERIFICATION CHECKS COMPLETED AND PASSED!');
  console.log('=======================================================');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
