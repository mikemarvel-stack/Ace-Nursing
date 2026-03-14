import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed:  ['#D1FAE5', '#065F46'],
  pending:    ['#FEF3C7', '#92400E'],
  processing: ['#DBEAFE', '#1E40AF'],
  cancelled:  ['#FEE2E2', '#991B1B'],
  refunded:   ['#EDE9FE', '#5B21B6'],
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 28 }}>{icon}</div>
        {color && <span style={{ background: color + '20', color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>This month</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ordersAPI.getStats(), ordersAPI.getAll({ limit: 8 })])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes.data);
        setOrders(ordersRes.data.orders);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16, marginBottom: 32 }}>
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="serif" style={{ fontSize: 34, color: 'var(--navy)' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Welcome back. Here's what's happening.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard icon="💰" label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} sub={`+$${(stats?.thisMonth?.revenue || 0).toFixed(2)} this month`} color="#059669" />
        <StatCard icon="🧾" label="Total Orders" value={stats?.totalOrders || 0} sub={`${stats?.thisMonth?.orders || 0} this month`} color="#1A7A6E" />
        <StatCard icon="⏳" label="Pending / Processing" value={stats?.pendingOrders || 0} />
        <StatCard icon="📦" label="Active Products" value={stats?.activeProducts ?? '—'} />
        <StatCard icon="👥" label="Total Customers" value={stats?.totalUsers ?? '—'} />
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Recent Orders</h3>
          <Link to="/admin/orders" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View all →</Link>
        </div>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div>
            <p>No orders yet</p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--gray)' }}>
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const [bg, fg] = STATUS_COLORS[o.status] || ['#F3F4F6', '#374151'];
                  return (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{o.orderNumber}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.customerInfo.firstName} {o.customerInfo.lastName}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>${o.total.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color: fg }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
