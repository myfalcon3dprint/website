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

const adminSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkInventory() {
  const { data: dbProducts } = await adminSupabase
    .from('products')
    .select('id, name, slug, is_published, created_at, category_id, categories(name)');

  const { data: orderItems, error: oiErr } = await adminSupabase
    .from('order_items')
    .select('*');

  if (oiErr) console.error('Order items error:', oiErr);

  const { data: orders } = await adminSupabase
    .from('orders')
    .select('id, order_number, customer_name, status, total_paise');

  console.log('=== DATABASE PRODUCTS ===');
  console.log(JSON.stringify(dbProducts, null, 2));

  console.log('\n=== ORDER ITEMS LINKAGES ===');
  console.log(JSON.stringify(orderItems, null, 2));

  console.log('\n=== ORDERS ===');
  console.log(JSON.stringify(orders, null, 2));
}

checkInventory();
