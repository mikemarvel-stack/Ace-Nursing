import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '../store';
import { paymentAPI } from '../api';

function StepDot({ n, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, background: done ? '#059669' : active ? 'var(--navy)' : 'var(--border)', color: done || active ? '#fff' : 'var(--muted)', transition: 'all 0.3s', flexShrink: 0 }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? 'var(--navy)' : 'var(--muted)' }}>
        {n === 1 ? 'Contact' : n === 2 ? 'Payment' : 'Review'}
      </span>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [{ isPending }] = usePayPalScriptReducer();

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('paypal');
  const [internalOrderId, setInternalOrderId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'Kenya',
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 className="serif" style={{ color: 'var(--navy)', fontSize: 32, marginBottom: 12 }}>Your cart is empty</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Add some study materials before checking out</p>
        <button className="btn btn-primary" onClick={() => navigate('/shop')}>Browse Materials →</button>
      </div>
    );
  }

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── PayPal createOrder ────────────────────────────────────────────────────
  const createPayPalOrder = async () => {
    try {
      const res = await paymentAPI.createPayPalOrder({
        items: items.map(i => ({ productId: i._id, quantity: i.qty })),
        customerInfo: form,
      });
      setInternalOrderId(res.data.orderId);
      return res.data.paypalOrderId;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order. Please try again.');
      throw err;
    }
  };

  // ── PayPal onApprove ──────────────────────────────────────────────────────
  const onPayPalApprove = async (data) => {
    setProcessing(true);
    try {
      const res = await paymentAPI.capturePayPalOrder({
        paypalOrderId: data.orderID,
        orderId: internalOrderId,
      });

      clearCart();
      toast.success('Payment successful! Redirecting…');
      navigate('/order-success', { state: { order: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment capture failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const onPayPalError = (err) => {
    console.error('PayPal error:', err);
    toast.error('PayPal encountered an error. Please try again.');
  };

  // ── Card (placeholder — wire to Stripe in production) ────────────────────
  const handleCardPay = async () => {
    setProcessing(true);
    toast('Card payments coming soon. Please use PayPal.', { icon: '💳' });
    setProcessing(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh', padding: '40px 0 72px' }}>
      <div className="container">
        <h1 className="serif" style={{ fontSize: 40, color: 'var(--navy)', marginBottom: 36 }}>Checkout</h1>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
          {[1, 2, 3].map((n, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 0 }}>
              <StepDot n={n} active={step === n} done={step > n} />
              {n < 3 && <div style={{ flex: 1, height: 2, background: step > n ? 'var(--navy)' : 'var(--border)', margin: '0 10px', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }} className="checkout-grid">
          {/* ── Left Panel ─────────────────────────────────────────────── */}
          <div>
            {/* Step 1: Contact */}
            {step === 1 && (
              <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 24 }}>Contact Information</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {[['firstName', 'First Name *'], ['lastName', 'Last Name *']].map(([k, l]) => (
                    <div key={k}>
                      <label className="label">{l}</label>
                      <input className="input" value={form[k]} onChange={e => updateForm(k, e.target.value)} placeholder={k === 'firstName' ? 'Jane' : 'Doe'} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="jane@example.com" />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Download links will be sent to this address</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label className="label">Phone (optional)</label>
                    <input className="input" type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+254 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <select className="input" value={form.country} onChange={e => updateForm('country', e.target.value)}>
                      {['Kenya', 'Uganda', 'Tanzania', 'Nigeria', 'Ghana', 'South Africa', 'United States', 'United Kingdom', 'Canada', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
                  onClick={() => {
                    if (!form.firstName || !form.lastName || !form.email) {
                      toast.error('Please fill in all required fields.');
                      return;
                    }
                    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
                      toast.error('Please enter a valid email address.');
                      return;
                    }
                    setStep(2);
                  }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 24 }}>Select Payment Method</h2>

                {/* Method selector */}
                <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                  {[['paypal', 'PayPal', '🅿️', 'Pay securely with your PayPal account or card via PayPal'],
                    ['card', 'Credit / Debit Card', '💳', 'Visa, Mastercard, or other cards (coming soon)']
                  ].map(([id, label, icon, desc]) => (
                    <label key={id} style={{ display: 'flex', gap: 14, padding: 16, border: `2px solid ${method === id ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer', background: method === id ? '#EBF0F8' : '#fff', transition: 'all 0.2s' }}>
                      <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} style={{ marginTop: 3 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{desc}</div>
                      </div>
                      <span style={{ fontSize: 26 }}>{icon}</span>
                    </label>
                  ))}
                </div>

                {/* PayPal button */}
                {method === 'paypal' && (
                  <>
                    <div style={{ background: '#F0F6FF', border: '1px solid #C0D4F0', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                      <p style={{ fontSize: 14, color: '#1A3A6A', fontWeight: 500 }}>
                        🅿️ You'll be redirected to PayPal to complete payment of <strong>{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</strong>
                      </p>
                    </div>
                    {isPending ? (
                      <div style={{ textAlign: 'center', padding: 24 }}>
                        <div className="spinner" style={{ borderTopColor: '#C49A3C', borderColor: '#ddd' }} />
                        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 10 }}>Loading PayPal…</p>
                      </div>
                    ) : (
                      <div onClick={() => setStep(3)}>
                        <PayPalButtons
                          style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                          createOrder={createPayPalOrder}
                          onApprove={onPayPalApprove}
                          onError={onPayPalError}
                          onCancel={() => toast('Payment cancelled.')}
                          disabled={processing}
                          forceReRender={[total]}
                        />
                      </div>
                    )}
                  </>
                )}

                {method === 'card' && (
                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleCardPay} disabled={processing}>
                    {processing ? <><span className="spinner" /> Processing…</> : '💳 Pay with Card'}
                  </button>
                )}

                <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: 14 }} onClick={() => setStep(1)}>
                  ← Back to Contact
                </button>
              </div>
            )}

            {/* Processing overlay */}
            {processing && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', marginTop: 16 }}>
                <div style={{ width: 56, height: 56, border: '4px solid var(--gray)', borderTop: '4px solid var(--navy)', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.9s linear infinite' }} />
                <h3 style={{ color: 'var(--navy)', fontSize: 20, marginBottom: 8 }}>Processing Your Payment…</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Please don't close this window</p>
              </div>
            )}
          </div>

          {/* ── Order Summary ───────────────────────────────────────────── */}
          <div className="card" style={{ padding: 24, position: 'sticky', top: 100 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 20 }}>Order Summary</h3>

            {items.map(item => (
              <div key={item._id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji || '📘'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>×{item.qty}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>{(item.price * item.qty).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1.5px solid var(--border)' }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>Total</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--navy)' }}>{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, background: '#FEF9EC', border: '1px solid #F5E0A0', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 12, color: '#7A5B00', textAlign: 'center', lineHeight: 1.6 }}>
                🎓 Instant PDF download after payment<br />📧 Download links sent to your email<br />🔒 Secure 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
