import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { notificationsAPI } from '../api';
import toast from 'react-hot-toast';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/upload', label: 'Upload Material', icon: '⬆️', end: false },
  { to: '/admin/categories', label: 'Categories', icon: '📂', end: false },
  { to: '/admin/products', label: 'Manage Products', icon: '📦', end: false },
  { to: '/admin/orders', label: 'Orders', icon: '🧾', end: false },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: '📝', end: false },
  { to: '/admin/notifications', label: 'Notifications', icon: '🔔', end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    notificationsAPI.getAll().then(res => setUnreadCount(res.data.unreadCount)).catch(() => {});
    const interval = setInterval(() => {
      notificationsAPI.getAll().then(res => setUnreadCount(res.data.unreadCount)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const navLink = (l) => (
    <NavLink key={l.to} to={l.to} end={l.end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
        borderRadius: 10, marginBottom: 4, textDecoration: 'none', fontSize: 14,
        fontWeight: isActive ? 600 : 400,
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
  );

  const sidebarContent = (
    <>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, background: '#C49A3C', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🎓</div>
          <span className="serif" style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>Ace<span style={{ color: '#C49A3C' }}>Nursing</span></span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 9, padding: '9px 11px' }}>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>Administrator</p>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {LINKS.map(navLink)}
      </nav>
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 14, borderRadius: 9, textDecoration: 'none' }}>
          🏠 View Store
        </NavLink>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 14, borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          🚪 Log Out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" style={{ width: 240, background: 'var(--navy)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      )}

      {/* Mobile sidebar drawer */}
      <aside className="admin-sidebar-mobile" style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
        background: 'var(--navy)', display: 'flex', flexDirection: 'column',
        zIndex: 1001, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="admin-topbar" style={{ display: 'none', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--navy)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 9, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            ☰
          </button>
          <span className="serif" style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Ace<span style={{ color: '#C49A3C' }}>Nursing</span> <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 400 }}>Admin</span></span>
          {unreadCount > 0 && (
            <NavLink to="/admin/notifications" style={{ marginLeft: 'auto', background: '#DC2626', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '3px 9px', textDecoration: 'none' }}>
              🔔 {unreadCount}
            </NavLink>
          )}
        </div>

        <main style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
