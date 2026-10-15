/**
 * Falcon 3D Prints — E2E Product Concurrency, Media Upload & Persistence Verification
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:3001';
const TEST_SECRET = 'falcon_test_sec_isolated_local_test_harness_2026';

const headers = {
  'Content-Type': 'application/json',
  'x-falcon-test-role': 'owner',
  'x-falcon-test-secret': TEST_SECRET,
};

async function run() {
  console.log('\n========================================================================');
  console.log('   E2E PRODUCT CONCURRENCY, MEDIA UPLOAD & PERSISTENCE VERIFICATION     ');
  console.log('========================================================================\n');

  // Step 1: Create a distinct test product
  const testSlug = `e2e-planter-${Date.now()}`;
  console.log(`1. Creating Test Product: ${testSlug}`);
  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'E2E Origami Planter',
      slug: testSlug,
      shortDescription: 'Initial version v1 description',
      description: 'Full product description for E2E persistence testing.',
      basePricePaise: 49900,
      availability: 'in_stock',
      images: [],
      variants: [
        {
          sku: `SKU-${Date.now()}`,
          title: 'Matte Charcoal',
          material: 'PLA',
          color: 'Charcoal',
          finish: 'Matte',
          priceAdjustmentPaise: 0,
          stockQuantity: 25,
          leadTimeDays: 1,
        },
      ],
    }),
  });

  assert.strictEqual(createRes.status, 201, `Product creation failed: ${createRes.status}`);
  const createData = await createRes.json();
  const productV1 = createData.product;
  console.log(`   ✓ Created product ID: ${productV1.id}`);
  console.log(`   ✓ Initial version token (V1): ${productV1.updatedAt}`);

  // Step 2: Test Image Upload to Supabase Storage (Fail-closed, NO local file fallback)
  console.log('\n2. Testing Genuine Binary Image Upload to Supabase Storage (product-images bucket)');
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  const blob = new Blob([pngHeader], { type: 'image/png' });
  const fd = new FormData();
  fd.append('file', blob, 'e2e_showcase_model.png');
  fd.append('category', 'products');

  const uploadRes = await fetch(`${BASE_URL}/api/admin/media/upload`, {
    method: 'POST',
    headers: {
      'x-falcon-test-role': 'owner',
      'x-falcon-test-secret': TEST_SECRET,
    },
    body: fd,
  });

  assert.strictEqual(uploadRes.status, 200, `Image upload failed: ${uploadRes.status}`);
  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadData.storageProvider, 'supabase_storage', 'Must use genuine Supabase Storage, NOT local disk fallback');
  console.log(`   ✓ Uploaded media to Supabase Storage: ${uploadData.publicUrl}`);
  console.log(`   ✓ Confirmed storage provider: ${uploadData.storageProvider}`);

  // Step 3: Consecutive Saves Test (Save 1 immediately followed by Save 2 without page reload)
  console.log('\n3. Testing Consecutive Product Saves (In-memory token advancement)');
  
  // Save 1: Attach uploaded image and update subtitle
  const save1Res = await fetch(`${BASE_URL}/api/products/${productV1.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'E2E Origami Planter',
      shortDescription: 'Updated subtitle from Save 1',
      basePricePaise: 54900,
      images: [uploadData.publicUrl],
      lastKnownUpdatedAt: productV1.updatedAt,
    }),
  });

  assert.strictEqual(save1Res.status, 200, `Consecutive Save 1 failed: ${save1Res.status}`);
  const save1Data = await save1Res.json();
  const productV2 = save1Data.product;
  assert.notStrictEqual(productV2.updatedAt, productV1.updatedAt, 'Timestamp token must advance on Save 1');
  console.log(`   ✓ Save 1 Succeeded. Advanced version token: ${productV2.updatedAt}`);

  // Save 2: Immediately update description using productV2 token without page reload
  const save2Res = await fetch(`${BASE_URL}/api/products/${productV1.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'E2E Origami Planter — Enhanced Edition',
      shortDescription: 'Updated subtitle from Save 2 (Sequential)',
      basePricePaise: 59900,
      images: [uploadData.publicUrl],
      lastKnownUpdatedAt: productV2.updatedAt,
    }),
  });

  assert.strictEqual(save2Res.status, 200, `Consecutive Save 2 failed: ${save2Res.status}`);
  const save2Data = await save2Res.json();
  const productV3 = save2Data.product;
  assert.strictEqual(productV3.title, 'E2E Origami Planter — Enhanced Edition');
  console.log(`   ✓ Save 2 Succeeded without page reload. New version token: ${productV3.updatedAt}`);

  // Step 4: Stale-Editor Conflict Detection (<1s / stale token)
  console.log('\n4. Testing Stale-Editor Concurrency Conflict (HTTP 409)');
  // A second editor still holding productV1 or productV2 tries to save:
  const staleSaveRes = await fetch(`${BASE_URL}/api/products/${productV1.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'Conflicting Edit by Second Operator',
      shortDescription: 'This edit should be blocked by OCC',
      basePricePaise: 29900,
      lastKnownUpdatedAt: productV2.updatedAt, // Stale! Database is now at productV3
    }),
  });

  assert.strictEqual(staleSaveRes.status, 409, `Stale edit must return 409 Conflict, received: ${staleSaveRes.status}`);
  const conflictData = await staleSaveRes.json();
  assert.strictEqual(conflictData.code, 'CONCURRENCY_CONFLICT', 'Error code must be CONCURRENCY_CONFLICT');
  assert.strictEqual(conflictData.currentProduct.title, 'E2E Origami Planter — Enhanced Edition');
  console.log(`   ✓ Stale editor rejected with HTTP 409 Concurrency Conflict`);
  console.log(`   ✓ Server returned current authoritative version: ${conflictData.currentProduct.updatedAt}`);

  // Step 5: Conflict Recovery Workflow (Bind reviewed version token and retry)
  console.log('\n5. Testing Conflict Recovery (Adopt reviewed version token & conditional retry)');
  const recoverySaveRes = await fetch(`${BASE_URL}/api/products/${productV1.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'Recovered Edit by Second Operator',
      shortDescription: 'Reviewed and merged with server version',
      basePricePaise: 64900,
      images: [uploadData.publicUrl],
      lastKnownUpdatedAt: conflictData.currentProduct.updatedAt, // Using reviewed token!
    }),
  });

  assert.strictEqual(recoverySaveRes.status, 200, `Conflict recovery save failed: ${recoverySaveRes.status}`);
  const recoveryData = await recoverySaveRes.json();
  const productV4 = recoveryData.product;
  assert.strictEqual(productV4.title, 'Recovered Edit by Second Operator');
  console.log(`   ✓ Conflict Recovery Succeeded! Final version token: ${productV4.updatedAt}`);

  // Output test summary
  console.log('\n========================================================================');
  console.log('   ALL E2E CONCURRENCY, STORAGE & CONFLICT TESTS PASSED SUCCESSFULLY!   ');
  console.log('========================================================================\n');

  return { productId: productV1.id, expectedTitle: 'Recovered Edit by Second Operator', expectedPrice: 64900, finalUpdatedAt: productV4.updatedAt };
}

run().catch(err => {
  console.error('\n✖ E2E Verification Failure:', err);
  process.exit(1);
});
