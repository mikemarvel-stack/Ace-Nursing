import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store';
import { notificationsAPI } from '../api';
import toast from 'react-hot-toast';
import { CATEGORY_GROUPS, slugifyCategory } from '../categories';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore();
  const { items, openCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const materialsRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);

  // Close materials dropdown on outside click
  useEffect(() => {
    if (!materialsOpen) return;
    const handler = (e) => {
      if (materialsRef.current && !materialsRef.current.contains(e.target)) {
        setMaterialsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [materialsOpen]);

  // Poll user notifications every 60s when logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = () => {
      notificationsAPI.getMine()
        .then(res => { setNotifs(res.data.notifications); setNotifUnread(res.data.unreadCount); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const handleMarkNotifRead = async (n) => {
    if (!n.read) {
      await notificationsAPI.markMineRead(n._id).catch(() => {});
      setNotifs(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      setNotifUnread(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllNotifRead = async () => {
    await notificationsAPI.markAllMineRead().catch(() => {});
    setNotifs(prev => prev.map(x => ({ ...x, read: true })));
    setNotifUnread(0);
  };

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const MATERIALS = [
    { label: 'All Materials', path: '/shop' },
    ...CATEGORY_GROUPS[0].items.map(c => ({ label: c, path: `/shop/${slugifyCategory(c)}` })),
    { label: '── Courses ──', path: null },
    ...CATEGORY_GROUPS[1].items.map(c => ({ label: c, path: `/shop/${slugifyCategory(c)}` })),
  ];

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setMaterialsOpen(false);
    setNotifOpen(false);
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
          <Link to="/custom-order" style={linkStyle('/custom-order')}>Custom Orders</Link>

          <div ref={materialsRef} style={{ position: 'relative' }}>
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
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#0C1B33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', minWidth: 200, zIndex: 40 }}>
                {MATERIALS.map((item) => (
                  item.path === null ? (
                    <div key={item.label} style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                  ) : (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMaterialsOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 12px',
                      background: location.pathname === item.path ? 'rgba(255,255,255,0.14)' : 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 10,
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                    onMouseOut={e => e.currentTarget.style.background = location.pathname === item.path ? 'rgba(255,255,255,0.14)' : 'transparent'}
                  >
                    {item.label}
                  </button>
                  )
                ))}
              </div>
            )}
          </div>

          {isAdmin() && <Link to="/admin" style={linkStyle('/admin')}>Admin Panel</Link>}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Notification Bell — logged-in users only */}
          {isAuthenticated && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }}
                style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: 38, height: 38, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                title="Notifications"
              >
                🔔
                {notifUnread > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -5, background: '#DC2626', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                    {notifUnread > 9 ? '9+' : notifUnread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="animate-fade-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 14, width: 320, maxHeight: 420, overflowY: 'auto', boxShadow: 'var(--shadow-lg)', zIndex: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>Notifications</span>
                    {notifUnread > 0 && (
                      <button onClick={handleMarkAllNotifRead} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                      No notifications yet
                    </div>
                  ) : notifs.map(n => (
                    <div key={n._id}
                      onClick={() => handleMarkNotifRead(n)}
                      style={{ display: 'flex', gap: 10, padding: '12px 16px', background: n.read ? '#fff' : '#F0F6FF', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = n.read ? 'var(--gray)' : '#E0EDFF'}
                      onMouseOut={e => e.currentTarget.style.background = n.read ? '#fff' : '#F0F6FF'}
                    >
                      <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
                        {n.type === 'new_order' ? '🧾' : n.type === 'order_status' ? '🔄' : '🔔'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--navy)', marginBottom: 2, lineHeight: 1.3 }}>{n.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!n.read && <div style={{ width: 7, height: 7, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

          {/* Hamburger — mobile only */}
          <button className="show-mobile" onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: 38, height: 38, borderRadius: 9, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {menuOpen ? '✕' : '☰'}
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

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="animate-fade-in" style={{ background: '#0C1B33', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Home', path: '/' },
              { label: 'All Materials', path: '/shop' },
              { label: 'Custom Orders', path: '/custom-order' },
              ...CATEGORY_GROUPS[0].items.map(c => ({ label: c, path: `/shop/${slugifyCategory(c)}` })),
              ...CATEGORY_GROUPS[1].items.map(c => ({ label: c, path: `/shop/${slugifyCategory(c)}` })),
              ...(isAdmin() ? [{ label: '⚙️ Admin Panel', path: '/admin' }] : []),
            ].map(item => (
              <Link key={item.path} to={item.path}
                style={{ color: location.pathname === item.path ? '#C49A3C' : 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: location.pathname === item.path ? 700 : 400, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Link to="/login" className="btn btn-outline" style={{ flex: 1, color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Log In</Link>
                <Link to="/register" className="btn btn-gold" style={{ flex: 1, fontSize: 14 }}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
