import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_ACCOUNTS = [
  {
    email: 'test.owner@falcon3dprints.local',
    password: 'FalconPass2026!',
    fullName: 'Test Studio Owner',
    role: 'owner',
  },
  {
    email: 'test.ordermanager@falcon3dprints.local',
    password: 'FalconPass2026!',
    fullName: 'Test Order Manager',
    role: 'order_manager',
  },
  {
    email: 'test.operator@falcon3dprints.local',
    password: 'FalconPass2026!',
    fullName: 'Test Production Operator',
    role: 'production_operator',
  },
  {
    email: 'test.catalog@falcon3dprints.local',
    password: 'FalconPass2026!',
    fullName: 'Test Catalog Editor',
    role: 'catalog_editor',
  },
];

async function setup() {
  console.log('Ensuring 4 isolated test accounts exist in Supabase...');

  for (const acc of TEST_ACCOUNTS) {
    // 1. Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    let existingUser = listData?.users?.find(u => u.email === acc.email);

    if (!existingUser) {
      console.log(`Creating user ${acc.email}...`);
      const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, role: acc.role },
      });

      if (createErr) {
        console.error(`Failed to create ${acc.email}:`, createErr.message);
        continue;
      }
      existingUser = createData.user;
    } else {
      console.log(`User ${acc.email} already exists (${existingUser.id}). Updating password & metadata...`);
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, role: acc.role },
      });
    }

    if (existingUser) {
      // 2. Ensure profile exists and has the correct role
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();

      if (!profile) {
        console.log(`Inserting profile for ${acc.email} with role ${acc.role}...`);
        const { error: insErr } = await supabase.from('profiles').insert({
          id: existingUser.id,
          full_name: acc.fullName,
          role: acc.role,
        });
        if (insErr) console.error(`Error inserting profile:`, insErr.message);
      } else if (profile.role !== acc.role) {
        console.log(`Updating profile for ${acc.email} from ${profile.role} to ${acc.role}...`);
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ role: acc.role, full_name: acc.fullName })
          .eq('id', existingUser.id);
        if (updErr) console.error(`Error updating profile:`, updErr.message);
      } else {
        console.log(`Profile for ${acc.email} already set to ${acc.role}.`);
      }
    }
  }

  console.log('\nVerification of all 4 test accounts:');
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
  profiles?.forEach(p => console.log(`  - ${p.full_name}: role=${p.role} (id=${p.id})`));
}

setup();
