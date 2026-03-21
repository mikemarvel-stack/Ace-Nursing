import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store';
import { notificationsAPI } from '../api';
import toast from 'react-hot-toast';
import { CATEGORY_GROUPS } from '../categories';

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
      notificationsAPI
        .getMine()
        .then((res) => {
          setNotifs(res.data.notifications);
          setNotifUnread(res.data.unreadCount);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const handleMarkNotifRead = async (n) => {
    if (!n.read) {
      await notificationsAPI.markMineRead(n._id).catch(() => {});
      setNotifs((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
      );
      setNotifUnread((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllNotifRead = async () => {
    await notificationsAPI.markAllMineRead().catch(() => {});
    setNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
    setNotifUnread(0);
  };

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const MATERIALS = [
    { label: 'All Materials', path: '/shop' },
    ...CATEGORY_GROUPS.map((g) => ({
      label: g.label,
      path: `/shop?group=${encodeURIComponent(g.label)}`,
    })),
  ];

  // Close all menus on route change
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
    color:
      location.pathname === path ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
    fontWeight: location.pathname === path ? 600 : 400,
    fontSize: 14,
    padding: '4px 0',
    borderBottom:
      location.pathname === path
        ? '2px solid var(--primaryL)'
        : '2px solid transparent',
    transition: 'all 0.2s',
    cursor: 'pointer',
  });

  return (
    <nav style={navStyle}>
      <div
        className="container"
        style={{
          height: 66,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🩺
          </div>
          <div>
            <span
              className="serif"
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.3,
                lineHeight: 1,
              }}
            >
              Ace<span style={{ color: 'var(--primaryL)' }}>Nursing</span>
            </span>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                marginTop: -2,
              }}
            >
              Nursing Study Materials
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div
          className="hide-mobile"
          style={{ display: 'flex', alignItems: 'center', gap: 32 }}
        >
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
                transition: 'all 0.2s',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')
              }
            />
            <div
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 16,
              }}
            >
              🔍
            </div>
          </div>

          <Link to="/" style={linkStyle('/')}>
            Home
          </Link>
          <Link to="/custom-order" style={linkStyle('/custom-order')}>
            Custom Orders
          </Link>

          {/* Materials Dropdown */}
          <div ref={materialsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMaterialsOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: location.pathname.startsWith('/shop')
                  ? 'var(--primaryL)'
                  : 'rgba(255,255,255,0.85)',
                fontWeight: location.pathname.startsWith('/shop') ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Materials ▾
            </button>

            {materialsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: '#0C1B33',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  minWidth: 200,
                  zIndex: 40,
                }}
              >
                {MATERIALS.map((item) =>
                  item.path === null ? (
                    <div
                      key={item.label}
                      style={{
                        padding: '6px 12px 2px',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      {item.label}
                    </div>
                  ) : (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMaterialsOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        background:
                          location.pathname === item.path
                            ? 'rgba(255,255,255,0.14)'
                            : 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: 13,
                        cursor: 'pointer',
                        borderRadius: 10,
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          location.pathname === item.path
                            ? 'rgba(255,255,255,0.14)'
                            : 'transparent')
                      }
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {isAdmin() && (
            <Link to="/admin" style={linkStyle('/admin')}>
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Notification, Cart, Auth Buttons remain */}
          {isAuthenticated && (
            <div className="hide-mobile" style={{ position: 'relative' }}>
              {/* Notification Bell */}
              {/* ... */}
            </div>
          )}

          {/* Cart */}
          {/* ... */}

          {/* Auth Buttons */}
          {/* ... */}

          {/* Hamburger menu: only mobile */}
          <button
            className="show-mobile"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              width: 38,
              height: 38,
              borderRadius: 9,
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div
          className="animate-fade-in"
          style={{
            background: '#0C1B33',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 20px 24px',
          }}
        >
          {/* ... mobile menu items ... */}
        </div>
      )}
    </nav>
  );
}