-- Falcon 3D Prints — Comprehensive Admin Suite Migration
-- Migration: 20261018000001_comprehensive_admin_suite.sql
-- Compatible with PostgreSQL 15+ and Supabase

-- 1. Store Settings (Key-Value and Typed Store Settings)
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'branding', 'appearance', 'shipping', 'payments', 'operations', 'notifications')),
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public store settings" ON public.store_settings;
CREATE POLICY "Public can view public store settings"
    ON public.store_settings FOR SELECT
    USING (category IN ('general', 'branding', 'appearance', 'shipping'));

DROP POLICY IF EXISTS "Staff manage all store settings" ON public.store_settings;
CREATE POLICY "Staff manage all store settings"
    ON public.store_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'order_manager')
        )
    );

-- 2. Shipping Zones & Rates
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    postal_code_prefixes TEXT[] NOT NULL DEFAULT '{}'::text[],
    is_all_india BOOLEAN NOT NULL DEFAULT false,
    base_fee_paise INT NOT NULL DEFAULT 0 CHECK (base_fee_paise >= 0),
    free_shipping_threshold_paise INT CHECK (free_shipping_threshold_paise IS NULL OR free_shipping_threshold_paise >= 0),
    estimated_days_min INT NOT NULL DEFAULT 2,
    estimated_days_max INT NOT NULL DEFAULT 5,
    cod_available BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active shipping zones" ON public.shipping_zones;
CREATE POLICY "Public can view active shipping zones"
    ON public.shipping_zones FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Staff manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Staff manage shipping zones"
    ON public.shipping_zones FOR ALL
    USING (public.is_staff());

-- 3. Homepage Management (Hero Slides & Sections)
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content_draft JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_published JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published homepage sections" ON public.homepage_sections;
CREATE POLICY "Public can read published homepage sections"
    ON public.homepage_sections FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Staff manage homepage sections" ON public.homepage_sections;
CREATE POLICY "Staff manage homepage sections"
    ON public.homepage_sections FOR ALL
    USING (public.is_staff());

-- 4. Product Videos & Shoppable Reels
CREATE TABLE IF NOT EXISTS public.product_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    caption TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INT,
    aspect_ratio TEXT NOT NULL DEFAULT '9:16',
    linked_product_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active videos" ON public.product_videos;
CREATE POLICY "Public can view active videos"
    ON public.product_videos FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Staff manage product videos" ON public.product_videos;
CREATE POLICY "Staff manage product videos"
    ON public.product_videos FOR ALL
    USING (public.is_staff());

-- 5. Customer Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    review_text TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    staff_reply TEXT,
    staff_replied_at TIMESTAMPTZ,
    staff_replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.product_reviews;
CREATE POLICY "Public can view approved reviews"
    ON public.product_reviews FOR SELECT
    USING (status = 'approved');

DROP POLICY IF EXISTS "Staff manage all reviews" ON public.product_reviews;
CREATE POLICY "Staff manage all reviews"
    ON public.product_reviews FOR ALL
    USING (public.is_staff());

-- 6. Customer Enquiries & Contact Messages (Bulk quotes and general contact)
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_type TEXT NOT NULL DEFAULT 'contact' CHECK (inquiry_type IN ('contact', 'bulk_quote', 'custom_consulting')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company_name TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    quantity_requested INT,
    target_delivery_date DATE,
    estimated_budget_paise INT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'quoted', 'awaiting_customer', 'closed', 'spam')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    internal_notes TEXT,
    follow_up_date DATE,
    converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    converted_quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage all customer inquiries" ON public.customer_inquiries;
CREATE POLICY "Staff manage all customer inquiries"
    ON public.customer_inquiries FOR ALL
    USING (public.is_staff());

-- 7. Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'transactional' CHECK (category IN ('transactional', 'marketing', 'operational')),
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    available_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    sample_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage email templates" ON public.email_templates;
CREATE POLICY "Staff manage email templates"
    ON public.email_templates FOR ALL
    USING (public.is_staff());

-- 8. Printers & Workshop Equipment
CREATE TABLE IF NOT EXISTS public.printers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    technology TEXT NOT NULL DEFAULT 'FDM' CHECK (technology IN ('FDM', 'SLA', 'SLS')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'printing', 'maintenance', 'unavailable')),
    bed_size_mm JSONB NOT NULL DEFAULT '{"x":256,"y":256,"z":256}'::jsonb,
    materials_supported TEXT[] NOT NULL DEFAULT '{"PLA","PETG","ABS","TPU"}'::text[],
    location TEXT NOT NULL DEFAULT 'Nashik Hub - Main Workshop',
    is_connected BOOLEAN NOT NULL DEFAULT false,
    last_service_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage printers" ON public.printers;
