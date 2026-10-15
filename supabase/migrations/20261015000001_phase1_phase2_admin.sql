-- ==============================================================================
-- Falcon 3D Prints — Phase 1 & Phase 2 Admin Hardening Migration
-- Migration: 20261015000001_phase1_phase2_admin.sql
-- Compatible with PostgreSQL 15+ and Supabase
--
-- This migration establishes:
--   1. Immutable admin_audit_logs table with strictly append-only RLS
--   2. Staff invitations table for owner-controlled access
--   3. Trigger to prevent users from promoting their own profile roles
--   4. Updated auth trigger guaranteeing public registrations always receive 'customer'
--   5. Composite performance indexes for bounded administrative pagination
-- ==============================================================================

-- 1. Admin Audit Logs (Strictly Immutable)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    staff_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_state JSONB,
    new_state JSONB,
    notes TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated staff members to record audit events
DROP POLICY IF EXISTS "Staff insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Staff insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (public.is_staff());

-- Allow owner and order_manager to inspect audit history
DROP POLICY IF EXISTS "Authorized staff read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Authorized staff read audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'order_manager')
        )
    );

-- IMMUTABILITY GUARANTEE:
-- No UPDATE or DELETE policies are created. Under PostgreSQL Row Level Security,
-- any attempt to UPDATE or DELETE an audit log row is rejected by default.

-- 2. Staff Invitations (Owner-Controlled Access)
-- ARCHITECTURAL NOTE: HOW THE FIRST OWNER IS SECURELY PROVISIONED:
-- Public registration permanently assigns 'customer' via handle_new_user().
-- The initial owner cannot be created via public sign-up or API requests.
-- Initial owner provisioning is performed authoritatively via:
--   1. Direct Database Bootstrap:
--      Executed directly in the PostgreSQL console / bootstrap.sql:
--      INSERT INTO public.profiles (id, full_name, role)
--      VALUES ('<auth_uid>', 'Falcon Studio Director', 'owner')
--      ON CONFLICT (id) DO UPDATE SET role = 'owner';
--   2. Explicitly Configured Initial Staff Invitation:
--      Configured per target environment with designated owner email and bound expiration.
-- All subsequent staff invitations are strictly owner-controlled and bound to email, role, and expiration.

CREATE TABLE IF NOT EXISTS public.staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'order_manager', 'production_operator', 'catalog_editor', 'support')),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage staff invitations" ON public.staff_invitations;
CREATE POLICY "Owners manage staff invitations"
    ON public.staff_invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- 3. Self-Promotion Prevention Trigger on Profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_promotion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Only an authenticated user who is already an 'owner' may alter roles
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner'
        ) THEN
            RAISE EXCEPTION 'Access denied: Profile roles can only be amended by an owner.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_self_promotion();

-- 4. Secure handle_new_user Trigger
-- Guarantee that public registrations ALWAYS assign 'customer' unless an active, unexpired pending invitation exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT := 'customer';
    invite_id UUID;
    invite_role TEXT;
BEGIN
    -- Check if an active, unexpired owner-generated invitation exists for this email
    SELECT id, role INTO invite_id, invite_role
    FROM public.staff_invitations
    WHERE email = NEW.email 
      AND status = 'pending'
      AND expires_at > timezone('utc'::text, now())
    LIMIT 1;

    -- Redeem invitation atomically (single-redemption guarantee)
    IF invite_role IS NOT NULL THEN
        assigned_role := invite_role;
        UPDATE public.staff_invitations
        SET status = 'accepted',
            redeemed_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE id = invite_id AND status = 'pending';
    END IF;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Additional Columns for Order Refund Workflow
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'refund_status'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'approved', 'rejected', 'processed'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'refund_notes'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN refund_notes TEXT;
    END IF;
END $$;

-- 6. Product Variants Versioning Column for Atomic Optimistic Locking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.product_variants ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

