import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store';
import toast from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore();
  const { items, openCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialsSearch, setMaterialsSearch] = useState('');
  const [materialsHighlight, setMaterialsHighlight] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const MATERIALS = [
    { label: 'All Materials', path: '/shop' },
    { label: 'Study Guides', path: '/shop/study-guides' },
    { label: 'Flashcards', path: '/shop/flashcards' },
    { label: 'Reference Cards', path: '/shop/reference-cards' },
    { label: 'Checklists', path: '/shop/checklists' },
    { label: 'Bundles', path: '/shop/bundles' },
  ];

  const filteredMaterials = MATERIALS.filter(item =>
    item.label.toLowerCase().includes(materialsSearch.toLowerCase())
  );

  const handleMaterialsKeyDown = (e) => {
    if (!materialsOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMaterialsHighlight(prev => Math.min(prev + 1, filteredMaterials.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMaterialsHighlight(prev => Math.max(prev - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredMaterials[materialsHighlight];
      if (item) {
        navigate(item.path);
        setMaterialsOpen(false);
      }
    }
    if (e.key === 'Escape') {
      setMaterialsOpen(false);
    }
  };

  useEffect(() => {
    setMaterialsHighlight(0);
  }, [filteredMaterials.length]);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setMaterialsOpen(false);
    setMaterialsSearch('');
    setMaterialsHighlight(0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 900,
    background: 'rgba(12,27,51,0.97)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    transition: 'all 0.3s ease',
  };

  const linkStyle = (path) => ({
    color: location.pathname === path ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
    fontWeight: location.pathname === path ? 600 : 400,
    fontSize: 14,
    padding: '4px 0',
    borderBottom: location.pathname === path ? '2px solid var(--primaryL)' : '2px solid transparent',
    transition: 'all 0.2s',
    cursor: 'pointer',
  });

  return (
    <nav style={navStyle}>
      <div className="container" style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🩺</div>
          <div>
            <span className="serif" style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1 }}>
              Ace<span style={{ color: 'var(--primaryL)' }}>Nursing</span>
            </span>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: -2 }}>Nursing Study Materials</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="Search study materials..."
              style={{
                width: '100%',
                padding: '8px 16px 8px 40px',
                borderRadius: 25,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>🔍</div>
          </div>

          <Link to="/" style={linkStyle('/')}>Home</Link>

          <div
            onMouseEnter={() => setMaterialsOpen(true)}
            onMouseLeave={() => setMaterialsOpen(false)}
            style={{ position: 'relative' }}>
            <button
              onClick={() => setMaterialsOpen(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: location.pathname.startsWith('/shop') ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
                fontWeight: location.pathname.startsWith('/shop') ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                padding: '4px 0',
              }}>
              Materials ▾
            </button>

            {materialsOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#0C1B33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', minWidth: 240, zIndex: 40 }}>
                <input
                  value={materialsSearch}
                  onChange={e => { setMaterialsSearch(e.target.value); setMaterialsHighlight(0); }}
                  onKeyDown={handleMaterialsKeyDown}
                  placeholder="Search materials…"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                />
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {filteredMaterials.length === 0 ? (
                    <div style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>No matches</div>
                  ) : (
                    filteredMaterials.map((item, index) => (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setMaterialsOpen(false); }}
                        onMouseOver={() => setMaterialsHighlight(index)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          background: index === materialsHighlight ? 'rgba(255,255,255,0.14)' : 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: 14,
                          cursor: 'pointer',
                          borderRadius: 10,
                          marginBottom: 4,
                          transition: 'background 0.2s',
                        }}
                      >
                        {item.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {isAdmin() && <Link to="/admin" style={linkStyle('/admin')}>Admin Panel</Link>}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Cart */}
          <button onClick={openCart} style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(196,154,60,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            🛒 <span className="hide-mobile">Cart</span>
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -7, right: -7, background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '7px 14px', borderRadius: 10, fontSize: 14 }}>
                <div style={{ width: 26, height: 26, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                  {user?.firstName?.[0]?.toUpperCase()}
                </div>
                <span className="hide-mobile">{user?.firstName}</span>
              </button>
              {userMenuOpen && (
                <div className="animate-fade-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 0', minWidth: 180, boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                  {[
                    { label: '👤 My Account', path: '/account' },
                    ...(isAdmin() ? [{ label: '⚙️ Admin Panel', path: '/admin' }] : []),
                  ].map(item => (
                    <Link key={item.path} to={item.path} style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--text)', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--gray)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 14, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    🚪 Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="hide-mobile" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}>
                Log in
              </Link>
              <Link to="/register" style={{ background: 'var(--primary)', color: '#fff', fontSize: 14, padding: '8px 16px', borderRadius: 9, fontWeight: 600, transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--primaryL)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
