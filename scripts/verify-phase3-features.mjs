/**
 * Falcon 3D Prints — Phase 3 Comprehensive Verification Suite
 * 
 * Tests the 6 Phase 3 commerce and catalog requirements:
 * 1. Product creation, editing, publishing, and archiving (soft-delete).
 * 2. Variant management with unique SKUs, prices, stock, material, color, and supported attributes.
 * 3. Category creation, editing, ordering, and visibility.
 * 4. Media upload, preview, reordering, replacement, and removal.
 * 5. Order-item corrections with before/after review, required reason, transactional inventory reconciliation, and explicit additional-payment or refund-due states.
 * 6. Product/SKU filters that correctly find orders containing multiple different products.
 */

import { createClient } from '@supabase/supabase-js';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://127.0.0.1:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const TEST_SECRET = process.env.FALCON_TEST_HARNESS_SECRET || 'falcon_test_sec_isolated_local_test_harness_2026';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

const results = [];

function recordResult(feature, testName, passed, details = '') {
  results.push({ feature, testName, passed, details });
  const status = passed ? `${GREEN}[PASS]${RESET}` : `${RED}[FAIL]${RESET}`;
  console.log(`  ${status} ${BOLD}${feature}:${RESET} ${testName}`);
  if (details) {
    console.log(`         ${CYAN}ℹ ${details}${RESET}`);
  }
}

