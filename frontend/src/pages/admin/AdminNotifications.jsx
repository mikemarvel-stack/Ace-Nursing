import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../../api';

const TYPE_META = {
  new_order:       { icon: '🧾', color: '#1E40AF', bg: '#DBEAFE' },
  new_user:        { icon: '👤', color: '#065F46', bg: '#D1FAE5' },
  contact_message: { icon: '✉️', color: '#92400E', bg: '#FEF3C7' },
  order_status:    { icon: '🔄', color: '#5B21B6', bg: '#EDE9FE' },
  system:          { icon: '⚙️', color: '#374151', bg: '#F3F4F6' },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ContactMessageExpanded({ meta }) {
  if (!meta?.message) return null;
  return (
    <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 10 }}>
        {[['Name', meta.name], ['Email', meta.email], meta.phone && ['Phone', meta.phone], meta.subject && ['Subject', meta.subject]]
          .filter(Boolean)
          .map(([label, value]) => (
            <div key={label}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
              <p style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600, marginTop: 1 }}>{value}</p>
            </div>
          ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap', borderTop: '1px solid #FDE68A', paddingTop: 10 }}>
        {meta.message}
      </div>
      <a
        href={`mailto:${meta.email}?subject=Re: ${encodeURIComponent(meta.subject || 'Your message to AceNursing')}`}
        className="btn btn-sm"
        style={{ marginTop: 12, background: '#92400E', color: '#fff', textDecoration: 'none', display: 'inline-flex' }}
        onClick={e => e.stopPropagation()}
      >
        ↩ Reply via Email
      </a>
    </div>
  );
}

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    notificationsAPI.getAll()
      .then(res => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    await notificationsAPI.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (id) => {
    await notificationsAPI.delete(id).catch(() => {});
    const n = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (n && !n.read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleClick = async (n) => {
    if (!n.read) await handleMarkRead(n._id);
    if (n.type === 'contact_message') {
      setExpanded(prev => prev === n._id ? null : n._id);
      return;
    }
    if (n.link) navigate(n.link);
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 34, color: 'var(--navy)' }}>Notifications</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { key: 'new_order', label: '🧾 Orders' },
          { key: 'new_user', label: '👤 Signups' },
          { key: 'contact_message', label: '✉️ Messages' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: '6px 16px', borderRadius: 50, fontSize: 13, fontWeight: filter === key ? 700 : 400, background: filter === key ? 'var(--navy)' : '#fff', color: filter === key ? '#fff' : 'var(--muted)', border: `1.5px solid ${filter === key ? 'var(--navy)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔔</div>
          <p style={{ fontSize: 16 }}>No notifications here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            return (
              <div key={n._id}
                style={{ display: 'flex', gap: 14, padding: '14px 18px', background: n.read ? '#fff' : '#F0F6FF', border: `1px solid ${n.read ? 'var(--border)' : '#C0D4F0'}`, borderRadius: 12, cursor: n.link ? 'pointer' : 'default', transition: 'all 0.15s', position: 'relative' }}
                onClick={() => handleClick(n)}
                onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
                )}

                {/* Icon */}
                <div style={{ width: 42, height: 42, borderRadius: 11, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontWeight: n.read ? 500 : 700, fontSize: 14, color: 'var(--navy)', marginBottom: 3 }}>{n.title}</p>
                    <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n.message}</p>
                  {/* Expanded contact message */}
                  {n.type === 'contact_message' && expanded === n._id && (
                    <ContactMessageExpanded meta={n.meta} />
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: meta.bg, color: meta.color }}>
                      {n.type.replace('_', ' ')}
                    </span>
                    {n.type === 'contact_message' && (
                      <button onClick={e => { e.stopPropagation(); setExpanded(prev => prev === n._id ? null : n._id); }}
                        style={{ fontSize: 11, color: '#92400E', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                        {expanded === n._id ? 'Hide message ▲' : 'View message ▼'}
                      </button>
                    )}
                    {!n.read && (
                      <button onClick={e => { e.stopPropagation(); handleMarkRead(n._id); }}
                        style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                        Mark read
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                      style={{ fontSize: 11, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
