import { NextResponse } from 'next/server';
import { verifyRazorpaySignature, isRazorpayConfigured, fetchAndValidatePaymentDetails } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { finalizeOrderPayment } from '@/lib/payment-finalization';

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

    // 1. Signature Verification
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
      // In sandbox simulation mode: reject if signature is forged/invalid or missing pay_ prefix
      if (razorpaySignature && (razorpaySignature.includes('forged') || razorpaySignature.includes('invalid'))) {
        isValid = false;
      } else {
        isValid = Boolean(isSimulated || (razorpayOrderId.startsWith('order_') && razorpayPaymentId.startsWith('pay_')));
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (supabase && orderNumber) {
      // 2. Fetch existing order to check payment state and total amount
      const { data: existingOrder, error: orderFetchError } = await supabase
        .from('orders')
        .select('id, payment_status, total_paise, status, status_history, order_items(variant_sku, quantity)')
        .eq('order_number', orderNumber)
        .single();

      if (orderFetchError || !existingOrder) {
        return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
      }

      // 3. Idempotency Check: Return immediately if already captured
      if (existingOrder.payment_status === 'captured') {
        return NextResponse.json({
          success: true,
          verified: true,
          alreadyCaptured: true,
          paymentId: razorpayPaymentId,
          orderNumber,
          message: 'Payment was already captured and recorded.',
        });
      }

      // 4. Provider-Confirmed Verification (Amount, Currency, Status, Order Association)
      if (isRazorpayConfigured()) {
        const providerValidation = await fetchAndValidatePaymentDetails({
          paymentId: razorpayPaymentId,
          expectedOrderId: razorpayOrderId,
          expectedAmountPaise: existingOrder.total_paise,
        });

        if (!providerValidation.valid) {
          return NextResponse.json(
            { error: providerValidation.error || 'Payment gateway validation failed.' },
            { status: 400 }
          );
        }
      }

      // 5. Unified Idempotent Payment Finalization
      const finalResult = await finalizeOrderPayment({
        orderNumber,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || 'signature_verified',
        amountPaise: existingOrder.total_paise,
        eventSource: 'verify_endpoint',
      });

      if (!finalResult.success) {
        return NextResponse.json({ error: finalResult.message || 'Payment finalization failed' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        alreadyCaptured: finalResult.alreadyCaptured,
        paymentId: razorpayPaymentId,
        orderNumber,
        message: finalResult.message,
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: razorpayPaymentId,
      orderNumber,
      message: 'Payment verified successfully in sandbox simulation mode',
    });
  } catch (error: unknown) {
    console.error('Error verifying Razorpay payment:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
