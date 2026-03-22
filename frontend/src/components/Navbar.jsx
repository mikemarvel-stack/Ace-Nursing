import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store';
import { notificationsAPI } from '../api';
import toast from 'react-hot-toast';
import { debounce } from '../utils/debounce';
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
  
  const materialsRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search navigation (400ms delay)
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      if (query.trim()) {
        navigate(`/shop?search=${encodeURIComponent(query)}`);
      }
    }, 400),
    [navigate]
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (materialsRef.current && !materialsRef.current.contains(e.target)) {
        setMaterialsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    
    if (materialsOpen || userMenuOpen || notifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [materialsOpen, userMenuOpen, notifOpen]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    debouncedSearch(searchQuery);
  };

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
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search study materials..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search study materials"
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
            </form>
            <div
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 16,
                pointerEvents: 'none',
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
          {/* Notification Bell */}
          {isAuthenticated && (
            <div className="hide-mobile" ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
              >
                🔔
                {notifUnread > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: '#EF4444',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {notifUnread}
                  </div>
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#0C1B33',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: 0,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    minWidth: 320,
                    maxHeight: 400,
                    overflowY: 'auto',
                    zIndex: 40,
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>Notifications</span>
                    {notifUnread > 0 && (
                      <button
                        onClick={handleMarkAllNotifRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primaryL)',
                          fontSize: 12,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                      No notifications
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => handleMarkNotifRead(n)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: n.read ? 'transparent' : 'rgba(255,255,255,0.05)',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,255,255,0.05)')}
                      >
                        <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="hide-mobile"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            🛒
            {cartCount > 0 && (
              <span style={{ background: 'var(--primaryL)', padding: '1px 6px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Auth Buttons / User Menu */}
          {isAuthenticated ? (
            <div className="hide-mobile" ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                👤 {user?.name?.split(' ')[0] || 'Account'}
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#0C1B33',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: 8,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    minWidth: 180,
                    zIndex: 40,
                  }}
                >
                  <button
                    onClick={() => {
                      navigate('/account');
                      setUserMenuOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 12px',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: 13,
                      borderRadius: 10,
                      transition: 'background 0.15s',
                      background: location.pathname === '/account' ? 'rgba(255,255,255,0.14)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = location.pathname === '/account' ? 'rgba(255,255,255,0.14)' : 'transparent')}
                  >
                    My Account
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 10,
                      transition: 'background 0.15s',
                      marginTop: 4,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hide-mobile" style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'var(--primaryL)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--primaryL)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Sign Up
              </button>
            </div>
          )}

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
          <button
            onClick={() => {
              navigate('/');
              setMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 0',
              color: location.pathname === '/' ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontWeight: location.pathname === '/' ? 600 : 400,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Home
          </button>

          <button
            onClick={() => {
              navigate('/custom-order');
              setMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 0',
              color: location.pathname === '/custom-order' ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontWeight: location.pathname === '/custom-order' ? 600 : 400,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Custom Orders
          </button>

          <button
            onClick={() => {
              navigate('/shop');
              setMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 0',
              color: location.pathname.startsWith('/shop') ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontWeight: location.pathname.startsWith('/shop') ? 600 : 400,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Materials
          </button>

          {isAdmin() && (
            <button
              onClick={() => {
                navigate('/admin');
                setMenuOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 0',
                color: location.pathname === '/admin' ? 'var(--primaryL)' : 'rgba(255,255,255,0.85)',
                fontSize: 14,
                fontWeight: location.pathname === '/admin' ? 600 : 400,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Admin Panel
            </button>
          )}

          {/* Cart */}
          <button
            onClick={() => {
              openCart();
              setMenuOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14,
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginTop: 8,
            }}
          >
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </button>

          {/* Mobile Auth */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    navigate('/account');
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 0',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 14,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  👤 {user?.name?.split(' ')[0] || 'My Account'}
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: 14,
                    cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 0',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 14,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: 8,
                    background: 'var(--primaryL)',
                    color: '#fff',
                    textAlign: 'center',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}