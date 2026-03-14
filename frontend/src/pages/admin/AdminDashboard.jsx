import { useEffect, useState } from 'react';
import { ordersAPI, productAPI } from '../../api';

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
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="serif" style={{ fontSize: 34, color: 'var(--navy)' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Welcome back. Here's what's happening.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard icon="💰" label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} sub={`+$${(stats?.thisMonth?.revenue || 0).toFixed(2)} this month`} color="#059669" />
        <StatCard icon="🧾" label="Total Orders" value={stats?.totalOrders || 0} sub={`${stats?.thisMonth?.orders || 0} this month`} color="#1A7A6E" />
        <StatCard icon="⏳" label="Pending Orders" value={stats?.pendingOrders || 0} />
        <StatCard icon="📦" label="Active Products" value="—" />
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Recent Orders</h3>
        </div>
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
              {orders.map((o) => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{o.orderNumber}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.customerInfo.firstName} {o.customerInfo.lastName}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>${o.total.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: o.status === 'completed' ? '#D1FAE5' : o.status === 'pending' ? '#FEF3C7' : '#FEE2E2', color: o.status === 'completed' ? '#065F46' : o.status === 'pending' ? '#92400E' : '#991B1B' }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
