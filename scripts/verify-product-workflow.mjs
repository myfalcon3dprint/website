import assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkkoviqhmccjnocjfudq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra292aXFobWNjam5vY2pmdWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTY0ODYsImV4cCI6MjEwNzI5MjQ4Nn0.MK9cn5kqom-GvaZTV-7__imhPd-Y_2r2rH3TOi0Zdfc';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra292aXFobWNjam5vY2pmdWRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTcxNjQ4NiwiZXhwIjoyMTA3MjkyNDg2fQ.bkoUEuc6e3feQN0pue7n_C_dN1IqmbuLMv2qeDsSqAY';

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('FALCON 3D PRINTS: PRODUCT & CATEGORY PERSISTENCE REGRESSION SUITE');
  console.log('================================================================\n');

  // Authenticate as owner
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
    email: 'test.owner@falcon3dprints.local',
    password: 'FalconPass2026!',
  });
  assert.ok(!authErr, `Staff authentication failed: ${authErr?.message}`);

  const staffCookie = `sb-wkkoviqhmccjnocjfudq-auth-token=${JSON.stringify([authData.session.access_token, authData.session.refresh_token])}`;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.session.access_token}`,
    'Cookie': staffCookie,
  };

  // 1. Category Creation & Idempotency
  console.log('[TEST 1] Create category "Desk Accessories" & verify persistence...');
  const catRes = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Desk Accessories',
      slug: 'desk-accessories',
      description: 'Ergonomic headphone holders, modular pen stands, and mechanical keyboard trays.',
    }),
  });
  const catData = await catRes.json();
  assert.strictEqual(catRes.status, 200, 'Category creation or lookup must return 200');
  assert.ok(catData.category?.id, 'Category must have a valid ID');
  const categoryId = catData.category.id;
  console.log(`  ✓ Category ID resolved: ${categoryId}`);

  // 2. Product creation/update with 3 distinct variants & media
  console.log('\n[TEST 2] Combined save: Product + Category FK + 3 Variants with media...');
  const { data: existingProd } = await supabase.from('products').select('*').eq('slug', 'falcon-hexdesk-organizer').maybeSingle();

  const testVariantsPayload = [
    {
      id: 'temp-v-blk',
      sku: 'FAL-HEX-BLK',
      title: 'Matte Obsidian Black',
      material: 'PLA',
      color: 'Black',
      finish: 'Matte (Layered)',
      priceAdjustmentPaise: 0,
      stockQuantity: 25,
      leadTimeDays: 0,
      image: '/products/planter-obsidian-black.jpg',
    },
    {
      id: 'temp-v-org',
      sku: 'FAL-HEX-ORG',
      title: 'Falcon Signature Orange',
      material: 'PLA',
      color: 'Orange',
      finish: 'Matte (Layered)',
      priceAdjustmentPaise: 15000,
      stockQuantity: 8,
      leadTimeDays: 0,
      image: '/products/planter-orange-variant.jpg',
    },
    {
      id: 'temp-v-wht',
      sku: 'FAL-HEX-WHT',
      title: 'Arctic Silk White',
      material: 'PLA',
      color: 'White',
      finish: 'Silk Gloss',
      priceAdjustmentPaise: 25000,
      stockQuantity: 12,
      leadTimeDays: 0,
      image: '/products/planter-sandstone.jpg',
    },
  ];

  let testProduct;
  if (!existingProd) {
    const createRes = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Falcon HexDesk Organizer',
        slug: 'falcon-hexdesk-organizer',
        categoryId,
        shortDescription: 'Modular hexagonal desktop organizer and pen stand',
        description: 'Engineered modular desktop organizer featuring precision angled pen slots, cable pass-through, and weighted non-slip silicone base.',
        basePricePaise: 79900,
        availability: 'in_stock',
        isPublished: true,
        images: [
          '/products/hexagrid-desk-organizer.jpg',
        ],
        features: [
          'Modular magnetic hexagonal interlock system',
          'Accommodates up to 12 writing instruments and studio styluses',
          'Integrated cable channel routing for phone and smartwatch chargers',
        ],
        variants: testVariantsPayload,
      }),
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201, `Failed to create product: ${createData.error}`);
    testProduct = createData.product;
  } else {
    const updateRes = await fetch(`http://localhost:3000/api/products/${existingProd.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: existingProd.name,
        slug: existingProd.slug,
        categoryId,
        shortDescription: existingProd.short_description,
        description: existingProd.description,
        basePricePaise: 79900,
        availability: 'in_stock',
        isPublished: true,
        images: [
          '/products/hexagrid-desk-organizer.jpg',
        ],
        variants: testVariantsPayload,
        lastKnownUpdatedAt: existingProd.updated_at,
        expectedVersion: existingProd.version,
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200, `Failed to update product: ${updateData.error}`);
    testProduct = updateData.product;
  }
  console.log(`  ✓ Product saved successfully. ID: ${testProduct.id}`);

  // 3. Direct Database Integrity Check
  console.log('\n[TEST 3] Verify database persistence and relationships directly in PostgreSQL...');
  const { data: dbProduct, error: dbErr } = await supabase
    .from('products')
    .select('*, categories(*), product_variants(*)')
    .eq('id', testProduct.id)
    .single();

  assert.ok(!dbErr, `Direct database query failed: ${dbErr?.message}`);
  assert.strictEqual(dbProduct.categories?.name, 'Desk Accessories', 'Database foreign key must resolve to "Desk Accessories"');
  assert.strictEqual(dbProduct.product_variants?.length, 3, 'Database must have exactly 3 product variants');
  for (const v of dbProduct.product_variants) {
    assert.ok(v.image, `Variant ${v.sku} must have an assigned image`);
    assert.ok(v.stock_quantity >= 0, `Variant ${v.sku} stock must be non-negative`);
  }
  console.log('  ✓ PostgreSQL records verified with foreign key relationship and 3 variants.');

  // 4. Persistence After Reload
  console.log('\n[TEST 4] Product re-read after simulated browser editor reload...');
  const getRes = await fetch(`http://localhost:3000/api/products/${testProduct.id}`);
  const getData = await getRes.json();
  assert.strictEqual(getRes.status, 200, 'GET /api/products/[id] must return 200');
  assert.strictEqual(getData.product?.category, 'Desk Accessories', 'Product category must persist after reload');
  assert.strictEqual(getData.product?.variants?.length, 3, 'Product variants count must be 3 after reload');
  console.log('  ✓ Product editor endpoint re-read successfully matches persisted state.');

  // 5. Storefront API verification with resolved prices & variants
  console.log('\n[TEST 5] Storefront slug resolution and price/stock display...');
  const sfRes = await fetch(`http://localhost:3000/api/products/${testProduct.slug}`);
  const sfData = await sfRes.json();
  assert.strictEqual(sfRes.status, 200, 'Storefront lookup by slug must return 200');
  assert.strictEqual(sfData.product?.category, 'Desk Accessories', 'Storefront category must be "Desk Accessories"');
  assert.strictEqual(sfData.product?.variants?.length, 3, 'Storefront must present all 3 variants');
  const blackSf = sfData.product.variants.find((v) => v.sku === 'FAL-HEX-BLK');
  const orangeSf = sfData.product.variants.find((v) => v.sku === 'FAL-HEX-ORG');
  assert.strictEqual(blackSf.pricePaise, 79900, 'Black variant base price must be 79900 paise (₹799)');
  assert.strictEqual(orangeSf.pricePaise, 94900, 'Orange variant price must include 15000 paise adjustment (₹949)');
  console.log('  ✓ Storefront variant prices calculated correctly.');

  // 6. Validation & Rejection: Duplicate SKU check
  console.log('\n[TEST 6] Validation check: Duplicate SKU rejection...');
  const dupRes = await fetch(`http://localhost:3000/api/products/${testProduct.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: testProduct.title,
      slug: testProduct.slug,
      categoryId,
      basePricePaise: testProduct.basePricePaise,
      variants: [
        { sku: 'DUPLICATE-SKU', title: 'V1', priceAdjustmentPaise: 0, stockQuantity: 5 },
        { sku: 'DUPLICATE-SKU', title: 'V2', priceAdjustmentPaise: 0, stockQuantity: 5 },
      ],
      lastKnownUpdatedAt: dbProduct.updated_at,
      expectedVersion: dbProduct.version,
    }),
  });
  assert.strictEqual(dupRes.status, 400, 'Server must reject duplicate SKUs with HTTP 400');
  console.log('  ✓ Duplicate SKU correctly rejected with 400 Bad Request.');

  // 7. Security: Unauthenticated update rejection
  console.log('\n[TEST 7] Security check: Unauthenticated update rejection...');
  const unauthRes = await fetch(`http://localhost:3000/api/products/${testProduct.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacked Product' }),
  });
  assert.ok(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated request must be rejected');
  console.log(`  ✓ Unauthenticated update rejected with status ${unauthRes.status}.`);

  console.log('\n================================================================');
  console.log('ALL REGRESSION TESTS PASSED (7 / 7)');
  console.log('================================================================');
}

runRegressionSuite().catch((err) => {
  console.error('\n*** REGRESSION TEST FAILED ***\n', err);
  process.exit(1);
});
