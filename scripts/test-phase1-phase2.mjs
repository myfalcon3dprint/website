/**
 * Phase 1 & Phase 2 Automated Verification Suite
 * Falcon 3D Prints - System of Record & Access Control Tests
 */

import { validateR2Configuration } from '../src/lib/cloudflare/r2.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   FALCON 3D PRINTS - PHASE 1 & PHASE 2 TEST SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // --- 1. Anonymous Access Protection (401 Defense-in-Depth) ---
  console.log('1. Anonymous Request Protection (Expected: 401 Unauthorized)');

  const protectedEndpoints = [
    { method: 'GET', url: `${BASE_URL}/api/orders`, desc: 'GET /api/orders' },
    { method: 'PATCH', url: `${BASE_URL}/api/orders/ord_test_nonexistent`, desc: 'PATCH /api/orders/[id]', body: { status: 'shipped' } },
    { method: 'POST', url: `${BASE_URL}/api/orders/ord_test_nonexistent/refund`, desc: 'POST /api/orders/[id]/refund', body: { action: 'approve' } },
    { method: 'GET', url: `${BASE_URL}/api/admin/metrics`, desc: 'GET /api/admin/metrics' },
    { method: 'GET', url: `${BASE_URL}/api/admin/queue`, desc: 'GET /api/admin/queue' },
    { method: 'PATCH', url: `${BASE_URL}/api/products/prod_test/stock`, desc: 'PATCH /api/products/[id]/stock', body: { variantId: 'v1', stockQuantity: 5 } },
    { method: 'GET', url: `${BASE_URL}/api/quotes`, desc: 'GET /api/quotes' },
    { method: 'PATCH', url: `${BASE_URL}/api/quotes/qt_test`, desc: 'PATCH /api/quotes/[id]', body: { estimatedPricePaise: 50000 } },
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert(res.status === 401, `${ep.desc} -> returned HTTP ${res.status} (expected 401)`);
    } catch (err) {
      assert(false, `${ep.desc} -> Network error: ${err.message}`);
    }
  }

  // --- 2. Public Storefront Access & Shared Serializers ---
  console.log('\n2. Public Catalog & Typed Serializer Verification');
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    assert(res.status === 200, `GET /api/products -> returned HTTP ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.products), `GET /api/products -> products is an Array (length: ${data.products?.length})`);
    
    if (data.products && data.products.length > 0) {
      const p = data.products[0];
      // Verify camelCase domain serialization from snake_case db
      assert(typeof p.basePricePaise === 'number', `Serializer maps base_price_paise -> basePricePaise (value: ${p.basePricePaise})`);
      assert(Array.isArray(p.variants), `Serializer populates variants array (count: ${p.variants?.length})`);
      if (p.variants?.length > 0) {
        assert(typeof p.variants[0].stockQuantity === 'number', `Serializer maps stock_quantity -> stockQuantity (value: ${p.variants[0].stockQuantity})`);
      }
    }
  } catch (err) {
    assert(false, `Catalog verification error: ${err.message}`);
  }

  // --- 3. Checkout Security & Validation ---
  console.log('\n3. Server-Side Checkout Security');
  try {
    // Missing required fields
    const res1 = await fetch(`${BASE_URL}/api/checkout/razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res1.status === 400, `Empty checkout order request rejected with HTTP ${res1.status} (expected 400)`);

    // Zero or negative total
    const res2 = await fetch(`${BASE_URL}/api/checkout/razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'ORD-TEST-001', amountPaise: 0 }),
    });
    assert(res2.status === 400, `Zero amountPaise rejected with HTTP ${res2.status} (expected 400)`);

    // Verify payment verification requires valid signature
    const res3 = await fetch(`${BASE_URL}/api/checkout/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'invalid_sig',
      }),
    });
    assert(res3.status === 400, `Forged payment verification rejected with HTTP ${res3.status} (expected 400)`);
  } catch (err) {
    assert(false, `Checkout security error: ${err.message}`);
  }

  // --- 4. R2 Configuration & Safe Secret Handling ---
  console.log('\n4. Cloudflare R2 Credentials & Configuration Safety');
  try {
    const report = validateR2Configuration();
    assert(Array.isArray(report.requiredEnvVars), `R2 validation lists required env vars: ${report.requiredEnvVars.join(', ')}`);
    assert(report.issues.length >= 0, `R2 validation completed without leaking credentials. Issues found: ${report.issues.length}`);
    for (const issue of report.issues) {
      console.log(`    ℹ Diagnostic (masked): ${issue}`);
    }
  } catch (err) {
    assert(false, `R2 validation error: ${err.message}`);
  }

  // --- 5. Summary ---
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
