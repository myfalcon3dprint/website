/**
 * Falcon 3D Prints — Catalog Content Restoration Script
 * Restores original verified product descriptions and images from seed data:
 * supabase/migrations/20261014000004_seed_data.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function restoreCatalog() {
  console.log('Restoring catalog content from verified seed data...');

  // 1. Restore Falcon Geometric Origami Planter
  const { data: p1, error: err1 } = await supabase
    .from('products')
    .update({
      short_description: 'Low-poly architectural succulent planter with integrated drainage tray',
      images: ['/products/planter-obsidian-black.jpg', '/products/planter-orange-variant.jpg'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'a1111111-1111-1111-1111-111111111111')
    .select('id, name, short_description, images');

  if (err1) {
    console.error('Failed to restore Planter:', err1);
  } else {
    console.log('✓ Restored Planter:', p1);
  }

  // 2. Restore Cyber Gryphon Articulated Figure
  const { data: p2, error: err2 } = await supabase
    .from('products')
    .update({
      description: 'A masterpiece of print-in-place engineering. Featuring 18 interlocking articulation points with zero assembly required right off the build plate. Wings expand to a 26cm span with mechanical feathers inspired by predatory falcons.',
      short_description: 'Print-in-place multi-jointed fantasy collectible with ball-socket wings',
      images: ['/products/figurine-mecha-gryphon.jpg', '/products/cyber-gryphon-figure.jpg'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'a2222222-2222-2222-2222-222222222222')
    .select('id, name, description, images');

  if (err2) {
    console.error('Failed to restore Cyber Gryphon:', err2);
  } else {
    console.log('✓ Restored Cyber Gryphon:', p2);
  }

  // 3. Restore AeroStand Ergonomic Headphone Rest
  const { data: p3, error: err3 } = await supabase
    .from('products')
    .update({
      short_description: 'Weighted desktop headphone arch with integrated braided cable spool',
      images: ['/products/stand-matte-white.jpg', '/products/headphone-desk-hanger.jpg'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'a3333333-3333-3333-3333-333333333333')
    .select('id, name, short_description, images');

  if (err3) {
    console.error('Failed to restore AeroStand:', err3);
  } else {
    console.log('✓ Restored AeroStand:', p3);
  }

  // 4. Also update variant images if needed
  await supabase
    .from('product_variants')
    .update({ image: '/products/cyber-gryphon-figure.jpg' })
    .eq('sku', 'FAL-FIG-GRY-TIT-STD');

  // Ensure AeroStand has a valid product variant
  await supabase
    .from('product_variants')
    .upsert({
      id: 'b3333333-3333-3333-3333-333333333331',
      product_id: 'a3333333-3333-3333-3333-333333333333',
      sku: 'FAL-DSK-AERO-BLK',
      title: 'Standard Arch - Matte Stealth Black',
      material: 'PETG',
      color: 'Stealth Black',
      finish: 'Raw (Layered)',
      price_adjustment_paise: 0,
      stock_quantity: 12,
      lead_time_days: 0,
      image: '/products/stand-matte-white.jpg',
    }, { onConflict: 'sku' });

  // 5. Restore Falcon HexDesk Organizer to use hexagrid image instead of planter
  const { data: p4, error: err4 } = await supabase
    .from('products')
    .update({
      images: ['/products/hexagrid-desk-organizer.jpg'],
      updated_at: new Date().toISOString(),
    })
    .eq('slug', 'falcon-hexdesk-organizer')
    .select('id, name, images');

  if (err4) {
    console.error('Failed to restore HexDesk Organizer:', err4);
  } else {
    console.log('✓ Restored HexDesk Organizer:', p4);
  }

  console.log('Restoration complete.');
}

restoreCatalog().catch(console.error);
