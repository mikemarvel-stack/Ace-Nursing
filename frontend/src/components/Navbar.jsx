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
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);

  const materialsRef = useRef(null);

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

  // Poll notifications
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
      location.pathname === path
        ? 'var(--primaryL)'
        : 'rgba(255,255,255,0.85)',
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

        {/* Hamburger (mobile only) */}
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

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          style={{
            background: '#0C1B33',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 20px 24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[{ label: '🏠 Home', path: '/' }].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  color:
                    location.pathname === item.path
                      ? '#C49A3C'
                      : 'rgba(255,255,255,0.85)',
                  padding: '12px 0',
                  display: 'block',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}