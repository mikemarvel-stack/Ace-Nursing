import { Link } from 'react-router-dom';

const CATS = ['Study Guides', 'Flashcards', 'Reference Cards', 'Checklists', 'Bundles'];

const SUPPORT_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Refund Policy', to: '/info/refund-policy' },
  { label: 'Download Help', to: '/info/download-help' },
  { label: 'Track Order', to: '/info/track-order' },
];

const COMPANY_LINKS = [
  { label: 'About AceNursing', to: '/info/about' },
  { label: 'Blog & Tips', to: '/info/blog' },
  { label: 'Careers', to: '/info/careers' },
  { label: 'Privacy Policy', to: '/info/privacy-policy' },
  { label: 'Terms of Service', to: '/info/terms-of-service' },
];

const SOCIALS = [
  { icon: 'f', href: 'https://facebook.com' },
  { icon: 'X', href: 'https://twitter.com' },
  { icon: 'in', href: 'https://linkedin.com' },
  { icon: 'ig', href: 'https://instagram.com' },
];

const linkStyle = { display: 'block', marginBottom: 9, fontSize: 14, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' };

export default function Footer() {
  return (
    <footer style={{ background: '#071020', color: 'rgba(255,255,255,0.55)', padding: '56px 0 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }} className="footer-grid">
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: '#C49A3C', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
              <span className="serif" style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                Ace<span style={{ color: '#C49A3C' }}>Nursing</span>
              </span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.75, maxWidth: 280, marginBottom: 20 }}>
              Premium nursing study materials designed to help you pass your exams and excel in clinical practice.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIALS.map(({ icon, href }) => (
                <a key={icon} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(196,154,60,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Shop</h4>
            {CATS.map((cat) => (
              <Link key={cat} to={`/shop/${cat.toLowerCase().replace(/\s+/g, '-')}`} style={linkStyle}
                onMouseOver={e => e.currentTarget.style.color = '#C49A3C'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                {cat}
              </Link>
            ))}
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Support</h4>
            {SUPPORT_LINKS.map(({ label, to }) => (
              <Link key={label} to={to} style={linkStyle}
                onMouseOver={e => e.currentTarget.style.color = '#C49A3C'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                {label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Company</h4>
            {COMPANY_LINKS.map(({ label, to }) => (
              <Link key={label} to={to} style={linkStyle}
                onMouseOver={e => e.currentTarget.style.color = '#C49A3C'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                {label}
              </Link>
            ))}
            <div style={{ marginTop: 20, fontSize: 13 }}>
              <p style={{ marginBottom: 4 }}>📧 supportacenursing@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13 }}>© {new Date().getFullYear()} AceNursing. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
            {['🔒 SSL Secured', '🅿️ PayPal', '💳 Visa/MC', '📥 Instant Download'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