CREATE POLICY "Staff manage printers"
    ON public.printers FOR ALL
    USING (public.is_staff());

-- 9. Production Jobs (Itemized Production Tracking)
CREATE TABLE IF NOT EXISTS public.production_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    item_title TEXT NOT NULL,
    variant_sku TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    completed_quantity INT NOT NULL DEFAULT 0 CHECK (completed_quantity >= 0),
    material TEXT NOT NULL,
    color TEXT NOT NULL,
    technology TEXT NOT NULL DEFAULT 'FDM',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'waiting_to_print' CHECK (
        status IN ('waiting_to_print', 'printing', 'finishing', 'quality_check', 'qc_failed', 'reprint_required', 'ready_to_pack')
    ),
    printer_id TEXT REFERENCES public.printers(id) ON DELETE SET NULL,
    external_supplier_name TEXT,
    operator_name TEXT,
    estimated_print_minutes INT,
    due_date DATE,
    qc_pass BOOLEAN,
    qc_notes TEXT,
    qc_failed_reason TEXT,
    rework_quantity INT NOT NULL DEFAULT 0,
    progress_photos TEXT[] NOT NULL DEFAULT '{}'::text[],
    staff_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.production_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage production jobs" ON public.production_jobs;
CREATE POLICY "Staff manage production jobs"
    ON public.production_jobs FOR ALL
    USING (public.is_staff());

-- 10. Customer Staff Notes (Private CRM notes)
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    staff_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage customer notes" ON public.customer_notes;
CREATE POLICY "Staff manage customer notes"
    ON public.customer_notes FOR ALL
    USING (public.is_staff());

