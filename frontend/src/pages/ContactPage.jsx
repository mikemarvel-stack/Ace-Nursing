import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/notifications/contact', form);
      setSent(true);
    } catch {
      toast.error('Failed to send message. Please email us directly at support@acenursing.com');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640, padding: '72px 24px' }}>
      <h1 className="serif" style={{ color: 'var(--navy)', fontSize: 36, marginBottom: 8 }}>Contact Us</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40 }}>We typically respond within 24 hours on business days.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
        {[['📧', 'Email', 'support@acenursing.com'], ['⏰', 'Hours', 'Mon–Fri, 9am–6pm EAT']].map(([e, t, v]) => (
          <div key={t} style={{ background: 'var(--gray)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{e}</div>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>{v}</div>
          </div>
        ))}
      </div>

      {sent ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h3 style={{ color: 'var(--navy)', marginBottom: 8 }}>Message Sent!</h3>
          <p style={{ color: 'var(--muted)' }}>We'll get back to you at {form.email} within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="name-grid">
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>Name</label>
              <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>Email</label>
              <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>Subject</label>
            <select className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required>
              <option value="">Select a topic…</option>
              <option>Order &amp; Download Issue</option>
              <option>Refund Request</option>
              <option>Product Question</option>
              <option>Technical Support</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea className="input" required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your issue or question…" style={{ resize: 'vertical' }} />
          </div>
          <button className="btn btn-gold" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '12px 32px' }}>
            {loading ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Sending…</> : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}
