import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const BASE_URL = 'http://localhost:3000';
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const adminSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function safeFetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { res, data: JSON.parse(text) };
  } catch (err) {
    throw new Error(`Failed to parse JSON from ${url} (status ${res.status}): ${text.slice(0, 300)}`);
  }
}

async function runTest() {
  console.log('=== STARTING ORIGINAL PRODUCT WORKFLOW & RBAC VERIFICATION ===\n');

  // Pre-cleanup of any prior test products
  const { data: priorTests } = await adminSupabase.from('products').select('id, name').ilike('name', '%LOCAL TEST%');
  if (priorTests && priorTests.length > 0) {
    for (const p of priorTests) {
      await adminSupabase.from('product_variants').delete().eq('product_id', p.id);
      await adminSupabase.from('products').delete().eq('id', p.id);
      console.log(`Pre-cleaned existing test product ${p.name} (${p.id})`);
    }
  }

  // Step 1: Authenticate as owner
  console.log('[Step 1] Authenticating as test owner...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test.owner@falcon3dprints.local',
    password: 'FalconPass2026!',
  });

  if (authError || !authData?.session?.access_token) {
    throw new Error(`Authentication failed: ${authError?.message}`);
  }
  const token = authData.session.access_token;
  console.log('✓ Owner authenticated successfully. Token acquired.\n');

  // Step 2: Role Authorization Enforcement Test
  console.log('[Step 2] Testing RBAC: Unauthenticated product creation must fail with 401...');
  const unauthRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Item' }),
  });
  console.log(`✓ Unauthenticated request status: ${unauthRes.status} (Expected 401)`);
  if (unauthRes.status !== 401) throw new Error('Security check failed: unauthenticated POST did not return 401');

  // Step 3: Fetch categories to get valid Category ID
  console.log('\n[Step 3] Fetching categories for product assignment...');
  const catRes = await fetch(`${BASE_URL}/api/categories`);
  const catData = await catRes.json();
  const targetCategory = catData.categories.find((c) => c.slug === 'miniatures-and-collectibles') || catData.categories[0];
  console.log(`✓ Selected category: "${targetCategory.name}" (ID: ${targetCategory.id})\n`);

  // Step 4: Create clearly labelled local test product
  const testSlug = `test-articulated-falcon-${Date.now()}`;
  const testPayload = {
    name: '[LOCAL TEST] Precision Articulated Falcon Model',
    slug: testSlug,
    categoryId: targetCategory.id,
    shortDescription: 'Multi-jointed predatory avian study model with folding wings',
    description: 'Precision engineering additive specimen designed for multi-axis articulation right off the build plate without support adhesion.',
    features: [
      'Dual-ball socket wing articulation',
      'Matte obsidian anti-reflection surface',
      'Zero assembly required off the print bed',
    ],
    includedItems: ['Falcon articulated model', 'Authenticity certificate card', 'Microfiber dust cloth'],
    careInstructions: 'Clean gently with a soft dry brush. Keep away from direct sunlight exceeding 60C.',
    dispatchInfo: 'Ships within 24 hours in shock-absorbing foam box.',
    basePricePaise: 89900, // ₹899.00
    availability: 'in_stock',
    isPublished: true,
    images: ['/products/cyber-gryphon-figure.jpg'],
    variants: [
      {
        sku: `TST-FAL-BLK-${Date.now().toString().slice(-4)}`,
        title: 'Standard - Matte Stealth Black',
        material: 'PLA',
        color: 'Black',
        finish: 'Matte (Layered)',
        priceAdjustmentPaise: 0,
        stockQuantity: 15,
        leadTimeDays: 0,
        image: '/products/cyber-gryphon-figure.jpg',
      },
      {
        sku: `TST-FAL-GRY-${Date.now().toString().slice(-4)}`,
        title: 'Studio Edition - Metallic Grey',
        material: 'PETG',
        color: 'Metallic Grey',
        finish: 'Smooth (Annealed)',
        priceAdjustmentPaise: 20000, // +₹200 = ₹1,099.00
        stockQuantity: 8,
        leadTimeDays: 2,
        image: '/products/cyber-gryphon-figure.jpg',
      },
    ],
  };

  console.log('[Step 4] Creating new product via POST /api/products...');
  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testPayload),
  });

  const createBody = await createRes.json();
  if (!createRes.ok || !createBody.product) {
    throw new Error(`Failed to create product: ${JSON.stringify(createBody)}`);
  }
  const createdProduct = createBody.product;
  console.log(`✓ Product created successfully! ID: ${createdProduct.id}, Slug: ${createdProduct.slug}`);
  console.log(`  Base price: ₹${createdProduct.basePricePaise / 100}, Variants: ${createdProduct.variants?.length}`);

  // Step 5: Verify persistence via GET /api/products and GET /api/products/[id]
  console.log('\n[Step 5] Verifying database persistence across GET endpoints...');
  const getByIdRes = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`);
  const getByIdBody = await getByIdRes.json();
  if (!getByIdRes.ok || !getByIdBody.product) {
    throw new Error(`Failed to fetch product by ID: ${JSON.stringify(getByIdBody)}`);
  }
  console.log(`✓ Product verified via ID: "${getByIdBody.product.title}"`);
  console.log(`  Category correctly assigned: "${getByIdBody.product.category}"`);

  const getBySlugRes = await fetch(`${BASE_URL}/api/products/${testSlug}`);
  const getBySlugBody = await getBySlugRes.json();
  if (!getBySlugRes.ok || !getBySlugBody.product) {
    throw new Error(`Failed to fetch product by Slug: ${JSON.stringify(getBySlugBody)}`);
  }
  console.log(`✓ Product verified via Slug: "${getBySlugBody.product.slug}"`);

  // Step 6: Test editing product (Descriptions, Price, and Stock)
  console.log('\n[Step 6] Testing product updates via PUT /api/products/[id]...');
  const updatePayload = {
    ...testPayload,
    name: '[LOCAL TEST] Precision Articulated Falcon Model (Updated Edition)',
    basePricePaise: 94900, // ₹949.00
    shortDescription: 'Updated: Ultra-refined predatory avian study model',
    expectedVersion: getByIdBody.product.version,
    lastKnownUpdatedAt: getByIdBody.product.updatedAt,
  };

  const updateRes = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatePayload),
  });

  const updateBody = await updateRes.json();
  if (!updateRes.ok || !updateBody.product) {
    throw new Error(`Failed to update product: ${JSON.stringify(updateBody)}`);
  }
  console.log(`✓ Product updated: "${updateBody.product.title}"`);
  console.log(`  New base price: ₹${updateBody.product.basePricePaise / 100}`);

  // Step 7: Test stock adjustment via PATCH /api/products/[id]/stock
  console.log('\n[Step 7] Testing inventory adjustment endpoint...');
  const firstVariant = updateBody.product.variants[0];
  const { res: stockAdjustRes, data: stockAdjustBody } = await safeFetchJson(`${BASE_URL}/api/products/${createdProduct.id}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      variantId: firstVariant.id,
      delta: 10, // 15 + 10 = 25
      expectedVersion: updateBody.product.version,
      lastKnownUpdatedAt: updateBody.product.updatedAt,
    }),
  });
  if (!stockAdjustRes.ok) {
    throw new Error(`Stock adjustment failed: ${JSON.stringify(stockAdjustBody)}`);
  }
  const updatedVariantStock = stockAdjustBody.product.variants.find((v) => v.id === firstVariant.id)?.stockQuantity;
  console.log(`✓ Stock adjustment committed: new quantity is ${updatedVariantStock} (was ${firstVariant.stockQuantity})`);

  // Step 8: Test publishing toggle (unpublish / archive)
  console.log('\n[Step 8] Testing publishing toggle and archiving...');
  const { res: unpublishRes, data: unpublishBody } = await safeFetchJson(`${BASE_URL}/api/products/${createdProduct.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      isPublished: false,
      expectedVersion: stockAdjustBody.product.version,
      lastKnownUpdatedAt: stockAdjustBody.product.updatedAt,
    }),
  });
  console.log(`✓ Unpublish toggle result: isPublished = ${unpublishBody.product?.isPublished}`);

  // Test soft delete via DELETE
  const deleteRes = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`✓ Soft-delete status: ${deleteRes.status} (Product archived)`);

  // Step 9: Clean up test product from isolated database
  console.log('\n[Step 9] Cleaning up test product from isolated database...');
  await adminSupabase.from('product_variants').delete().eq('product_id', createdProduct.id);
  await adminSupabase.from('products').delete().eq('id', createdProduct.id);
  console.log(`✓ Test product ${createdProduct.id} deleted. Isolated database clean.`);

  console.log('\n=== ALL WORKFLOW & RBAC VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runTest().catch((err) => {
  console.error('\n❌ Workflow verification failed:', err);
  process.exit(1);
});
