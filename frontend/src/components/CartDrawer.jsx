import { useCartStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart } = useCartStore();
  const navigate = useNavigate();

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  const toUSD = (usd) => usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="animate-fade-in" onClick={closeCart}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1400 }} />
      )}

      {/* Drawer */}
      <div className={isOpen ? 'animate-slide-inR' : ''}
        style={{
          position: 'fixed', top: 0, right: 0, width: 400, maxWidth: '95vw',
          height: '100vh', background: '#fff', zIndex: 1500,
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isOpen ? 'none' : 'transform 0.3s ease',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.18)',
        }}>

        {/* Header */}
        <div style={{ background: 'var(--navy)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>🛒 Your Cart</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={closeCart} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
              <h4 style={{ color: 'var(--navy)', fontSize: 18, marginBottom: 8 }}>Your cart is empty</h4>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Browse our nursing materials to get started</p>
              <button className="btn btn-primary" onClick={() => { closeCart(); navigate('/shop'); }}>
                Browse Shop →
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  {/* Thumbnail */}
                  <div style={{ width: 58, height: 58, borderRadius: 10, background: 'linear-gradient(135deg, #0C1B33, #1E3050)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {item.emoji || '📘'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{toUSD(item.price)}</p>

                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQty(item._id, item.qty - 1)}
                        style={{ width: 28, height: 28, border: '1.5px solid var(--border)', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)' }}>
                        −
                      </button>
                      <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty + 1)}
                        style={{ width: 28, height: 28, border: '1.5px solid var(--border)', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)' }}>
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
                    <button onClick={() => removeItem(item._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: 2, lineHeight: 1 }}
                      title="Remove">×</button>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{toUSD(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                Clear cart
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--gray)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1.5px solid var(--border)', marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--navy)' }}>Total</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>{toUSD(subtotal)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}></div>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 10 }} onClick={handleCheckout}>
              🔒 Checkout Securely →
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={closeCart}>
              Continue Shopping
            </button>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
              <span>🅿️ PayPal</span><span>💳 Card</span><span>🔒 SSL Secure</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
