import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { customOrdersAPI, uploadAPI } from '../../api';

const STATUS_META = {
  submitted:          { label: 'Submitted',     color: '#1E40AF', bg: '#DBEAFE' },
  reviewing:          { label: 'Reviewing',     color: '#92400E', bg: '#FEF3C7' },
  quoted:             { label: 'Quoted',        color: '#065F46', bg: '#D1FAE5' },
  accepted:           { label: 'Accepted',      color: '#065F46', bg: '#D1FAE5' },
  declined:           { label: 'Declined',      color: '#991B1B', bg: '#FEE2E2' },
  in_progress:        { label: 'In Progress',   color: '#5B21B6', bg: '#EDE9FE' },
  delivered:          { label: 'Delivered',     color: '#065F46', bg: '#D1FAE5' },
  completed:          { label: 'Completed',     color: '#374151', bg: '#F3F4F6' },
  revision_requested: { label: 'Revision Req.', color: '#92400E', bg: '#FEF3C7' },
  cancelled:          { label: 'Cancelled',     color: '#991B1B', bg: '#FEE2E2' },
};

const STATUSES = Object.keys(STATUS_META);

function Countdown({ dueAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, new Date(dueAt) - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const urgent = ms < 86400000;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: urgent ? '#DC2626' : '#065F46' }}>
      ⏱ {d}d {h}h {m}m remaining
    </span>
  );
}

