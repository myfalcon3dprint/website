-- Migration: 20261015000003_phase3_commerce_and_taxonomy.sql
-- Description: Add category updated_at, variant updated_at, order payment states, and transactional order item reconciliation RPC.

-- 1. Categories updated_at and trigger
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DROP TRIGGER IF EXISTS on_categories_updated ON public.categories;
CREATE TRIGGER on_categories_updated
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Product Variants updated_at and trigger
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DROP TRIGGER IF EXISTS on_product_variants_updated ON public.product_variants;
CREATE TRIGGER on_product_variants_updated
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 3. Relax and extend orders payment_status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN (
        'pending', 
        'captured', 
        'failed', 
        'refunded', 
        'additional_payment_due', 
        'refund_due_pending_approval'
    ));

-- 4. Transactional Order Item Reconciliation Function
CREATE OR REPLACE FUNCTION public.reconcile_order_item_transactional(
    p_order_id UUID,
    p_action TEXT,
    p_item_id UUID DEFAULT NULL,
    p_variant_id UUID DEFAULT NULL,
    p_quantity INT DEFAULT 1,
    p_reason TEXT DEFAULT '',
    p_expected_updated_at TIMESTAMPTZ DEFAULT NULL,
    p_staff_user_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT 'Staff'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_variant RECORD;
    v_product RECORD;
    v_old_total_paise INT;
    v_new_subtotal_paise INT;
    v_new_tax_paise INT;
    v_new_total_paise INT;
    v_delta_qty INT;
    v_unit_price_paise INT;
    v_inventory_note TEXT := '';
    v_financial_note TEXT := '';
    v_new_payment_status TEXT;
    v_history_entry JSONB;
    v_new_status_history JSONB;
    v_is_ready_stock BOOLEAN;
BEGIN
    -- 1. Lock and validate order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found with ID %', p_order_id;
    END IF;

    -- Concurrency check if expected updated_at provided
    IF p_expected_updated_at IS NOT NULL AND v_order.updated_at <> p_expected_updated_at THEN
        RAISE EXCEPTION 'Concurrency conflict: Order was updated by another user (expected %, current %)',
            p_expected_updated_at, v_order.updated_at;
    END IF;

    -- Guard against locked terminal or shipping statuses
    IF v_order.status IN ('packed', 'shipped', 'delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Cannot reconcile items for order in status "%"', v_order.status;
    END IF;

    v_old_total_paise := v_order.total_paise;

    -- 2. Execute Action
    IF p_action = 'add' THEN
        IF p_variant_id IS NULL THEN
            RAISE EXCEPTION 'p_variant_id is required to add an item';
        END IF;

        IF p_quantity <= 0 THEN
            RAISE EXCEPTION 'p_quantity must be greater than zero';
        END IF;

        -- Lock variant
        SELECT pv.*, p.name AS product_name, p.base_price_paise, p.availability
        INTO v_variant
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = p_variant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variant not found with ID %', p_variant_id;
        END IF;

        v_is_ready_stock := (v_variant.availability = 'in_stock');
        IF v_is_ready_stock AND v_variant.stock_quantity < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for SKU %: requested %, available %',
                v_variant.sku, p_quantity, v_variant.stock_quantity;
        END IF;

        -- Reconcile inventory: decrement
        IF v_is_ready_stock THEN
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity - p_quantity
            WHERE id = v_variant.id;
            v_inventory_note := format('Decremented %s unit(s) of SKU %s', p_quantity, v_variant.sku);
        ELSE
            v_inventory_note := format('Made-to-order item added: %s unit(s) of SKU %s', p_quantity, v_variant.sku);
        END IF;

        v_unit_price_paise := GREATEST(0, v_variant.base_price_paise + v_variant.price_adjustment_paise);

        -- Insert order item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_title,
            variant_id,
            variant_sku,
            variant_details,
            unit_price_paise,
            quantity,
            total_paise,
            stock_type,
            production_status
        ) VALUES (
            p_order_id,
            v_variant.product_id,
            v_variant.product_name,
            v_variant.id,
            v_variant.sku,
            format('%s / %s (%s)', v_variant.material, v_variant.color, v_variant.finish),
            v_unit_price_paise,
            p_quantity,
            v_unit_price_paise * p_quantity,
            CASE WHEN v_is_ready_stock THEN 'ready_stock' ELSE 'made_to_order' END,
            CASE WHEN v_is_ready_stock THEN 'not_applicable' ELSE 'queued' END
        );

    ELSIF p_action = 'update_quantity' THEN
        IF p_item_id IS NULL THEN
            RAISE EXCEPTION 'p_item_id is required to update quantity';
        END IF;

        IF p_quantity <= 0 THEN
            RAISE EXCEPTION 'Target quantity must be greater than zero';
        END IF;

        SELECT * INTO v_item
        FROM public.order_items
        WHERE id = p_item_id AND order_id = p_order_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Order item not found with ID %', p_item_id;
        END IF;

        v_delta_qty := p_quantity - v_item.quantity;

        IF v_delta_qty > 0 THEN
            -- Check and decrement variant stock
            SELECT * INTO v_variant
            FROM public.product_variants
            WHERE (v_item.variant_id IS NOT NULL AND id = v_item.variant_id)
               OR sku = v_item.variant_sku
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Associated variant for SKU % not found in inventory', v_item.variant_sku;
            END IF;

            IF v_variant.stock_quantity < v_delta_qty THEN
                RAISE EXCEPTION 'Insufficient stock to increase quantity: requested +%, available %',
                    v_delta_qty, v_variant.stock_quantity;
            END IF;

            UPDATE public.product_variants
            SET stock_quantity = stock_quantity - v_delta_qty
            WHERE id = v_variant.id;

            v_inventory_note := format('Decremented %s unit(s) of SKU %s', v_delta_qty, v_item.variant_sku);
        ELSIF v_delta_qty < 0 THEN
            -- Restock variant stock
            SELECT * INTO v_variant
            FROM public.product_variants
            WHERE (v_item.variant_id IS NOT NULL AND id = v_item.variant_id)
               OR sku = v_item.variant_sku
            FOR UPDATE;

            IF FOUND THEN
                UPDATE public.product_variants
                SET stock_quantity = stock_quantity + ABS(v_delta_qty)
                WHERE id = v_variant.id;
            END IF;

            v_inventory_note := format('Restocked %s unit(s) of SKU %s', ABS(v_delta_qty), v_item.variant_sku);
        ELSE
            v_inventory_note := 'Quantity unchanged';
        END IF;

        UPDATE public.order_items
        SET quantity = p_quantity,
            total_paise = unit_price_paise * p_quantity
        WHERE id = p_item_id;

    ELSIF p_action = 'remove' THEN
        IF p_item_id IS NULL THEN
            RAISE EXCEPTION 'p_item_id is required to remove an item';
        END IF;

        SELECT * INTO v_item
        FROM public.order_items
        WHERE id = p_item_id AND order_id = p_order_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Order item not found with ID %', p_item_id;
        END IF;

        -- Restock
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE (v_item.variant_id IS NOT NULL AND id = v_item.variant_id)
           OR sku = v_item.variant_sku
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_variant.id;
        END IF;

        v_inventory_note := format('Restocked %s unit(s) of SKU %s upon line removal', v_item.quantity, v_item.variant_sku);

        DELETE FROM public.order_items
        WHERE id = p_item_id;

    ELSE
        RAISE EXCEPTION 'Unknown action "%", expected add, update_quantity, or remove', p_action;
    END IF;

    -- 3. Recalculate Subtotal, Proportional Tax, & Total
    SELECT COALESCE(SUM(total_paise), 0) INTO v_new_subtotal_paise
    FROM public.order_items
    WHERE order_id = p_order_id;

    IF v_order.subtotal_paise > 0 AND v_order.tax_paise > 0 THEN
        v_new_tax_paise := ROUND(v_new_subtotal_paise::NUMERIC * (v_order.tax_paise::NUMERIC / v_order.subtotal_paise::NUMERIC));
    ELSE
        v_new_tax_paise := v_order.tax_paise;
    END IF;

    v_new_total_paise := v_new_subtotal_paise + v_order.shipping_paise + v_new_tax_paise;

    -- Determine new payment status based on price differential and actual payment status
    IF v_order.payment_status IN ('pending', 'failed') THEN
        v_new_payment_status := v_order.payment_status;
        v_financial_note := format('Unpaid order (%s): total adjusted to %s paise. No refund or merchant balance due.',
            v_order.payment_status, v_new_total_paise);
    ELSE
        IF v_new_total_paise > v_old_total_paise THEN
            v_new_payment_status := 'additional_payment_due';
            v_financial_note := format('Total increased from %s paise to %s paise. Additional %s paise due from customer.',
                v_old_total_paise, v_new_total_paise, v_new_total_paise - v_old_total_paise);
        ELSIF v_new_total_paise < v_old_total_paise THEN
            v_new_payment_status := 'refund_due_pending_approval';
            v_financial_note := format('Total reduced from %s paise to %s paise. Refund of %s paise due (pending owner authorization).',
                v_old_total_paise, v_new_total_paise, v_old_total_paise - v_new_total_paise);
        ELSE
            v_new_payment_status := v_order.payment_status;
            v_financial_note := 'Total unchanged.';
        END IF;
    END IF;

    -- Prepare status history entry
    v_history_entry := jsonb_build_object(
        'status', v_order.status,
        'timestamp', timezone('utc'::text, now())::TEXT,
        'note', format('Order correction (%s) by %s. Reason: %s. %s %s',
            p_action, COALESCE(p_staff_name, 'Staff'), p_reason, v_inventory_note, v_financial_note),
        'staff_id', p_staff_user_id,
        'staff_name', p_staff_name
    );

    v_new_status_history := COALESCE(v_order.status_history, '[]'::jsonb) || jsonb_build_array(v_history_entry);

    -- 4. Update Order
    UPDATE public.orders
    SET subtotal_paise = v_new_subtotal_paise,
        tax_paise = v_new_tax_paise,
        total_paise = v_new_total_paise,
        payment_status = v_new_payment_status,
        status_history = v_new_status_history,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'orderId', p_order_id,
        'oldTotalPaise', v_old_total_paise,
        'newTotalPaise', v_new_total_paise,
        'paymentStatus', v_new_payment_status,
        'inventoryAdjustmentNote', v_inventory_note,
        'financialAdjustmentNote', v_financial_note
    );
END;
$$;

-- 5. RPC Grants
REVOKE ALL ON FUNCTION public.reconcile_order_item_transactional FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reconcile_order_item_transactional TO authenticated, service_role;
