import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI } from '../../api';

const STATUS_COLORS = {
  completed:  ['#D1FAE5', '#065F46'],
  pending:    ['#FEF3C7', '#92400E'],
  processing: ['#DBEAFE', '#1E40AF'],
  cancelled:  ['#FEE2E2', '#991B1B'],
  refunded:   ['#EDE9FE', '#5B21B6'],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchOrders = () => {
    setLoading(true);
    ordersAPI.getAll({ search, status: statusFilter, limit: LIMIT, page })
      .then(res => { setOrders(res.data.orders); setTotal(res.data.total); })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [search, statusFilter, page]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await ordersAPI.update(id, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="admin-page">
      <div style={{ marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 28, color: 'var(--navy)' }}>Orders</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{total} total orders</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order # or email…" style={{ paddingLeft: 38 }} />
        </div>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div><p>No orders found</p>
            </div>
          ) : orders.map((o, i) => (
            <div key={o._id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                onMouseOver={e => e.currentTarget.style.background = 'var(--gray)'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{o.orderNumber}</span>
                    <span className="badge" style={{ background: STATUS_COLORS[o.status]?.[0] || '#eee', color: STATUS_COLORS[o.status]?.[1] || '#666', fontSize: 10 }}>{o.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {o.customerInfo.firstName} {o.customerInfo.lastName} · {o.customerInfo.email}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {o.items.length} item{o.items.length !== 1 ? 's' : ''} · {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>${o.total.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{expanded === o._id ? '▲' : '▼'}</div>
                </div>
              </div>

              {expanded === o._id && (
                <div style={{ background: 'var(--gray)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Items</h4>
                    {o.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 3 }}>
                        {item.emoji || '📘'} {item.title} ×{item.quantity} — ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Update Status</h4>
                    <select className="input" value={o.status} onChange={e => handleStatusUpdate(o._id, e.target.value)} style={{ marginBottom: 6, fontSize: 13 }}>
                      {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Payment: {o.payment.status} · {o.payment.method}
                      {o.payment.paypalCaptureId && <><br />PayPal: {o.payment.paypalCaptureId}</>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--muted)', padding: '0 10px' }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}>Next →</button>
        </div>
      )}
    </div>
  );
}
