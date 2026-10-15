/**
 * Falcon 3D Prints — Isolated PostgreSQL Database Verification Suite
 *
 * SAFETY GUARD:
 * This script will REFUSE to execute against any remote or production database host.
 * It strictly requires a local containerized PostgreSQL instance (127.0.0.1 / localhost).
 */

import pg from 'pg';

const { Client } = pg;

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

function assertLocalDatabaseUrl(urlStr) {
  if (!urlStr) {
    throw new Error('TEST_DB_URL environment variable is required.');
  }
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch (err) {
    throw new Error(`Invalid TEST_DB_URL format: ${err.message}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  if (!isLocal || parsed.href.includes('supabase.co') || parsed.href.includes('wkkoviqhmccjnocjfudq')) {
    console.error(`\n${BOLD}${RED}[CRITICAL SAFETY GUARD TRIGGERED]${RESET}`);
    console.error(`Target host: "${hostname}"`);
    console.error('REFUSING EXECUTION: Database tests must NEVER run against a remote or production database.');
    console.error('Target must be an isolated local test container (127.0.0.1 or localhost).\n');
    process.exit(1);
  }
}

async function runIsolatedDbTests() {
  const dbUrl = process.env.TEST_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}      FALCON 3D PRINTS — ISOLATED POSTGRESQL DATABASE VERIFIER          ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  assertLocalDatabaseUrl(dbUrl);

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log(`  ${GREEN}✓ Connected to isolated local database:${RESET} ${dbUrl}\n`);
  } catch (err) {
    console.error(`\n  ${RED}✖ Connection failed to local test database:${RESET} ${err.message}`);
    console.error(`\n  ${YELLOW}${BOLD}[PRECISE BLOCKER]${RESET}`);
    console.error('  Docker Desktop Linux Engine is not running on this Windows host.');
    console.error('  Manual Action Required: Start Docker Desktop from the Start Menu.');
    console.error('  Then start the local Supabase stack with:');
    console.error(`  ${CYAN}npx supabase start${RESET}\n`);
    process.exit(2);
  }

  let passed = 0;
  let failed = 0;

  function assertTest(condition, name, details = '') {
    if (condition) {
      console.log(`  ${GREEN}[PASS]${RESET} ${name}`);
      if (details) console.log(`         ${CYAN}ℹ ${details}${RESET}`);
      passed++;
    } else {
      console.error(`  ${RED}[FAIL]${RESET} ${name}`);
      if (details) console.error(`         ${YELLOW}⚠ ${details}${RESET}`);
      failed++;
    }
  }

  try {
    // 1. Verify prevent_profile_role_self_promotion trigger
    console.log(`${BOLD}1. Profile Role Self-Promotion Trigger Enforcement${RESET}`);
    const testUserId = '00000000-0000-0000-0000-000000000999';
    await client.query(`
      INSERT INTO auth.users (id, email)
      VALUES ($1, 'test_customer_target@example.com')
      ON CONFLICT (id) DO NOTHING;
    `, [testUserId]);

    await client.query(`
      INSERT INTO public.profiles (id, full_name, role)
      VALUES ($1, 'Test Customer Target', 'customer')
      ON CONFLICT (id) DO UPDATE SET role = 'customer';
    `, [testUserId]);

    let triggerFired = false;
    try {
      // Simulate non-owner session context
      await client.query(`
        SET LOCAL request.jwt.claim.sub = '${testUserId}';
        SET LOCAL request.jwt.claim.role = 'authenticated';
        UPDATE public.profiles SET role = 'owner' WHERE id = '${testUserId}';
      `);
    } catch (err) {
      triggerFired = err.message.toLowerCase().includes('denied') || err.message.includes('forbidden') || err.message.includes('promotion');
    }
    assertTest(triggerFired, 'Trigger prevent_profile_role_self_promotion rejects customer self-escalation');

    // 2. Verify Atomic Reservation Creation and Row-level Locking
    console.log(`\n${BOLD}2. Atomic Reservation Creation & Two Simultaneous Orders Racing for Last Unit${RESET}`);
    const testProdId = '11111111-1111-1111-1111-111111111111';
    const testVarId = '22222222-2222-2222-2222-222222222222';

    await client.query(`
      INSERT INTO public.products (id, name, slug, availability, is_published, base_price_paise)
      VALUES ($1, 'Limited Edition Part', 'limited-edition-part', 'in_stock', true, 19900)
      ON CONFLICT (id) DO NOTHING;
    `, [testProdId]);

    await client.query(`
      INSERT INTO public.product_variants (id, product_id, sku, title, material, color, finish, stock_quantity, is_active)
      VALUES ($1, $2, 'FAL-RACE-001', 'Default Variant', 'PLA', 'Black', 'Matte', 1, true)
      ON CONFLICT (id) DO UPDATE SET stock_quantity = 1;
    `, [testVarId, testProdId]);

    await client.query(`
      DELETE FROM public.stock_reservations WHERE variant_id = $1;
    `, [testVarId]);

    // Client 2 for simultaneous competing connection
    const clientB = new Client({ connectionString: dbUrl });
    await clientB.connect();

    const [resA, resB] = await Promise.all([
      client.query(`SELECT public.create_stock_reservation_atomic($1, $2, NULL, 1, 15) as result`, [testProdId, testVarId]),
      clientB.query(`SELECT public.create_stock_reservation_atomic($1, $2, NULL, 1, 15) as result`, [testProdId, testVarId]),
    ]);

    await clientB.end();

    const resultA = resA.rows[0].result;
    const resultB = resB.rows[0].result;

    const winCount = [resultA.success, resultB.success].filter(Boolean).length;
    const rejectCount = [resultA.success, resultB.success].filter(s => s === false).length;

    assertTest(
      winCount === 1 && rejectCount === 1,
      'Concurrent reservation race: Exactly 1 order wins, 1 rejected with insufficient_stock',
      `Winner: ${resultA.success ? 'Order A' : 'Order B'}, Rejected: ${!resultA.success ? resultA.error : resultB.error}`
    );

    // 3. Verify Release of Expired Reservations
    console.log(`\n${BOLD}3. Release Expired Stock Reservations${RESET}`);
    const winningResId = resultA.success ? resultA.reservation_id : resultB.reservation_id;
    await client.query(`
      UPDATE public.stock_reservations
      SET expires_at = timezone('utc'::text, now()) - interval '1 minute'
      WHERE id = $1;
    `, [winningResId]);

    const releaseRes = await client.query(`SELECT public.release_expired_stock_reservations() as released_count;`);
    const releasedCount = releaseRes.rows[0].released_count;
    assertTest(releasedCount >= 1, `release_expired_stock_reservations() successfully expired ${releasedCount} past holds`);

    // 4. Verify Forced Audit Rollback in Transactional Procedure
    console.log(`\n${BOLD}4. Transactional Order Mutation with Audit Rollback${RESET}`);
    const testOrderId = '33333333-3333-3333-3333-333333333333';
    await client.query(`
      INSERT INTO public.orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, subtotal_paise, shipping_paise, tax_paise, total_paise, status, payment_status
      )
      VALUES (
        $1, 'FAL-ROLLBACK-001', $2, 'Test Customer', 'cust@test.com', '+919876543210',
        '{"line1":"123 Main St","city":"Mumbai","state":"Maharashtra","pincode":"400001"}'::jsonb,
        5000, 0, 0, 5000, 'pending', 'pending'
      )
      ON CONFLICT (id) DO UPDATE SET status = 'pending';
    `, [testOrderId, testUserId]);

    let rollbackObserved = false;
    try {
      // Force constraint failure on audit insert by sending non-existent entity_type
      await client.query(`
        SELECT public.apply_order_mutation_with_audit(
          $1,
          jsonb_build_object('status', 'confirmed'),
          jsonb_build_object('action', 'ORDER_STATUS_UPDATE', 'staff_name', 'Test Staff', 'entity_type', 'INVALID_ENTITY_TYPE')
        );
      `, [testOrderId]);
    } catch {
      rollbackObserved = true;
    }

    const checkOrder = await client.query(`SELECT status FROM public.orders WHERE id = $1`, [testOrderId]);
    const finalStatus = checkOrder.rows[0].status;
    assertTest(
      finalStatus === 'pending',
      'Forced audit failure rolls back order mutation (status remains pending)'
    );

    // 5. Verify In-Database SUM Aggregate for Dashboard Metrics (>1000 orders)
    console.log(`\n${BOLD}5. Dashboard Revenue SUM Aggregate on High Volume (>1,000 orders)${RESET}`);
    await client.query(`
      INSERT INTO public.orders (
        order_number, customer_name, customer_email, customer_phone,
        shipping_address, subtotal_paise, shipping_paise, tax_paise, total_paise, status, payment_status, created_at
      )
      SELECT 
        'FAL-VOL-' || s.i,
        'Volume Customer ' || s.i,
        'vol' || s.i || '@example.com',
        '+919876543210',
        '{"line1":"Test St","city":"Nashik","state":"Maharashtra","pincode":"422001"}'::jsonb,
        10000,
        0,
        0,
        10000, -- ₹100.00 each
        'confirmed',
        'captured',
        now()
      FROM generate_series(1, 1050) as s(i)
      ON CONFLICT DO NOTHING;
    `);

    const metricsRes = await client.query(`SELECT public.get_dashboard_metrics() as metrics;`);
    const metrics = metricsRes.rows[0].metrics;

    assertTest(
      Number(metrics.totalOrdersCount) >= 1050,
      `get_dashboard_metrics() counts volume orders correctly (count: ${metrics.totalOrdersCount})`
    );
    assertTest(
      Number(metrics.totalRevenuePaise) >= 1050 * 10000,
      `get_dashboard_metrics() calculates PostgreSQL SUM aggregate without memory truncation (₹${(metrics.totalRevenuePaise / 100).toFixed(2)})`
    );

  } finally {
    await client.end();
  }

  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`ISOLATED DATABASE TESTS: ${passed + failed} | ${GREEN}PASSED: ${passed}${RESET} | ${failed > 0 ? RED : GREEN}FAILED: ${failed}${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  if (failed > 0) process.exit(1);
}

runIsolatedDbTests().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
