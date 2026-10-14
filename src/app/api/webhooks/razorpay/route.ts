import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

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

        await supabase
          .from('orders')
          .update({
            payment_status: 'captured',
            status: 'confirmed',
            razorpay_payment_id: razorpayPaymentId,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', razorpayOrderId);
      } else if (eventType === 'payment.failed') {
        const razorpayOrderId = payload.order_id;
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', razorpayOrderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
