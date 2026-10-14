import { NextResponse } from 'next/server';
import { verifyRazorpaySignature, isRazorpayConfigured } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderNumber,
      isSimulated,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment identification parameters' },
        { status: 400 }
      );
    }

    let isValid = false;

    if (isRazorpayConfigured()) {
      if (!razorpaySignature) {
        return NextResponse.json(
          { error: 'Missing razorpaySignature for signature verification' },
          { status: 400 }
        );
      }
      isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    } else {
      // In sandbox/development simulation mode, verify simulated credentials
      isValid = Boolean(isSimulated || razorpayOrderId.startsWith('order_'));
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // If Supabase is connected, update order payment status in database
    const supabase = getSupabaseAdminClient();
    if (supabase && orderNumber) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'captured',
          status: 'confirmed',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature || 'simulated',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: razorpayPaymentId,
      orderNumber,
      message: 'Payment verified and captured successfully',
    });
  } catch (error: unknown) {
    console.error('Error verifying Razorpay payment:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
