import crypto from 'crypto';
import Razorpay from 'razorpay';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

export const isRazorpayConfigured = (): boolean => {
  return Boolean(keyId && keySecret && keyId.startsWith('rzp_'));
};

/**
 * Returns Razorpay SDK instance if server secrets are configured.
 */
export function getRazorpayClient(): Razorpay | null {
  if (!isRazorpayConfigured()) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Verifies Razorpay HMAC SHA256 payment signature server-side.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!keySecret) {
    // If running in development sandbox simulation without real credentials
    return razorpayOrderId.startsWith('order_') && razorpayPaymentId.startsWith('pay_');
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
}

/**
 * Verifies Razorpay Webhook signature server-side.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

export interface PaymentValidationResult {
  valid: boolean;
  error?: string;
  providerDetails?: {
    id: string;
    orderId: string;
    amountPaise: number;
    currency: string;
    status: string;
  };
}

/**
 * Validates payment directly against the Razorpay API to confirm provider-confirmed amount,
 * currency, captured status, and order association.
 */
export async function fetchAndValidatePaymentDetails({
  paymentId,
  expectedOrderId,
  expectedAmountPaise,
}: {
  paymentId: string;
  expectedOrderId: string;
  expectedAmountPaise?: number;
}): Promise<PaymentValidationResult> {
  const client = getRazorpayClient();
  if (!client) {
    // Development sandbox simulation mode
    return {
      valid: true,
      providerDetails: {
        id: paymentId,
        orderId: expectedOrderId,
        amountPaise: expectedAmountPaise || 0,
        currency: 'INR',
        status: 'captured',
      },
    };
  }

  try {
    const payment = await (client.payments as unknown as { fetch: (id: string) => Promise<Record<string, unknown>> }).fetch(paymentId);
    if (!payment) {
      return { valid: false, error: 'Payment not found on payment gateway' };
    }

    const providerOrderId = String(payment.order_id || '');
    if (providerOrderId !== expectedOrderId) {
      return {
        valid: false,
        error: `Payment order mismatch: gateway payment is associated with order '${providerOrderId}', expected '${expectedOrderId}'`,
      };
    }

    const currency = String(payment.currency || '');
    if (currency !== 'INR') {
      return { valid: false, error: `Invalid currency: expected 'INR', gateway returned '${currency}'` };
    }

    const status = String(payment.status || '');
    if (status !== 'captured') {
      return {
        valid: false,
        error: status === 'authorized'
          ? 'Payment is authorized but pending gateway capture confirmation.'
          : `Payment is not in captured status: currently '${status}'`,
      };
    }

    const amount = Number(payment.amount || 0);
    if (expectedAmountPaise !== undefined && amount !== expectedAmountPaise) {
      return {
        valid: false,
        error: `Payment amount mismatch: gateway received ${amount} paise, order expected ${expectedAmountPaise} paise`,
      };
    }

    return {
      valid: true,
      providerDetails: {
        id: String(payment.id),
        orderId: providerOrderId,
        amountPaise: amount,
        currency,
        status,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown gateway error';
    return { valid: false, error: `Failed to verify payment with Razorpay gateway: ${message}` };
  }
}
