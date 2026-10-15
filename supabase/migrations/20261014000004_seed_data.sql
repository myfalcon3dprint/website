-- Falcon 3D Prints — Seed Data
-- Migration: 20261014000004_seed_data.sql
-- Seeds categories, core products, variants, quotes, and printer farm queue.

-- 1. Categories
INSERT INTO public.categories (id, name, slug, description, sort_order) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Planters & Decor', 'planters-and-decor', 'Contemporary parametric planters, origami vases, and ambient home decor.', 1),
    ('c2222222-2222-2222-2222-222222222222', 'Miniatures & Collectibles', 'miniatures-and-collectibles', 'Precision resin miniatures, fantasy figurines, and articulated models.', 2),
    ('c3333333-3333-3333-3333-333333333333', 'Desk Accessories', 'desk-accessories', 'Ergonomic headphone holders, modular pen stands, and mechanical keyboard trays.', 3),
    ('c4444444-4444-4444-4444-444444444444', 'Architectural Models', 'architectural-models', 'Scale architectural dioramas, monuments, and urban study models.', 4),
    ('c5555555-5555-5555-5555-555555555555', 'Kitchen Miniatures', 'kitchen-miniatures', 'Specialty cookie cutters, measuring gadgets, and custom organizational clips.', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Products
INSERT INTO public.products (
    id, name, slug, description, short_description, category_id,
    material, dimensions, weight_grams, base_price_paise, availability,
    care_info, lead_time_days, is_published, specs, images, features, rating, review_count
) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'Falcon Geometric Origami Planter',
    'falcon-heavy-geometric-planter',
    'Precision-crafted geometric planter engineered with micro-drainage channels to prevent root rot. Printed with eco-friendly biodegradable PLA, creating a tactile matte faceted exterior that captures shifting daylight on your desk or windowsill.',
    'Low-poly architectural succulent planter with integrated drainage tray',
    'c1111111-1111-1111-1111-111111111111',
    'PLA',
    '120mm x 120mm x 100mm',
    145,
    49900,
    'in_stock',
    'Wipe with a damp cloth. Do not expose to temperatures above 55°C.',
    0,
    true,
    '{"printTechnology": "FDM", "layerHeightMm": 0.16, "infillPercentage": 25, "foodSafe": false, "heatResistanceC": 55}'::jsonb,
    ARRAY['/products/planter-obsidian-black.jpg', '/products/planter-orange-variant.jpg'],
    ARRAY['Self-centering matching drainage saucer included', 'High-infill honeycomb base for center-of-gravity stability', 'Matte micro-textured finish eliminates layer reflection', 'Custom color blends crafted in Nashik workshop'],
    4.9,
    38
),
(
    'a2222222-2222-2222-2222-222222222222',
    'Cyber Gryphon Articulated Figure',
    'mecha-gryphon-articulated-figurine',
    'A masterpiece of print-in-place engineering. Featuring 18 interlocking articulation points with zero assembly required right off the build plate. Wings expand to a 26cm span with mechanical feathers inspired by predatory falcons.',
    'Print-in-place multi-jointed fantasy collectible with ball-socket wings',
    'c2222222-2222-2222-2222-222222222222',
    'PETG',
    '180mm x 260mm x 95mm',
    210,
    89900,
    'made_to_order',
    'Do not force articulation joints past their designed mechanical stop.',
    3,
    true,
    '{"printTechnology": "FDM", "layerHeightMm": 0.12, "infillPercentage": 35, "foodSafe": false, "heatResistanceC": 70}'::jsonb,
    ARRAY['/products/figurine-mecha-gryphon.jpg'],
    ARRAY['Print-in-place dual-axis wing hinges', 'Articulated talons, head swivel, and spinal joints', 'High-impact PETG core prevents stress fractures', 'Balanced standing stance without external base support'],
    5.0,
    19
),
(
    'a3333333-3333-3333-3333-333333333333',
    'AeroStand Ergonomic Headphone Rest',
    'aerostand-minimalist-headphone-cradle',
    'Architectural desktop headphone mount designed to cradle curved headbands without denting leather padding. Features internal acoustic baffle chambers to reduce resonant desk hum from mechanical typing.',
    'Weighted desktop headphone arch with integrated braided cable spool',
    'c3333333-3333-3333-3333-333333333333',
    'PETG',
    '110mm x 140mm x 245mm',
    340,
    74900,
    'in_stock',
    'Clean with microfiber cloth.',
    0,
    true,
    '{"printTechnology": "FDM", "layerHeightMm": 0.20, "infillPercentage": 30, "foodSafe": false, "heatResistanceC": 70}'::jsonb,
    ARRAY['/products/stand-matte-white.jpg'],
    ARRAY['Broad 60mm silicone-lined headband contact cradle', 'Integrated rear channel for headphone cable management', 'Anti-slip rubber feet pre-installed', 'Tested to support studio monitors up to 850 grams'],
    4.8,
    42
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Product Variants
INSERT INTO public.product_variants (
    id, product_id, sku, title, material, color, finish,
    price_adjustment_paise, stock_quantity, lead_time_days, dimensions, weight_grams, image
) VALUES
(
    'b1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'FAL-PLT-GEO-BLK-M',
    'Medium (12cm) - Matte Obsidian Black',
    'PLA',
    'Obsidian Black',
    'Raw (Layered)',
    0,
    14,
    0,
    '{"lengthMm": 120, "widthMm": 120, "heightMm": 100}'::jsonb,
    145,
    '/products/planter-obsidian-black.jpg'
),
(
    'b1111111-1111-1111-1111-111111111112',
    'a1111111-1111-1111-1111-111111111111',
    'FAL-PLT-GEO-ORG-M',
    'Medium (12cm) - Falcon Signature Orange',
    'PLA',
    'Falcon Orange',
    'Raw (Layered)',
    5000,
    8,
    0,
    '{"lengthMm": 120, "widthMm": 120, "heightMm": 100}'::jsonb,
    145,
    '/products/planter-orange-variant.jpg'
),
(
    'b2222222-2222-2222-2222-222222222221',
    'a2222222-2222-2222-2222-222222222222',
    'FAL-FIG-GRY-TIT-STD',
    'Standard (18cm wingspan) - Titanium Gray PETG',
    'PETG',
    'Titanium Gray',
    'Raw (Layered)',
    0,
    0,
    3,
    '{"lengthMm": 180, "widthMm": 260, "heightMm": 95}'::jsonb,
    210,
    '/products/figurine-mecha-gryphon.jpg'
)
ON CONFLICT (sku) DO NOTHING;

-- 4. Print Farm Machines
INSERT INTO public.print_queue (
    id, printer_name, technology, status, current_job_name,
    material, progress_percent, hotend_temp_c, bed_temp_c, remaining_minutes
) VALUES
('unit-01', 'Bambu Lab X1C #01', 'FDM', 'printing', 'Artisan Mechanical Keyboard Stand', 'Matte Charcoal PLA', 76, 220, 60, 42),
('unit-02', 'Prusa MK4 #01', 'FDM', 'printing', 'Parametric Hexagonal Desk Planter', 'PETG Stone Gray', 47, 240, 85, 115),
('unit-03', 'Elegoo Saturn 4 Ultra', 'SLA Resin', 'idle', NULL, NULL, 0, 25, 30, 0),
('unit-04', 'Bambu Lab P1S #02', 'FDM', 'maintenance', NULL, NULL, 0, 24, 25, 0)
ON CONFLICT (id) DO UPDATE SET
    printer_name = EXCLUDED.printer_name,
    status = EXCLUDED.status,
    progress_percent = EXCLUDED.progress_percent,
    hotend_temp_c = EXCLUDED.hotend_temp_c,
    bed_temp_c = EXCLUDED.bed_temp_c,
    remaining_minutes = EXCLUDED.remaining_minutes;

-- 5. Seed Quotes
INSERT INTO public.quotes (
    id, reference_number, full_name, email, phone,
    file_name, file_size_bytes, material_preference, color_preference,
    infill_percentage, quantity, customer_notes, status, quoted_price_paise, estimated_lead_days, admin_notes
) VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    'RFQ-FAL-2026-081',
    'Rajesh Sharma',
    'rajesh.sharma@archstudio.in',
    '+91 94222 55667',
    'Villa_Floorplan_Scale_Model.stl',
    24500000,
    'PLA',
    'Architectural Warm White',
    15,
    2,
    'Need this for client architectural presentation on Friday. High detail facade essential.',
    'quoted',
    290000,
    3,
    'Slice simulation: 18h print time per unit. Good bed adhesion expected.'
),
(
    'd2222222-2222-2222-2222-222222222222',
    'RFQ-FAL-2026-082',
    'Dr. Sneha Patil',
    'sneha.patil@nashikdental.com',
    '+91 98230 88990',
    'Orthodontic_Study_Jaw.3mf',
    12100000,
    'Resin',
    'Dental Grey',
    100,
    1,
    'Dental teaching anatomy model. High dimensional accuracy required.',
    'under_review',
    NULL,
    NULL,
    NULL
)
ON CONFLICT (reference_number) DO NOTHING;
