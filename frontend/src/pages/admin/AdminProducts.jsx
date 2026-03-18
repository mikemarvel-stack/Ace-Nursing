import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '../../api';
import { CATEGORY_GROUPS } from '../../categories';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'RN Prep (NCLEX-RN)', price: 0, originalPrice: 0, badge: '', emoji: '📘', isActive: true, featured: false, seoTitle: '', seoDescription: '', seoKeywords: '' });

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
      description: editingProduct.description || '',
      category: editingProduct.category || 'RN Prep (NCLEX-RN)',
      price: editingProduct.price || 0,
      originalPrice: editingProduct.originalPrice || 0,
      badge: editingProduct.badge || '',
      emoji: editingProduct.emoji || '📘',
      isActive: editingProduct.isActive ?? true,
      featured: editingProduct.featured ?? false,
      seoTitle: editingProduct.seo?.metaTitle || '',
      seoDescription: editingProduct.seo?.metaDescription || '',
      seoKeywords: editingProduct.seo?.keywords?.join(', ') || '',
    });
  }, [editingProduct]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}"?`)) return;
    setDeletingId(id);
    try {
      await productAPI.delete(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product removed');
    } catch { toast.error('Failed to remove product'); }
    finally { setDeletingId(null); }
  };

  const handleToggleFeatured = async (id, current) => {
    try {
      await productAPI.update(id, { featured: !current });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, featured: !current } : p));
      toast.success(!current ? 'Marked as featured' : 'Removed from featured');
    } catch { toast.error('Update failed'); }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        price: form.price,
        originalPrice: form.originalPrice,
        badge: form.badge,
        emoji: form.emoji,
        isActive: form.isActive,
        featured: form.featured,
        seo: {
          metaTitle: form.seoTitle || undefined,
          metaDescription: form.seoDescription || undefined,
          keywords: form.seoKeywords ? form.seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        },
      };
      const res = await productAPI.update(editingProduct._id, payload);
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? res.data.product : p));
      toast.success('Product updated');
      setEditingProduct(null);
    } catch { toast.error('Failed to update product'); }
    finally { setIsSaving(false); }
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 28, color: 'var(--navy)' }}>Manage Products</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{products.length} products</p>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: 36, width: 200 }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div><p>No products found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.map((p, i) => (
            <div key={p._id} style={{ padding: '12px 14px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--navy), #1E3050)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {p.emoji || '📘'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.title}</span>
                    {p.featured && <span style={{ fontSize: 9, background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>FEATURED</span>}
                    {!p.isActive && <span style={{ fontSize: 9, background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>HIDDEN</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {p.category} · {p.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {p.totalSales || 0} sales
                  </div>
                </div>
              </div>
              {/* Actions row */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setEditingProduct(p)}
                  style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', color: 'var(--navy)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleToggleFeatured(p._id, p.featured)}
                  style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: p.featured ? '#FEF3C7' : '#fff', color: p.featured ? '#92400E' : 'var(--muted)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  {p.featured ? '★ Featured' : '☆ Feature'}
                </button>
                <button onClick={() => handleDelete(p._id, p.title)} disabled={deletingId === p._id}
                  className="btn btn-danger btn-sm">
                  {deletingId === p._id ? '…' : '🗑 Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: 0 }}
          onClick={e => e.target === e.currentTarget && setEditingProduct(null)}>
          <div style={{ background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', padding: '20px 20px 32px', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="serif" style={{ color: 'var(--navy)', fontSize: 22 }}>Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORY_GROUPS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.items.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Price (USD)</label>
                  <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Original Price</label>
                  <input type="number" className="input" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Emoji</label>
                  <input className="input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Badge</label>
                  <select className="input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                    {['','Best Seller','Popular','New','Top Rated','Best Value','Fan Fave','Advanced','Must Have'].map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active
                </label>
              </div>

              {/* SEO */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>SEO (optional — overrides defaults)</p>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <label className="label">Meta Title <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(50–60 chars ideal)</span></label>
                    <input className="input" value={form.seoTitle} onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))} placeholder={`${form.title} – Nursing Study Material`} maxLength={70} />
                    <p style={{ fontSize: 11, color: form.seoTitle.length > 60 ? '#DC2626' : 'var(--muted)', marginTop: 3 }}>{form.seoTitle.length}/60</p>
                  </div>
                  <div>
                    <label className="label">Meta Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(120–155 chars ideal)</span></label>
                    <textarea className="input" value={form.seoDescription} onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))} rows={2} placeholder={form.description?.slice(0, 155)} maxLength={160} style={{ resize: 'vertical' }} />
                    <p style={{ fontSize: 11, color: form.seoDescription.length > 155 ? '#DC2626' : 'var(--muted)', marginTop: 3 }}>{form.seoDescription.length}/155</p>
                  </div>
                  <div>
                    <label className="label">Keywords <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(comma-separated)</span></label>
                    <input className="input" value={form.seoKeywords} onChange={e => setForm(f => ({ ...f, seoKeywords: e.target.value }))} placeholder="NCLEX prep, nursing pharmacology, study guide" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="btn btn-outline" onClick={() => setEditingProduct(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