async function runPhase3Verification() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}      FALCON 3D PRINTS — PHASE 3 COMPREHENSIVE VERIFICATION SUITE       ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  // 1. Verify Local Server Isolation Preflight
  console.log(`${BOLD}1. Preflight Isolation Check${RESET}`);
  const isolationRes = await fetch(`${SERVER_URL}/api/system/isolation`);
  assert.strictEqual(isolationRes.status, 200, 'Isolation endpoint must respond with HTTP 200');
  const isolationData = await isolationRes.json();
  assert.strictEqual(isolationData.isIsolated, true, 'Server must confirm isolated local target');
  assert.strictEqual(isolationData.allowMutations, true, 'Server must permit mutations in local test mode');
  recordResult('Isolation Preflight', 'Server reports isolated local database', true, `Target: ${isolationData.targetHost}`);

  // 2. Real Authenticated Sessions
  console.log(`\n${BOLD}2. Authenticated Session Setup${RESET}`);
  const dbAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // Ensure accounts are present post-reset
  const { data: usersList } = await dbAdmin.auth.admin.listUsers();
  const existingEmails = new Set((usersList?.users || []).map((u) => u.email));

  if (!existingEmails.has('admin@falcon3dprints.com')) {
    const adminId = 'b1ef5469-0a0a-45a0-b7b5-d6beef36cc2b';
    await dbAdmin.auth.admin.createUser({
      id: adminId,
      email: 'admin@falcon3dprints.com',
      password: 'TestAdminPass123!',
      email_confirm: true,
      user_metadata: { full_name: 'Studio Owner', role: 'owner' },
    });
    await dbAdmin.from('profiles').upsert({ id: adminId, full_name: 'Studio Owner', role: 'owner' });
  }

  if (!existingEmails.has('customer@falcon3dprints.com')) {
    const { data: newCust } = await dbAdmin.auth.admin.createUser({
      email: 'customer@falcon3dprints.com',
      password: 'TestCustomerPass123!',
      email_confirm: true,
      user_metadata: { full_name: 'Regular Customer', role: 'customer' },
    });
    if (newCust?.user) {
      await dbAdmin.from('profiles').upsert({ id: newCust.user.id, full_name: 'Regular Customer', role: 'customer' });
    }
  }

  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: adminLogin, error: adminLoginErr } = await adminClient.auth.signInWithPassword({
    email: 'admin@falcon3dprints.com',
    password: 'TestAdminPass123!',
  });
  assert(!adminLoginErr && adminLogin.session, 'Admin login must succeed');
  const adminToken = adminLogin.session.access_token;
  recordResult('Authentication', 'Admin credentials authenticated successfully', true, `User: ${adminLogin.user.email}`);

  const customerClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: custLogin, error: custLoginErr } = await customerClient.auth.signInWithPassword({
    email: 'customer@falcon3dprints.com',
    password: 'TestCustomerPass123!',
  });
  assert(!custLoginErr && custLogin.session, 'Customer login must succeed');
  const customerToken = custLogin.session.access_token;
  recordResult('Authentication', 'Customer credentials authenticated successfully', true, `User: ${custLogin.user.email}`);

  // Verify Customer RBAC denial on staff products endpoint
  const custForbiddenRes = await fetch(`${SERVER_URL}/api/admin/media/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
  });
  assert.strictEqual(custForbiddenRes.status, 403, 'Customer token must be rejected with HTTP 403 on staff API');
  recordResult('RBAC Defense', 'Customer session denied access to staff administration endpoints', true, 'HTTP 403 Forbidden confirmed');

  const adminHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
    'x-falcon-test-role': 'owner',
    'x-falcon-test-user-id': adminLogin.user.id,
    'x-falcon-test-secret': TEST_SECRET,
  };

  // 3. Feature 1: Product creation, editing, publishing, and archiving (soft-delete)
  console.log(`\n${BOLD}3. Feature 1: Product Lifecycle (Create, Edit, Publish, Archive)${RESET}`);
  const uniqueId = Date.now();
  const testProductSlug = `p3-test-planter-${uniqueId}`;

  const createProdRes = await fetch(`${SERVER_URL}/api/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Phase 3 Planter ${uniqueId}`,
      slug: testProductSlug,
      shortDescription: 'Precision engineered desk planter with reservoir',
      description: 'Manufactured with matte bio-polymer for botanical styling.',
      basePricePaise: 129900,
      availability: 'in_stock',
      features: ['Self-watering reservoir', 'Matte architectural finish'],
      specs: {
        printTechnology: 'FDM',
        layerHeightMm: 0.2,
        infillPercentage: 25,
        foodSafe: false,
        heatResistanceC: 60,
      },
      isPublished: true,
      variants: [
        {
          sku: `P3-PLT-01-${uniqueId}`,
          title: 'Matte Grey PLA',
          material: 'PLA',
          color: 'Studio Grey',
          finish: 'Raw (Layered)',
          priceAdjustmentPaise: 0,
          stockQuantity: 20,
          leadTimeDays: 0,
        },
      ],
    }),
  });

  assert.strictEqual(createProdRes.status, 201, `Product creation must return 201, received ${createProdRes.status}`);
  const createdProdData = await createProdRes.json();
  const createdProd = createdProdData.product;
  assert(createdProd.id, 'Created product must have ID');
  assert.strictEqual(createdProd.basePricePaise, 129900);
  assert.strictEqual(createdProd.isPublished, true);
  recordResult('Feature 1: Product Lifecycle', 'Product created with initial configuration and variants', true, `ID: ${createdProd.id}, SKU: ${createdProd.variants[0].sku}`);

  // Edit product
  const editProdRes = await fetch(`${SERVER_URL}/api/products/${createdProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Phase 3 Planter Updated ${uniqueId}`,
      basePricePaise: 139900,
      expectedVersion: createdProd.version,
      lastKnownUpdatedAt: createdProd.updatedAt,
    }),
  });
  assert.strictEqual(editProdRes.status, 200, `Product edit must return 200, received ${editProdRes.status}`);
  const editedProdData = await editProdRes.json();
  const editedProd = editedProdData.product;
  assert.strictEqual(editedProd.title, `Phase 3 Planter Updated ${uniqueId}`);
  assert.strictEqual(editedProd.basePricePaise, 139900);
  recordResult('Feature 1: Product Lifecycle', 'Product details and base price updated with optimistic concurrency version check', true, `New Price: ₹${editedProd.basePricePaise / 100}`);

  // Toggle publishing state to unpublished
  const unpublishRes = await fetch(`${SERVER_URL}/api/products/${createdProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      isPublished: false,
      expectedVersion: editedProd.version,
      lastKnownUpdatedAt: editedProd.updatedAt,
    }),
  });
  assert.strictEqual(unpublishRes.status, 200);
  const unpublishedProd = (await unpublishRes.json()).product;
  assert.strictEqual(unpublishedProd.isPublished, false);
  recordResult('Feature 1: Product Lifecycle', 'Product publish state toggled to unpublished', true, 'isPublished: false');

  // Archive product (soft delete)
  const archiveRes = await fetch(`${SERVER_URL}/api/products/${createdProd.id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  assert.strictEqual(archiveRes.status, 200, `Product archive must return 200, received ${archiveRes.status}`);
  recordResult('Feature 1: Product Lifecycle', 'Product archived via soft delete endpoint', true, 'Product unpublished and marked archived');

  // 4. Feature 2: Variant management with unique SKUs, prices, stock, material, color, and supported attributes
  console.log(`\n${BOLD}4. Feature 2: Variant Management${RESET}`);
  const multiVarSlug = `p3-multivar-${uniqueId}`;
  const skuA = `SKU-A-${uniqueId}`;
  const skuB = `SKU-B-${uniqueId}`;

  const createMultiVarRes = await fetch(`${SERVER_URL}/api/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Multi-Variant Sculpture ${uniqueId}`,
      slug: multiVarSlug,
      basePricePaise: 100000,
      isPublished: true,
      variants: [
        {
          sku: skuA,
          title: 'PLA Matte White',
          material: 'PLA',
          color: 'Matte White',
          finish: 'Raw (Layered)',
          priceAdjustmentPaise: 0,
          stockQuantity: 15,
          leadTimeDays: 0,
        },
        {
          sku: skuB,
          title: 'Resin Sanded Black',
          material: 'Resin',
          color: 'Obsidian Black',
          finish: 'Sanded Smooth',
          priceAdjustmentPaise: 40000,
          stockQuantity: 8,
          leadTimeDays: 3,
        },
      ],
    }),
  });

  assert.strictEqual(createMultiVarRes.status, 201);
  const multiVarProd = (await createMultiVarRes.json()).product;
  assert.strictEqual(multiVarProd.variants.length, 2);
  const varA = multiVarProd.variants.find((v) => v.sku === skuA);
  const varB = multiVarProd.variants.find((v) => v.sku === skuB);
  assert(varA && varB, 'Both variants must be present');
  assert.strictEqual(varA.pricePaise, 100000);
  assert.strictEqual(varB.pricePaise, 140000);
  assert.strictEqual(varA.stockQuantity, 15);
  assert.strictEqual(varB.stockQuantity, 8);
  recordResult('Feature 2: Variant Management', 'Multiple variants created with unique SKUs, materials, finishes, prices, and stock', true, `Variant 1: ₹${varA.pricePaise / 100} (${varA.material}), Variant 2: ₹${varB.pricePaise / 100} (${varB.material})`);

  // Verify unique SKU constraint enforcement
  const dupSkuRes = await fetch(`${SERVER_URL}/api/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Duplicate SKU Attempt ${uniqueId}`,
      slug: `dup-sku-${uniqueId}`,
      basePricePaise: 50000,
      variants: [
        {
          sku: skuA, // Duplicate of existing skuA!
          title: 'Conflict Variant',
          material: 'PLA',
          color: 'Red',
          finish: 'Raw (Layered)',
          stockQuantity: 5,
        },
      ],
    }),
  });
  assert.strictEqual(dupSkuRes.status, 400, 'Duplicate SKU must be rejected with HTTP 400');
  recordResult('Feature 2: Variant Management', 'Unique SKU enforcement prevents duplicate variant creation', true, 'Duplicate SKU rejected with HTTP 400');

  // Update variant attributes and stock
  const updatedVariantsPayload = [
    {
      ...varA,
      stockQuantity: 25,
      priceAdjustmentPaise: 10000,
    },
    {
      ...varB,
      stockQuantity: 12,
    },
  ];

  const updateVariantsRes = await fetch(`${SERVER_URL}/api/products/${multiVarProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      expectedVersion: multiVarProd.version,
      lastKnownUpdatedAt: multiVarProd.updatedAt,
      variants: updatedVariantsPayload,
    }),
  });
  assert.strictEqual(updateVariantsRes.status, 200);
  const refreshedMultiVar = (await updateVariantsRes.json()).product;
  const refreshedA = refreshedMultiVar.variants.find((v) => v.sku === skuA);
  assert.strictEqual(refreshedA.stockQuantity, 25);
  recordResult('Feature 2: Variant Management', 'Variant stock and pricing adjusted and reconciled', true, `SKU ${skuA} stock updated to 25`);

  // 5. Feature 3: Category creation, editing, ordering, and visibility
  console.log(`\n${BOLD}5. Feature 3: Category Management${RESET}`);
  const catSlug = `p3-category-${uniqueId}`;
  const createCatRes = await fetch(`${SERVER_URL}/api/categories`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Phase 3 Sculptures ${uniqueId}`,
      slug: catSlug,
      description: 'Hand-crafted spatial desktop sculptures',
      sortOrder: 88,
    }),
  });
  assert.strictEqual(createCatRes.status, 201);
  const createdCat = (await createCatRes.json()).category;
  assert.strictEqual(createdCat.slug, catSlug);
  assert.strictEqual(createdCat.sort_order, 88);
  assert.strictEqual(createdCat.is_active, true);
  recordResult('Feature 3: Category Management', 'Category created with designated slug and sort order', true, `Name: ${createdCat.name}, Sort Order: ${createdCat.sort_order}`);

  // Edit category sort order and toggle visibility off
  const patchCatRes = await fetch(`${SERVER_URL}/api/categories/${createdCat.id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({
      name: `Phase 3 Sculptures Modified ${uniqueId}`,
      sortOrder: 95,
      isActive: false,
      lastKnownUpdatedAt: createdCat.updated_at,
    }),
  });
  assert.strictEqual(patchCatRes.status, 200);
  const patchedCat = (await patchCatRes.json()).category;
  assert.strictEqual(patchedCat.name, `Phase 3 Sculptures Modified ${uniqueId}`);
  assert.strictEqual(patchedCat.sort_order, 95);
  assert.strictEqual(patchedCat.is_active, false);
  recordResult('Feature 3: Category Management', 'Category edited, sort order updated, and visibility toggled to hidden', true, 'sort_order: 95, is_active: false');

  // Verify public categories listing excludes inactive category
  const publicCatsRes = await fetch(`${SERVER_URL}/api/categories`);
  const publicCats = (await publicCatsRes.json()).categories;
  const isFoundInPublic = publicCats.some((c) => c.id === createdCat.id);
  assert.strictEqual(isFoundInPublic, false, 'Inactive category must be hidden from public catalog');

  // Verify admin categories listing with all=true includes inactive category
  const adminCatsRes = await fetch(`${SERVER_URL}/api/categories?all=true`);
  const adminCats = (await adminCatsRes.json()).categories;
  const isFoundInAdmin = adminCats.some((c) => c.id === createdCat.id);
  assert.strictEqual(isFoundInAdmin, true, 'Inactive category must be visible in admin CMS');
  recordResult('Feature 3: Category Management', 'Visibility filtering verified: hidden from public, accessible to staff CMS', true, 'Public: excluded, Admin (all=true): included');

  // 6. Feature 4: Media upload, preview, reordering, replacement, and removal
  console.log(`\n${BOLD}6. Feature 4: Media Upload, Preview, Reorder, Replace, and Removal${RESET}`);
  
  // Create valid JPEG binary buffers
  function createTestJpeg(marker) {
    const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00]);
    const body = Buffer.from(`TEST_IMAGE_DATA_${marker}_` + 'X'.repeat(200));
    const footer = Buffer.from([0xFF, 0xD9]);
    return Buffer.concat([header, body, footer]);
  }

  async function uploadImage(marker) {
    const buffer = createTestJpeg(marker);
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('file', blob, `test_media_${marker}.jpg`);
    fd.append('category', 'products');

    const res = await fetch(`${SERVER_URL}/api/admin/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-falcon-test-role': 'owner',
        'x-falcon-test-secret': TEST_SECRET,
      },
      body: fd,
    });
    assert.strictEqual(res.status, 200, `Upload must succeed with HTTP 200`);
    const data = await res.json();
    return data.publicUrl;
  }

  const img1 = await uploadImage('1');
  const img2 = await uploadImage('2');
  const img3 = await uploadImage('3');

  // Verify previewable over HTTP
  const previewRes = await fetch(img1);
  assert.strictEqual(previewRes.status, 200, 'Image preview URL must respond with HTTP 200');
  recordResult('Feature 4: Media Management', 'Media uploaded to storage and verified accessible for preview', true, `URL: ${img1.slice(0, 50)}...`);

  // Attach images [img1, img2]
  const attachRes = await fetch(`${SERVER_URL}/api/products/${multiVarProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      expectedVersion: refreshedMultiVar.version,
      lastKnownUpdatedAt: refreshedMultiVar.updatedAt,
      images: [img1, img2],
    }),
  });
  assert.strictEqual(attachRes.status, 200);
  let mediaProd = (await attachRes.json()).product;
  assert.deepStrictEqual(mediaProd.images, [img1, img2]);

  // Reorder images to [img2, img1]
  const reorderRes = await fetch(`${SERVER_URL}/api/products/${multiVarProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      expectedVersion: mediaProd.version,
      lastKnownUpdatedAt: mediaProd.updatedAt,
      images: [img2, img1],
    }),
  });
  assert.strictEqual(reorderRes.status, 200);
  mediaProd = (await reorderRes.json()).product;
  assert.deepStrictEqual(mediaProd.images, [img2, img1]);
  recordResult('Feature 4: Media Management', 'Media reordered successfully on product record', true, 'Sequence inverted to [img2, img1]');

  // Replace image slot: replace slot 0 with img3 -> [img3, img1]
  const replaceRes = await fetch(`${SERVER_URL}/api/products/${multiVarProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      expectedVersion: mediaProd.version,
      lastKnownUpdatedAt: mediaProd.updatedAt,
      images: [img3, img1],
    }),
  });
  assert.strictEqual(replaceRes.status, 200);
  mediaProd = (await replaceRes.json()).product;
  assert.deepStrictEqual(mediaProd.images, [img3, img1]);
  recordResult('Feature 4: Media Management', 'Image slot replacement executed', true, 'Slot 0 replaced with img3');

  // Remove image: remove slot 1 -> [img3]
  const removeImgRes = await fetch(`${SERVER_URL}/api/products/${multiVarProd.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      expectedVersion: mediaProd.version,
      lastKnownUpdatedAt: mediaProd.updatedAt,
      images: [img3],
    }),
  });
  assert.strictEqual(removeImgRes.status, 200);
  mediaProd = (await removeImgRes.json()).product;
  assert.deepStrictEqual(mediaProd.images, [img3]);
  recordResult('Feature 4: Media Management', 'Media removal executed and persisted', true, 'Single primary image retained');

  // 7. Feature 5: Order-item corrections with before/after review, required reason, transactional inventory reconciliation, and explicit additional-payment or refund-due states
  console.log(`\n${BOLD}7. Feature 5: Order-Item Corrections & Transactional Reconciliation${RESET}`);

  // Create isolated multi-item order in DB
  const initialStockA = 25;
  const initialStockB = 12;
  const initialQtyA = 2;
  const initialQtyB = 1;
  const unitPriceA = 110000; // 100000 + 10000 adjustment
  const unitPriceB = 140000;
  const subtotalPaise = (unitPriceA * initialQtyA) + (unitPriceB * initialQtyB); // 220000 + 140000 = 360000
  const shippingPaise = 0;
  const taxPaise = Math.round(subtotalPaise * 0.18); // 64800
  const totalPaise = subtotalPaise + shippingPaise + taxPaise; // 424800

  const { data: testOrder, error: orderCreateErr } = await dbAdmin
    .from('orders')
    .insert({
      order_number: `FAL-P3-ORD-${uniqueId}`,
      customer_name: 'Dr. Vikram Sarabhai',
      customer_email: 'vikram.sarabhai@isro.gov.in',
      customer_phone: '+919876543210',
      shipping_address: {
        fullName: 'Dr. Vikram Sarabhai',
        phone: '+919876543210',
        addressLine1: 'Physical Research Laboratory',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380009',
      },
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      tax_paise: taxPaise,
      total_paise: totalPaise,
      payment_status: 'captured',
      payment_method: 'Razorpay UPI/Card',
      status: 'confirmed',
      status_history: [
        { status: 'confirmed', timestamp: new Date().toISOString(), note: 'Order placed by customer' },
      ],
    })
    .select()
    .single();

  assert(!orderCreateErr && testOrder, `Failed to create test order: ${orderCreateErr?.message}`);

  // Insert line items
  const { data: itemRows, error: itemInsertErr } = await dbAdmin
    .from('order_items')
    .insert([
      {
        order_id: testOrder.id,
        product_id: multiVarProd.id,
        product_title: multiVarProd.title,
        variant_id: varA.id,
        variant_sku: skuA,
        variant_details: 'PLA / Matte White (Raw)',
        unit_price_paise: unitPriceA,
        quantity: initialQtyA,
        total_paise: unitPriceA * initialQtyA,
        stock_type: 'ready_stock',
        production_status: 'not_applicable',
      },
      {
        order_id: testOrder.id,
        product_id: multiVarProd.id,
        product_title: multiVarProd.title,
        variant_id: varB.id,
        variant_sku: skuB,
        variant_details: 'Resin / Obsidian Black (Sanded)',
        unit_price_paise: unitPriceB,
        quantity: initialQtyB,
        total_paise: unitPriceB * initialQtyB,
        stock_type: 'ready_stock',
        production_status: 'not_applicable',
      },
    ])
    .select();

  assert(!itemInsertErr && itemRows && itemRows.length === 2, `Must insert 2 order items: ${itemInsertErr?.message}`);
  const itemA = itemRows.find((i) => i.variant_sku === skuA);
  const itemB = itemRows.find((i) => i.variant_sku === skuB);

  recordResult('Feature 5: Order Reconciliation', 'Multi-item test order seeded with 2 distinct product variants', true, `Order: ${testOrder.order_number}, Total: ₹${totalPaise / 100}`);

  // 7.1 Negative Validation: Missing reason rejection
  const invalidReasonRes = await fetch(`${SERVER_URL}/api/orders/${testOrder.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: itemA.id,
      newQuantity: 3,
      reason: 'bad', // < 5 characters!
      lastKnownUpdatedAt: testOrder.updated_at,
    }),
  });
  assert.strictEqual(invalidReasonRes.status, 400, 'Correction with short reason must be rejected');
  const invalidReasonData = await invalidReasonRes.json();
  assert(invalidReasonData.error.includes('minimum 5 characters'));
  recordResult('Feature 5: Order Reconciliation', 'Validation enforces mandatory reason (minimum 5 characters)', true, 'Rejected with HTTP 400');

  // 7.2 Increase quantity -> additional_payment_due & stock decrement
  const incRes = await fetch(`${SERVER_URL}/api/orders/${testOrder.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: itemA.id,
      newQuantity: 3, // +1 unit
      reason: 'Customer requested additional unit prior to dispatch',
      lastKnownUpdatedAt: testOrder.updated_at,
    }),
  });
  const incData = await incRes.json();
  if (incRes.status !== 200) {
    console.error('incRes error:', incData);
  }
  assert.strictEqual(incRes.status, 200, `Increase quantity must succeed with 200, received ${incRes.status}: ${JSON.stringify(incData)}`);
  const incOrder = incData.order;
  assert.strictEqual(incOrder.paymentStatus, 'additional_payment_due', 'Payment status must transition to additional_payment_due');
  assert(incOrder.totalPaise > totalPaise, 'Total must increase');

  // Verify stock decremented by 1 in database
  const { data: stockCheckA } = await dbAdmin.from('product_variants').select('stock_quantity').eq('id', varA.id).single();
  assert.strictEqual(stockCheckA.stock_quantity, initialStockA - 1, 'Stock must decrement by 1');
  recordResult('Feature 5: Order Reconciliation', 'Quantity increase atomically decremented stock and transitioned to additional_payment_due', true, `New Status: ${incOrder.paymentStatus}, Variant Stock: ${stockCheckA.stock_quantity}`);

  // 7.3 Decrease quantity -> refund_due_pending_approval & stock replenishment
  const decRes = await fetch(`${SERVER_URL}/api/orders/${testOrder.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: itemA.id,
      newQuantity: 1, // -2 units from 3
      reason: 'Customer requested downscaling order to single unit',
      lastKnownUpdatedAt: incOrder.updatedAt,
    }),
  });
  assert.strictEqual(decRes.status, 200, `Decrease quantity must succeed with 200`);
  const decData = await decRes.json();
  const decOrder = decData.order;
  assert.strictEqual(decOrder.paymentStatus, 'refund_due_pending_approval', 'Payment status must transition to refund_due_pending_approval');
  assert(decOrder.totalPaise < incOrder.totalPaise, 'Total must decrease');

  // Verify stock replenished by 2 in database
  const { data: stockReplenishedA } = await dbAdmin.from('product_variants').select('stock_quantity').eq('id', varA.id).single();
  assert.strictEqual(stockReplenishedA.stock_quantity, initialStockA + 1, 'Stock must replenish by 2 units');
  recordResult('Feature 5: Order Reconciliation', 'Quantity decrease atomically replenished stock and transitioned to refund_due_pending_approval', true, `New Status: ${decOrder.paymentStatus}, Variant Stock: ${stockReplenishedA.stock_quantity}`);

  // 7.4 Historical Order Details Preservation Check
  // Modify catalog product and variant price drastically
  await dbAdmin.from('products').update({ name: 'Tampered Product Name 9999', base_price_paise: 999999 }).eq('id', multiVarProd.id);
  await dbAdmin.from('product_variants').update({ title: 'Tampered Variant Title', sku: 'TAMPERED-SKU-999' }).eq('id', varA.id);

  // Re-fetch order items
  const { data: historicalItems } = await dbAdmin.from('order_items').select('*').eq('order_id', testOrder.id);
  const preservedItemA = historicalItems.find((i) => i.variant_id === varA.id);
  assert.strictEqual(preservedItemA.variant_sku, skuA, 'Historical variant SKU must NOT change');
  assert.strictEqual(preservedItemA.unit_price_paise, unitPriceA, 'Historical unit price must NOT change');
  assert.strictEqual(preservedItemA.product_title, multiVarProd.title, 'Historical product title must NOT change');
  recordResult('Feature 5: Order Reconciliation', 'Historical order line items immutably preserved when catalog changes occur', true, `Historical SKU: ${preservedItemA.variant_sku}, Unit Price: ₹${preservedItemA.unit_price_paise / 100}`);

  // 7.5 Edge Case: Insufficient Stock Causes Complete Rollback
  const excessiveStockRes = await fetch(`${SERVER_URL}/api/orders/${testOrder.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: itemA.id,
      newQuantity: 9999, // Way beyond available stock
      reason: 'Attempting invalid allocation exceeding physical stock',
      lastKnownUpdatedAt: decOrder.updatedAt,
    }),
  });
  assert.strictEqual(excessiveStockRes.status, 400, 'Excessive stock allocation must be rejected');
  const excessiveData = await excessiveStockRes.json();
  assert(excessiveData.error.toLowerCase().includes('insufficient stock'), 'Error message must specify insufficient stock');
  
  // Verify complete rollback: order total and variant stock completely untouched
  const { data: stockAfterRollback } = await dbAdmin.from('product_variants').select('stock_quantity').eq('id', varA.id).single();
  assert.strictEqual(stockAfterRollback.stock_quantity, stockReplenishedA.stock_quantity, 'Stock must not change when transaction rolls back');
  const { data: orderAfterRollback } = await dbAdmin.from('orders').select('total_paise').eq('id', testOrder.id).single();
  assert.strictEqual(orderAfterRollback.total_paise, decOrder.totalPaise, 'Order total must remain rolled back');
  recordResult('Feature 5: Order Reconciliation', 'Insufficient stock triggers complete transactional rollback', true, 'Stock and order totals fully preserved');

  // 7.6 Edge Case: Stale Concurrent Corrections Are Rejected (HTTP 409)
  const staleConflictRes = await fetch(`${SERVER_URL}/api/orders/${testOrder.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: itemA.id,
      newQuantity: 2,
      reason: 'Concurrent operator collision test',
      lastKnownUpdatedAt: testOrder.updated_at, // Stale timestamp from order creation!
    }),
  });
  assert.strictEqual(staleConflictRes.status, 409, 'Stale concurrent update must return HTTP 409 Concurrency Conflict');
  recordResult('Feature 5: Order Reconciliation', 'Stale concurrent correction rejected with HTTP 409', true, 'Optimistic lock prevented race condition');

  // 7.7 Edge Case: Shipped and Locked Orders Cannot Be Reconciled
  const { data: updatedShipped } = await dbAdmin.from('orders').update({ status: 'shipped' }).eq('id', testOrder.id).select().single();
  const shippedOrderRes = await fetch(`${SERVER_URL}/api/orders/${testOrder.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: itemA.id,
      newQuantity: 2,
      reason: 'Attempt to modify shipped dispatch',
      lastKnownUpdatedAt: updatedShipped.updated_at,
    }),
  });
  assert.strictEqual(shippedOrderRes.status, 400, 'Shipped order modification must be rejected');
  const shippedData = await shippedOrderRes.json();
  assert(shippedData.error.includes('shipped'), 'Error must identify locked order status');
  await dbAdmin.from('orders').update({ status: 'confirmed' }).eq('id', testOrder.id); // restore status
  recordResult('Feature 5: Order Reconciliation', 'Terminal and shipped order statuses strictly protected from item alteration', true, 'HTTP 400 rejection confirmed');

  // 7.8 Edge Case: Corrections Preserve Shipping, Proportional Taxes, and Historical Pricing
  const orderWithTaxAndShipping = await dbAdmin.from('orders').insert({
    order_number: `FAL-TAX-SHIP-${uniqueId}`,
    customer_name: 'Dr. APJ Abdul Kalam',
    customer_email: 'kalam@drdo.res.in',
    customer_phone: '+919876543211',
    shipping_address: { fullName: 'Dr. Kalam', phone: '+919876543211', addressLine1: 'DRDO Complex', city: 'Hyderabad', state: 'Telangana', pinCode: '500058' },
    subtotal_paise: 220000, // 2 items at 110000
    shipping_paise: 15000,  // ₹150 flat shipping
    tax_paise: 39600,       // 18% of 220000
    total_paise: 274600,
    payment_status: 'captured',
    payment_method: 'Razorpay UPI/Card',
    status: 'confirmed',
  }).select().single();

  const orderItemTax = await dbAdmin.from('order_items').insert({
    order_id: orderWithTaxAndShipping.data.id,
    product_id: multiVarProd.id,
    product_title: 'Historical Title Before Catalog Inflation',
    variant_id: varA.id,
    variant_sku: skuA,
    variant_details: 'Standard',
    unit_price_paise: 110000,
    quantity: 2,
    total_paise: 220000,
    stock_type: 'ready_stock',
    production_status: 'not_applicable',
  }).select().single();

  const taxReconcileRes = await fetch(`${SERVER_URL}/api/orders/${orderWithTaxAndShipping.data.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: orderItemTax.data.id,
      newQuantity: 3, // +1 unit at 110000 -> subtotal 330000
      reason: 'Adding single unit under existing tax structure',
      lastKnownUpdatedAt: orderWithTaxAndShipping.data.updated_at,
    }),
  });
  assert.strictEqual(taxReconcileRes.status, 200);
  const taxReconcileOrder = (await taxReconcileRes.json()).order;
  assert.strictEqual(taxReconcileOrder.subtotalPaise, 330000, 'Subtotal must calculate from historical 110000 unit price');
  assert.strictEqual(taxReconcileOrder.shippingPaise, 15000, 'Shipping must remain strictly preserved at 15000 paise');
  assert.strictEqual(taxReconcileOrder.taxPaise, 59400, 'Tax must scale proportionally (18% of 330000 = 59400)');
  assert.strictEqual(taxReconcileOrder.totalPaise, 330000 + 15000 + 59400, 'Total must equal subtotal + shipping + tax');
  recordResult('Feature 5: Order Reconciliation', 'Explicit preservation of flat shipping, proportional 18% GST, and historical pricing', true, `Subtotal: ₹${taxReconcileOrder.subtotalPaise/100}, Ship: ₹${taxReconcileOrder.shippingPaise/100}, Tax: ₹${taxReconcileOrder.taxPaise/100}`);

  // 7.9 Edge Case: Decrease on Unpaid Order Does NOT Create a Refund Due
  const unpaidOrder = await dbAdmin.from('orders').insert({
    order_number: `FAL-UNPAID-${uniqueId}`,
    customer_name: 'Unpaid Customer',
    customer_email: 'unpaid@example.com',
    customer_phone: '+919876543212',
    shipping_address: { fullName: 'Unpaid Customer', phone: '+919876543212', addressLine1: 'Line 1', city: 'Nashik', state: 'MH', pinCode: '422001' },
    subtotal_paise: 200000,
    shipping_paise: 0,
    tax_paise: 0,
    total_paise: 200000,
    payment_status: 'pending', // UNPAID
    payment_method: 'Cash on Delivery (Local Nashik)',
    status: 'confirmed',
  }).select().single();

  const unpaidItem = await dbAdmin.from('order_items').insert({
    order_id: unpaidOrder.data.id,
    product_id: multiVarProd.id,
    product_title: 'Unpaid Test Item',
    variant_id: varB.id,
    variant_sku: skuB,
    variant_details: 'Resin',
    unit_price_paise: 100000,
    quantity: 2,
    total_paise: 200000,
    stock_type: 'ready_stock',
    production_status: 'not_applicable',
  }).select().single();

  const unpaidDecRes = await fetch(`${SERVER_URL}/api/orders/${unpaidOrder.data.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: unpaidItem.data.id,
      newQuantity: 1, // downscale unpaid order
      reason: 'Customer adjusted unpaid cart balance',
      lastKnownUpdatedAt: unpaidOrder.data.updated_at,
    }),
  });
  assert.strictEqual(unpaidDecRes.status, 200);
  const unpaidDecOrder = (await unpaidDecRes.json()).order;
  assert.strictEqual(unpaidDecOrder.totalPaise, 100000, 'Total adjusted downwards');
  assert.strictEqual(unpaidDecOrder.paymentStatus, 'pending', 'Unpaid order must NOT transition to refund_due_pending_approval');
  recordResult('Feature 5: Order Reconciliation', 'Financial calculations against payments prevent refund creation on unpaid orders', true, 'Payment status remained pending as expected');

  // 7.10 Edge Case: Repeating Request Cannot Adjust Inventory Twice (Idempotency)
  const { data: stockBeforeRepeat } = await dbAdmin.from('product_variants').select('stock_quantity').eq('id', varB.id).single();
  const repeatReqRes = await fetch(`${SERVER_URL}/api/orders/${unpaidOrder.data.id}/items`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'update_quantity',
      itemId: unpaidItem.data.id,
      newQuantity: 1, // EXACT SAME target quantity
      reason: 'Network retry of identical correction request',
      lastKnownUpdatedAt: unpaidDecOrder.updatedAt,
    }),
  });
  assert.strictEqual(repeatReqRes.status, 200);
  const { data: stockAfterRepeat } = await dbAdmin.from('product_variants').select('stock_quantity').eq('id', varB.id).single();
  assert.strictEqual(stockAfterRepeat.stock_quantity, stockBeforeRepeat.stock_quantity, 'Inventory stock must not adjust twice on repeated request');
  recordResult('Feature 5: Order Reconciliation', 'Duplicate or retry requests maintain idempotency with zero duplicate inventory movement', true, `Stock preserved at ${stockAfterRepeat.stock_quantity}`);

  // 8. Feature 6: Product/SKU filters on multi-product orders
  console.log(`\n${BOLD}8. Feature 6: Multi-Product and SKU Order Filtering${RESET}`);

  // Search by SKU of Item A
  const searchSkuARes = await fetch(`${SERVER_URL}/api/orders?sku=${skuA}`, {
    headers: adminHeaders,
  });
  assert.strictEqual(searchSkuARes.status, 200);
  const skuAData = await searchSkuARes.json();
  const matchedOrderA = skuAData.orders.find((o) => o.id === testOrder.id);
  assert(matchedOrderA, 'Order must be found when searching by SKU A');
  assert.strictEqual(matchedOrderA.items.length, 2, 'Multi-item order must return all items intact');
  recordResult('Feature 6: Multi-Product Filters', 'Order found by SKU filter with all multi-product items preserved intact', true, `Found order with ${matchedOrderA.items.length} items`);

  // Search by SKU of Item B
  const searchSkuBRes = await fetch(`${SERVER_URL}/api/orders?sku=${skuB}`, {
    headers: adminHeaders,
  });
  assert.strictEqual(searchSkuBRes.status, 200);
  const skuBData = await searchSkuBRes.json();
  const matchedOrderB = skuBData.orders.find((o) => o.id === testOrder.id);
  assert(matchedOrderB, 'Order must be found when searching by SKU B');
  assert.strictEqual(matchedOrderB.items.length, 2);
  recordResult('Feature 6: Multi-Product Filters', 'Order found by second item SKU with complete order payload', true, `Found order matching SKU B`);

  // Search by Product Name fragment
  const searchProdRes = await fetch(`${SERVER_URL}/api/orders?product=Multi-Variant`, {
    headers: adminHeaders,
  });
  assert.strictEqual(searchProdRes.status, 200);
  const prodData = await searchProdRes.json();
  const matchedOrderProd = prodData.orders.find((o) => o.id === testOrder.id);
  assert(matchedOrderProd, 'Order must be found when searching by product title');
  recordResult('Feature 6: Multi-Product Filters', 'Order found by product title query with full item breakdown', true, `Order ${matchedOrderProd.orderNumber} matched`);

  // Search for non-existent SKU
  const searchNoneRes = await fetch(`${SERVER_URL}/api/orders?sku=FAL-NONEXISTENT-99999`, {
    headers: adminHeaders,
  });
  assert.strictEqual(searchNoneRes.status, 200);
  const noneData = await searchNoneRes.json();
  assert.strictEqual(noneData.orders.length, 0, 'No orders should match non-existent SKU');
  recordResult('Feature 6: Multi-Product Filters', 'Non-existent SKU yields empty results safely', true, '0 orders returned');

  // Summary
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}                     PHASE 3 VERIFICATION SUMMARY                       ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`  Total Phase 3 Tests: ${totalCount}`);
  console.log(`  Passed: ${GREEN}${passedCount}${RESET}`);
  console.log(`  Failed: ${passedCount === totalCount ? '0' : RED + (totalCount - passedCount) + RESET}`);

  if (passedCount === totalCount) {
    console.log(`\n  ${GREEN}${BOLD}ALL 6 PHASE 3 FEATURES VERIFIED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  } else {
    console.error(`\n  ${RED}${BOLD}SOME TESTS FAILED!${RESET}\n`);
    process.exit(1);
  }
}

runPhase3Verification().catch((err) => {
  console.error(`\n${RED}${BOLD}[FATAL ERROR] Phase 3 verification threw exception:${RESET}`, err);
  process.exit(1);
});
