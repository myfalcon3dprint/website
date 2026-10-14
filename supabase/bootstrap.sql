-- ==============================================================================
-- Falcon 3D Prints — Consolidated Supabase Bootstrap Script
-- Run this script in the Supabase SQL Editor to set up:
--   1. Schema (Tables, triggers, auto-user profile handler, indexes)
--   2. Row Level Security (RLS) policies for customers and staff
--   3. Storage Buckets (cad-models, product-images) and storage policies
--   4. Seed Catalog & Printer Queue Data
-- ==============================================================================

-- ----------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------
-- 2. SCHEMAS & TABLES
-- ----------------------------------------------------

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'order_manager', 'production_operator', 'support', 'catalog_editor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    material TEXT,
    dimensions TEXT,
    weight_grams INT,
    base_price_paise INT NOT NULL CHECK (base_price_paise > 0),
    availability TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability IN ('in_stock', 'made_to_order', 'out_of_stock')),
    care_info TEXT,
    lead_time_days INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    images TEXT[] NOT NULL DEFAULT '{}'::text[],
    features TEXT[] NOT NULL DEFAULT '{}'::text[],
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    review_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    variant_type TEXT,
    variant_value TEXT,
    material TEXT NOT NULL,
    color TEXT NOT NULL,
    finish TEXT NOT NULL,
    price_adjustment_paise INT NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    lead_time_days INT NOT NULL DEFAULT 0,
    dimensions JSONB,
    weight_grams INT,
    image TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    subtotal_paise INT NOT NULL CHECK (subtotal_paise >= 0),
    shipping_paise INT NOT NULL CHECK (shipping_paise >= 0),
    tax_paise INT NOT NULL CHECK (tax_paise >= 0),
    total_paise INT NOT NULL CHECK (total_paise > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (
        status IN ('pending', 'confirmed', 'queued', 'printing', 'finishing', 'quality_check', 'reprint_required', 'ready', 'packed', 'shipped', 'delivered', 'cancelled')
    ),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'captured', 'failed', 'refunded')),
    payment_method TEXT NOT NULL DEFAULT 'Razorpay UPI/Card',
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    tracking_number TEXT,
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_orders_updated ON public.orders;
CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    variant_sku TEXT NOT NULL,
    variant_details TEXT,
    product_snapshot JSONB,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_paise INT NOT NULL CHECK (unit_price_paise >= 0),
    total_paise INT NOT NULL CHECK (total_paise >= 0),
    stock_type TEXT NOT NULL DEFAULT 'ready_stock' CHECK (stock_type IN ('ready_stock', 'made_to_order')),
    production_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (
        production_status IN ('not_applicable', 'queued', 'printing', 'finishing', 'quality_check', 'qc_failed', 'ready', 'packed', 'shipped')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_order_items_updated ON public.order_items;
CREATE TRIGGER on_order_items_updated
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Custom Quotes / Enquiries
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    storage_path TEXT,
    dimensions_mm JSONB NOT NULL DEFAULT '{"x":100,"y":100,"z":80}'::jsonb,
    material_preference TEXT NOT NULL DEFAULT 'PLA',
    color_preference TEXT NOT NULL DEFAULT 'Standard Studio Grey/Black',
    infill_percentage INT NOT NULL DEFAULT 20 CHECK (infill_percentage BETWEEN 5 AND 100),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    customer_notes TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'quoted', 'approved', 'rejected')),
    quoted_price_paise INT CHECK (quoted_price_paise IS NULL OR quoted_price_paise >= 0),
    estimated_lead_days INT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_quotes_updated ON public.quotes;
CREATE TRIGGER on_quotes_updated
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Print Queue Farm
CREATE TABLE IF NOT EXISTS public.print_queue (
    id TEXT PRIMARY KEY,
    printer_name TEXT NOT NULL,
    technology TEXT NOT NULL DEFAULT 'FDM',
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('printing', 'idle', 'maintenance', 'calibrating')),
    current_job_name TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    material TEXT,
    progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    hotend_temp_c INT NOT NULL DEFAULT 0,
    bed_temp_c INT NOT NULL DEFAULT 0,
    remaining_minutes INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_print_queue_updated ON public.print_queue;
CREATE TRIGGER on_print_queue_updated
    BEFORE UPDATE ON public.print_queue
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Stock Reservations
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'expired', 'released')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_ref ON public.quotes(reference_number);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON public.quotes(user_id);

-- ----------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('owner', 'order_manager', 'production_operator', 'support', 'catalog_editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_staff());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can manage all profiles" ON public.profiles;
CREATE POLICY "Staff can manage all profiles" ON public.profiles FOR ALL USING (public.is_staff());

-- Categories Policies
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = true OR public.is_staff());

DROP POLICY IF EXISTS "Staff manage categories" ON public.categories;
CREATE POLICY "Staff manage categories" ON public.categories FOR ALL USING (public.is_staff());

