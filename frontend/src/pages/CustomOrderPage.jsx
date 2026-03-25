import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { customOrdersAPI, paymentAPI, uploadAPI } from '../api';
import useSEO from '../hooks/useSEO';

const TYPES = ['Essay', 'Case Study', 'Care Plan', 'Research Paper', 'Presentation', 'Exam Prep', 'Other'];
const LEVELS = ['Certificate', 'Diploma', 'Undergraduate', 'Postgraduate', 'Other'];
const CITATIONS = ['APA', 'MLA', 'Harvard', 'Chicago', 'None', 'Other'];

const STATUS_META = {
  submitted:          { label: 'Submitted',       color: '#1E40AF', bg: '#DBEAFE', icon: '📝' },
  reviewing:          { label: 'Under Review',    color: '#92400E', bg: '#FEF3C7', icon: '🔍' },
  quoted:             { label: 'Quote Ready',     color: '#065F46', bg: '#D1FAE5', icon: '💰' },
  accepted:           { label: 'Accepted',        color: '#065F46', bg: '#D1FAE5', icon: '✅' },
  declined:           { label: 'Declined',        color: '#991B1B', bg: '#FEE2E2', icon: '❌' },
  in_progress:        { label: 'In Progress',     color: '#5B21B6', bg: '#EDE9FE', icon: '⚙️' },
  delivered:          { label: 'Delivered',       color: '#065F46', bg: '#D1FAE5', icon: '🎉' },
  completed:          { label: 'Completed',       color: '#374151', bg: '#F3F4F6', icon: '🏁' },
  revision_requested: { label: 'Revision Req.',   color: '#92400E', bg: '#FEF3C7', icon: '🔄' },
  cancelled:          { label: 'Cancelled',       color: '#991B1B', bg: '#FEE2E2', icon: '🚫' },
};

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
  const s = Math.floor((ms % 60000) / 1000);
  const urgent = ms < 86400000;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {[['Days', d], ['Hrs', h], ['Min', m], ['Sec', s]].map(([l, v]) => (
        <div key={l} style={{ textAlign: 'center', background: urgent ? '#FEE2E2' : '#EBF0F8', borderRadius: 8, padding: '6px 10px', minWidth: 48 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: urgent ? '#DC2626' : 'var(--navy)', lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function PayNowModal({ order, onClose, onPaid }) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [internalOrderId] = useState(order._id);
  const [processing, setProcessing] = useState(false);

  const createOrder = async () => {
    const res = await paymentAPI.createCustomPayPalOrder({ customOrderId: order._id });
    return res.data.paypalOrderId;
  };

  const onApprove = async (data) => {
    setProcessing(true);
    try {
      const res = await paymentAPI.captureCustomPayPalOrder({
        paypalOrderId: data.orderID,
        customOrderId: internalOrderId,
      });
      toast.success('Payment successful! Downloading now…');
      onPaid(res.data.downloadUrl);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally { setProcessing(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, padding: '28px 28px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="serif" style={{ color: 'var(--navy)', fontSize: 22 }}>Pay & Download</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)' }}>×</button>
        </div>
        <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>{order.assignmentType} — {order.subject}</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>${order.quote.price.toFixed(2)}</p>
        </div>
        {processing ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--navy)', borderColor: 'var(--border)', width: 36, height: 36, borderWidth: 3, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Processing payment…</p>
          </div>
        ) : isPending ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner" style={{ borderTopColor: '#C49A3C', borderColor: '#ddd', width: 32, height: 32, borderWidth: 3, margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading PayPal…</p>
          </div>
        ) : (
          <PayPalButtons
            style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={() => toast.error('PayPal error. Please try again.')}
            onCancel={() => toast('Payment cancelled.')}
            disabled={processing}
          />
        )}
      </div>
    </div>
  );
}

function RedownloadButton({ orderId }) {
  const [loading, setLoading] = useState(false);
  const handleRedownload = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.redownloadCustomOrder(orderId);
      const a = document.createElement('a');
      a.href = res.data.downloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { toast.error('Failed to get download link. Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <button className="btn btn-outline btn-sm" onClick={handleRedownload} disabled={loading}>
      {loading ? 'Generating link…' : '⬇ Re-download'}
    </button>
  );
}

function OrderCard({ order, onRespond, onRevision, onConfirmReceipt, onPayNow }) {
  const sm = STATUS_META[order.status] || STATUS_META.submitted;
  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevision, setShowRevision] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const revisionsUsed = order.revisionsUsed ?? 0;
  const revisionsRemaining = 3 - revisionsUsed;
  const confirmed = !!order.delivery?.confirmedAt;

  return (
    <div className="card" style={{ padding: 22, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>#{order.orderNumber}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: sm.bg, color: sm.color }}>
              {sm.icon} {sm.label}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            {order.assignmentType} · {order.subject} · {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        {order.quote?.price && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--navy)' }}>${order.quote.price.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{order.quote.daysToComplete} day(s) delivery</div>
          </div>
        )}
      </div>

      {order.attachments?.length > 0 && (
        <div style={{ marginBottom: 14, background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📎 Submitted Attachments</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151' }}>
            {order.attachments.map((file) => (
              <li key={file.fileKey}>
                {file.url ? <a href={file.url} target="_blank" rel="noreferrer">{file.originalName}</a> : file.originalName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Countdown timer when accepted/in_progress */}
      {['accepted', 'in_progress'].includes(order.status) && order.delivery?.dueAt && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            ⏱ Time Remaining
          </p>
          <Countdown dueAt={order.delivery.dueAt} />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            Due: {new Date(order.delivery.dueAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      {/* Quote expiry warning */}
      {order.status === 'quoted' && order.quote?.expiresAt && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
            ⚠️ Quote expires: {new Date(order.quote.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          {order.quote.adminNotes && <p style={{ fontSize: 13, color: '#92400E', marginTop: 4 }}>📝 {order.quote.adminNotes}</p>}
        </div>
      )}

      {/* Delivered — pay to download */}
      {order.status === 'delivered' && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>🎉 Your assignment is ready!</p>
          {order.payment?.status === 'paid' ? (
            order.delivery?.downloadUrl
              ? <a href={order.delivery.downloadUrl} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">⬇ Download Assignment</a>
              : <p style={{ fontSize: 13, color: '#065F46' }}>Payment confirmed. Download link will arrive by email shortly.</p>
          ) : (
            <button className="btn btn-primary btn-sm" style={{ background: '#C49A3C', borderColor: '#C49A3C' }} onClick={() => onPayNow(order)}>
              💳 Pay Now → Download
            </button>
          )}
        </div>
      )}

      {/* Completed + paid — download, confirm receipt, then revisions */}
      {order.status === 'completed' && order.payment?.status === 'paid' && (
        <div style={{ background: '#EBF0F8', border: '1px solid #C0D4F0', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: confirmed ? 12 : 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
              🏁 Paid &amp; completed
              {confirmed && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#059669' }}>✔ Receipt confirmed</span>}
            </p>
            <RedownloadButton orderId={order._id} />
          </div>

          {/* Confirm receipt CTA */}
          {!confirmed && (
            <div style={{ background: '#FEF9EC', border: '1px solid #F5E0A0', borderRadius: 8, padding: '10px 14px', marginTop: 10 }}>
              <p style={{ fontSize: 13, color: '#7A5B00', marginBottom: 8 }}>
                👀 Reviewed the work? Confirm receipt to unlock revision requests.
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: '#C49A3C', borderColor: '#C49A3C' }}
                disabled={confirming}
                onClick={async () => {
                  setConfirming(true);
                  await onConfirmReceipt(order._id);
                  setConfirming(false);
                }}
              >
                {confirming ? 'Confirming…' : '✅ Confirm I’ve Reviewed the Work'}
              </button>
            </div>
          )}

          {/* Revision section — only after confirmation */}
          {confirmed && (
            <div style={{ borderTop: '1px solid #C0D4F0', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>🔄 Revisions</p>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: revisionsRemaining > 0 ? '#D1FAE5' : '#FEE2E2',
                  color: revisionsRemaining > 0 ? '#065F46' : '#991B1B',
                }}>
                  {revisionsRemaining} of 3 remaining
                </span>
              </div>
              {revisionsRemaining === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>All 3 revisions used. Contact support for further changes.</p>
              ) : !showRevision ? (
                <button className="btn btn-outline btn-sm" onClick={() => setShowRevision(true)}>🔄 Request Revision</button>
              ) : (
                <div>
                  <textarea className="input" value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
                    placeholder="Describe exactly what needs to be revised…" rows={3}
                    style={{ marginBottom: 10, resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { onRevision(order._id, revisionNotes); setShowRevision(false); setRevisionNotes(''); }}>
                      Submit Revision Request
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowRevision(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {order.status === 'quoted' && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {!declining ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => onRespond(order._id, 'accepted')}>✅ Accept Quote — ${order.quote.price.toFixed(2)}</button>
              <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => setDeclining(true)}>❌ Decline</button>
            </div>
          ) : (
            <div>
              <textarea className="input" value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                placeholder="Optional: tell us why you're declining…" rows={2} style={{ marginBottom: 10, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm" onClick={() => onRespond(order._id, 'declined', declineReason)}>Confirm Decline</button>
                <button className="btn btn-outline btn-sm" onClick={() => setDeclining(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function CustomOrderPage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('form'); // 'form' | 'success' | 'myorders'
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [resolvingPay, setResolvingPay] = useState(false); // true while loading orders for ?pay= redirect

  const [attachments, setAttachments] = useState([]);
  const [attachUploadProgress, setAttachUploadProgress] = useState(0);
  const [attachUploading, setAttachUploading] = useState(false);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    assignmentType: 'Essay',
    pages: '',
    deadline: '',
    academicLevel: 'Undergraduate',
    citationStyle: 'APA',
    requirements: '',
    attachmentNotes: '',
  });

  useSEO({
    title: 'Custom Assignment Orders',
    description: 'Submit a custom nursing assignment request. Get a quote within 24 hours. Case studies, care plans, essays, research papers and more.',
    canonical: 'https://acenursing.com/custom-order',
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const uploadAttachment = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    setAttachUploading(true);
    setAttachUploadProgress(0);

    try {
      const res = await uploadAPI.uploadCustomOrderFile(fd, {
        onProgress: (evt) => {
          if (evt.total) setAttachUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const uploaded = {
        key: res.data.key,
        originalName: res.data.originalName,
        url: res.data.signedUrl,
      };
      setAttachments(prev => [...prev, uploaded]);
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Attachment upload failed. Please try again.');
    } finally {
      setAttachUploading(false);
      setAttachUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (key) => {
    setAttachments(prev => prev.filter(item => item.key !== key));
  };

  const loadMyOrders = async (autoPayId) => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const res = await customOrdersAPI.getMine();
      setMyOrders(res.data.orders);
      setView('myorders');
      if (autoPayId) {
        const target = res.data.orders.find(o => o._id === autoPayId);
        if (target && target.status === 'delivered' && target.payment?.status !== 'paid') {
          setPayingOrder(target);
        }
      }
    } catch { toast.error('Failed to load orders'); }
    finally { setLoadingOrders(false); }
  };

  // Handle ?pay=ORDER_ID from email / notification link
  useEffect(() => {
    const payId = searchParams.get('pay');
    if (payId && isAuthenticated) {
      setResolvingPay(true);
      loadMyOrders(payId).finally(() => setResolvingPay(false));
      setSearchParams({}, { replace: true });
    } else if (payId && !isAuthenticated) {
      navigate('/login?redirect=/custom-order?pay=' + payId);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.deadline || !form.requirements) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, attachments };
      const res = await customOrdersAPI.submit(payload);
      setSubmittedOrder(res.data);
      setView('success');
      setAttachments([]);
      toast.success('Request submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleRespond = async (id, action, declineReason) => {
    try {
      await customOrdersAPI.respond(id, { action, declineReason });
      toast.success(action === 'accepted' ? 'Quote accepted! Work begins now.' : 'Quote declined.');
      loadMyOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to respond.'); }
  };

  const handleRevision = async (id, notes) => {
    try {
      const res = await customOrdersAPI.requestRevision(id, { notes });
      toast.success(`Revision request submitted. ${res.data.revisionsRemaining} revision(s) remaining.`);
      loadMyOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit revision request.'); }
  };

  const handleConfirmReceipt = async (id) => {
    try {
      await customOrdersAPI.confirmReceipt(id);
      toast.success('Receipt confirmed! You can now request up to 3 revisions.');
      loadMyOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to confirm receipt.'); }
  };

  const handlePaid = (url) => {
    setPayingOrder(null);
    setDownloadUrl(url);
    loadMyOrders();
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {resolvingPay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--navy)', borderColor: 'var(--border)', width: 44, height: 44, borderWidth: 4, margin: '0 auto 14px' }} />
            <p style={{ color: 'var(--navy)', fontWeight: 600 }}>Loading your order…</p>
          </div>
        </div>
      )}
      {payingOrder && (
        <PayNowModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={handlePaid}
        />
      )}
      {/* Hero */}
      <div style={{ background: 'var(--navy)', padding: '52px 0 44px' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p style={{ color: '#C49A3C', fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Custom Orders</p>
          <h1 className="serif" style={{ color: '#fff', fontSize: 'clamp(30px,5vw,46px)', marginBottom: 12 }}>
            Need a Custom Nursing Assignment?
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 520, marginBottom: 24 }}>
            Submit your requirements, receive a quote within 24 hours, and get expert-written nursing assignments delivered on time.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['📝 Essays & Research', '🏥 Care Plans', '📊 Case Studies', '🎓 Exam Prep'].map(t => (
              <span key={t} style={{ background: 'rgba(196,154,60,0.15)', border: '1px solid rgba(196,154,60,0.3)', color: '#C49A3C', fontSize: 13, padding: '5px 14px', borderRadius: 20 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 760, padding: '40px 24px 80px' }}>

        {/* Tab switcher */}
        {isAuthenticated && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--gray)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {[['form', '📝 New Request'], ['myorders', '📋 My Orders']].map(([v, l]) => (
              <button key={v} onClick={() => v === 'myorders' ? loadMyOrders() : setView('form')}
                style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: view === v ? 'var(--navy)' : 'transparent', color: view === v ? '#fff' : 'var(--muted)', fontWeight: view === v ? 700 : 400, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Success state */}
        {view === 'success' && submittedOrder && (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }} className="animate-fade-up">
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 className="serif" style={{ color: 'var(--navy)', fontSize: 28, marginBottom: 10 }}>Request Submitted!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 6 }}>
              Your request <strong>#{submittedOrder.orderNumber}</strong> has been received.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
              We'll review it and send you a quote within <strong>24 hours</strong>. Check your email and account notifications.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isAuthenticated && <button className="btn btn-primary" onClick={loadMyOrders}>📋 Track My Orders</button>}
              <button className="btn btn-outline" onClick={() => { setView('form'); setSubmittedOrder(null); }}>Submit Another</button>
            </div>
          </div>
        )}

        {/* My Orders */}
        {view === 'myorders' && (
          <div>
            <h2 className="serif" style={{ fontSize: 26, color: 'var(--navy)', marginBottom: 20 }}>My Custom Orders</h2>
            {loadingOrders ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
              </div>
            ) : myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <h3 style={{ color: 'var(--navy)', marginBottom: 8 }}>No custom orders yet</h3>
                <button className="btn btn-primary" onClick={() => setView('form')}>Submit a Request →</button>
              </div>
            ) : (
              myOrders.map(o => (
                <OrderCard key={o._id} order={o} onRespond={handleRespond} onRevision={handleRevision} onConfirmReceipt={handleConfirmReceipt} onPayNow={setPayingOrder} />
              ))
            )}
          </div>
        )}

        {/* Request Form */}
        {view === 'form' && (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 28px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Submit Your Assignment Request</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Fill in the details below. We'll review and send you a quote within 24 hours.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Contact info */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Your Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="name-grid">
                  <div>
                    <label className="label">First Name *</label>
                    <input className="input" required value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input className="input" required value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="jane@example.com" />
                  </div>
                  <div>
                    <label className="label">Phone (optional)</label>
                    <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" />
                  </div>
                </div>
              </div>

              {/* Assignment details */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Assignment Details</p>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label className="label">Subject / Topic *</label>
                    <input className="input" required value={form.subject} onChange={set('subject')} placeholder="e.g. Pathophysiology of Heart Failure" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="name-grid">
                    <div>
                      <label className="label">Assignment Type *</label>
                      <select className="input" value={form.assignmentType} onChange={set('assignmentType')}>
                        {TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Number of Pages</label>
                      <input className="input" type="number" min="1" value={form.pages} onChange={set('pages')} placeholder="e.g. 5" />
                    </div>
                    <div>
                      <label className="label">Academic Level</label>
                      <select className="input" value={form.academicLevel} onChange={set('academicLevel')}>
                        {LEVELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Citation Style</label>
                      <select className="input" value={form.citationStyle} onChange={set('citationStyle')}>
                        {CITATIONS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Deadline *</label>
                    <input className="input" type="datetime-local" required value={form.deadline} onChange={set('deadline')}
                      min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)} />
                  </div>
                  <div>
                    <label className="label">Requirements & Instructions *</label>
                    <textarea className="input" required rows={5} value={form.requirements} onChange={set('requirements')}
                      placeholder="Describe your assignment in detail — topic, instructions, rubric, specific requirements, learning outcomes to address…"
                      style={{ resize: 'vertical', minHeight: 120 }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{form.requirements.length}/5000</p>
                  </div>
                  <div>
                    <label className="label">Files to Attach <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>

                    {attachments.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {attachments.map(file => (
                          <div key={file.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, background: '#F3F4F6', borderRadius: 8, padding: '8px 10px' }}>
                            <span style={{ fontSize: 13, color: '#111', flex: 1 }}>{file.originalName}</span>
                            <a href={file.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0C1B33', textDecoration: 'underline' }}>Preview</a>
                            <button type="button" onClick={() => handleRemoveAttachment(file.key)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        await uploadAttachment(file);
                      }}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={attachUploading}
                      style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                    >
                      {attachUploading ? `Uploading… ${attachUploadProgress}%` : '📎 Upload File'}
                    </button>

                    <label className="label" style={{ marginTop: 10 }}>Attachment Notes</label>
                    <textarea className="input" rows={2} value={form.attachmentNotes} onChange={set('attachmentNotes')}
                      placeholder="Describe files or relevant context (e.g. rubric, lecture notes)."
                      style={{ resize: 'vertical' }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>You can still email extra materials to <strong>supportacenursing@gmail.com</strong> if needed.</p>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '16px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>How it works</p>
                <div style={{ display: 'grid', gap: 6 }}>
                  {[
                    ['1', 'Submit your request — free, no commitment'],
                    ['2', 'We review and send a quote within 24 hours'],
                    ['3', 'Accept or decline the quote'],
                    ['4', 'We deliver your assignment before the deadline'],
                    ['5', 'Request revisions if needed — included'],
                  ].map(([n, t]) => (
                    <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, background: 'var(--navy)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{n}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>🔒 Your information is kept private and never shared.</p>
                <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Submitting…</> : '📝 Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