DROP TRIGGER IF EXISTS on_product_variants_updated ON public.product_variants;
CREATE TRIGGER on_product_variants_updated
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Composite Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status_created ON public.quotes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email_status ON public.staff_invitations(email, status);

-- 8. In-Database Metrics and Revenue Aggregation (Direct SQL SUM, zero in-memory array downloading)
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
    v_total_revenue BIGINT;
    v_total_orders INT;
    v_active_production INT;
    v_ready_to_ship INT;
    v_unhandled_orders INT;
    v_pending_quotes INT;
    v_total_products INT;
BEGIN
    SELECT COALESCE(SUM(total_paise), 0) INTO v_total_revenue
    FROM public.orders
    WHERE payment_status = 'captured';

    SELECT COUNT(*) INTO v_total_orders FROM public.orders;

    SELECT COUNT(*) INTO v_active_production FROM public.orders
    WHERE status IN ('queued', 'printing', 'finishing', 'quality_check');

    SELECT COUNT(*) INTO v_ready_to_ship FROM public.orders
    WHERE status IN ('ready', 'packed');

    SELECT COUNT(*) INTO v_unhandled_orders FROM public.orders
    WHERE status = 'confirmed';

    SELECT COUNT(*) INTO v_pending_quotes FROM public.quotes
    WHERE status IN ('submitted', 'under_review');

    SELECT COUNT(*) INTO v_total_products FROM public.products;

    RETURN jsonb_build_object(
        'totalRevenuePaise', v_total_revenue,
        'totalOrdersCount', v_total_orders,
        'activeProductionJobs', v_active_production,
        'readyToShip', v_ready_to_ship,
        'unhandledOrdersCount', v_unhandled_orders,
        'pendingQuotesCount', v_pending_quotes,
        'totalProductsCount', v_total_products
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Secure Staff Invitation Acceptance (Atomic, verified ownership, single redemption)
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
    p_token TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
    v_user_email TEXT;
    v_invite RECORD;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to accept staff invitation';
    END IF;

    -- Retrieve verified email of the authenticated user
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    IF v_user_email IS NULL THEN
        -- Fallback to profiles table if auth.users is inaccessible in context
        SELECT full_name INTO v_user_email FROM public.profiles WHERE id = p_user_id;
    END IF;

    -- Query active, unexpired pending invitation locking row for update
    SELECT * INTO v_invite
    FROM public.staff_invitations
    WHERE token = p_token
      AND status = 'pending'
      AND expires_at > timezone('utc'::text, now())
    FOR UPDATE;

    IF v_invite.id IS NULL THEN
        RAISE EXCEPTION 'Invalid, expired, or previously redeemed staff invitation token';
    END IF;

    -- Email ownership verification
    IF v_user_email IS NOT NULL AND lower(v_invite.email) <> lower(v_user_email) THEN
        RAISE EXCEPTION 'Email mismatch: invitation token is restricted to %', v_invite.email;
    END IF;

    -- Atomically redeem invitation (Single redemption guarantee)
    UPDATE public.staff_invitations
    SET status = 'accepted',
        redeemed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_invite.id;

    -- Upgrade existing profile to staff role
    UPDATE public.profiles
    SET role = v_invite.role,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Record immutable audit log inside the same database transaction
    INSERT INTO public.admin_audit_logs (
        staff_user_id,
        staff_name,
        staff_role,
        action,
        entity_type,
        entity_id,
        new_state,
        notes
    ) VALUES (
        p_user_id,
        COALESCE(v_user_email, 'Verified Staff Member'),
        v_invite.role,
        'STAFF_INVITATION_REDEEMED',
        'user',
        v_invite.email,
        jsonb_build_object('role', v_invite.role, 'invitationId', v_invite.id),
        'Staff invitation successfully redeemed and profile upgraded.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'role', v_invite.role,
        'email', v_invite.email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Atomic Order Mutation with In-Transaction Audit Logging
CREATE OR REPLACE FUNCTION public.apply_order_mutation_with_audit(
    p_order_id UUID,
    p_expected_updated_at TIMESTAMPTZ,
    p_new_status TEXT DEFAULT NULL,
    p_shipping_address JSONB DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL,
    p_status_history_entry JSONB DEFAULT NULL,
    p_staff_user_id UUID DEFAULT auth.uid(),
    p_staff_name TEXT DEFAULT 'Staff Operator',
    p_staff_role TEXT DEFAULT 'staff',
    p_action TEXT DEFAULT 'ORDER_UPDATE',
    p_notes TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_old_order RECORD;
    v_updated_order RECORD;
BEGIN
    -- Fetch existing order and check optimistic locking version
    SELECT * INTO v_old_order FROM public.orders WHERE id = p_order_id;
    IF v_old_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_old_order.updated_at <> p_expected_updated_at THEN
        RAISE EXCEPTION 'Concurrency conflict: Order was updated by another operator (expected %, found %)',
            p_expected_updated_at, v_old_order.updated_at;
    END IF;

    -- Update order row with optimistic lock verification
    UPDATE public.orders
    SET status = COALESCE(p_new_status, status),
        shipping_address = COALESCE(p_shipping_address, shipping_address),
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        status_history = CASE 
            WHEN p_status_history_entry IS NOT NULL THEN status_history || jsonb_build_array(p_status_history_entry)
            ELSE status_history
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id AND updated_at = p_expected_updated_at
    RETURNING * INTO v_updated_order;

    IF v_updated_order.id IS NULL THEN
        RAISE EXCEPTION 'Concurrency conflict: Order was updated concurrently during transaction commit';
    END IF;

    -- Record audit log inside the same transaction
    INSERT INTO public.admin_audit_logs (
        staff_user_id,
        staff_name,
        staff_role,
        action,
        entity_type,
        entity_id,
        old_state,
        new_state,
        notes,
        ip_address
    ) VALUES (
        p_staff_user_id,
        p_staff_name,
        p_staff_role,
        p_action,
        'order',
        v_updated_order.order_number,
        jsonb_build_object('status', v_old_order.status, 'tracking_number', v_old_order.tracking_number),
        jsonb_build_object('status', v_updated_order.status, 'tracking_number', v_updated_order.tracking_number),
        p_notes,
        p_ip_address
    );

    RETURN to_jsonb(v_updated_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Atomic Product Stock Adjustment with In-Transaction Audit Logging
CREATE OR REPLACE FUNCTION public.apply_product_stock_with_audit(
    p_product_id UUID,
    p_variant_id UUID,
    p_expected_updated_at TIMESTAMPTZ,
    p_delta INT DEFAULT NULL,
    p_new_stock_quantity INT DEFAULT NULL,
    p_staff_user_id UUID DEFAULT auth.uid(),
    p_staff_name TEXT DEFAULT 'Catalog Staff',
    p_staff_role TEXT DEFAULT 'catalog_editor',
    p_action TEXT DEFAULT 'PRODUCT_STOCK_ADJUSTMENT',
    p_notes TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_old_prod RECORD;
    v_old_var RECORD;
    v_target_stock INT;
BEGIN
    SELECT * INTO v_old_prod FROM public.products WHERE id = p_product_id;
    IF v_old_prod.id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_old_prod.updated_at <> p_expected_updated_at THEN
        RAISE EXCEPTION 'Concurrency conflict: Product inventory was modified concurrently (expected %, found %)',
            p_expected_updated_at, v_old_prod.updated_at;
    END IF;

    SELECT * INTO v_old_var FROM public.product_variants WHERE id = p_variant_id AND product_id = p_product_id;
    IF v_old_var.id IS NULL THEN
        RAISE EXCEPTION 'Variant not found';
    END IF;

    IF p_new_stock_quantity IS NOT NULL THEN
        IF p_new_stock_quantity < 0 THEN
            RAISE EXCEPTION 'Stock quantity must be non-negative';
        END IF;
        v_target_stock := p_new_stock_quantity;
    ELSIF p_delta IS NOT NULL THEN
        v_target_stock := v_old_var.stock_quantity + p_delta;
        IF v_target_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient stock: adjustment would produce negative inventory balance';
        END IF;
    ELSE
        RAISE EXCEPTION 'delta or new_stock_quantity is required';
    END IF;

    -- Update parent product timestamp with optimistic condition
    UPDATE public.products
    SET updated_at = timezone('utc'::text, now())
    WHERE id = p_product_id AND updated_at = p_expected_updated_at;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Concurrency conflict: Product updated concurrently';
    END IF;

    -- Update variant stock
    UPDATE public.product_variants
    SET stock_quantity = v_target_stock,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_variant_id;

    -- Record audit log inside the same transaction
    INSERT INTO public.admin_audit_logs (
        staff_user_id,
        staff_name,
        staff_role,
        action,
        entity_type,
        entity_id,
        old_state,
        new_state,
        notes,
        ip_address
    ) VALUES (
        p_staff_user_id,
        p_staff_name,
        p_staff_role,
        p_action,
        'product',
        v_old_var.sku,
        jsonb_build_object('stockQuantity', v_old_var.stock_quantity),
        jsonb_build_object('stockQuantity', v_target_stock),
        p_notes,
        p_ip_address
    );

    RETURN jsonb_build_object(
        'variantId', p_variant_id,
        'oldStockQuantity', v_old_var.stock_quantity,
        'newStockQuantity', v_target_stock
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Idempotent Atomic Payment Finalization (Status + Stock + Audit in one commit)
CREATE OR REPLACE FUNCTION public.finalize_order_payment_atomic(
    p_order_number TEXT,
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT,
    p_amount_paise INT,
    p_event_source TEXT DEFAULT 'verify'
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_current_stock INT;
BEGIN
    -- Query order row and lock for update
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = p_order_number
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order % not found', p_order_number;
    END IF;

    -- Idempotency check: Return immediately if payment is already recorded
    IF v_order.payment_status = 'captured' THEN
        RETURN jsonb_build_object(
            'success', true,
            'alreadyCaptured', true,
            'orderNumber', p_order_number,
            'paymentId', v_order.razorpay_payment_id
        );
    END IF;

    -- Validate amount match
    IF v_order.total_paise <> p_amount_paise THEN
        RAISE EXCEPTION 'Amount mismatch: expected % paise, received % paise', v_order.total_paise, p_amount_paise;
    END IF;

    -- Deduct stock atomically for each ordered line item
    FOR v_item IN (SELECT * FROM public.order_items WHERE order_id = v_order.id) LOOP
        IF v_item.variant_id IS NOT NULL AND v_item.quantity > 0 THEN
            SELECT stock_quantity INTO v_current_stock
            FROM public.product_variants
            WHERE id = v_item.variant_id
            FOR UPDATE;

            IF v_current_stock IS NOT NULL AND v_current_stock < v_item.quantity THEN
                -- If insufficient ready stock on an in-stock order, abort payment capture
                IF v_item.stock_type = 'ready_stock' THEN
                    RAISE EXCEPTION 'Inventory allocation failed: insufficient stock for SKU % (available %, required %)',
                        v_item.variant_sku, v_current_stock, v_item.quantity;
                END IF;
            END IF;

            UPDATE public.product_variants
            SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_item.variant_id;
        END IF;
    END LOOP;

    -- Convert any active stock reservations for this order
    UPDATE public.stock_reservations
    SET status = 'converted'
    WHERE order_id = v_order.id AND status = 'active';

    -- Update order to captured status
    UPDATE public.orders
    SET payment_status = 'captured',
        status = 'confirmed',
        razorpay_order_id = p_razorpay_order_id,
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = p_razorpay_signature,
        status_history = status_history || jsonb_build_array(jsonb_build_object(
            'status', 'confirmed',
            'timestamp', timezone('utc'::text, now()),
            'note', format('Payment captured via Razorpay (%s) through %s', p_razorpay_payment_id, p_event_source)
        )),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_order.id;

    -- Insert system audit log entry inside the same database transaction
    INSERT INTO public.admin_audit_logs (
        staff_name,
        staff_role,
        action,
        entity_type,
        entity_id,
        new_state,
        notes
    ) VALUES (
        'Payment Gateway Integration',
        'system',
        'ORDER_PAYMENT_CAPTURED',
        'order',
        p_order_number,
        jsonb_build_object(
            'paymentStatus', 'captured',
            'razorpayPaymentId', p_razorpay_payment_id,
            'amountPaise', p_amount_paise,
            'source', p_event_source
        ),
        format('Payment of %s paise captured and stock allocated.', p_amount_paise)
    );

    RETURN jsonb_build_object(
        'success', true,
        'alreadyCaptured', false,
        'orderNumber', p_order_number,
        'paymentId', p_razorpay_payment_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Procedure: release_expired_stock_reservations
-- Periodically marks active reservations past their 15-minute expiry as 'expired'
CREATE OR REPLACE FUNCTION public.release_expired_stock_reservations()
RETURNS INT AS $$
DECLARE
    v_released_count INT;
BEGIN
    UPDATE public.stock_reservations
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < timezone('utc'::text, now());
    GET DIAGNOSTICS v_released_count = ROW_COUNT;
    RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Procedure: create_stock_reservation_atomic
-- Locks the target variant with FOR UPDATE, cleans expired holds, checks availability, and creates reservation
CREATE OR REPLACE FUNCTION public.create_stock_reservation_atomic(
    p_product_id UUID,
    p_variant_id UUID,
    p_order_id UUID,
    p_quantity INT,
    p_hold_minutes INT DEFAULT 15
)
RETURNS JSONB AS $$
DECLARE
    v_stock INT;
    v_active_reserved INT;
    v_available INT;
    v_reservation_id UUID;
BEGIN
    -- 1. Row-level exclusive lock on the variant to prevent race conditions
    SELECT stock_quantity INTO v_stock
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF v_stock IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Variant not found');
    END IF;

    -- 2. Clean up any expired reservations on this variant
    UPDATE public.stock_reservations
    SET status = 'expired'
    WHERE variant_id = p_variant_id
      AND status = 'active'
      AND expires_at < timezone('utc'::text, now());

    -- 3. Sum current unexpired active reservations under row lock
    SELECT COALESCE(SUM(quantity), 0) INTO v_active_reserved
    FROM public.stock_reservations
    WHERE variant_id = p_variant_id
      AND status = 'active'
      AND expires_at >= timezone('utc'::text, now());

    v_available := GREATEST(0, v_stock - v_active_reserved);

    -- 4. Check availability
    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_stock',
            'available', v_available,
            'stock', v_stock,
            'reserved', v_active_reserved,
            'requested', p_quantity
        );
    END IF;

    -- 5. Insert reservation atomically inside the locked transaction
    INSERT INTO public.stock_reservations (
        product_id,
        variant_id,
        order_id,
        quantity,
        expires_at,
        status
    ) VALUES (
        p_product_id,
        p_variant_id,
        p_order_id,
        p_quantity,
        timezone('utc'::text, now()) + (p_hold_minutes || ' minutes')::interval,
        'active'
    ) RETURNING id INTO v_reservation_id;

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'available_remaining', v_available - p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Procedure: release_stock_reservation
-- Explicitly releases an active reservation (e.g. on checkout failure or user cancellation)
CREATE OR REPLACE FUNCTION public.release_stock_reservation(
    p_reservation_id UUID,
    p_reason TEXT DEFAULT 'cancelled'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.stock_reservations
    SET status = 'released'
    WHERE id = p_reservation_id
      AND status = 'active';
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



