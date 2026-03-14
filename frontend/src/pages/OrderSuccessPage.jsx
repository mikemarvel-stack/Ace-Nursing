// ─── OrderSuccessPage ──────────────────────────────────────────────────────────
import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }} className="animate-fade-up">
        {/* Checkmark */}
        <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 28px', animation: 'pulse 2s infinite' }}>
          ✓
        </div>

        <h1 className="serif" style={{ fontSize: 42, color: 'var(--navy)', marginBottom: 12 }}>Order Confirmed!</h1>
        {order?.orderNumber && (
          <p style={{ background: 'var(--gray)', display: 'inline-block', padding: '6px 18px', borderRadius: 50, fontSize: 14, color: 'var(--muted)', marginBottom: 20, fontWeight: 600 }}>
            Order #{order.orderNumber}
          </p>
        )}

        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 28 }}>
          Thank you for your purchase! Your nursing study materials are ready. Download links have been sent to your email.
        </p>

        {/* Download links */}
        {order?.downloadLinks?.length > 0 && (
          <div style={{ background: 'var(--gray)', borderRadius: 16, padding: 24, marginBottom: 28, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>📥 Download Your Files</h3>
            {order.downloadLinks.map((link, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < order.downloadLinks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{link.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>Expires {new Date(link.expiry).toLocaleDateString()}</p>
                </div>
                <a href={link.url} download className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>⬇ Download</a>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#EBF5EE', border: '1px solid #BBF7D0', borderRadius: 14, padding: 18, marginBottom: 28 }}>
          <p style={{ fontSize: 14, color: '#065F46', lineHeight: 1.7 }}>
            📧 Download links also sent to your email<br />
            ⏱ Links valid for 30 days<br />
            💬 Need help? Email support@acenursing.com
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/shop" className="btn btn-primary">Continue Shopping →</Link>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
