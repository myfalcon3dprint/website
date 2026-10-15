-- Falcon 3D Prints — Migration 20261015000002
-- Concurrency Hardening, Versioning, and Privileged RPC Security

-- 1. Integer version column on core mutable entities
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- 2. Exact microsecond handle_updated_at trigger function (Zero truncation, strictly monotonic)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = GREATEST(timezone('utc'::text, now()), OLD.updated_at + INTERVAL '1 microsecond');
    RETURN NEW;
END;
$$;

-- 3. Row version auto-advancement trigger for generic updates
CREATE OR REPLACE FUNCTION public.handle_row_version_and_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = GREATEST(timezone('utc'::text, now()), OLD.updated_at + INTERVAL '1 microsecond');
    IF NEW.version = OLD.version THEN
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_products_version_updated ON public.products;
CREATE TRIGGER on_products_version_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_row_version_and_updated_at();

DROP TRIGGER IF EXISTS on_product_variants_version_updated ON public.product_variants;
CREATE TRIGGER on_product_variants_version_updated
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE PROCEDURE public.handle_row_version_and_updated_at();

DROP TRIGGER IF EXISTS on_orders_version_updated ON public.orders;
CREATE TRIGGER on_orders_version_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_row_version_and_updated_at();

DROP TRIGGER IF EXISTS on_quotes_version_updated ON public.quotes;
CREATE TRIGGER on_quotes_version_updated
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_row_version_and_updated_at();

-- 3b. Refined prevent_profile_role_self_promotion allowing service_role administrative provisioning
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Allow service_role, superuser, or verified invitation redemption transaction
        IF auth.role() = 'service_role' OR auth.role() IS NULL OR current_setting('falcon.invitation_redemption', true) = 'true' THEN
            RETURN NEW;
        END IF;

        -- Authenticated callers must be verified owners
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner'
        ) THEN
            RAISE EXCEPTION 'Access denied: Profile roles can only be amended by an owner.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Hardened get_dashboard_metrics with search_path, RBAC authorization, and grant revocation
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_total_revenue BIGINT;
    v_total_orders INT;
    v_active_production INT;
    v_ready_to_ship INT;
    v_unhandled_orders INT;
    v_pending_quotes INT;
    v_total_products INT;
BEGIN
    IF auth.role() = 'anon' THEN
        RAISE EXCEPTION 'Access denied: anonymous users cannot execute administrative procedures'
            USING ERRCODE = '42501';
    END IF;

    IF auth.role() = 'authenticated' THEN
        SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
        IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin', 'catalog_editor', 'production_staff') THEN
            RAISE EXCEPTION 'Access denied: insufficient permissions to access dashboard metrics'
                USING ERRCODE = '42501';
        END IF;
    END IF;

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
$$;

