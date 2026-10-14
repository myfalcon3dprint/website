-- Falcon 3D Prints — Row Level Security (RLS) Policies
-- Migration: 20261014000002_enable_rls_policies.sql
-- Enables RLS on all tables and configures access controls for customers and staff.

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is staff/admin
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

-- ----------------------------------------------------
-- 1. Profiles Policies
-- ----------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff());

-- Users can update their own non-role fields
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Staff can insert profiles
CREATE POLICY "Staff can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_staff());

-- ----------------------------------------------------
-- 2. Categories Policies
-- ----------------------------------------------------
-- Public can view active categories
CREATE POLICY "Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_staff());

-- Staff can manage categories
CREATE POLICY "Staff manage categories"
    ON public.categories FOR ALL
    USING (public.is_staff());

-- ----------------------------------------------------
-- 3. Products Policies
-- ----------------------------------------------------
-- Public can view published products
CREATE POLICY "Public read published products"
    ON public.products FOR SELECT
    USING (is_published = true OR public.is_staff());

-- Staff can manage products
CREATE POLICY "Staff manage products"
    ON public.products FOR ALL
    USING (public.is_staff());

-- ----------------------------------------------------
-- 4. Product Variants Policies
-- ----------------------------------------------------
-- Public can view active variants
CREATE POLICY "Public read active variants"
    ON public.product_variants FOR SELECT
    USING (is_active = true OR public.is_staff());

-- Staff can manage variants
CREATE POLICY "Staff manage variants"
    ON public.product_variants FOR ALL
    USING (public.is_staff());

-- ----------------------------------------------------
-- 5. Orders Policies
-- ----------------------------------------------------
-- Customers can read their own orders
CREATE POLICY "Users can read own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_staff());

-- Customers or guests can create orders
CREATE POLICY "Anyone can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Staff can update orders
CREATE POLICY "Staff manage orders"
    ON public.orders FOR UPDATE
    USING (public.is_staff());

-- ----------------------------------------------------
-- 6. Order Items Policies
-- ----------------------------------------------------
-- Customers can read their own order items
CREATE POLICY "Users read own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR public.is_staff())
        )
    );

-- Anyone can insert items for new orders
CREATE POLICY "Insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
        )
    );

-- Staff manage order items
CREATE POLICY "Staff manage order items"
    ON public.order_items FOR ALL
    USING (public.is_staff());

-- ----------------------------------------------------
-- 7. Quotes Policies
-- ----------------------------------------------------
-- Anyone can submit a custom quote request
CREATE POLICY "Anyone can insert quotes"
    ON public.quotes FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own quotes, staff can view all
CREATE POLICY "Users read own quotes"
    ON public.quotes FOR SELECT
    USING (auth.uid() = user_id OR public.is_staff());

-- Staff manage quotes
CREATE POLICY "Staff manage quotes"
    ON public.quotes FOR UPDATE
    USING (public.is_staff());

-- ----------------------------------------------------
-- 8. Print Queue Policies
-- ----------------------------------------------------
-- Public can view printer statuses
CREATE POLICY "Public read print queue"
    ON public.print_queue FOR SELECT
    USING (true);

-- Staff manage print queue
CREATE POLICY "Staff manage print queue"
    ON public.print_queue FOR ALL
    USING (public.is_staff());

-- ----------------------------------------------------
-- 9. Stock Reservations Policies
-- ----------------------------------------------------
CREATE POLICY "Staff manage reservations"
    ON public.stock_reservations FOR ALL
    USING (public.is_staff());
