import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../api';

const TESTIMONIALS = [
  { name: 'Sarah M., RN', role: 'Registered Nurse – KNH', text: 'AceNursing\'s NCLEX guide was a game-changer. I passed on my first attempt and felt completely prepared.', rating: 5 },
  { name: 'James O.', role: 'BSN Student – UoN', text: 'The pharmacology cards are incredibly comprehensive. Best investment I made throughout nursing school.', rating: 5 },
  { name: 'Priya K., NP', role: 'Nurse Practitioner', text: 'The critical care handbook is now my daily reference at work. Excellent organization and clinical accuracy.', rating: 5 },
];

const CATS = [
  { name: 'Study Guides', emoji: '📘', count: '20+ guides', desc: 'Comprehensive exam prep' },
  { name: 'Flashcards', emoji: '🗂️', count: '8 decks', desc: 'Quick active recall' },
  { name: 'Reference Cards', emoji: '💊', count: '15 refs', desc: 'Clinical quick guides' },
  { name: 'Checklists', emoji: '✅', count: '10 sets', desc: 'Procedure competency' },
  { name: 'Bundles', emoji: '📦', count: '5 bundles', desc: 'Best value packs' },
];

const STATS = [['25K+', 'Students'], ['500+', 'Materials'], ['4.9★', 'Avg Rating'], ['98%', 'Pass Rate']];

function StatCard({ number, label }) {
  return (
    <div>
      <div className="serif" style={{ color: 'var(--primaryL)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{number}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getFeatured()
      .then(res => setFeatured(res.data.products))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #071020 0%, #0C1B33 55%, #152540 100%)', minHeight: '90vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background accents */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(196,154,60,0.09) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(26,122,110,0.12) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%', opacity: 0.03, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '18px 18px' }} />

        <div className="container" style={{ padding: '88px 24px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="hero-grid">
            <div className="animate-fade-up">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(196,154,60,0.14)', border: '1px solid rgba(196,154,60,0.28)', borderRadius: 50, padding: '6px 18px', marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, background: '#C49A3C', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ color: '#C49A3C', fontSize: 13, fontWeight: 500 }}>Trusted by 25,000+ nursing students</span>
              </div>

              <h1 className="serif" style={{ fontSize: 'clamp(38px, 4.5vw, 60px)', fontWeight: 700, color: '#fff', lineHeight: 1.08, marginBottom: 22 }}>
                Ace Your Nursing <span style={{ color: '#C49A3C', fontStyle: 'italic' }}>Career</span> with Expert Study Materials
              </h1>

              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, marginBottom: 38, maxWidth: 490 }}>
                Premium NCLEX prep guides, clinical flashcards, pharmacology references, and study tools — crafted by expert nurses to help you pass on your first attempt.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 52 }}>
                <button className="btn btn-gold btn-lg" onClick={() => navigate('/shop')}>
                  Browse Materials →
                </button>
                <Link to="/shop" className="btn" style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(255,255,255,0.22)', padding: '14px 26px', borderRadius: 12, fontSize: 15, textDecoration: 'none' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'}>
                  Browse Free Samples
                </Link>
              </div>

              <div style={{ display: 'flex', gap: 40 }}>
                {STATS.map(([n, l]) => <StatCard key={l} number={n} label={l} />)}
              </div>
            </div>

            {/* Hero cards */}
            <div className="hide-mobile animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[['📘','NCLEX-RN Guide','450 pages · Bestseller','study-guides'], ['💊','Pharmacology','300+ drug profiles','reference-cards'], ['🫀','Anatomy Atlas','300 illustrations','study-guides'], ['⚡','Flash Cards','800 high-yield cards','flashcards']].map(([em, t, s, cat]) => (
                  <Link key={t} to={`/shop/${cat}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 24, backdropFilter: 'blur(8px)', transition: 'all 0.25s', cursor: 'pointer' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(196,154,60,0.08)'; e.currentTarget.style.borderColor = 'rgba(196,154,60,0.25)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}>
                      <div style={{ fontSize: 34, marginBottom: 12 }}>{em}</div>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{t}</div>
                      <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12 }}>{s}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="section-sm" style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-sub">Find exactly what you need for your nursing journey</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
            {CATS.map((cat) => (
              <Link key={cat.name} to={`/shop/${encodeURIComponent(cat.name.toLowerCase().replace(/\s+/g, '-'))}`}
                style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--gray)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.querySelector('.cat-title').style.color = '#fff'; e.currentTarget.querySelector('.cat-sub').style.color = 'rgba(255,255,255,0.6)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--gray)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.querySelector('.cat-title').style.color = 'var(--navy)'; e.currentTarget.querySelector('.cat-sub').style.color = 'var(--muted)'; }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>{cat.emoji}</div>
                  <div className="cat-title" style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 3, transition: 'color 0.2s' }}>{cat.name}</div>
                  <div className="cat-sub" style={{ fontSize: 11, color: 'var(--muted)', transition: 'color 0.2s' }}>{cat.count}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 className="section-title">Featured Materials</h2>
              <p className="section-sub">Our highest-rated study resources</p>
            </div>
            <Link to="/shop" className="btn btn-outline" style={{ fontSize: 14 }}>View All →</Link>
          </div>

          {loading ? (
            <div className="product-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card" style={{ height: 340 }}>
                  <div className="skeleton" style={{ height: 148, borderRadius: 0 }} />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 32 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Why AceNursing ───────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--navy)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 className="section-title" style={{ color: '#fff' }}>
              Why Choose <span style={{ color: '#C49A3C' }}>AceNursing?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 500, margin: '10px auto 0' }}>
              Everything you need to succeed in nursing school and beyond
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
            {[
              ['🎯', 'Expert-Crafted', 'Developed by experienced nurses and nurse educators with decades of clinical and teaching experience.'],
              ['⚡', 'Instant Download', 'Get immediate access to your study materials the moment your payment is confirmed.'],
              ['🔒', 'Secure Payments', 'Multiple payment options — PayPal and major credit/debit cards — all SSL encrypted.'],
              ['🔄', 'Regular Updates', 'Materials updated quarterly to reflect the latest NCLEX changes and clinical guidelines.'],
            ].map(([e, t, d]) => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 34, marginBottom: 14 }}>{e}</div>
                <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{t}</h3>
                <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: 14, lineHeight: 1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title">Student Success Stories</h2>
            <p className="section-sub">Join thousands of nurses who passed with AceNursing</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: 'var(--gray)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                <div style={{ color: '#C49A3C', fontSize: 22, marginBottom: 14, letterSpacing: 1 }}>{'★'.repeat(t.rating)}</div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text)', marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #C49A3C, #D4AF60)', padding: '64px 0' }}>
        <div className="container" style={{ maxWidth: 560, textAlign: 'center' }}>
          <h2 className="serif" style={{ fontSize: 36, color: '#fff', marginBottom: 10 }}>Get 15% Off Your First Order</h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: 30, fontSize: 16 }}>Join our newsletter for exclusive deals and free nursing study tips</p>
          <div style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
            <input placeholder="Enter your email address" className="input" style={{ flex: 1, background: '#fff', borderColor: 'transparent' }} />
            <button className="btn" style={{ background: 'var(--navy)', color: '#fff', flexShrink: 0, whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 12 }}>No spam. Unsubscribe any time.</p>
        </div>
      </section>
    </div>
  );
}
