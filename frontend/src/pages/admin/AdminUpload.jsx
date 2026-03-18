import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadAPI } from '../../api';

const CATS = ['Study Guides', 'Flashcards', 'Reference Cards', 'Checklists', 'Bundles'];
const EMOJIS = ['📘', '💊', '🗂️', '✅', '📦', '🫀', '🧠', '🔢', '🧪', '⚡', '🏥', '👶'];
const BADGES = ['', 'Best Seller', 'Popular', 'New', 'Top Rated', 'Best Value', 'Fan Fave', 'Advanced', 'Must Have'];

const ALLOWED_PDF_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PDF_MB = 50;
const MAX_IMAGE_MB = 5;

function validateFile(file, allowedTypes, maxMB) {
  if (!allowedTypes.includes(file.type)) return `Invalid file type: ${file.type}`;
  if (file.size > maxMB * 1024 * 1024) return `File exceeds ${maxMB}MB limit`;
  return null;
}

function DropZone({ label, accept, icon, file, onFile }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        style={{ border: `2px dashed ${dragging ? 'var(--navy)' : file ? '#059669' : 'var(--border)'}`, borderRadius: 12, padding: '20px 12px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#EBF0F8' : file ? '#EBF5EE' : 'var(--gray)', transition: 'all 0.2s' }}>
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
        <div style={{ fontSize: 28, marginBottom: 6 }}>{file ? '✅' : icon}</div>
        {file ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#065F46', wordBreak: 'break-all' }}>{file.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · tap to replace</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Tap or drag to upload</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{accept}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUpload() {
  const [form, setForm] = useState({ title: '', category: 'Study Guides', price: '', originalPrice: '', pages: '', description: '', badge: '', emoji: '📘', seoTitle: '', seoDescription: '', seoKeywords: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Title and price are required.'); return; }
    setUploading(true); setProgress(10);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (pdfFile) fd.append('pdf', pdfFile);
      if (coverFile) fd.append('cover', coverFile);
      setProgress(40);
      await uploadAPI.uploadProductFull(fd);
      setProgress(100);
      toast.success('Product uploaded successfully!');
      setForm({ title: '', category: 'Study Guides', price: '', originalPrice: '', pages: '', description: '', badge: '', emoji: '📘', seoTitle: '', seoDescription: '', seoKeywords: '' });
      setPdfFile(null); setCoverFile(null); setProgress(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
      setProgress(0);
    } finally { setUploading(false); }
  };

  return (
    <div className="admin-page" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="serif" style={{ fontSize: 28, color: 'var(--navy)' }}>Upload Material</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Add a new nursing study material to the shop</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 18px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Product Details</h2>

          <div style={{ marginBottom: 14 }}>
            <label className="label">Product Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g., NCLEX-RN Master Study Guide" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="name-grid">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Badge</label>
              <select className="input" value={form.badge} onChange={set('badge')}>
                {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }} className="three-col-grid">
            <div>
              <label className="label">Sale Price *</label>
              <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="29.99" required />
            </div>
            <div>
              <label className="label">Original Price</label>
              <input className="input" type="number" step="0.01" min="0" value={form.originalPrice} onChange={set('originalPrice')} placeholder="49.99" />
            </div>
            <div>
              <label className="label">Pages</label>
              <input className="input" type="number" min="0" value={form.pages} onChange={set('pages')} placeholder="200" />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={set('description')} rows={3} placeholder="Describe the content…" style={{ resize: 'vertical' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>SEO <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — leave blank to auto-generate)</span></p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label className="label">Meta Title <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(50–60 chars ideal)</span></label>
                <input className="input" value={form.seoTitle} onChange={set('seoTitle')} placeholder={form.title ? `${form.title} – Nursing Study Material` : 'e.g. NCLEX-RN Master Guide – Nursing Study Material'} maxLength={70} />
                <p style={{ fontSize: 11, color: form.seoTitle.length > 60 ? '#DC2626' : 'var(--muted)', marginTop: 3 }}>{form.seoTitle.length}/60</p>
              </div>
              <div>
                <label className="label">Meta Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(120–155 chars ideal)</span></label>
                <textarea className="input" value={form.seoDescription} onChange={set('seoDescription')} rows={2} placeholder="Comprehensive NCLEX-RN study guide covering…" maxLength={160} style={{ resize: 'vertical' }} />
                <p style={{ fontSize: 11, color: form.seoDescription.length > 155 ? '#DC2626' : 'var(--muted)', marginTop: 3 }}>{form.seoDescription.length}/155</p>
              </div>
              <div>
                <label className="label">Keywords <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(comma-separated)</span></label>
                <input className="input" value={form.seoKeywords} onChange={set('seoKeywords')} placeholder="NCLEX prep, nursing pharmacology, study guide" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Emoji Icon</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button type="button" key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ width: 40, height: 40, fontSize: 20, borderRadius: 9, border: `2px solid ${form.emoji === e ? 'var(--navy)' : 'var(--border)'}`, background: form.emoji === e ? '#EBF0F8' : '#fff', cursor: 'pointer' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 18px', marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Upload Files</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="name-grid">
            <DropZone label="Cover Image" accept="image/jpeg, image/png, image/webp" icon="🖼️" file={coverFile} onFile={(f) => {
              const err = validateFile(f, ALLOWED_IMAGE_TYPES, MAX_IMAGE_MB);
              if (err) { toast.error(err); return; }
              setCoverFile(f);
            }} />
            <DropZone label="PDF Document" accept=".pdf,.docx,.pptx,.xlsx" icon="📄" file={pdfFile} onFile={(f) => {
              const err = validateFile(f, ALLOWED_PDF_TYPES, MAX_PDF_MB);
              if (err) { toast.error(err); return; }
              setPdfFile(f);
            }} />
          </div>
        </div>

        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>Uploading…</span>
              <span style={{ color: 'var(--muted)' }}>{progress}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--gray)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--navy), #C49A3C)', width: `${progress}%`, transition: 'width 0.4s ease', borderRadius: 3 }} />
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-lg" type="submit" disabled={uploading} style={{ width: '100%' }}>
          {uploading ? <><span className="spinner" /> Uploading…</> : '⬆ Upload & Publish'}
        </button>
      </form>
    </div>
  );
}
