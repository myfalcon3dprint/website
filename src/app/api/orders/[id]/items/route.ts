import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { serializeOrderFromDb } from '@/lib/serializers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 1. RBAC: Only owner or order_manager may alter items on existing orders
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      action, // 'add' | 'update_quantity' | 'remove'
      itemId,
      variantId,
      quantity,
      newQuantity,
      reason,
      lastKnownUpdatedAt,
    }: {
      action: 'add' | 'update_quantity' | 'remove';
      itemId?: string;
      variantId?: string;
      quantity?: number;
      newQuantity?: number;
      reason?: string;
      lastKnownUpdatedAt: string;
    } = body;

    // 2. Mandatory Optimistic Version Lock
    if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: lastKnownUpdatedAt timestamp is mandatory.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Reason for order item correction is required (minimum 5 characters).' },
        { status: 400 }
      );
    }

    // 3. Fetch existing order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Invariant: Locked statuses
    const lockedStatuses = ['packed', 'shipped', 'delivered', 'cancelled'];
    if (lockedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot alter items for an order in status '${order.status}'.` },
        { status: 400 }
      );
    }

    let inventoryAdjustmentNote = '';
    let financialAdjustmentNote = '';
    let newTotalPaise = Number(order.total_paise || 0);

    // 4. Handle Actions
    if (action === 'add') {
      if (!variantId) {
        return NextResponse.json({ error: 'variantId is required to add an order item' }, { status: 400 });
      }
      const addQty = Math.max(1, parseInt(String(quantity || 1), 10));

      // Fetch variant
      const { data: variant, error: varErr } = await supabase
        .from('product_variants')
        .select('*, products(*)')
        .eq('id', variantId)
        .single();

      if (varErr || !variant) {
        return NextResponse.json({ error: 'Variant not found in catalog' }, { status: 404 });
      }

      // Check ready stock
      const isReadyStock = variant.products?.availability === 'in_stock';
      if (isReadyStock && (variant.stock_quantity || 0) < addQty) {
        return NextResponse.json(
          { error: `Insufficient inventory: in-stock ${variant.stock_quantity}, requested ${addQty}` },
          { status: 400 }
        );
      }

      // Decrement inventory
      await supabase
        .from('product_variants')
        .update({ stock_quantity: Math.max(0, (variant.stock_quantity || 0) - addQty) })
        .eq('id', variant.id);

      const basePrice = Number(variant.products?.base_price_paise || 0);
      const adjustment = Number(variant.price_adjustment_paise || 0);
      const unitPricePaise = Math.max(0, basePrice + adjustment);
      const lineTotalPaise = unitPricePaise * addQty;

      // Insert order item
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: variant.product_id,
        product_title: variant.products?.name || 'Custom 3D Print',
        variant_sku: variant.sku,
        variant_details: `${variant.material} / ${variant.color} (${variant.finish})`,
        unit_price_paise: unitPricePaise,
        quantity: addQty,
        total_paise: lineTotalPaise,
        stock_type: isReadyStock ? 'ready_stock' : 'made_to_order',
        production_status: 'confirmed',
      });

      newTotalPaise += lineTotalPaise;
      inventoryAdjustmentNote = `Decremented ${addQty} unit(s) of SKU ${variant.sku}`;
      financialAdjustmentNote = `Line item added: +₹${(lineTotalPaise / 100).toFixed(2)} balance due from customer`;
    } else if (action === 'update_quantity') {
      if (!itemId) {
        return NextResponse.json({ error: 'itemId is required to update quantity' }, { status: 400 });
      }
      const targetQty = Number(newQuantity);
      if (!Number.isInteger(targetQty) || targetQty <= 0) {
        return NextResponse.json({ error: 'newQuantity must be an integer greater than 0' }, { status: 400 });
      }

      const existingItem = (order.order_items || []).find((i: Record<string, unknown>) => i.id === itemId);
      if (!existingItem) {
        return NextResponse.json({ error: 'Order line item not found' }, { status: 404 });
      }

      const currentQty = Number(existingItem.quantity || 1);
      const delta = targetQty - currentQty;
      const unitPricePaise = Number(existingItem.unit_price_paise || 0);

      if (delta > 0) {
        // Quantity Increase: check and decrement variant inventory
        const { data: v } = await supabase
          .from('product_variants')
          .select('id, stock_quantity')
          .eq('sku', existingItem.variant_sku)
          .single();

        if (v && typeof v.stock_quantity === 'number') {
          if (v.stock_quantity < delta) {
            return NextResponse.json(
              { error: `Insufficient stock to add ${delta} units. Available: ${v.stock_quantity}` },
              { status: 400 }
            );
          }
          await supabase
            .from('product_variants')
            .update({ stock_quantity: v.stock_quantity - delta })
            .eq('id', v.id);
        }

        const addedPaise = unitPricePaise * delta;
        newTotalPaise += addedPaise;
        inventoryAdjustmentNote = `Decremented ${delta} unit(s) of SKU ${existingItem.variant_sku}`;
        financialAdjustmentNote = `Quantity increased: +₹${(addedPaise / 100).toFixed(2)} balance due from customer`;
      } else if (delta < 0) {
        // Quantity Decrease: return stock to variant inventory
        const returnedUnits = Math.abs(delta);
        const { data: v } = await supabase
          .from('product_variants')
          .select('id, stock_quantity')
          .eq('sku', existingItem.variant_sku)
          .single();

        if (v && typeof v.stock_quantity === 'number') {
          await supabase
            .from('product_variants')
            .update({ stock_quantity: v.stock_quantity + returnedUnits })
            .eq('id', v.id);
        }

        const creditPaise = unitPricePaise * returnedUnits;
        newTotalPaise = Math.max(0, newTotalPaise - creditPaise);
        inventoryAdjustmentNote = `Restocked ${returnedUnits} unit(s) of SKU ${existingItem.variant_sku}`;
        financialAdjustmentNote = `Quantity reduced: -₹${(creditPaise / 100).toFixed(2)} customer credit recorded (pending approval)`;
      }

      // Update line item in database
      await supabase
        .from('order_items')
        .update({
          quantity: targetQty,
          total_paise: unitPricePaise * targetQty,
        })
        .eq('id', itemId);
    } else if (action === 'remove') {
      if (!itemId) {
        return NextResponse.json({ error: 'itemId is required to remove an order item' }, { status: 400 });
      }

      const existingItem = (order.order_items || []).find((i: Record<string, unknown>) => i.id === itemId);
      if (!existingItem) {
        return NextResponse.json({ error: 'Order line item not found' }, { status: 404 });
      }

      const returnedUnits = Number(existingItem.quantity || 1);
      const lineTotalPaise = Number(existingItem.total_paise || 0);

      // Return stock
      const { data: v } = await supabase
        .from('product_variants')
        .select('id, stock_quantity')
        .eq('sku', existingItem.variant_sku)
        .single();

      if (v && typeof v.stock_quantity === 'number') {
        await supabase
          .from('product_variants')
          .update({ stock_quantity: v.stock_quantity + returnedUnits })
          .eq('id', v.id);
      }

      // Delete line item
      await supabase.from('order_items').delete().eq('id', itemId);

      newTotalPaise = Math.max(0, newTotalPaise - lineTotalPaise);
      inventoryAdjustmentNote = `Restocked ${returnedUnits} unit(s) of SKU ${existingItem.variant_sku}`;
      financialAdjustmentNote = `Item removed: -₹${(lineTotalPaise / 100).toFixed(2)} customer credit recorded (pending approval)`;
    } else {
      return NextResponse.json({ error: `Invalid action '${action}'. Expected 'add', 'update_quantity', or 'remove'` }, { status: 400 });
    }

    // 5. ATOMIC Concurrency Lock on Orders Table
    const existingHistory = Array.isArray(order.status_history) ? order.status_history : [];
    const reconciliationHistoryEntry = {
      status: order.status,
      timestamp: new Date().toISOString(),
      note: `Order item correction (${action}) by ${auth.profile.full_name}. Reason: ${reason}. ${inventoryAdjustmentNote}. ${financialAdjustmentNote}`,
      staff_id: auth.user.id,
      staff_name: auth.profile.full_name,
    };

    const { data: updatedOrders, error: orderUpdateErr } = await supabase
      .from('orders')
      .update({
        total_paise: newTotalPaise,
        status_history: [...existingHistory, reconciliationHistoryEntry],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('updated_at', lastKnownUpdatedAt)
      .select('*, order_items(*)');

    if (orderUpdateErr) {
      return NextResponse.json({ error: orderUpdateErr.message }, { status: 500 });
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Concurrency conflict: Order was updated by another operator. Please reload.' },
        { status: 409 }
      );
    }

    const updatedOrder = updatedOrders[0];

    // 6. Record Audit Log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'ORDER_ITEM_RECONCILIATION',
      entityType: 'order',
      entityId: order.order_number,
      oldState: { totalPaise: order.total_paise, itemCount: (order.order_items || []).length },
      newState: { totalPaise: newTotalPaise, itemCount: (updatedOrder.order_items || []).length },
      notes: `Action: ${action}; Reason: ${reason}; ${inventoryAdjustmentNote}; ${financialAdjustmentNote}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Order items and financial reconciliation recorded successfully.',
      reconciliation: {
        inventoryAdjustmentNote,
        financialAdjustmentNote,
        newTotalPaise,
      },
      order: serializeOrderFromDb(updatedOrder),
    });
  } catch (err: unknown) {
    console.error('Order item correction error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
