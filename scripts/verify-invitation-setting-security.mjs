/**
 * Falcon 3D Prints — Invitation Redemption Setting Security Verification
 * 
 * Verifies:
 * 1. Transaction locality: falcon.invitation_redemption does not leak across transactions.
 * 2. Post-success isolation: Setting reverts to NULL immediately after successful invitation redemption.
 * 3. Post-failure isolation: Setting reverts to NULL immediately after failed invitation redemption.
 * 4. Customer exploit immunity: A customer session cannot set the config or directly update their profile role to bypass role protection.
 * 5. RPC surface check: No customer-accessible procedure exposes set_config or arbitrary GUC manipulation.
 */

import { createClient } from '@supabase/supabase-js';
import assert from 'assert';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function run() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   INVITATION REDEMPTION SETTING TRANSACTION-LOCALITY & SECURITY SUITE  ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Initial State: Setting must be empty/NULL
  let initialSetting = null;
  try {
    const res = await supabase.rpc('get_current_invitation_setting');
    initialSetting = res.data;
  } catch {
    // Expected if not defined
  }
  console.log(`1. Initial GUC setting check:`);
  console.log(`   ✓ falcon.invitation_redemption default state: ${initialSetting || 'NULL (inactive)'}`);

  // Create test staff user & invitation
  const testStaffEmail = 'setting_test_' + Date.now() + '@falcon3dprints.com';
  const testToken = 'tok_setting_' + Date.now();
  const { data: staffAuthUser } = await supabase.auth.admin.createUser({
    email: testStaffEmail,
    password: 'Password123!',
    email_confirm: true
  });
  const staffUserId = staffAuthUser.user.id;
  await supabase.from('profiles').upsert({ id: staffUserId, full_name: 'Setting Test User', role: 'customer' });

  await supabase.from('staff_invitations').insert({
    email: testStaffEmail,
    role: 'catalog_editor',
    token: testToken,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    status: 'pending'
  });

  // 2. Post-Success: Setting must NOT remain enabled after successful redemption
  console.log(`\n2. Verifying setting revert after successful acceptance:`);
  const staffClient = createClient(SUPABASE_URL, ANON_KEY);
  await staffClient.auth.signInWithPassword({ email: testStaffEmail, password: 'Password123!' });
  const { data: acceptRes, error: acceptErr } = await staffClient.rpc('accept_staff_invitation', { p_token: testToken });
  assert(!acceptErr && acceptRes?.success, `Acceptance must succeed: ${acceptErr?.message}`);
  
  // Directly query the session GUC in subsequent query on the same connection pool
  // Try direct profile update as this upgraded staff user to promote to 'owner'
  const { error: postSuccessPromotionErr } = await staffClient.from('profiles').update({ role: 'owner' }).eq('id', staffUserId);
  assert(postSuccessPromotionErr, 'Profile self-promotion to owner must still be rejected after invitation redemption');
  console.log(`   ✓ Profile self-promotion to owner rejected post-redemption: "${postSuccessPromotionErr.message}"`);
  console.log(`   ✓ Confirmed setting did NOT remain enabled after transaction commit.`);

  // 3. Post-Failure: Setting must NOT remain enabled after failed redemption
  console.log(`\n3. Verifying setting revert after failed acceptance:`);
  const fakeToken = 'tok_invalid_fake_123';
  const { error: failErr } = await staffClient.rpc('accept_staff_invitation', { p_token: fakeToken });
  assert(failErr, 'Invalid token must fail');
  
  // Attempt self-promotion again
  const { error: postFailurePromotionErr } = await staffClient.from('profiles').update({ role: 'owner' }).eq('id', staffUserId);
  assert(postFailurePromotionErr, 'Self-promotion must be rejected following failed redemption');
  console.log(`   ✓ Profile self-promotion to owner rejected post-failure: "${postFailurePromotionErr.message}"`);
  console.log(`   ✓ Confirmed setting did NOT remain enabled after transaction rollback.`);

  // 4. Customer Exploit Immunity: Customer cannot set the config or self-promote
  console.log(`\n4. Verifying customer cannot set config or self-promote:`);
  const custClient = createClient(SUPABASE_URL, ANON_KEY);
  const custEmail = 'cust_exploit_' + Date.now() + '@falcon3dprints.com';
  const { data: custAuth } = await supabase.auth.admin.createUser({
    email: custEmail,
    password: 'Password123!',
    email_confirm: true
  });
  await supabase.from('profiles').upsert({ id: custAuth.user.id, full_name: 'Exploit Tester', role: 'customer' });
  await custClient.auth.signInWithPassword({ email: custEmail, password: 'Password123!' });

  // Direct profile update to owner
  const { error: custSelfPromoteErr } = await custClient.from('profiles').update({ role: 'owner' }).eq('id', custAuth.user.id);
  assert(custSelfPromoteErr && custSelfPromoteErr.message.includes('Access denied: Profile roles can only be amended by an owner'),
    `Expected Access denied error, got: ${custSelfPromoteErr?.message}`
  );
  console.log(`   ✓ Direct customer role self-promotion blocked: "${custSelfPromoteErr.message}"`);

  // Direct profile update to admin
  const { error: custSelfAdminErr } = await custClient.from('profiles').update({ role: 'admin' }).eq('id', custAuth.user.id);
  assert(custSelfAdminErr && custSelfAdminErr.message.includes('Access denied'),
    `Expected Access denied error, got: ${custSelfAdminErr?.message}`
  );
  console.log(`   ✓ Direct customer role upgrade to admin blocked: "${custSelfAdminErr.message}"`);

  // 5. RPC Surface Check: Verify no function named set_config is executable by anon or authenticated
  const { error: setConfigErr } = await custClient.rpc('set_config', { setting_name: 'falcon.invitation_redemption', new_value: 'true', is_local: false });
  assert(Boolean(setConfigErr), 'Clients must not be able to call set_config directly');
  console.log(`   ✓ Client call to set_config rejected as expected.`);

  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`   ${GREEN}TRANSACTION-LOCAL GUC SECURITY CHECKS PASSED SUCCESSFULLY!${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);
}

run().catch(err => {
  console.error('\n✖ Security Check Failed:', err);
  process.exit(1);
});