-- 5. Hardened accept_staff_invitation with search_path and row lock
DROP FUNCTION IF EXISTS public.accept_staff_invitation(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
    p_token TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_target_user_id UUID;
    v_user_email TEXT;
    v_email_confirmed_at TIMESTAMPTZ;
    v_invite RECORD;
BEGIN
    IF auth.role() = 'anon' THEN
        RAISE EXCEPTION 'Access denied: authentication required to accept staff invitation'
            USING ERRCODE = '42501';
    END IF;

    IF auth.role() = 'authenticated' THEN
        v_target_user_id := auth.uid();
    ELSE
        v_target_user_id := COALESCE(p_user_id, auth.uid());
    END IF;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to accept staff invitation';
    END IF;

    SELECT email, email_confirmed_at INTO v_user_email, v_email_confirmed_at FROM auth.users WHERE id = v_target_user_id;
    IF v_email_confirmed_at IS NULL THEN
        RAISE EXCEPTION 'Unverified email: staff invitations require a confirmed email address'
            USING ERRCODE = '42501';
    END IF;
    IF v_user_email IS NULL THEN
        SELECT full_name INTO v_user_email FROM public.profiles WHERE id = v_target_user_id;
    END IF;

    SELECT * INTO v_invite
    FROM public.staff_invitations
    WHERE token = p_token
      AND status = 'pending'
      AND expires_at > timezone('utc'::text, now())
    FOR UPDATE;

    IF v_invite.id IS NULL THEN
        RAISE EXCEPTION 'Invalid, expired, or previously redeemed staff invitation token';
    END IF;

    IF v_user_email IS NOT NULL AND lower(v_invite.email) <> lower(v_user_email) THEN
        RAISE EXCEPTION 'Email mismatch: invitation token is restricted to %', v_invite.email
            USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('falcon.invitation_redemption', 'true', true);

    UPDATE public.staff_invitations
    SET status = 'accepted',
        redeemed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_invite.id;

    UPDATE public.profiles
    SET role = v_invite.role,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_target_user_id;

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
        v_target_user_id,
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
$$;

-- 6. Hardened apply_product_stock_with_audit with version check, row lock, and safe actor handling
DROP FUNCTION IF EXISTS public.apply_product_stock_with_audit(UUID, UUID, TIMESTAMPTZ, INT, INT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.apply_product_stock_with_audit(UUID, UUID, INT, TIMESTAMPTZ, INT, INT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.apply_product_stock_with_audit(
    p_product_id UUID,
    p_variant_id UUID,
    p_expected_version INT DEFAULT NULL,
    p_expected_updated_at TIMESTAMPTZ DEFAULT NULL,
    p_delta INT DEFAULT NULL,
    p_new_stock_quantity INT DEFAULT NULL,
    p_staff_user_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT NULL,
    p_staff_role TEXT DEFAULT NULL,
    p_action TEXT DEFAULT 'PRODUCT_STOCK_ADJUSTMENT',
    p_notes TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_effective_staff_id UUID;
    v_effective_staff_name TEXT;
    v_effective_staff_role TEXT;
    v_old_prod RECORD;
    v_old_var RECORD;
    v_target_stock INT;
    v_updated_prod RECORD;
    v_updated_var RECORD;
BEGIN
    IF auth.role() = 'anon' THEN
        RAISE EXCEPTION 'Access denied: anonymous users cannot execute administrative procedures'
            USING ERRCODE = '42501';
    END IF;

    IF auth.role() = 'authenticated' THEN
        SELECT role, full_name INTO v_caller_role, v_caller_name
        FROM public.profiles
        WHERE id = auth.uid();

        IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin', 'catalog_editor') THEN
            RAISE EXCEPTION 'Access denied: insufficient permissions to adjust product stock'
                USING ERRCODE = '42501';
        END IF;

        v_effective_staff_id := auth.uid();
        v_effective_staff_name := COALESCE(v_caller_name, 'Catalog Staff');
        v_effective_staff_role := v_caller_role;
    ELSE
        v_effective_staff_id := p_staff_user_id;
        v_effective_staff_name := COALESCE(p_staff_name, 'Catalog Staff');
        v_effective_staff_role := COALESCE(p_staff_role, 'catalog_editor');
    END IF;

    SELECT * INTO v_old_prod
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_old_prod.id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF p_expected_version IS NOT NULL AND v_old_prod.version <> p_expected_version THEN
        RAISE EXCEPTION 'Concurrency conflict: Product version modified concurrently (expected %, found %)',
            p_expected_version, v_old_prod.version;
    END IF;

    IF p_expected_updated_at IS NOT NULL AND v_old_prod.updated_at <> p_expected_updated_at THEN
        RAISE EXCEPTION 'Concurrency conflict: Product inventory was modified concurrently (expected %, found %)',
            p_expected_updated_at, v_old_prod.updated_at;
    END IF;

    SELECT * INTO v_old_var
    FROM public.product_variants
    WHERE id = p_variant_id AND product_id = p_product_id
    FOR UPDATE;

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

    UPDATE public.products
    SET version = v_old_prod.version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_product_id
    RETURNING * INTO v_updated_prod;

    UPDATE public.product_variants
    SET stock_quantity = v_target_stock,
        version = v_old_var.version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_variant_id
    RETURNING * INTO v_updated_var;

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
        v_effective_staff_id,
        v_effective_staff_name,
        v_effective_staff_role,
        p_action,
        'product',
        v_old_var.sku,
        jsonb_build_object('stockQuantity', v_old_var.stock_quantity, 'version', v_old_prod.version),
        jsonb_build_object('stockQuantity', v_target_stock, 'version', v_updated_prod.version),
        p_notes,
        p_ip_address
    );

    RETURN jsonb_build_object(
        'success', true,
        'productId', p_product_id,
        'variantId', p_variant_id,
        'oldStockQuantity', v_old_var.stock_quantity,
        'newStockQuantity', v_target_stock,
        'oldVersion', v_old_prod.version,
        'newVersion', v_updated_prod.version,
        'updatedAt', v_updated_prod.updated_at
    );
END;
$$;

-- 7. Hardened apply_order_mutation_with_audit with version check, row lock, and safe actor handling
DROP FUNCTION IF EXISTS public.apply_order_mutation_with_audit(UUID, TIMESTAMPTZ, TEXT, JSONB, TEXT, JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.apply_order_mutation_with_audit(UUID, INT, TIMESTAMPTZ, TEXT, JSONB, TEXT, JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.apply_order_mutation_with_audit(
    p_order_id UUID,
    p_expected_version INT DEFAULT NULL,
    p_expected_updated_at TIMESTAMPTZ DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_shipping_address JSONB DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL,
    p_status_history_entry JSONB DEFAULT NULL,
    p_staff_user_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT NULL,
    p_staff_role TEXT DEFAULT NULL,
    p_action TEXT DEFAULT 'ORDER_UPDATE',
    p_notes TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_effective_staff_id UUID;
    v_effective_staff_name TEXT;
    v_effective_staff_role TEXT;
    v_old_order RECORD;
    v_updated_order RECORD;
BEGIN
    IF auth.role() = 'anon' THEN
        RAISE EXCEPTION 'Access denied: anonymous users cannot execute administrative procedures'
            USING ERRCODE = '42501';
    END IF;

    IF auth.role() = 'authenticated' THEN
        SELECT role, full_name INTO v_caller_role, v_caller_name
        FROM public.profiles
        WHERE id = auth.uid();

        IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin', 'production_staff') THEN
            RAISE EXCEPTION 'Access denied: insufficient permissions to update order'
                USING ERRCODE = '42501';
        END IF;

        v_effective_staff_id := auth.uid();
        v_effective_staff_name := COALESCE(v_caller_name, 'Staff Operator');
        v_effective_staff_role := v_caller_role;
    ELSE
        v_effective_staff_id := p_staff_user_id;
        v_effective_staff_name := COALESCE(p_staff_name, 'Staff Operator');
        v_effective_staff_role := COALESCE(p_staff_role, 'staff');
    END IF;

    SELECT * INTO v_old_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_old_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF p_expected_version IS NOT NULL AND v_old_order.version <> p_expected_version THEN
        RAISE EXCEPTION 'Concurrency conflict: Order was updated by another operator (expected version %, found %)',
            p_expected_version, v_old_order.version;
    END IF;

    IF p_expected_updated_at IS NOT NULL AND v_old_order.updated_at <> p_expected_updated_at THEN
        RAISE EXCEPTION 'Concurrency conflict: Order was updated by another operator (expected %, found %)',
            p_expected_updated_at, v_old_order.updated_at;
    END IF;

    UPDATE public.orders
    SET status = COALESCE(p_new_status, status),
        shipping_address = COALESCE(p_shipping_address, shipping_address),
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        status_history = CASE 
            WHEN p_status_history_entry IS NOT NULL THEN status_history || jsonb_build_array(p_status_history_entry)
            ELSE status_history
        END,
        version = v_old_order.version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id
    RETURNING * INTO v_updated_order;

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
        v_effective_staff_id,
        v_effective_staff_name,
        v_effective_staff_role,
        p_action,
        'order',
        v_updated_order.order_number,
        jsonb_build_object('status', v_old_order.status, 'tracking_number', v_old_order.tracking_number, 'version', v_old_order.version),
        jsonb_build_object('status', v_updated_order.status, 'tracking_number', v_updated_order.tracking_number, 'version', v_updated_order.version),
        p_notes,
        p_ip_address
    );

    RETURN to_jsonb(v_updated_order);
END;
$$;

-- 8. Hardened finalize_order_payment_atomic with search_path, version increment, and row lock
CREATE OR REPLACE FUNCTION public.finalize_order_payment_atomic(
    p_order_number TEXT,
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT,
    p_amount_paise INT,
    p_event_source TEXT DEFAULT 'verify'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_current_stock INT;
    v_updated_order RECORD;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = p_order_number
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order % not found', p_order_number;
    END IF;

    IF v_order.payment_status = 'captured' THEN
        RETURN jsonb_build_object(
            'success', true,
            'alreadyCaptured', true,
            'orderNumber', p_order_number,
            'paymentId', v_order.razorpay_payment_id,
            'version', v_order.version
        );
    END IF;

    IF v_order.total_paise <> p_amount_paise THEN
        RAISE EXCEPTION 'Amount mismatch: expected % paise, received % paise', v_order.total_paise, p_amount_paise;
    END IF;

    FOR v_item IN (SELECT * FROM public.order_items WHERE order_id = v_order.id) LOOP
        IF v_item.variant_id IS NOT NULL AND v_item.quantity > 0 THEN
            SELECT stock_quantity INTO v_current_stock
            FROM public.product_variants
            WHERE id = v_item.variant_id
            FOR UPDATE;

            IF v_current_stock IS NOT NULL AND v_current_stock < v_item.quantity THEN
                IF v_item.stock_type = 'ready_stock' THEN
                    RAISE EXCEPTION 'Inventory allocation failed: insufficient stock for SKU % (available %, required %)',
                        v_item.variant_sku, v_current_stock, v_item.quantity;
                END IF;
            END IF;

            UPDATE public.product_variants
            SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
                version = version + 1,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_item.variant_id;
        END IF;
    END LOOP;

    UPDATE public.stock_reservations
    SET status = 'converted'
    WHERE order_id = v_order.id AND status = 'active';

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
        version = v_order.version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_order.id
    RETURNING * INTO v_updated_order;

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
            'source', p_event_source,
            'version', v_updated_order.version
        ),
        format('Payment of %s paise captured and stock allocated.', p_amount_paise)
    );

    RETURN jsonb_build_object(
        'success', true,
        'alreadyCaptured', false,
        'orderNumber', p_order_number,
        'paymentId', p_razorpay_payment_id,
        'version', v_updated_order.version
    );
END;
$$;

-- 9. Hardened stock reservation procedures with search_path
CREATE OR REPLACE FUNCTION public.release_expired_stock_reservations()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_stock_reservation_atomic(
    p_product_id UUID,
    p_variant_id UUID,
    p_order_id UUID,
    p_quantity INT,
    p_hold_minutes INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_stock INT;
    v_active_reserved INT;
    v_available INT;
    v_reservation_id UUID;
BEGIN
    SELECT stock_quantity INTO v_stock
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF v_stock IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Variant not found');
    END IF;

    UPDATE public.stock_reservations
    SET status = 'expired'
    WHERE variant_id = p_variant_id
      AND status = 'active'
      AND expires_at < timezone('utc'::text, now());

    SELECT COALESCE(SUM(quantity), 0) INTO v_active_reserved
    FROM public.stock_reservations
    WHERE variant_id = p_variant_id
      AND status = 'active'
      AND expires_at >= timezone('utc'::text, now());

    v_available := GREATEST(0, v_stock - v_active_reserved);

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
$$;

CREATE OR REPLACE FUNCTION public.release_stock_reservation(
    p_reservation_id UUID,
    p_reason TEXT DEFAULT 'cancelled'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    UPDATE public.stock_reservations
    SET status = 'released'
    WHERE id = p_reservation_id
      AND status = 'active';
    RETURN FOUND;
END;
$$;

-- 10. Explicit Principle of Least Privilege: Revoke public and anon execution grants
REVOKE ALL ON FUNCTION public.get_dashboard_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_staff_invitation(TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_product_stock_with_audit(UUID, UUID, INT, TIMESTAMPTZ, INT, INT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_order_mutation_with_audit(UUID, INT, TIMESTAMPTZ, TEXT, JSONB, TEXT, JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_order_payment_atomic(TEXT, TEXT, TEXT, TEXT, INT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_expired_stock_reservations() FROM PUBLIC, anon, authenticated;

-- Grant to appropriate roles
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_staff_invitation(TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_product_stock_with_audit(UUID, UUID, INT, TIMESTAMPTZ, INT, INT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_order_mutation_with_audit(UUID, INT, TIMESTAMPTZ, TEXT, JSONB, TEXT, JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_order_payment_atomic(TEXT, TEXT, TEXT, TEXT, INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_stock_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_stock_reservation_atomic(UUID, UUID, UUID, INT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_stock_reservation(UUID, TEXT) TO anon, authenticated, service_role;
