'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useOrders } from '@/lib/store';
import { formatINR, calculateShippingFeePaise, calculateTaxPaise } from '@/lib/money';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';
import { ShieldCheck, Truck, Lock, CreditCard, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotalPaise, clearCart } = useCart();
  const { addOrder } = useOrders();

  const [form, setForm] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Nashik',
    state: 'Maharashtra',
    pinCode: '422009',
  });

  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay UPI/Card' | 'Cash on Delivery (Local Nashik)'>('Razorpay UPI/Card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const shippingPaise = calculateShippingFeePaise(subtotalPaise, form.pinCode);
  const taxPaise = calculateTaxPaise(subtotalPaise);
  const totalPaise = subtotalPaise + shippingPaise;

  const finalizeOrder = async (
    orderNum: string,
    newOrderId: string,
    orderItems: OrderItem[],
    paymentId?: string,
    paymentStatus: Order['paymentStatus'] = 'captured'
  ) => {
    const newOrder: Order = {
      id: newOrderId,
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
      customerName: form.fullName,
      customerEmail: email,
      customerPhone: form.phone,
      shippingAddress: { ...form },
      items: orderItems,
      subtotalPaise,
      shippingPaise,
      taxPaise,
      totalPaise,
      paymentStatus,
      paymentMethod,
      razorpayPaymentId: paymentId,
      status: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: `Order authorized via ${paymentMethod} (${formatINR(totalPaise)})`,
        },
      ],
    };

    addOrder(newOrder);
    clearCart();
    setIsSubmitting(false);
    router.push(`/account/orders/${newOrderId}`);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Form validations
    if (!form.fullName.trim()) {
      setErrorMessage('Please enter your full recipient name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian phone number (+91)');
      return;
    }
    if (!form.addressLine1.trim()) {
      setErrorMessage('Please enter your delivery street address');
      return;
    }
    if (!form.pinCode.trim() || form.pinCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your shopping cart is empty');
      return;
    }

    setIsSubmitting(true);

    // Build Order Items
    const orderItems: OrderItem[] = cart.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: item.product.id,
      productTitle: item.product.title,
      variantSku: item.variant.sku,
      variantDetails: item.variant.title,
      unitPricePaise: item.variant.pricePaise,
      quantity: item.quantity,
      totalPricePaise: item.variant.pricePaise * item.quantity,
      stockType: item.product.stockType,
      itemStatus: item.product.stockType === 'ready_stock' ? 'confirmed' : 'queued',
    }));

    // Generate Order Number
    const orderNum = `FAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = `ord-${Date.now()}`;

    // 1. Cash on Delivery (Local Nashik pickup / handoff)
    if (paymentMethod === 'Cash on Delivery (Local Nashik)') {
      await finalizeOrder(orderNum, newOrderId, orderItems, undefined, 'pending');
      return;
    }

    // 2. Razorpay Gateway flow
    try {
      const orderRes = await fetch('/api/checkout/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaise: totalPaise,
          orderNumber: orderNum,
          customerName: form.fullName,
          customerEmail: email,
          customerPhone: form.phone,
        }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initialize payment gateway order');
      }

      const orderData = await orderRes.json();
      const { orderId, amount, keyId, isSimulated } = orderData;

      // Try loading Razorpay client SDK
      const { loadRazorpayScript } = await import('@/lib/razorpay-checkout');
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && typeof (window as unknown as { Razorpay: unknown }).Razorpay === 'function') {
        const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const rzp = new RazorpayConstructor({
          key: keyId,
          amount,
          currency: 'INR',
          name: 'Falcon 3D Prints',
          description: `Custom Additive Fabrication — Order ${orderNum}`,
          image: '/products/planter-orange-variant.jpg',
          order_id: orderId,
          prefill: {
            name: form.fullName,
            email,
            contact: form.phone,
          },
          theme: {
            color: '#FF5722',
            backdrop_color: 'rgba(11, 15, 25, 0.85)',
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderNumber: orderNum,
                  isSimulated,
                }),
              });

              if (!verifyRes.ok) {
                throw new Error('Payment verification signature check failed');
              }

              await finalizeOrder(orderNum, newOrderId, orderItems, response.razorpay_payment_id, 'captured');
            } catch (err: unknown) {
              setIsSubmitting(false);
              setErrorMessage(err instanceof Error ? err.message : 'Payment verification error');
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setErrorMessage('Payment authorization was cancelled by user');
            },
          },
        });

        rzp.open();
      } else {
        // Fallback for simulation / sandbox mode when script is blocked or offline
        const simulatedPaymentId = `pay_sim_${Date.now()}`;
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: orderId,
            razorpayPaymentId: simulatedPaymentId,
            razorpaySignature: 'simulated_test_sig',
            orderNumber: orderNum,
            isSimulated: true,
          }),
        });

        if (!verifyRes.ok) {
          throw new Error('Payment simulation verification failed');
        }

        await finalizeOrder(orderNum, newOrderId, orderItems, simulatedPaymentId, 'captured');
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Payment authorization failed');
    }
  };

  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your Cart is Empty</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Please select items from the studio catalog before proceeding to checkout.
        </p>
        <button onClick={() => router.push('/catalog')} className="btn-primary">
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Checkout & Order Details
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Complete your delivery destination in India and authorize settlement.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Delivery Details */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={18} style={{ color: 'var(--brand-accent)' }} />
              Shipping Destination (India)
            </h2>

            {errorMessage && (
              <div style={{ padding: '0.75rem', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', borderRadius: 'var(--radius-xs)', color: 'var(--status-danger)', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="input"
                  placeholder="e.g. Aarav Deshmukh"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                    Mobile Number * (+91)
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    className="input"
                    placeholder="98506 07144"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                  Street Address / Flat No *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  className="input"
                  placeholder="Flat 302, Sai Vihar, College Road"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="address-level2"
                    className="input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                    State
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="address-level1"
                    className="input"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoComplete="postal-code"
                    className="input"
                    placeholder="422009"
                    value={form.pinCode}
                    onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                  />
                </div>
              </div>

              {form.pinCode.startsWith('422') && (
                <div style={{ padding: '0.45rem 0.65rem', background: 'var(--status-ready-bg)', border: '1px solid var(--status-ready-border)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', color: 'var(--status-ready)', fontWeight: 600 }}>
                  Nashik Local Hub Detected: Eligible for free local handoff or CIDCO studio pickup.
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="card">
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CreditCard size={18} style={{ color: 'var(--brand-accent)' }} />
              Payment Method
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-xs)',
                  background: paymentMethod === 'Razorpay UPI/Card' ? 'var(--surface-alt)' : 'var(--surface)',
                  border: paymentMethod === 'Razorpay UPI/Card' ? '1px solid var(--action-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Razorpay UPI/Card'}
                  onChange={() => setPaymentMethod('Razorpay UPI/Card')}
                />
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Razorpay Gateway (UPI, GPay, PhonePe, Cards, NetBanking)
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', margin: 0 }}>
                    Sandboxed local preview mode active. Zero test charges.
                  </p>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-xs)',
                  background: paymentMethod === 'Cash on Delivery (Local Nashik)' ? 'var(--surface-alt)' : 'var(--surface)',
                  border: paymentMethod === 'Cash on Delivery (Local Nashik)' ? '1px solid var(--action-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Cash on Delivery (Local Nashik)'}
                  onChange={() => setPaymentMethod('Cash on Delivery (Local Nashik)')}
                />
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Cash on Delivery / Studio Pickup (Nashik)
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', margin: 0 }}>
                    Pay upon pickup at our CIDCO workshop or local Nashik handoff.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '5.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Order Summary ({cart.length} items)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '260px', overflowY: 'auto' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div style={{ paddingRight: '0.5rem' }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>{item.product.title}</p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                      {item.variant.title} × {item.quantity}
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {formatINR(item.variant.pricePaise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatINR(subtotalPaise)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping ({form.pinCode.startsWith('422') ? 'Nashik Flat' : 'Rest of India'})</span>
                <span style={{ color: shippingPaise === 0 ? 'var(--status-ready)' : 'var(--text-primary)', fontWeight: shippingPaise === 0 ? 600 : 400 }}>
                  {shippingPaise === 0 ? 'FREE' : formatINR(shippingPaise)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Included GST (18%)</span>
                <span>{formatINR(taxPaise)}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span>Total Due</span>
                <span>{formatINR(totalPaise)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              <Lock size={16} />
              <span>{isSubmitting ? 'Processing Authorization...' : `Pay ${formatINR(totalPaise)}`}</span>
            </button>

            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <ShieldCheck size={13} style={{ color: 'var(--status-ready)' }} />
              <span>Verified sandbox checkout • Zero test cards charged</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
