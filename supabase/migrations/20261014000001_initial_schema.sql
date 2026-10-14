-- Falcon 3D Prints — Initial Database Schema
-- Migration: 20261014000001_initial_schema.sql
-- Compatible with PostgreSQL 15+ and Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'order_manager', 'production_operator', 'support', 'catalog_editor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Auto-create profile on auth.users insert
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

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Categories
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

-- 3. Products
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

CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Product Variants
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

-- 5. Orders
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

CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Order Items
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

CREATE TRIGGER on_order_items_updated
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Custom Quotes / Enquiries
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

CREATE TRIGGER on_quotes_updated
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Print Queue Farm
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

CREATE TRIGGER on_print_queue_updated
    BEFORE UPDATE ON public.print_queue
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 9. Stock Reservations (Temporary checkout holds)
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
CREATE INDEX IF NOT EXISTS idx_order_items_prod ON public.order_items(production_status) WHERE production_status != 'not_applicable';

CREATE INDEX IF NOT EXISTS idx_quotes_ref ON public.quotes(reference_number);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON public.quotes(user_id);
