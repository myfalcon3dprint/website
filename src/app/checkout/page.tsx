'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, useOrders } from '@/lib/store';
import { formatINR, calculateShippingFeePaise, calculateTaxPaise } from '@/lib/money';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';
import {
  ShieldCheck,
  Truck,
  Lock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Building,
} from 'lucide-react';

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

  // Validation helpers for tactile inline feedback
  const isEmailValid = email.trim().length > 3 && email.includes('@') && email.includes('.');
  const isPhoneValid = form.phone.replace(/\D/g, '').length === 10;
  const isPinValid = form.pinCode.trim().length === 6 && /^\d+$/.test(form.pinCode.trim());
  const isNameValid = form.fullName.trim().length >= 3;
  const isAddressValid = form.addressLine1.trim().length >= 5;

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

    if (!isNameValid) {
      setErrorMessage('Please enter your full recipient name');
      return;
    }
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address for receipt dispatch');
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit Indian phone number (+91)');
      return;
    }
    if (!isAddressValid) {
      setErrorMessage('Please enter complete street address for courier delivery');
      return;
    }
    if (!isPinValid) {
      setErrorMessage('Please enter a valid 6-digit postal PIN code');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your shopping cart is currently empty');
      return;
    }

    setIsSubmitting(true);

    const orderItems: OrderItem[] = cart.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: item.product.id,
      productTitle: item.product.title,
      variantSku: item.variant.sku,
      variantDetails: `${item.variant.title} (${item.variant.color} • ${item.variant.material} • ${item.variant.finish})`,
      unitPricePaise: item.variant.pricePaise,
      quantity: item.quantity,
      totalPricePaise: item.variant.pricePaise * item.quantity,
      stockType: item.product.stockType,
      itemStatus: item.product.stockType === 'ready_stock' ? 'confirmed' : 'queued',
      variantImage: item.variant.image || item.product.images[0],
    }));

    const orderNum = `FAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = `ord-${Date.now()}`;

    // 1. Cash on Delivery (Local Nashik handoff)
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
          items: cart.map((item) => ({
            productId: item.product.id,
            variantId: item.variant.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initialize payment gateway order');
      }

      const orderData = await orderRes.json();
      const { orderId, amount, keyId, isSimulated } = orderData;

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
          image: '/logo.png',
          order_id: orderId,
          prefill: {
            name: form.fullName,
            email,
            contact: form.phone,
          },
          theme: {
            color: '#E8590C',
            backdrop_color: 'rgba(26, 24, 22, 0.85)',
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
        // Fallback for simulation / sandbox mode
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
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <h1 className="font-editorial" style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Your Shopping Bag is Empty
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.92rem' }}>
          Select products from the studio catalog before proceeding to checkout.
        </p>
        <Link href="/catalog" className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      {/* Editorial Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          marginBottom: '1.75rem',
        }}
      >
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <ChevronRight size={13} />
        <Link href="/cart" style={{ color: 'var(--text-secondary)' }}>Bag</Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Checkout</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2.25rem' }}>
        <h1
          className="font-editorial"
          style={{
            fontSize: '2.35rem',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            margin: '0 0 0.4rem',
            letterSpacing: '-0.02em',
          }}
        >
          Secure Checkout
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
          Provide your India delivery address and authorize order processing.
        </p>
      </div>

      <form
        onSubmit={handleSubmitOrder}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Left Column: Delivery Form & Payment Selection */}
        <div>
          {/* Destination Card */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <Truck size={18} style={{ color: 'var(--brand-accent)' }} />
              <span>1. Shipping Destination (India)</span>
            </h2>

            {errorMessage && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--status-danger)',
                  fontSize: '0.84rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Recipient Full Name *
                  </label>
                  {isNameValid && <span style={{ fontSize: '0.74rem', color: 'var(--status-ready)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={12} /> Valid</span>}
                </div>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="input"
                  placeholder="e.g. Aarav Deshmukh"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  style={{ borderColor: isNameValid ? 'var(--status-ready)' : undefined }}
                />
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Email Address *
                    </label>
                    {isEmailValid && <span style={{ fontSize: '0.74rem', color: 'var(--status-ready)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={12} /> Valid</span>}
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                    placeholder="aarav@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ borderColor: isEmailValid ? 'var(--status-ready)' : undefined }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Mobile Number (+91) *
                    </label>
                    {isPhoneValid && <span style={{ fontSize: '0.74rem', color: 'var(--status-ready)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={12} /> Valid</span>}
                  </div>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    className="input"
                    placeholder="98506 07144"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{ borderColor: isPhoneValid ? 'var(--status-ready)' : undefined }}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Street Address & Flat / House No *
                  </label>
                  {isAddressValid && <span style={{ fontSize: '0.74rem', color: 'var(--status-ready)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={12} /> Valid</span>}
                </div>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  className="input"
                  placeholder="Flat 302, Sai Vihar, College Road"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  style={{ borderColor: isAddressValid ? 'var(--status-ready)' : undefined }}
                />
              </div>

              {/* City, State, PIN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                    City *
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
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                    State *
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      PIN Code *
                    </label>
                    {isPinValid && <span style={{ fontSize: '0.74rem', color: 'var(--status-ready)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={12} /> Valid</span>}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoComplete="postal-code"
                    className="input tabular-num"
                    placeholder="422009"
                    value={form.pinCode}
                    onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                    style={{ borderColor: isPinValid ? 'var(--status-ready)' : undefined }}
                  />
                </div>
              </div>

              {/* Local Nashik Detection Note */}
              {form.pinCode.startsWith('422') && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'var(--status-ready-bg)',
                    border: '1px solid var(--status-ready-border)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.78rem',
                    color: 'var(--status-ready)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Building size={14} />
                  <span>Nashik Studio Zone Detected: Eligible for complimentary local delivery or CIDCO pickup.</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <CreditCard size={18} style={{ color: 'var(--brand-accent)' }} />
              <span>2. Payment Method</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Razorpay Gateway */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentMethod === 'Razorpay UPI/Card' ? 'var(--surface-alt)' : 'var(--surface)',
                  border: paymentMethod === 'Razorpay UPI/Card' ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 140ms ease',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Razorpay UPI/Card'}
                  onChange={() => setPaymentMethod('Razorpay UPI/Card')}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--brand-accent)' }}
                />
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Razorpay Gateway (UPI, Google Pay, PhonePe, Cards, NetBanking)
                  </span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0, lineHeight: 1.45 }}>
                    Instant settlement via UPI QR, mobile apps, or domestic debit/credit cards. Sandboxed testing active.
                  </p>
                </div>
              </label>

              {/* COD / Nashik Handoff */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentMethod === 'Cash on Delivery (Local Nashik)' ? 'var(--surface-alt)' : 'var(--surface)',
                  border: paymentMethod === 'Cash on Delivery (Local Nashik)' ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 140ms ease',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Cash on Delivery (Local Nashik)'}
                  onChange={() => setPaymentMethod('Cash on Delivery (Local Nashik)')}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--brand-accent)' }}
                />
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Cash on Delivery / Studio Pickup (Nashik Only)
                  </span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0, lineHeight: 1.45 }}>
                    Settle upon collection at our CIDCO workshop or upon verified local Nashik delivery handoff.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '5.5rem', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="font-editorial" style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Order Review ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </h2>

            {/* Scrollable mini items review */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                marginBottom: '1.25rem',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '0.25rem',
              }}
            >
              {cart.map((item) => {
                const itemImg = item.variant.image || item.product.images[0] || '';
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        background: '#F3EFE6',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {itemImg ? (
                        <Image
                          src={itemImg}
                          alt={`${item.product.title} - ${item.variant.title}`}
                          fill
                          sizes="60px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          3D
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.86rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product.title}
                      </p>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0', fontWeight: 500 }}>
                        {item.variant.title}
                      </p>
                      <p className="tabular-num" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                        Qty: {item.quantity} × {formatINR(item.variant.pricePaise)}
                      </p>
                    </div>
                    <span className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.92rem', flexShrink: 0 }}>
                      {formatINR(item.variant.pricePaise * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span className="tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatINR(subtotalPaise)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping ({form.pinCode.startsWith('422') ? 'Nashik Flat' : 'Domestic Courier'})</span>
                <span style={{ color: shippingPaise === 0 ? 'var(--status-ready)' : 'var(--text-primary)', fontWeight: shippingPaise === 0 ? 700 : 500 }}>
                  {shippingPaise === 0 ? 'FREE' : formatINR(shippingPaise)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Included GST (18%)</span>
                <span className="tabular-num">{formatINR(taxPaise)}</span>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  marginTop: '0.35rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                <span>Total Due</span>
                <span className="tabular-num">{formatINR(totalPaise)}</span>
              </div>
            </div>

            {/* Authorize & Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.9rem',
                fontSize: '0.98rem',
                height: '3.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Lock size={16} />
              <span>{isSubmitting ? 'Authorizing Payment...' : `Complete Order • ${formatINR(totalPaise)}`}</span>
            </button>

            <div style={{ marginTop: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--status-ready)' }} />
              <span>256-bit encrypted checkout • Zero unexpected fees</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
