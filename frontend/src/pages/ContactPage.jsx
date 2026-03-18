import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import useSEO from '../hooks/useSEO';

const SUBJECTS = [
  'Order & Download Issue',
  'Refund Request',
  'Product Question',
  'Technical Support',
  'Partnership / Bulk Order',
  'Other',
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  useSEO({
    title: 'Contact Us',
    description: 'Get in touch with AceNursing support. We respond within 24 hours on business days.',
    canonical: 'https://acenursing.com/contact',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject) { toast.error('Please select a subject.'); return; }
    setLoading(true);
    try {
      await api.post('/notifications/contact', form);
      setSent(true);
    } catch {
      toast.error('Failed to send. Please email us directly at supportacenursing@gmail.com');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: 'var(--navy)', padding: '52px 0 44px' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Support</p>
          <h1 className="serif" style={{ color: '#fff', fontSize: 'clamp(32px,5vw,48px)', marginBottom: 12 }}>How can we help?</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 480 }}>
            Send us a message and we'll get back to you within 24 hours on business days.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 760, padding: '48px 24px 80px' }}>
        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 40 }} className="three-col-grid">
          {[
            ['📧', 'Email', 'supportacenursing@gmail.com'],
            ['⏰', 'Response Time', 'Within 24 hours'],
            ['🕐', 'Business Hours', 'Mon–Fri, 9am–6pm EAT'],
          ].map(([icon, label, value]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{value}</div>
            </div>
          ))}
        </div>

        {sent ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }} className="animate-fade-up">
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 className="serif" style={{ color: 'var(--navy)', fontSize: 30, marginBottom: 10 }}>Message Received!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 6 }}>
              Thanks, <strong>{form.name}</strong>! We'll reply to <strong>{form.email}</strong> within 24 hours.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              In the meantime, check our <a href="/info/faq" style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'underline' }}>FAQ page</a> — your answer might already be there.
            </p>
            <button className="btn btn-outline" style={{ marginTop: 28 }} onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
              Send Another Message
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 32px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 24 }}>Send a Message</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="name-grid">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name} onChange={set('name')} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="jane@example.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="name-grid">
                <div>
                  <label className="label">Phone (optional)</label>
                  <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" />
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <select className="input" value={form.subject} onChange={set('subject')} required>
                    <option value="">Select a topic…</option>
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input" required rows={6}
                  value={form.message} onChange={set('message')}
                  placeholder="Describe your issue or question in detail…"
                  style={{ resize: 'vertical', minHeight: 140 }}
                />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {form.message.length}/1000 characters
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  🔒 Your information is kept private and never shared.
                </p>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                  {loading
                    ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Sending…</>
                    : '📨 Send Message'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQ nudge */}
        <div style={{ marginTop: 32, background: '#EBF0F8', border: '1px solid #C0D4F0', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Looking for quick answers?</p>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Browse our FAQ for instant help with common questions.</p>
          </div>
          <a href="/info/faq" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>View FAQ →</a>
        </div>
      </div>
    </div>
  );
}
