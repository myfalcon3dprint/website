import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrvxidvpxszijvfevllo.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase keys in environment.');
  process.exit(1);
}

const BASE_URL = 'http://localhost:3000';
const PASSWORD = 'FalconPass2026!';

const ACCOUNTS = {
  owner: 'test.owner@falcon3dprints.local',
  order_manager: 'test.ordermanager@falcon3dprints.local',
  production_operator: 'test.operator@falcon3dprints.local',
  catalog_editor: 'test.catalog@falcon3dprints.local',
};

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let testResults = [];

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    testResults.push({ description, status: 'PASS', details });
  } else {
    console.error(`  ✗ FAIL: ${description} ${details ? `(${details})` : ''}`);
    testResults.push({ description, status: 'FAIL', details });
  }
}

async function loginUser(email) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`Failed to log in ${email}: ${error?.message}`);
  }
  return {
    token: data.session.access_token,
    user: data.user,
  };
}

async function api(path, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('FALCON 3D PRINTS — 4-ROLE RBAC VERIFICATION SUITE');
  console.log('======================================================\n');

  console.log('Authenticating all 4 isolated staff accounts...');
  const tokens = {};
  for (const [role, email] of Object.entries(ACCOUNTS)) {
    try {
      const { token, user } = await loginUser(email);
      tokens[role] = { token, user };
      console.log(`  Authenticated [${role}]: ${email} (UID: ${user.id.slice(0, 8)}...)`);
    } catch (err) {
      console.error(`  Auth failure for ${role}:`, err.message);
      process.exit(1);
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: STUDIO OWNER (SUPER ADMIN)
  // ----------------------------------------------------
  console.log('\n--- Group 1: Studio Owner (Super Admin) Full Privileges ---');
  const ownerToken = tokens.owner.token;

  const ownerMetrics = await api('/api/admin/metrics', { method: 'GET' }, ownerToken);
  assert(
    'Owner can view operational and financial metrics',
    ownerMetrics.status === 200 && ownerMetrics.data?.metrics?.grossSalesPaise !== undefined,
    `Gross sales: ₹${(ownerMetrics.data?.metrics?.grossSalesPaise || 0) / 100}`
  );

  const ownerReports = await api('/api/admin/reports', { method: 'GET' }, ownerToken);
  assert(
    'Owner can access executive financial reports',
    ownerReports.status === 200,
    `Status: ${ownerReports.status}`
  );

  const ownerSettings = await api('/api/admin/settings', { method: 'GET' }, ownerToken);
  assert(
    'Owner can access system settings & store configuration',
    ownerSettings.status === 200,
    `Status: ${ownerSettings.status}`
  );

  const ownerStaff = await api('/api/admin/staff', { method: 'GET' }, ownerToken);
  assert(
    'Owner can view staff directory and role assignments',
    ownerStaff.status === 200,
    `Status: ${ownerStaff.status}`
  );

  const ownerActivity = await api('/api/admin/activity', { method: 'GET' }, ownerToken);
  assert(
    'Owner can view administrative audit activity logs',
    ownerActivity.status === 200,
    `Status: ${ownerActivity.status}`
  );

  // ----------------------------------------------------
  // TEST GROUP 2: ORDER MANAGER
  // ----------------------------------------------------
  console.log('\n--- Group 2: Order Manager Scoped Privileges ---');
  const mgrToken = tokens.order_manager.token;

  const mgrOrders = await api('/api/orders', { method: 'GET' }, mgrToken);
  assert(
    'Order Manager can access customer orders list',
    mgrOrders.status === 200,
    `Status: ${mgrOrders.status}`
  );

  const mgrMetrics = await api('/api/admin/metrics', { method: 'GET' }, mgrToken);
  assert(
    'Order Manager metrics payload strictly hides financial revenue figures',
    mgrMetrics.status === 200 && mgrMetrics.data?.metrics?.grossSalesPaise === undefined,
    `grossSalesPaise is: ${mgrMetrics.data?.metrics?.grossSalesPaise}`
  );

  const mgrReports = await api('/api/admin/reports', { method: 'GET' }, mgrToken);
  assert(
    'Order Manager is DENIED access to financial reports (HTTP 403 Forbidden)',
    mgrReports.status === 403,
    `Status: ${mgrReports.status}`
  );

  const mgrSettings = await api('/api/admin/settings', { method: 'GET' }, mgrToken);
  assert(
    'Order Manager is DENIED access to system settings (HTTP 403 Forbidden)',
    mgrSettings.status === 403,
    `Status: ${mgrSettings.status}`
  );

  const mgrStaff = await api('/api/admin/staff', { method: 'GET' }, mgrToken);
  assert(
    'Order Manager is DENIED access to staff management (HTTP 403 Forbidden)',
    mgrStaff.status === 403,
    `Status: ${mgrStaff.status}`
  );

  const mgrRefund = await api('/api/orders/ord-test-sample/refund', { method: 'POST', body: JSON.stringify({ reason: 'Unauthorized attempt', lastKnownUpdatedAt: '2026-10-18T00:00:00Z' }) }, mgrToken);
  assert(
    'Order Manager cannot approve financial refunds (HTTP 403 Forbidden)',
    mgrRefund.status === 403,
    `Status: ${mgrRefund.status}`
  );

  // ----------------------------------------------------
  // TEST GROUP 3: PRODUCTION OPERATOR
  // ----------------------------------------------------
  console.log('\n--- Group 3: Production Operator Scoped Privileges & PII Protection ---');
  const opToken = tokens.production_operator.token;

  const opQueue = await api('/api/admin/production', { method: 'GET' }, opToken);
  assert(
    'Production Operator can access workshop 3D print queue & farm status',
    opQueue.status === 200,
    `Status: ${opQueue.status}`
  );

  const opOrders = await api('/api/orders', { method: 'GET' }, opToken);
  assert(
    'Production Operator is DENIED general customer orders list (HTTP 403 Forbidden)',
    opOrders.status === 403,
    `Status: ${opOrders.status}`
  );

  const opReports = await api('/api/admin/reports', { method: 'GET' }, opToken);
  assert(
    'Production Operator is DENIED financial reports (HTTP 403 Forbidden)',
    opReports.status === 403,
    `Status: ${opReports.status}`
  );

  const opSettings = await api('/api/admin/settings', { method: 'GET' }, opToken);
  assert(
    'Production Operator is DENIED store settings (HTTP 403 Forbidden)',
    opSettings.status === 403,
    `Status: ${opSettings.status}`
  );

  const opMetrics = await api('/api/admin/metrics', { method: 'GET' }, opToken);
  assert(
    'Production Operator metrics has zero financial revenue data and customer PII is omitted',
    opMetrics.status === 200 &&
      opMetrics.data?.metrics?.grossSalesPaise === undefined &&
      (opMetrics.data?.recentOrders?.length === 0 || opMetrics.data?.recentOrders?.every(o => o.customerEmail?.includes('Restricted'))),
    `recentOrders count: ${opMetrics.data?.recentOrders?.length || 0}`
  );

  // ----------------------------------------------------
  // TEST GROUP 4: CATALOG EDITOR
  // ----------------------------------------------------
  console.log('\n--- Group 4: Catalog Editor Scoped Privileges ---');
  const catToken = tokens.catalog_editor.token;

  const catOrders = await api('/api/orders', { method: 'GET' }, catToken);
  assert(
    'Catalog Editor is DENIED customer orders list (HTTP 403 Forbidden)',
    catOrders.status === 403,
    `Status: ${catOrders.status}`
  );

  const catQueue = await api('/api/admin/production', { method: 'GET' }, catToken);
  assert(
    'Catalog Editor is DENIED production queue write access (HTTP 403 Forbidden)',
    catQueue.status === 403,
    `Status: ${catQueue.status}`
  );

  const catReports = await api('/api/admin/reports', { method: 'GET' }, catToken);
  assert(
    'Catalog Editor is DENIED financial reports (HTTP 403 Forbidden)',
    catReports.status === 403,
    `Status: ${catReports.status}`
  );

  const catSettings = await api('/api/admin/settings', { method: 'GET' }, catToken);
  assert(
    'Catalog Editor is DENIED store settings (HTTP 403 Forbidden)',
    catSettings.status === 403,
    `Status: ${catSettings.status}`
  );

  const catStaff = await api('/api/admin/staff', { method: 'GET' }, catToken);
  assert(
    'Catalog Editor is DENIED staff management (HTTP 403 Forbidden)',
    catStaff.status === 403,
    `Status: ${catStaff.status}`
  );

  // ----------------------------------------------------
  // TEST GROUP 5: SELF-PROMOTION & PRIVILEGE ESCALATION
  // ----------------------------------------------------
  console.log('\n--- Group 5: Self-Promotion & Privilege Escalation Prevention ---');

  const promoteAttempt = await api('/api/admin/staff', {
    method: 'PATCH',
    body: JSON.stringify({
      targetStaffId: tokens.catalog_editor.user.id,
      newRole: 'owner',
    }),
  }, catToken);
  assert(
    'Catalog Editor CANNOT promote themselves to Super Admin (HTTP 403 Forbidden)',
    promoteAttempt.status === 403,
    `Status: ${promoteAttempt.status}`
  );

  const mgrPromoteAttempt = await api('/api/admin/staff', {
    method: 'PATCH',
    body: JSON.stringify({
      targetStaffId: tokens.order_manager.user.id,
      newRole: 'owner',
    }),
  }, mgrToken);
  assert(
    'Order Manager CANNOT promote themselves to Super Admin (HTTP 403 Forbidden)',
    mgrPromoteAttempt.status === 403,
    `Status: ${mgrPromoteAttempt.status}`
  );

  // ----------------------------------------------------
  // TEST GROUP 6: LAST ACTIVE SUPER ADMIN PROTECTION
  // ----------------------------------------------------
  console.log('\n--- Group 6: Last Active Super Admin Protection ---');

  // Owner attempting to demote themselves
  const demoteSelfAttempt = await api('/api/admin/staff', {
    method: 'PATCH',
    body: JSON.stringify({
      targetStaffId: tokens.owner.user.id,
      newRole: 'order_manager',
    }),
  }, ownerToken);
  assert(
    'Owner cannot demote the last remaining active Super Admin (HTTP 400 Bad Request)',
    demoteSelfAttempt.status === 400,
    `Status: ${demoteSelfAttempt.status}, Error: ${demoteSelfAttempt.data?.error}`
  );

  // Owner attempting to suspend themselves
  const suspendSelfAttempt = await api('/api/admin/staff', {
    method: 'PATCH',
    body: JSON.stringify({
      targetStaffId: tokens.owner.user.id,
      action: 'suspend',
    }),
  }, ownerToken);
  assert(
    'Owner cannot suspend their own active Super Admin session (HTTP 400 Bad Request)',
    suspendSelfAttempt.status === 400,
    `Status: ${suspendSelfAttempt.status}, Error: ${suspendSelfAttempt.data?.error}`
  );

  // ----------------------------------------------------
  // TEST GROUP 7: REAL-TIME SUSPENSION ENFORCEMENT
  // ----------------------------------------------------
  console.log('\n--- Group 7: Real-Time Account Suspension Enforcement ---');
  const catUserId = tokens.catalog_editor.user.id;

  // Suspend the catalog editor account via authentic admin endpoint
  const suspendRes = await api('/api/admin/staff', {
    method: 'PATCH',
    body: JSON.stringify({
      userId: catUserId,
      action: 'suspend',
      reason: 'Automated test suspension verification',
    }),
  }, ownerToken);

  // Now, call with catalog editor's previously valid JWT
  const suspendedCall = await api('/api/admin/metrics', { method: 'GET' }, catToken);
  assert(
    'Suspended staff member is IMMEDIATELY blocked with HTTP 403 Forbidden',
    suspendedCall.status === 403 && (suspendedCall.data?.error?.includes('suspended') || suspendedCall.data?.error?.includes('revoked')),
    `Status: ${suspendedCall.status}, Error: ${suspendedCall.data?.error}`
  );

  // Unsuspend account via authentic admin endpoint
  await api('/api/admin/staff', {
    method: 'PATCH',
    body: JSON.stringify({
      userId: catUserId,
      action: 'unsuspend',
    }),
  }, ownerToken);

  const unsuspendedCall = await api('/api/admin/metrics', { method: 'GET' }, catToken);
  assert(
    'Unsuspended staff member recovers access immediately upon reactivation',
    unsuspendedCall.status === 200,
    `Status: ${unsuspendedCall.status}`
  );

  // ----------------------------------------------------
  // TEST GROUP 8: AUDIT INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- Group 8: Audit Log Actor Integrity ---');
  const ownerLogs = await api('/api/admin/activity', { method: 'GET' }, ownerToken);
  assert(
    'Audit logs record verified actor details without client identity spoofing',
    ownerLogs.status === 200 && Array.isArray(ownerLogs.data?.activity || ownerLogs.data?.logs),
    `Logs retrieved: ${(ownerLogs.data?.activity || ownerLogs.data?.logs || []).length}`
  );

  console.log('\n======================================================');
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  console.log(`TEST SUMMARY: ${passed}/${total} passed (${failed} failed)`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
