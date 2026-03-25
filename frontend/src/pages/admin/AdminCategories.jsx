import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '📘',
    displayOrder: 0,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
  });

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/categories?isActive=true&parentOnly=true`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      toast.error('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId
        ? `${apiBase}/admin/categories/${editingId}`
        : `${apiBase}/admin/categories`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save category');
      }

      toast.success(editingId ? 'Category updated' : 'Category created');
      setFormData({
        name: '',
        description: '',
        emoji: '📘',
        displayOrder: 0,
        seo: { metaTitle: '', metaDescription: '', keywords: [] },
      });
      setEditingId(null);
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (cat) => {
    setFormData(cat);
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      const res = await fetch(`${apiBase}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete category');

      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      emoji: '📘',
      displayOrder: 0,
      seo: { metaTitle: '', metaDescription: '', keywords: [] },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Categories</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="e.g., RN Prep (NCLEX-RN)"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Emoji
                </label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  maxLength="2"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                }}
                placeholder="Category description for users and SEO"
              />
            </div>

            <div style={{
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}>
              <h3 style={{ marginTop: 0 }}>SEO Settings</h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Meta Title (60 chars)
                </label>
                <input
                  type="text"
                  value={formData.seo?.metaTitle || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    seo: { ...formData.seo, metaTitle: e.target.value },
                  })}
                  maxLength="60"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                  placeholder="Leave empty for auto-generation"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Meta Description (160 chars)
                </label>
                <textarea
                  value={formData.seo?.metaDescription || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    seo: { ...formData.seo, metaDescription: e.target.value },
                  })}
                  maxLength="160"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Leave empty for auto-generation"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={(formData.seo?.keywords || []).join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    seo: {
                      ...formData.seo,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                  placeholder="nursing, NCLEX, study guides"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
            No categories yet. Create one to get started!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Products</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>{cat.emoji}</span>
                    {cat.name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', maxWidth: '300px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                      {cat.productCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(cat)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        marginRight: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
