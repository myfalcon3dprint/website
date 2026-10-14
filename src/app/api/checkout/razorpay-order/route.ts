import { NextResponse } from 'next/server';
import { getRazorpayClient, isRazorpayConfigured } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amountPaise, orderNumber, customerName, customerEmail, customerPhone } = body;

    if (!amountPaise || typeof amountPaise !== 'number' || amountPaise <= 0) {
      return NextResponse.json(
        { error: 'Invalid or missing amountPaise (must be a positive integer in paise)' },
        { status: 400 }
      );
    }

    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing orderNumber' },
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
        amount: Math.round(amountPaise),
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
      amount: Math.round(amountPaise),
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
