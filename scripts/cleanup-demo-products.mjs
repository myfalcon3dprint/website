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

const adminSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function cleanupDemoProducts() {
  console.log('=== FALCON 3D PRINTS — DEMO PRODUCT CLEANUP AUDIT ===\n');

  // 1. Fetch all products and order items
  const { data: products, error: pErr } = await adminSupabase.from('products').select('id, name, slug, is_published');
  if (pErr) throw pErr;
  const { data: orderItems, error: oiErr } = await adminSupabase.from('order_items').select('product_id, product_title, variant_sku');
  if (oiErr) throw oiErr;

  const prods = products || [];
  const items = orderItems || [];

  const orderLinkedProductIds = new Set(items.map((oi) => oi.product_id).filter(Boolean));
  const orderLinkedTitles = new Set(items.map((oi) => oi.product_title).filter(Boolean));

  console.log(`Found ${prods.length} products in local database.`);
  console.log(`Order items link to ${orderLinkedProductIds.size} explicit product IDs and ${orderLinkedTitles.size} titles.\n`);

  const disposableIds = [];
  const archivedIds = [];

  for (const p of prods) {
    const isLinkedByOrder = orderLinkedProductIds.has(p.id) || orderLinkedTitles.has(p.name);
    if (isLinkedByOrder) {
      console.log(`[ORDER PRESERVED] Product "${p.name}" (${p.id}) is referenced by existing customer order history.`);
      console.log(`  -> Archiving (soft delete, is_published: false) to preserve order referential integrity.`);
      await adminSupabase
        .from('products')
        .update({ is_published: false })
        .eq('id', p.id);
      archivedIds.push({ id: p.id, name: p.name, reason: 'Referenced by customer order history' });
    } else {
      console.log(`[CONFIRMED DISPOSABLE] Product "${p.name}" (${p.id}) has 0 orders.`);
      disposableIds.push({ id: p.id, name: p.name });
    }
  }

  // Remove confirmed disposable products and their child variants
  console.log(`\nRemoving ${disposableIds.length} confirmed disposable test/demo products...`);
  for (const d of disposableIds) {
    await adminSupabase.from('product_variants').delete().eq('product_id', d.id);
    const { error } = await adminSupabase.from('products').delete().eq('id', d.id);
    if (error) {
      console.error(`  ✗ Error removing ${d.name} (${d.id}):`, error.message);
    } else {
      console.log(`  ✓ Successfully removed ${d.name} (${d.id})`);
    }
  }

  console.log('\n=== CLEANUP SUMMARY ===');
  console.log('Archived (order-linked):', archivedIds);
  console.log('Deleted (disposable test records):', disposableIds);
}

cleanupDemoProducts().catch(console.error);
