import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { notificationsAPI } from '../api';
import toast from 'react-hot-toast';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/upload', label: 'Upload Material', icon: '⬆️', end: false },
  { to: '/admin/products', label: 'Manage Products', icon: '📦', end: false },
  { to: '/admin/orders', label: 'Orders', icon: '🧾', end: false },
  { to: '/admin/notifications', label: 'Notifications', icon: '🔔', end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsAPI.getAll()
      .then(res => setUnreadCount(res.data.unreadCount))
      .catch(() => {});
    // Poll every 60s
    const interval = setInterval(() => {
      notificationsAPI.getAll().then(res => setUnreadCount(res.data.unreadCount)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'var(--navy)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: '#C49A3C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
            <span className="serif" style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Ace<span style={{ color: '#C49A3C' }}>Nursing</span></span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>Administrator</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                borderRadius: 10, marginBottom: 4, textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(196,154,60,0.18)' : 'transparent',
                color: isActive ? '#C49A3C' : 'rgba(255,255,255,0.7)',
                borderLeft: isActive ? '3px solid #C49A3C' : '3px solid transparent',
                transition: 'all 0.18s',
              })}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label}
              {l.to === '/admin/notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#DC2626', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 14, borderRadius: 9, textDecoration: 'none' }}>
            🏠 View Store
          </NavLink>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 14, borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
