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

const supabaseAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testLogin() {
  const accounts = [
    { email: 'test.owner@falcon3dprints.local', role: 'owner' },
    { email: 'test.ordermanager@falcon3dprints.local', role: 'order_manager' },
    { email: 'test.operator@falcon3dprints.local', role: 'production_operator' },
    { email: 'test.catalog@falcon3dprints.local', role: 'catalog_editor' },
  ];

  for (const acc of accounts) {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: acc.email,
      password: 'FalconPass2026!',
    });

    if (error) {
      console.error(`Login failed for ${acc.email}:`, error.message);
    } else {
      console.log(`✓ Login success for ${acc.email} (${acc.role}): userId=${data.user.id}, token=${data.session.access_token.slice(0, 20)}...`);
    }
  }
}

testLogin();
