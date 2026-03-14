import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadAPI } from '../../api';

const CATS = ['Study Guides', 'Flashcards', 'Reference Cards', 'Checklists', 'Bundles'];
const EMOJIS = ['📘', '💊', '🗂️', '✅', '📦', '🫀', '🧠', '🔢', '🧪', '⚡', '🏥', '👶'];
const BADGES = ['', 'Best Seller', 'Popular', 'New', 'Top Rated', 'Best Value', 'Fan Fave', 'Advanced', 'Must Have'];

function DropZone({ label, accept, icon, file, onFile }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div
        onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ border: `2px dashed ${dragging ? 'var(--navy)' : file ? '#059669' : 'var(--border)'}`, borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#EBF0F8' : file ? '#EBF5EE' : 'var(--gray)', transition: 'all 0.2s' }}>
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
        <div style={{ fontSize: 30, marginBottom: 8 }}>{file ? '✅' : icon}</div>
        {file ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>{file.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Drag & drop or click to upload</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{accept}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUpload() {
  const [form, setForm] = useState({ title: '', category: 'Study Guides', price: '', originalPrice: '', pages: '', description: '', badge: '', emoji: '📘' });
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Title and sale price are required.'); return; }

    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (pdfFile) fd.append('pdf', pdfFile);
      if (coverFile) fd.append('cover', coverFile);

      setProgress(40);

      await uploadAPI.uploadProductFull(fd);
      setProgress(100);

      toast.success('Product uploaded and published successfully!');
      setForm({ title: '', category: 'Study Guides', price: '', originalPrice: '', pages: '', description: '', badge: '', emoji: '📘' });
      setPdfFile(null);
      setCoverFile(null);
      setProgress(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 780 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="serif" style={{ fontSize: 34, color: 'var(--navy)' }}>Upload Material</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Upload a new nursing study material to the shop</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 22 }}>Product Details</h2>

          <div style={{ marginBottom: 18 }}>
            <label className="label">Product Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g., NCLEX-RN Master Study Guide 2025" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Badge (optional)</label>
              <select className="input" value={form.badge} onChange={set('badge')}>
                {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <label className="label">Sale Price (USD) *</label>
              <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="29.99" required />
            </div>
            <div>
              <label className="label">Original Price (USD)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.originalPrice} onChange={set('originalPrice')} placeholder="49.99" />
            </div>
            <div>
              <label className="label">Page Count</label>
              <input className="input" type="number" min="0" value={form.pages} onChange={set('pages')} placeholder="200" />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={set('description')} rows={4} placeholder="Describe the content, what students will learn, and how it helps them pass…" style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="label">Emoji Icon</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button type="button" key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ width: 42, height: 42, fontSize: 22, borderRadius: 10, border: `2px solid ${form.emoji === e ? 'var(--navy)' : 'var(--border)'}`, background: form.emoji === e ? '#EBF0F8' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 22 }}>Upload Files</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <DropZone label="Cover Image" accept="image/jpeg, image/png, image/webp" icon="🖼️" file={coverFile} onFile={setCoverFile} />
            <DropZone label="PDF Document" accept=".pdf,.docx,.doc,.pptx,.xlsx,.txt,.rtf,.epub" icon="📄" file={pdfFile} onFile={setPdfFile} />
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>Uploading…</span>
              <span style={{ color: 'var(--muted)' }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--gray)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--navy), var(--gold))', width: `${progress}%`, transition: 'width 0.4s ease', borderRadius: 3 }} />
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-lg" type="submit" disabled={uploading} style={{ width: '100%' }}>
          {uploading ? <><span className="spinner" /> Uploading…</> : '⬆ Upload & Publish Product'}
        </button>
      </form>
    </div>
  );
}
