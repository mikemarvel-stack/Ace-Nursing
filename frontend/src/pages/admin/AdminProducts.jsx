import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '../../api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Study Guides',
    price: 0,
    originalPrice: 0,
    badge: '',
    emoji: '📘',
    isActive: true,
    featured: false,
  });

  useEffect(() => {
    productAPI.adminGetAll()
      .then(res => setProducts(res.data.products))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editingProduct) return;
    setForm({
      title: editingProduct.title || '',
      category: editingProduct.category || 'Study Guides',
      price: editingProduct.price || 0,
      originalPrice: editingProduct.originalPrice || 0,
      badge: editingProduct.badge || '',
      emoji: editingProduct.emoji || '📘',
      isActive: editingProduct.isActive ?? true,
      featured: editingProduct.featured ?? false,
    });
  }, [editingProduct]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}"? This will hide it from the shop.`)) return;
    setDeletingId(id);
    try {
      await productAPI.delete(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product removed from shop');
    } catch {
      toast.error('Failed to remove product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFeatured = async (id, current) => {
    try {
      await productAPI.update(id, { featured: !current });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, featured: !current } : p));
      toast.success(!current ? 'Marked as featured' : 'Removed from featured');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      const res = await productAPI.update(editingProduct._id, form);
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? res.data.product : p));
      toast.success('Product updated');
      setEditingProduct(null);
    } catch {
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 34, color: 'var(--navy)' }}>Manage Products</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{products.length} total products</p>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ paddingLeft: 38, width: 240 }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>No products found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.map((p, i) => (
            <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--gray)'}
              onMouseOut={e => e.currentTarget.style.background = '#fff'}>

              {/* Emoji */}
              <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg, var(--navy), #1E3050)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {p.emoji || '📘'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{p.title}</span>
                  {p.featured && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>FEATURED</span>}
                  {!p.isActive && <span style={{ fontSize: 10, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>HIDDEN</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                  <span>{p.category}</span>
                  <span>{p.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                  <span>⭐ {p.rating?.average || 0} ({p.rating?.count || 0} reviews)</span>
                  <span>{p.totalSales || 0} sales</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditingProduct(p)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
                  Edit
                </button>
                <button onClick={() => handleToggleFeatured(p._id, p.featured)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: p.featured ? '#FEF3C7' : '#fff', color: p.featured ? '#92400E' : 'var(--muted)', fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
                  {p.featured ? '★ Featured' : '☆ Feature'}
                </button>
                <button onClick={() => handleDelete(p._id, p.title)} disabled={deletingId === p._id}
                  className="btn btn-danger btn-sm">
                  {deletingId === p._id ? '…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 18px 45px rgba(0,0,0,0.35)', position: 'relative' }}>
            <button onClick={() => setEditingProduct(null)} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>
              ×
            </button>
            <h2 className="serif" style={{ marginBottom: 12, color: 'var(--navy)' }}>Edit product</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <label style={{ fontSize: 12, fontWeight: 600 }}>Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option>Study Guides</option>
                <option>Flashcards</option>
                <option>Reference Cards</option>
                <option>Checklists</option>
                <option>Bundles</option>
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Price (USD)</label>
                  <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Original Price</label>
                  <input type="number" className="input" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Emoji</label>
                  <input className="input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Badge</label>
                  <input className="input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button className="btn btn-outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