export default function AdminCustomOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: '', daysToComplete: '', adminNotes: '' });
  const [deliveryForm, setDeliveryForm] = useState({ notes: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null); // { key, originalName, signedUrl }
  const fileInputRef = useRef();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      customOrdersAPI.getAll({ status: filter === 'all' ? undefined : filter, limit: 50 }),
      customOrdersAPI.getStats(),
    ])
      .then(([ordersRes, statsRes]) => {
        if (cancelled) return;
        setOrders(ordersRes.data.orders);
        setStats(statsRes.data);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter]);

  const load = () => {
    setLoading(true);
    Promise.all([
      customOrdersAPI.getAll({ status: filter === 'all' ? undefined : filter, limit: 50 }),
      customOrdersAPI.getStats(),
    ])
      .then(([ordersRes, statsRes]) => {
        setOrders(ordersRes.data.orders);
        setStats(statsRes.data);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  const handleSendQuote = async () => {
    if (!quoteForm.price || !quoteForm.daysToComplete) { toast.error('Price and delivery days are required.'); return; }
    setSaving(true);
    try {
      const res = await customOrdersAPI.sendQuote(selected._id, quoteForm);
      toast.success('Quote sent to customer!');
      setSelected(res.data.order);
      setQuoteForm({ price: '', daysToComplete: '', adminNotes: '' });
      setOrders(prev => prev.map(o => o._id === res.data.order._id ? res.data.order : o));
      setStats(s => ({ ...s })); // trigger stats refresh
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send quote.'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await customOrdersAPI.update(id, { status });
      toast.success('Status updated');
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      if (selected?._id === id) setSelected(res.data.order);
    } catch { toast.error('Failed to update status'); }
  };

  const handleDeliver = async () => {
    if (!uploadedFile) { toast.error('Please upload a file first.'); return; }
    setSaving(true);
    try {
      await customOrdersAPI.update(selected._id, {
        status: 'delivered',
        deliveryFileKey: uploadedFile.key,
        deliveryOriginalName: uploadedFile.originalName,
        deliveryNotes: deliveryForm.notes,
      });
      toast.success('Assignment marked as delivered! Customer notified.');
      setSelected(null);
      setDeliveryForm({ notes: '' });
      setUploadedFile(null);
      setUploadProgress(0);
      load();
    } catch { toast.error('Failed to mark as delivered.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="admin-page">
      <div style={{ marginBottom: 24 }}>
        <h1 className="serif" style={{ fontSize: 28, color: 'var(--navy)' }}>Custom Assignment Orders</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{stats.total || 0} total requests</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          ['📥', 'Total', stats.total || 0, '#EBF0F8', '#1E40AF'],
          ['⏳', 'Pending', stats.pending || 0, '#FEF3C7', '#92400E'],
          ['⚙️', 'Active', stats.active || 0, '#EDE9FE', '#5B21B6'],
          ['✅', 'Delivered', stats.delivered || 0, '#D1FAE5', '#065F46'],
        ].map(([icon, label, val, bg, color]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color, opacity: 0.8 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['submitted', 'New'], ['reviewing', 'Reviewing'], ['quoted', 'Quoted'], ['accepted', 'Accepted'], ['in_progress', 'In Progress'], ['revision_requested', 'Revision'], ['delivered', 'Delivered']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: filter === v ? 700 : 400, background: filter === v ? 'var(--navy)' : '#fff', color: filter === v ? '#fff' : 'var(--muted)', border: `1.5px solid ${filter === v ? 'var(--navy)' : 'var(--border)'}`, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <p>No orders in this category</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {orders.map((o, i) => {
            const sm = STATUS_META[o.status] || STATUS_META.submitted;
            return (
              <div key={o._id} style={{ padding: '14px 16px', borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>#{o.orderNumber}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sm.bg, color: sm.color }}>{sm.label}</span>
                      {o.quote?.price && <span style={{ fontSize: 12, color: 'var(--muted)' }}>${o.quote.price.toFixed(2)}</span>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{o.subject}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {o.customerInfo.firstName} {o.customerInfo.lastName} · {o.customerInfo.email} · {o.assignmentType} · Due {new Date(o.deadline).toLocaleDateString()}
                    </p>
                    {['accepted', 'in_progress'].includes(o.status) && o.delivery?.dueAt && (
                      <div style={{ marginTop: 4 }}><Countdown dueAt={o.delivery.dueAt} /></div>
                    )}
                  </div>
                  <button onClick={() => setSelected(o)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: 'var(--navy)', fontSize: 12, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                    Manage →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Action Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', padding: '20px 22px 36px', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="serif" style={{ color: 'var(--navy)', fontSize: 20 }}>#{selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>

            {/* Details */}
            <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Customer', `${selected.customerInfo.firstName} ${selected.customerInfo.lastName}`],
                  ['Email', selected.customerInfo.email],
                  ['Type', selected.assignmentType],
                  ['Subject', selected.subject],
                  ['Pages', selected.pages || '—'],
                  ['Deadline', new Date(selected.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
                  ['Level', selected.academicLevel],
                  ['Citation', selected.citationStyle],
                ].map(([l, v]) => (
                  <div key={l}>
                    <span style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>{l}</span>
                    <p style={{ fontWeight: 600, color: 'var(--navy)', marginTop: 1 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Requirements</p>
              <div style={{ background: '#F9F9F9', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                {selected.requirements}
              </div>
            </div>

            {selected.attachmentNotes && (
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400E' }}>
                📎 Attachment notes: {selected.attachmentNotes}
              </div>
            )}

            {/* Status update */}
            <div style={{ marginBottom: 16 }}>
              <label className="label">Update Status</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.filter(s => s !== selected.status).map(s => {
                  const sm = STATUS_META[s];
                  return (
                    <button key={s} onClick={() => handleStatusUpdate(selected._id, s)}
                      style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sm.bg, color: sm.color, border: 'none', cursor: 'pointer' }}>
                      {sm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Send Quote */}
            {['submitted', 'reviewing'].includes(selected.status) && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>💰 Send Quote to Customer</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label className="label">Price (USD) *</label>
                    <input className="input" type="number" step="0.01" min="1" value={quoteForm.price}
                      onChange={e => setQuoteForm(f => ({ ...f, price: e.target.value }))} placeholder="49.99" />
                  </div>
                  <div>
                    <label className="label">Delivery Days *</label>
                    <input className="input" type="number" min="1" value={quoteForm.daysToComplete}
                      onChange={e => setQuoteForm(f => ({ ...f, daysToComplete: e.target.value }))} placeholder="3" />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">Notes to Customer (optional)</label>
                  <textarea className="input" rows={2} value={quoteForm.adminNotes}
                    onChange={e => setQuoteForm(f => ({ ...f, adminNotes: e.target.value }))}
                    placeholder="Any notes about scope, assumptions, or requirements…" style={{ resize: 'vertical' }} />
                </div>
                <button className="btn btn-primary" onClick={handleSendQuote} disabled={saving}>
                  {saving ? 'Sending…' : '📨 Send Quote'}
                </button>
              </div>
            )}

            {/* Mark as Delivered */}
            {['accepted', 'in_progress', 'revision_requested'].includes(selected.status) && (
              <div style={{ border: '1px solid #6EE7B7', borderRadius: 12, padding: '16px', background: '#F0FDF4', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 12 }}>🎉 Mark as Delivered</p>

                {/* File picker */}
                <div style={{ marginBottom: 10 }}>
                  <label className="label">Upload Assignment File *</label>
                  {uploadedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#D1FAE5', borderRadius: 8, padding: '10px 14px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46', flex: 1 }}>✅ {uploadedFile.originalName}</span>
                      <button onClick={() => { setUploadedFile(null); setUploadProgress(0); }}
                        style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                  ) : (
                    <>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('file', file);
                          fd.append('customOrderId', selected._id);
                          try {
                            setUploadProgress(1);
                            const res = await uploadAPI.uploadCustomOrderFile(fd, (evt) => {
                              if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
                            });
                            setUploadedFile({ key: res.data.key, originalName: res.data.originalName, signedUrl: res.data.signedUrl });
                            toast.success('File uploaded!');
                          } catch { toast.error('Upload failed.'); setUploadProgress(0); }
                          e.target.value = '';
                        }}
                      />
                      <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current.click()}
                        style={{ width: '100%', justifyContent: 'center' }} disabled={uploadProgress > 0}>
                        {uploadProgress > 0 ? `Uploading… ${uploadProgress}%` : '📎 Choose File'}
                      </button>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="label">Delivery Notes (optional)</label>
                  <textarea className="input" rows={2} value={deliveryForm.notes}
                    onChange={e => setDeliveryForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any notes for the customer about the delivered work…" style={{ resize: 'vertical' }} />
                </div>
                <button className="btn btn-primary" style={{ background: '#059669' }} onClick={handleDeliver} disabled={saving || !uploadedFile}>
                  {saving ? 'Saving…' : '✅ Mark Delivered & Notify Customer'}
                </button>
              </div>
            )}

            {/* Revision requests */}
            {selected.revisionRequests?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Revision Requests</p>
                {selected.revisionRequests.map((r, i) => (
                  <div key={i} style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 13 }}>
                    <p style={{ color: '#92400E', fontWeight: 600, marginBottom: 2 }}>Revision #{i + 1} — {new Date(r.requestedAt).toLocaleDateString()}</p>
                    <p style={{ color: '#92400E' }}>{r.notes || 'No notes provided'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
