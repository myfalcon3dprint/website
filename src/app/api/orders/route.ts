import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getAuthenticatedUserSession } from '@/lib/supabase/server';
import { serializeOrderFromDb } from '@/lib/serializers';
import { Order } from '@/lib/types';
import { AdminDataService } from '@/lib/adminDataStore';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  // Defense-in-depth: Require authenticated session
  const session = await getAuthenticatedUserSession();
  if (!session.user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required. Please sign in.' },
      { status: 401 }
    );
  }

  // RBAC: If caller is staff, enforce orders:view permission (denies catalog_editor & production_operator)
  if (session.isStaff && !hasPermission(session.profile?.role, 'orders:view')) {
    return NextResponse.json(
      { error: `Forbidden: Role '${session.profile?.role}' does not have permission to view store orders.` },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();
  const sku = searchParams.get('sku')?.trim();
  const product = searchParams.get('product')?.trim();

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    let allOrders = AdminDataService.getOrders();
    if (!session.isStaff) {
      allOrders = allOrders.filter(
        (o) => o.customerEmail === session.user?.email || o.userId === session.user?.id
      );
    }
    if (status && status !== 'all') {
      allOrders = allOrders.filter((o) => o.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      allOrders = allOrders.filter((o) => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    if (sku) {
      allOrders = allOrders.filter((o) => o.items.some((i) => i.variantSku.toLowerCase().includes(sku.toLowerCase())));
    }
    if (product) {
      allOrders = allOrders.filter((o) => o.items.some((i) => i.productTitle.toLowerCase().includes(product.toLowerCase())));
    }

    const totalCount = allOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const paginated = allOrders.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      orders: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      isLiveDb: false,
    });
  }
  try {

    // Query order_items to resolve SKU and product filter matches across multi-item orders
    let matchedOrderIds: string[] | null = null;
    if (sku || product) {
      let itemQuery = supabase.from('order_items').select('order_id');
      if (sku) {
        itemQuery = itemQuery.ilike('variant_sku', `%${sku}%`);
      }
      if (product) {
        itemQuery = itemQuery.or(`product_title.ilike.%${product}%,variant_sku.ilike.%${product}%`);
      }
      const { data: matchedRows } = await itemQuery;
      matchedOrderIds = Array.from(new Set((matchedRows || []).map((r) => r.order_id)));

      if (matchedOrderIds.length === 0) {
        return NextResponse.json({
          orders: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
          },
          isLiveDb: true,
        });
      }
    }

    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' });

    if (matchedOrderIds !== null) {
      query = query.in('id', matchedOrderIds);
    }

    // Customer Isolation: If caller is not staff, restrict to their own orders only
    if (!session.isStaff) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id);
      if (isUuid) {
        query = query.or(`user_id.eq.${session.user.id},customer_email.eq.${session.user.email}`);
      } else {
        query = query.eq('customer_email', session.user.email);
      }
    } else {
      // Staff filter: can filter by status and search
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        const { data: searchItemRows } = await supabase
          .from('order_items')
          .select('order_id')
          .or(`product_title.ilike.%${search}%,variant_sku.ilike.%${search}%`);
        const itemOrderIds = (searchItemRows || []).map((r) => r.order_id);

        if (itemOrderIds.length > 0) {
          query = query.or(
            `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,id.in.(${itemOrderIds.join(',')})`
          );
        } else {
          query = query.or(
            `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`
          );
        }
      }
    }

    // Apply bounded pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to query orders from database:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const orders: Order[] = (data || []).map((row) => serializeOrderFromDb(row));
    const totalCount = count ?? orders.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      isLiveDb: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order: Partial<Order> = body;

    if (!order.orderNumber || !order.customerName || !order.customerPhone || !order.shippingAddress) {
      return NextResponse.json(
        { error: 'Missing mandatory order fields (orderNumber, customerName, customerPhone, shippingAddress)' },
        { status: 400 }
      );
    }

    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty <= 0 || !Number.isFinite(qty)) {
          return NextResponse.json(
            { error: `Order item '${item.productTitle || item.variantSku}' must have a finite, positive integer quantity.` },
            { status: 400 }
          );
        }
        if (typeof item.unitPricePaise === 'number' && item.unitPricePaise < 0) {
          return NextResponse.json(
            { error: 'Item unit price cannot be negative' },
            { status: 400 }
          );
        }
      }
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const newOrder: Order = {
        id: order.id || `ord-${Date.now()}`,
        orderNumber: order.orderNumber || `FAL-MAN-${Date.now().toString().slice(-6)}`,
        customerName: order.customerName || 'Walk-in Customer',
        customerEmail: order.customerEmail || 'orders@falcon3dprints.com',
        customerPhone: order.customerPhone || '+91 98506 07144',
        shippingAddress: order.shippingAddress || {
          fullName: order.customerName || 'Customer',
          phone: order.customerPhone || '',
          addressLine1: 'Studio Pickup, Sector 4, CIDCO',
          city: 'Nashik',
          state: 'Maharashtra',
          pinCode: '422009',
        },
        items: (order.items || []).map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          productId: it.productId || `prod-custom-${idx}`,
          productTitle: it.productTitle || 'Custom Print Job',
          variantSku: it.variantSku || 'FAL-CUSTOM-PLA',
          variantDetails: it.variantDetails || 'PLA Standard',
          unitPricePaise: it.unitPricePaise || 0,
          quantity: it.quantity || 1,
          totalPricePaise: it.totalPricePaise || (it.unitPricePaise || 0) * (it.quantity || 1),
          stockType: it.stockType || 'made_to_order',
          itemStatus: (order.status as any) || 'confirmed',
        })),
        subtotalPaise: order.subtotalPaise || 0,
        shippingPaise: order.shippingPaise || 0,
        taxPaise: order.taxPaise || 0,
        totalPaise: order.totalPaise || 0,
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'Razorpay UPI/Card',
        status: order.status || 'confirmed',
        statusHistory: [
          {
            status: order.status || 'confirmed',
            timestamp: new Date().toISOString(),
            note: 'Order placed by studio staff',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      AdminDataService.addOrder(newOrder);

      return NextResponse.json({
        success: true,
        orderId: newOrder.id,
        savedToDatabase: false,
        order: newOrder,
        message: 'Order created and persisted in local store.',
      });
    }

    // Insert order header
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_number: order.orderNumber,
          customer_name: order.customerName,
          customer_email: order.customerEmail || '',
          customer_phone: order.customerPhone,
          shipping_address: order.shippingAddress,
          subtotal_paise: Math.max(0, order.subtotalPaise || 0),
          shipping_paise: Math.max(0, order.shippingPaise || 0),
          tax_paise: Math.max(0, order.taxPaise || 0),
          total_paise: Math.max(1, order.totalPaise || 0),
          currency: 'INR',
          status: order.status || 'confirmed',
          payment_status: order.paymentStatus || 'pending',
          payment_method: order.paymentMethod || 'Razorpay UPI/Card',
          razorpay_payment_id: order.razorpayPaymentId || null,
          status_history: order.statusHistory || [
            {
              status: order.status || 'confirmed',
              timestamp: new Date().toISOString(),
              note: 'Order placed',
            },
          ],
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Supabase order insert error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Insert order items
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map((item) => ({
        order_id: orderData.id,
        product_title: item.productTitle,
        variant_sku: item.variantSku,
        variant_details: item.variantDetails,
        quantity: Math.max(1, item.quantity),
        unit_price_paise: Math.max(0, item.unitPricePaise),
        total_paise: Math.max(0, item.totalPricePaise),
        stock_type: item.stockType || 'ready_stock',
        production_status: item.stockType === 'ready_stock' ? 'not_applicable' : 'queued',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) {
        console.error('Supabase order_items insert failed, executing rollback:', itemsError);
        // Rollback: Delete the orphaned order row
        await supabase.from('orders').delete().eq('id', orderData.id);
        return NextResponse.json(
          { error: `Database write failed for order items: ${itemsError.message}. Order creation rolled back.` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      orderNumber: order.orderNumber,
      savedToDatabase: true,
    });
  } catch (err: unknown) {
    console.error('Order creation API error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
