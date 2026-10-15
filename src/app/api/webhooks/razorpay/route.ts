import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { finalizeOrderPayment } from '@/lib/payment-finalization';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Verify signature if secret configured
    if (webhookSecret && signature) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload?.payment?.entity || event.payload?.order?.entity;

    const supabase = getSupabaseAdminClient();

    if (supabase && payload) {
      if (eventType === 'payment.captured') {
        const razorpayOrderId = payload.order_id;
        const razorpayPaymentId = payload.id;
        const currency = payload.currency;
        const amountPaise = Number(payload.amount);

        if (!razorpayOrderId || !razorpayPaymentId) {
          return NextResponse.json({ error: 'Missing payment identifiers in webhook payload' }, { status: 400 });
        }

        if (currency && currency !== 'INR') {
          return NextResponse.json({ error: `Currency mismatch: expected INR, received ${currency}` }, { status: 400 });
        }

        // 1. Fetch order by razorpay_order_id
        const { data: order, error: orderFetchErr } = await supabase
          .from('orders')
          .select('id, order_number, total_paise, payment_status')
          .eq('razorpay_order_id', razorpayOrderId)
          .single();

        if (orderFetchErr || !order) {
          // Acknowledge webhook to avoid retries if order was created in separate environment
          return NextResponse.json({ received: true, warning: 'Order not found for razorpay_order_id' });
        }

        // 2. Route through unified idempotent finalization
        const result = await finalizeOrderPayment({
          orderNumber: order.order_number,
          razorpayOrderId,
          razorpayPaymentId,
          amountPaise: amountPaise || order.total_paise,
          eventSource: 'webhook',
        });

        return NextResponse.json({
          received: true,
          captured: !result.alreadyCaptured,
          alreadyCaptured: result.alreadyCaptured,
        });
      } else if (eventType === 'payment.failed') {
        const razorpayOrderId = payload.order_id;
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', razorpayOrderId)
          .neq('payment_status', 'captured');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
