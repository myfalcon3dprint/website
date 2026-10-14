import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { Order } from '@/lib/types';

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ orders: [], isLiveDb: false });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data, isLiveDb: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const order: Order = await request.json();
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        savedToDatabase: false,
        message: 'Order saved to local client store (Supabase credentials not configured in .env.local)',
      });
    }

    // Insert order header
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          id: order.id.startsWith('ord-') ? undefined : order.id,
          order_number: order.orderNumber,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
          shipping_address: order.shippingAddress,
          subtotal_paise: order.subtotalPaise,
          shipping_paise: order.shippingPaise,
          tax_paise: order.taxPaise,
          total_paise: order.totalPaise,
          currency: 'INR',
          status: order.status,
          payment_status: order.paymentStatus,
          payment_method: order.paymentMethod,
          razorpay_payment_id: order.razorpayPaymentId || null,
          status_history: order.statusHistory,
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
        quantity: item.quantity,
        unit_price_paise: item.unitPricePaise,
        total_paise: item.totalPricePaise,
        stock_type: item.stockType,
        production_status: item.stockType === 'ready_stock' ? 'not_applicable' : 'queued',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) {
        console.warn('Supabase order_items insert warning:', itemsError);
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