-- 11. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON public.customer_inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_production_jobs_order ON public.production_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON public.production_jobs(status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_printer ON public.production_jobs(printer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_cust ON public.customer_notes(customer_id);

-- 12. Seed Default Operational Data
INSERT INTO public.store_settings (key, category, description, value)
VALUES
('branding', 'branding', 'Store branding tokens and assets', '{
    "storeName": "Falcon 3D Prints",
    "tagline": "Precision Additive Manufacturing & Rapid Prototyping",
    "logoUrl": "/images/branding/falcon-logo.png",
    "faviconUrl": "/favicon.ico",
    "contactPhone": "+91 98506 07144",
    "contactEmail": "contact@falcon3dprints.com",
    "contactAddress": "Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India",
    "businessHours": "Mon-Sat: 09:00 AM - 07:00 PM IST",
    "gstin": "27AABCF1234F1Z8"
}'::jsonb),
('appearance', 'appearance', 'Storefront theme and design controls', '{
    "primaryAccent": "#FF5722",
    "secondaryAccent": "#00E5FF",
    "surfaceColor": "#0B0F19",
    "typography": "Inter",
    "buttonRadius": "rounded",
    "showAnnouncementBar": true,
    "announcementText": "Free Express Dispatch across India on orders above ₹1,999! Studio Nashik Hub"
}'::jsonb),
('shipping_policy', 'shipping', 'Default shipping rules and thresholds', '{
    "freeShippingThresholdPaise": 199900,
    "defaultShippingFeePaise": 9900,
    "localNashikFeePaise": 4900,
    "codEnabled": true,
    "codMaxLimitPaise": 500000,
    "pickupAvailable": true,
    "pickupAddress": "Falcon 3D Studio, Sector 4, CIDCO Nashik"
}'::jsonb),
('operations', 'operations', 'Operational lead times and workshop rules', '{
    "defaultLeadDaysReadyStock": 1,
    "defaultLeadDaysMadeToOrder": 3,
    "lowStockAlertThreshold": 5,
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "autoCancelUnpaidMinutes": 1440
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Default Printers
INSERT INTO public.printers (id, name, model, technology, status, location, notes)
VALUES
('PRN-BAMBU-X1C-01', 'Bambu Lab X1-Carbon #01', 'Bambu Lab X1-Carbon', 'FDM', 'available', 'Nashik Hub - Bay A', 'Equipped with 0.4mm hardened nozzle. Ready for engineering materials.'),
('PRN-BAMBU-P1S-02', 'Bambu Lab P1S #02', 'Bambu Lab P1S', 'FDM', 'available', 'Nashik Hub - Bay A', 'Equipped with textured PEI plate. Optimal for PLA+ and PETG.'),
('PRN-ELEGOO-SAT-03', 'Elegoo Saturn 4 Ultra #03', 'Elegoo Saturn 4 Ultra 12K', 'SLA', 'available', 'Nashik Hub - Bay B (Resin Lab)', 'High-detail 12K resin setup with ultrasonic wash & UV cure chamber.'),
('PRN-CREALITY-K1-04', 'Creality K1 Max #04', 'Creality K1 Max', 'FDM', 'maintenance', 'Nashik Hub - Bay C', 'Under routine bed leveling calibration and extruder cleaning.')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Shipping Zones
INSERT INTO public.shipping_zones (name, description, postal_code_prefixes, is_all_india, base_fee_paise, free_shipping_threshold_paise, estimated_days_min, estimated_days_max, cod_available, sort_order)
VALUES
('Local Nashik Studio Dispatch', 'Direct studio courier or store pickup in Nashik metro area', '{"422"}'::text[], false, 4900, 49900, 1, 2, true, 10),
('Maharashtra Regional', 'Fast surface and air express within Maharashtra (Mumbai, Pune, Nagpur, etc.)', '{"400","401","411","412","413","414","415","416","421","422","423","424","425","431","440"}'::text[], false, 7900, 149900, 2, 3, true, 20),
('All-India Standard Express', 'Reliable nationwide express delivery to all serviceable Indian pin codes', '{}'::text[], true, 9900, 199900, 3, 6, true, 30)
ON CONFLICT DO NOTHING;

-- Seed Default Email Templates
INSERT INTO public.email_templates (template_key, name, category, subject_template, body_template, available_variables)
VALUES
('order_confirmation', 'Order Confirmation', 'transactional', 'Your Falcon 3D Prints Order #{{order_number}} is Confirmed!',
'Hello {{customer_name}},

Thank you for choosing Falcon 3D Prints! We have received your order and our Nashik studio team has begun preparation.

Order Details:
- Order Number: {{order_number}}
- Items: {{items_summary}}
- Total Amount: {{total_amount}}
- Delivery Address: {{delivery_address}}

You can track your order status anytime at: {{order_tracking_url}}

If you have any questions, reply to this email or contact us on WhatsApp at +91 98506 07144.

Warm regards,
Falcon 3D Prints Studio Team',
'["customer_name", "order_number", "items_summary", "total_amount", "delivery_address", "order_tracking_url"]'::jsonb),

('custom_quote_issued', 'Custom Print Quote Issued', 'transactional', 'Your Falcon 3D Print Quote #{{reference_number}} is Ready',
'Hello {{customer_name}},

Our engineering team has reviewed your uploaded 3D CAD model ({{file_name}}) and prepared your custom quotation.

Quote Details:
- Reference: {{reference_number}}
- Technology & Material: {{technology}} ({{material}} - {{color}})
- Estimated Print & Finishing Time: {{lead_days}} days
- Total Quoted Price: {{quoted_price}} (All taxes included)

View your itemized quotation and approve with 1-click here: {{quote_approval_url}}

This quote remains valid for 14 calendar days.

Best regards,
Falcon 3D Prints Engineering',
'["customer_name", "reference_number", "file_name", "technology", "material", "color", "lead_days", "quoted_price", "quote_approval_url"]'::jsonb),

('order_dispatched', 'Order Dispatched with Tracking', 'transactional', 'Your Falcon 3D Prints Order #{{order_number}} has Shipped!',
'Hello {{customer_name}},

Great news! Your 3D printed items have passed our quality control inspection and are on their way to you.

Shipment Details:
- Order Number: {{order_number}}
- Courier Partner: {{courier_name}}
- Tracking Number / AWB: {{tracking_number}}
- Track Your Shipment: {{tracking_url}}

Expected Delivery: Within {{estimated_days}} business days.

Warm regards,
Falcon 3D Prints Fulfillment Desk',
'["customer_name", "order_number", "courier_name", "tracking_number", "tracking_url", "estimated_days"]'::jsonb)
ON CONFLICT (template_key) DO NOTHING;
