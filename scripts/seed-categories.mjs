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

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

const STANDARD_CATEGORIES = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Planters & Decor',
    slug: 'planters-and-decor',
    description: 'Contemporary parametric planters, origami vases, and ambient home decor.',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Miniatures & Collectibles',
    slug: 'miniatures-and-collectibles',
    description: 'Precision resin miniatures, fantasy figurines, and articulated models.',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Desk Accessories',
    slug: 'desk-accessories',
    description: 'Ergonomic headphone holders, modular pen stands, and mechanical keyboard trays.',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    name: 'Architectural Models',
    slug: 'architectural-models',
    description: 'Scale architectural dioramas, monuments, and urban study models.',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    name: 'Kitchen Miniatures',
    slug: 'kitchen-miniatures',
    description: 'Specialty cookie cutters, measuring gadgets, and custom organizational clips.',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    name: 'Scale Models',
    slug: 'scale-models',
    description: 'High-fidelity scale models, automotive replicas, and collectible miniatures.',
    sort_order: 6,
    is_active: true,
  },
];

async function seedCategories() {
  console.log('Seeding standard categories into Supabase...');

  for (const cat of STANDARD_CATEGORIES) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(cat, { onConflict: 'slug' })
      .select();
    if (error) {
      console.error(`Error upserting ${cat.name}:`, error);
    } else {
      console.log(`✓ Category: ${cat.name} (${cat.slug})`);
    }
  }

  // Update product category_id associations
  const updates = [
    { id: 'a1111111-1111-1111-1111-111111111111', category_id: 'c1111111-1111-1111-1111-111111111111' }, // Planters
    { id: 'a2222222-2222-2222-2222-222222222222', category_id: 'c2222222-2222-2222-2222-222222222222' }, // Collectibles
    { id: 'a3333333-3333-3333-3333-333333333333', category_id: 'c3333333-3333-3333-3333-333333333333' }, // Desk
    { id: '982053be-ce2c-47f4-88d9-29de0a4ea8f4', category_id: 'c3333333-3333-3333-3333-333333333333' }, // HexDesk
  ];

  for (const u of updates) {
    const { error } = await supabase.from('products').update({ category_id: u.category_id }).eq('id', u.id);
    if (error) console.error(`Error updating product ${u.id}:`, error);
    else console.log(`✓ Linked product ${u.id} to category ${u.category_id}`);
  }

  console.log('Categories and product mappings updated successfully.');
}

seedCategories();
