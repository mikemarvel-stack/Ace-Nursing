import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { authAPI, paymentAPI, notificationsAPI } from '../api';

export default function AccountPage() {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [notifs, setNotifs] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '', country: user?.country || '' });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    paymentAPI.getMyOrders()
      .then(res => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
    notificationsAPI.getMine()
      .then(res => { setNotifs(res.data.notifications); setNotifUnread(res.data.unreadCount); })
      .catch(() => {});
  }, []);

  const handleMarkNotifRead = async (id) => {
    await notificationsAPI.markMineRead(id).catch(() => {});
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setNotifUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllNotifRead = async () => {
    await notificationsAPI.markAllMineRead().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setNotifUnread(0);
    toast.success('All notifications marked as read');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      setAuth(res.data.user, useAuthStore.getState().token);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 12) {
      toast.error('New password must be at least 12 characters long');
      return;
    }

    // Basic password strength check
    const hasLower = /[a-z]/.test(passwordForm.newPassword);
    const hasUpper = /[A-Z]/.test(passwordForm.newPassword);
    const hasNumber = /\d/.test(passwordForm.newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword);

    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
      toast.error('New password must contain uppercase, lowercase, numbers, and special characters');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully! A confirmation email has been sent.');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to change password';
      toast.error(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  const STATUS_COLORS = {
    completed: ['#D1FAE5', '#065F46'],
    pending: ['#FEF3C7', '#92400E'],
    cancelled: ['#FEE2E2', '#991B1B'],
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh', padding: '40px 0 72px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24 }}>
            {user?.firstName?.[0]}
          </div>
          <div>
            <h1 className="serif" style={{ fontSize: 32, color: 'var(--navy)' }}>{user?.firstName} {user?.lastName}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--gray)', borderRadius: 12, padding: 4, width: 'fit-content' }} className="account-tabs">
          {['orders', 'notifications', 'profile', 'security'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: tab === t ? 'var(--navy)' : 'transparent', color: tab === t ? '#fff' : 'var(--muted)', fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', position: 'relative' }}>
              {t === 'orders' ? '🧾 My Orders' : t === 'notifications' ? (
                <>🔔 Notifications{notifUnread > 0 && <span style={{ marginLeft: 6, background: '#DC2626', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{notifUnread}</span>}</>
              ) : t === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            {loading ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🧾</div>
                <h3 style={{ color: 'var(--navy)', fontSize: 20, marginBottom: 8 }}>No orders yet</h3>
                <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Your purchases will appear here</p>
                <button className="btn btn-primary" onClick={() => navigate('/shop')}>Browse Shop →</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {orders.map(o => (
                  <div key={o._id} className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>#{o.orderNumber}</span>
                          <span className="badge" style={{ background: STATUS_COLORS[o.status]?.[0] || '#eee', color: STATUS_COLORS[o.status]?.[1] || '#666' }}>
                            {o.status}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · via {o.payment.method}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>{o.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}></div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {o.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray)', borderRadius: 10, padding: '8px 12px' }}>
                          <span style={{ fontSize: 18 }}>{item.emoji || '📘'}</span>
                          <span style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{item.title}</span>
                          {o.status === 'completed' && item.downloadToken && (
                            <a
                              href={`${import.meta.env.VITE_API_URL || '/api'}/payments/download/${item.downloadToken}`}
                              className="btn btn-primary btn-sm"
                              style={{ marginLeft: 8, textDecoration: 'none', fontSize: 11, padding: '4px 10px' }}
                              rel="noopener noreferrer"
                            >
                              ⬇ Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>{notifUnread > 0 ? `${notifUnread} unread` : 'All caught up'}</p>
              {notifUnread > 0 && (
                <button className="btn btn-outline btn-sm" onClick={handleMarkAllNotifRead}>✓ Mark all read</button>
              )}
            </div>
            {notifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                <h3 style={{ color: 'var(--navy)', fontSize: 18, marginBottom: 8 }}>No notifications yet</h3>
                <p style={{ color: 'var(--muted)' }}>Order confirmations and updates will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifs.map(n => (
                  <div key={n._id} style={{ display: 'flex', gap: 14, padding: '16px 18px', background: n.read ? '#fff' : '#F0F6FF', border: `1px solid ${n.read ? 'var(--border)' : '#C0D4F0'}`, borderRadius: 12, position: 'relative' }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>
                      {n.type === 'new_order' ? '🧾' : n.type === 'order_status' ? '🔄' : '🔔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: n.read ? 500 : 700, fontSize: 14, color: 'var(--navy)' }}>{n.title}</p>
                        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n.message}</p>
                      {!n.read && (
                        <button onClick={() => handleMarkNotifRead(n._id)}
                          style={{ marginTop: 8, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                          Mark as read
                        </button>
                      )}
                    </div>
                    {!n.read && <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div style={{ maxWidth: 520 }}>
            <form onSubmit={handleChangePassword} className="card" style={{ padding: 28, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 22 }}>Change Password</h2>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  minLength="12"
                  required
                />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Must be 12+ characters with uppercase, lowercase, numbers, and special characters
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  minLength="12"
                  required
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={changingPassword}>
                {changingPassword ? <><span className="spinner" /> Changing Password…</> : 'Change Password'}
              </button>
            </form>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Password Security Tips</h3>
              <ul style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                <li>Use at least 12 characters</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Add numbers and special characters</li>
                <li>Don't reuse passwords from other sites</li>
                <li>Change your password regularly</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