-- Products Policies
DROP POLICY IF EXISTS "Public read published products" ON public.products;
CREATE POLICY "Public read published products" ON public.products FOR SELECT USING (is_published = true OR public.is_staff());

DROP POLICY IF EXISTS "Staff manage products" ON public.products;
CREATE POLICY "Staff manage products" ON public.products FOR ALL USING (public.is_staff());

-- Variants Policies
DROP POLICY IF EXISTS "Public read active variants" ON public.product_variants;
CREATE POLICY "Public read active variants" ON public.product_variants FOR SELECT USING (is_active = true OR public.is_staff());

DROP POLICY IF EXISTS "Staff manage variants" ON public.product_variants;
CREATE POLICY "Staff manage variants" ON public.product_variants FOR ALL USING (public.is_staff());

-- Orders Policies
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Staff manage orders" ON public.orders;
CREATE POLICY "Staff manage orders" ON public.orders FOR UPDATE USING (public.is_staff());

-- Order Items Policies
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_staff()))
);

DROP POLICY IF EXISTS "Insert order items" ON public.order_items;
CREATE POLICY "Insert order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id)
);

DROP POLICY IF EXISTS "Staff manage order items" ON public.order_items;
CREATE POLICY "Staff manage order items" ON public.order_items FOR ALL USING (public.is_staff());

-- Quotes Policies
DROP POLICY IF EXISTS "Anyone can insert quotes" ON public.quotes;
CREATE POLICY "Anyone can insert quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users read own quotes" ON public.quotes;
CREATE POLICY "Users read own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

DROP POLICY IF EXISTS "Staff manage quotes" ON public.quotes;
CREATE POLICY "Staff manage quotes" ON public.quotes FOR UPDATE USING (public.is_staff());

-- Print Queue Policies
DROP POLICY IF EXISTS "Public read print queue" ON public.print_queue;
CREATE POLICY "Public read print queue" ON public.print_queue FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage print queue" ON public.print_queue;
CREATE POLICY "Staff manage print queue" ON public.print_queue FOR ALL USING (public.is_staff());

-- ----------------------------------------------------
-- 4. STORAGE BUCKETS & POLICIES
-- ----------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cad-models',
    'cad-models',
    false,
    52428800,
    ARRAY['application/octet-stream', 'application/sla', 'model/stl', 'model/obj', 'application/vnd.ms-pki.stl', 'application/step', 'application/x-step', 'model/step', 'model/3mf', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

DROP POLICY IF EXISTS "Allow public upload to cad-models" ON storage.objects;
CREATE POLICY "Allow public upload to cad-models" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cad-models');

DROP POLICY IF EXISTS "Allow staff to read cad-models" ON storage.objects;
CREATE POLICY "Allow staff to read cad-models" ON storage.objects FOR SELECT USING (bucket_id = 'cad-models' AND (public.is_staff() OR auth.uid() = owner));

DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Staff manage product-images" ON storage.objects;
CREATE POLICY "Staff manage product-images" ON storage.objects FOR ALL USING (bucket_id = 'product-images' AND public.is_staff());

-- ----------------------------------------------------
-- 5. SEED DATA
-- ----------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, sort_order) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Planters & Decor', 'planters-and-decor', 'Contemporary parametric planters, origami vases, and ambient home decor.', 1),
    ('c2222222-2222-2222-2222-222222222222', 'Miniatures & Collectibles', 'miniatures-and-collectibles', 'Precision resin miniatures, fantasy figurines, and articulated models.', 2),
    ('c3333333-3333-3333-3333-333333333333', 'Desk Accessories', 'desk-accessories', 'Ergonomic headphone holders, modular pen stands, and mechanical keyboard trays.', 3),
    ('c4444444-4444-4444-4444-444444444444', 'Architectural Models', 'architectural-models', 'Scale architectural dioramas, monuments, and urban study models.', 4),
    ('c5555555-5555-5555-5555-555555555555', 'Kitchen Miniatures', 'kitchen-miniatures', 'Specialty cookie cutters, measuring gadgets, and custom organizational clips.', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
    id, name, slug, description, short_description, category_id,
    material, dimensions, weight_grams, base_price_paise, availability,
    care_info, lead_time_days, is_published, specs, images, features, rating, review_count
) VALUES
(
    'p1111111-1111-1111-1111-111111111111',
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
    'p2222222-2222-2222-2222-222222222222',
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
    'p3333333-3333-3333-3333-333333333333',
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

INSERT INTO public.product_variants (
    id, product_id, sku, title, material, color, finish,
    price_adjustment_paise, stock_quantity, lead_time_days, dimensions, weight_grams, image
) VALUES
(
    'v1111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111',
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
    'v1111111-1111-1111-1111-111111111112',
    'p1111111-1111-1111-1111-111111111111',
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
    'v2222222-2222-2222-2222-222222222221',
    'p2222222-2222-2222-2222-222222222222',
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
