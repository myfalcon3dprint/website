import { NextResponse } from 'next/server';
import { getRazorpayClient, isRazorpayConfigured } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

interface CartItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      items,
      amountPaise: clientAmountPaise,
    } = body;

    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing orderNumber' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    let calculatedAmountPaise = 0;

    // Server-Authoritative Price and Stock Calculation
    if (supabase) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Checkout requires a non-empty array of items for server-authoritative price validation.' },
          { status: 400 }
        );
      }

      let subtotal = 0;

      for (const item of items as CartItemInput[]) {
        if (!item.variantId || typeof item.variantId !== 'string') {
          return NextResponse.json({ error: 'Each item must have a valid variantId' }, { status: 400 });
        }

        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty <= 0 || !Number.isFinite(qty)) {
          return NextResponse.json(
            { error: `Item quantity for variant '${item.variantId}' must be a finite, positive integer.` },
            { status: 400 }
          );
        }

        const { data: variant, error: varError } = await supabase
          .from('product_variants')
          .select('id, sku, is_active, price_adjustment_paise, stock_quantity, products(id, name, base_price_paise, availability, is_published)')
          .eq('id', item.variantId)
          .single();

        if (varError || !variant) {
          return NextResponse.json(
            { error: `Variant ID '${item.variantId}' is no longer available in catalog.` },
            { status: 400 }
          );
        }

        if (variant.is_active === false) {
          return NextResponse.json(
            { error: `Variant '${variant.sku}' is currently inactive.` },
            { status: 400 }
          );
        }

        const parentProduct = Array.isArray(variant.products)
          ? (variant.products[0] as Record<string, unknown> | undefined)
          : (variant.products as unknown as Record<string, unknown> | undefined);

        if (!parentProduct || parentProduct.is_published !== true) {
          return NextResponse.json(
            { error: `Product '${parentProduct?.name || item.productId}' is currently unpublished.` },
            { status: 400 }
          );
        }

        // Validate stock with active reservation deduplication
        const isReadyStock = parentProduct.availability === 'in_stock';
        if (isReadyStock) {
          const { data: activeReservations } = await supabase
            .from('stock_reservations')
            .select('quantity')
            .eq('variant_id', item.variantId)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());

          const reservedQty = (activeReservations || []).reduce(
            (sum, r) => sum + (Number(r.quantity) || 0),
            0
          );
          const availableStock = Math.max(0, (variant.stock_quantity || 0) - reservedQty);

          if (availableStock < qty) {
            return NextResponse.json(
              {
                error: `Insufficient available inventory for '${variant.sku}'. In-stock units: ${variant.stock_quantity}, currently reserved: ${reservedQty}. Available: ${availableStock}. Requested: ${qty}.`,
              },
              { status: 400 }
            );
          }
        }

        const basePrice = Number(parentProduct.base_price_paise || 0);
        const adjustment = Number(variant.price_adjustment_paise || 0);
        const unitPrice = Math.max(0, basePrice + adjustment);
        subtotal += unitPrice * qty;
      }

      // Record temporary checkout reservation (15-minute hold)
      for (const item of items as CartItemInput[]) {
        try {
          await supabase.from('stock_reservations').insert({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            status: 'active',
          });
        } catch {
          // Ignores reservation insertion error if table is unmigrated in dev
        }
      }

      // Delivery fee: Free for orders >= ₹999 (99900 paise); otherwise ₹99 (9900 paise)
      const deliveryFee = subtotal >= 99900 || subtotal === 0 ? 0 : 9900;
      calculatedAmountPaise = subtotal + deliveryFee;
    } else {
      // Fallback in test simulation when database unconfigured
      calculatedAmountPaise = Math.round(Number(clientAmountPaise || 0));
    }

    if (calculatedAmountPaise <= 0) {
      return NextResponse.json(
        { error: 'Calculated order total must be greater than zero.' },
        { status: 400 }
      );
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_simulation';

    if (isRazorpayConfigured()) {
      const razorpay = getRazorpayClient();
      if (!razorpay) {
        throw new Error('Razorpay client initialization failed');
      }

      const options = {
        amount: calculatedAmountPaise,
        currency: 'INR',
        receipt: orderNumber.slice(0, 40),
        notes: {
          falconOrder: orderNumber,
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
        },
      };

      const order = await razorpay.orders.create(options);

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        isSimulated: false,
      });
    }

    // Fallback: Sandbox / Simulation response for development without credentials
    const simulatedOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return NextResponse.json({
      orderId: simulatedOrderId,
      amount: calculatedAmountPaise,
      currency: 'INR',
      keyId,
      isSimulated: true,
      message: 'Running in simulated sandbox mode (Razorpay test keys not configured in .env.local)',
    });
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
