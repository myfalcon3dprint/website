/**
 * Falcon 3D Prints — Real Database Concurrency & RPC Security Verification Suite
 * 
 * Executes real PostgreSQL transactions against the isolated local database:
 * 1. Concurrency: Simultaneous stock adjustments (Relative additions serialized without lost updates)
 * 2. Concurrency: Competing edits on identical version (Optimistic concurrency conflict detection)
 * 3. Payment Finalization: Idempotent duplicate payment capture (Stock deducted exactly once)
 * 4. Staff Invitations: Concurrent single-use invitation redemption race
 * 5. Direct PostgREST RPC Security: Anon rejected via GRANT revocation
 * 6. Direct PostgREST RPC Security: Customer session rejected via function RBAC
 * 7. Direct PostgREST RPC Security: Staff actor spoofing prevented (auth.uid enforced in audit log)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

async function runRealDbSuite() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   FALCON 3D PRINTS — REAL DATABASE CONCURRENCY & SECURITY SUITE        ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);

  let realDbCount = 0;
  let realDbPassed = 0;

  function assertDb(condition, testName, details = '') {
    realDbCount++;
    if (condition) {
      console.log(`  ${GREEN}[REAL_DB_TRANSACTION: PASS]${RESET} ${testName}`);
      if (details) console.log(`         ${CYAN}ℹ ${details}${RESET}`);
      realDbPassed++;
    } else {
      console.error(`  ${RED}[REAL_DB_TRANSACTION: FAIL]${RESET} ${testName}`);
      if (details) console.error(`         ${RED}⚠ ${details}${RESET}`);
    }
  }

  const productId = 'a1111111-1111-1111-1111-111111111111';
  const variantId = 'b1111111-1111-1111-1111-111111111111';

  // 1. Simultaneous relative adjustments (+5 and +3)
  await supabase.from('product_variants').update({ stock_quantity: 10 }).eq('id', variantId);
  const [resDelta1, resDelta2] = await Promise.all([
    supabase.rpc('apply_product_stock_with_audit', { p_product_id: productId, p_variant_id: variantId, p_delta: 5 }),
    supabase.rpc('apply_product_stock_with_audit', { p_product_id: productId, p_variant_id: variantId, p_delta: 3 }),
  ]);
  const { data: varAfterDeltas } = await supabase.from('product_variants').select('stock_quantity').eq('id', variantId).single();
  assertDb(
    varAfterDeltas.stock_quantity === 18 && Boolean(resDelta1.data) && Boolean(resDelta2.data),
    'Simultaneous relative adjustments (+5 and +3) serialized with row locks without lost updates',
    `Initial: 10, Intermediate commits: ${resDelta1.data?.newStockQuantity}, ${resDelta2.data?.newStockQuantity}, Final stock: ${varAfterDeltas.stock_quantity}`
  );

  // 2. Competing edits with stale version
  const { data: prodBeforeConflict } = await supabase.from('products').select('version').eq('id', productId).single();
  const currentVersion = prodBeforeConflict.version;
  const [opt1, opt2] = await Promise.all([
    supabase.rpc('apply_product_stock_with_audit', { p_product_id: productId, p_variant_id: variantId, p_delta: 1, p_expected_version: currentVersion }),
    supabase.rpc('apply_product_stock_with_audit', { p_product_id: productId, p_variant_id: variantId, p_delta: 1, p_expected_version: currentVersion }),
  ]);
  const optSuccessCount = [opt1.data?.success, opt2.data?.success].filter(Boolean).length;
  const optConflictCount = [opt1.error?.message, opt2.error?.message].filter(m => m && m.includes('Concurrency conflict')).length;
  assertDb(
    optSuccessCount === 1 && optConflictCount === 1,
    'Simultaneous competing edits with same expected version: exactly one commits, second triggers concurrency conflict',
    `Succeeded: ${optSuccessCount}, Concurrency Conflicts: ${optConflictCount}`
  );

  // 3. Duplicate payment finalization
  await supabase.from('product_variants').update({ stock_quantity: 20 }).eq('id', variantId);
  const orderNumber = 'TEST-ORD-DUP-' + Date.now();
  const { data: order } = await supabase.from('orders').insert({
    order_number: orderNumber,
    customer_name: 'Payment Finalize Test',
    customer_email: 'paydup@falcon3dprints.com',
    customer_phone: '+919876543210',
    subtotal_paise: 50000,
    shipping_paise: 0,
    tax_paise: 0,
    total_paise: 50000,
    payment_status: 'pending',
    payment_method: 'Razorpay UPI/Card',
    status: 'confirmed',
    shipping_address: { fullName: 'Pay Dup', phone: '9876543210', addressLine1: 'Line 1', city: 'Nashik', state: 'Maharashtra', pinCode: '422001' }
  }).select().single();

  await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: productId,
    variant_id: variantId,
    product_title: 'Planter',
    variant_sku: 'FAL-PLT-GEO-BLK-M',
    variant_details: 'Standard',
    unit_price_paise: 50000,
    quantity: 2,
    total_paise: 50000,
    stock_type: 'ready_stock'
  });

  const [pay1, pay2] = await Promise.all([
    supabase.rpc('finalize_order_payment_atomic', {
      p_order_number: orderNumber,
      p_razorpay_order_id: 'rzp_ord_test_001',
      p_razorpay_payment_id: 'rzp_pay_test_001',
      p_razorpay_signature: 'sig_valid_dummy',
      p_amount_paise: 50000,
      p_event_source: 'webhook'
    }),
    supabase.rpc('finalize_order_payment_atomic', {
      p_order_number: orderNumber,
      p_razorpay_order_id: 'rzp_ord_test_001',
      p_razorpay_payment_id: 'rzp_pay_test_001',
      p_razorpay_signature: 'sig_valid_dummy',
      p_amount_paise: 50000,
      p_event_source: 'client_verify'
    })
  ]);

  const { data: varAfterPayment } = await supabase.from('product_variants').select('stock_quantity').eq('id', variantId).single();
  const paymentCapturedOnce = (pay1.data?.alreadyCaptured === false && pay2.data?.alreadyCaptured === true) ||
                              (pay1.data?.alreadyCaptured === true && pay2.data?.alreadyCaptured === false);
  assertDb(
    varAfterPayment.stock_quantity === 18 && paymentCapturedOnce,
    'Simultaneous duplicate payment finalization: captured atomically once, stock deducted exactly once',
    `Initial: 20, Order Quantity: 2, Remaining Stock: ${varAfterPayment.stock_quantity}, alreadyCaptured flagged on duplicate: true`
  );

  // 4. Concurrent invitation redemption race
  const inviteEmail = 'staff_race_' + Date.now() + '@falcon3dprints.com';
  const inviteToken = 'tok_race_' + Math.random().toString(36).substring(2);

  const { data: staffAuthUser } = await supabase.auth.admin.createUser({
    email: inviteEmail,
    password: 'Password123!',
    email_confirm: true
  });
  const staffUserId = staffAuthUser.user.id;

  await supabase.from('staff_invitations').insert({
    email: inviteEmail,
    role: 'catalog_editor',
    token: inviteToken,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    status: 'pending'
  });

  const [red1, red2] = await Promise.all([
    supabase.rpc('accept_staff_invitation', { p_token: inviteToken, p_user_id: staffUserId }),
    supabase.rpc('accept_staff_invitation', { p_token: inviteToken, p_user_id: staffUserId })
  ]);
  const redSuccessCount = [red1.data?.success, red2.data?.success].filter(Boolean).length;
  const redConflictCount = [red1.error?.message, red2.error?.message].filter(m => m && m.includes('Invalid, expired, or previously redeemed')).length;
  const { data: upgradedProfile } = await supabase.from('profiles').select('role').eq('id', staffUserId).single();

  assertDb(
    redSuccessCount === 1 && redConflictCount === 1 && upgradedProfile.role === 'catalog_editor',
    'Concurrent staff invitation redemption: single redemption guarantee enforced via FOR UPDATE row lock',
    `Redeemed: ${redSuccessCount}, Rejected: ${redConflictCount}, Profile Role: ${upgradedProfile.role}`
  );

  // 5. Privileged procedure access: Anon blocked
  const { error: anonMetricsErr } = await anonClient.rpc('get_dashboard_metrics');
  const { error: anonStockErr } = await anonClient.rpc('apply_product_stock_with_audit', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_delta: 1
  });
  assertDb(
    Boolean(anonMetricsErr && anonStockErr),
    'Anonymous callers denied execution on privileged stored procedures via REVOKE grants',
    `Metrics error: ${anonMetricsErr?.message || anonMetricsErr?.code}, Stock error: ${anonStockErr?.message || anonStockErr?.code}`
  );

  // 6. Privileged procedure access: Customer JWT blocked
  const custClient = createClient(SUPABASE_URL, ANON_KEY);
  await custClient.auth.signInWithPassword({
    email: 'customer@falcon3dprints.com',
    password: 'TestCustomerPass123!'
  });
  const { error: custMetricsErr } = await custClient.rpc('get_dashboard_metrics');
  const { error: custStockErr } = await custClient.rpc('apply_product_stock_with_audit', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_delta: 1,
    p_staff_role: 'owner', // Spoofed role in body
    p_staff_name: 'Forged Owner'
  });
  assertDb(
    custMetricsErr?.message?.includes('Access denied') && custStockErr?.message?.includes('Access denied'),
    'Authenticated customer JWT denied administrative execution and role spoofing rejected',
    `Metrics error: ${custMetricsErr?.message}, Stock error: ${custStockErr?.message}`
  );

  // 7. Legitimate staff execution and audit log actor verification
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: adminLogin } = await adminClient.auth.signInWithPassword({
    email: 'admin@falcon3dprints.com',
    password: 'TestAdminPass123!'
  });
  const adminUserId = adminLogin.user.id;
  const { data: adminMetrics } = await adminClient.rpc('get_dashboard_metrics');
  const { data: adminStock } = await adminClient.rpc('apply_product_stock_with_audit', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_delta: 1,
    p_staff_name: 'Forged Impersonation'
  });
  const { data: auditLogEntry } = await supabase
    .from('admin_audit_logs')
    .select('staff_user_id, staff_name, staff_role')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const auditActorGenuine = auditLogEntry?.staff_user_id === adminUserId &&
                            auditLogEntry?.staff_name === 'Studio Owner' &&
                            auditLogEntry?.staff_role === 'owner';
  assertDb(
    Boolean(adminMetrics) && adminStock?.success && auditActorGenuine,
    'Verified staff session authorized; audit log strictly enforces genuine auth.uid ignoring forged actor arguments',
    `Recorded staff_user_id: ${auditLogEntry?.staff_user_id}, Name: ${auditLogEntry?.staff_name}, Role: ${auditLogEntry?.staff_role}`
  );

  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}REAL DATABASE TRANSACTIONS: ${realDbCount} | ${GREEN}PASSED: ${realDbPassed}${RESET} | ${realDbPassed < realDbCount ? RED : GREEN}FAILED: ${realDbCount - realDbPassed}${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  if (realDbPassed < realDbCount) {
    process.exit(1);
  }
}

runRealDbSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
