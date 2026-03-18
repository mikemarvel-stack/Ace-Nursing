import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI } from '../api';
import { useCartStore, useAuthStore } from '../store';
import useSEO from '../hooks/useSEO';

const SITE_URL = 'https://acenursing.com';

const BADGE_COLORS = {
  'Best Seller': ['#FEF3C7', '#92400E'],
  'Popular':     ['#DBEAFE', '#1E40AF'],
  'New':         ['#D1FAE5', '#065F46'],
  'Top Rated':   ['#EDE9FE', '#5B21B6'],
  'Best Value':  ['#C49A3C', '#FEF9EC'],
  'Fan Fave':    ['#FEE2E2', '#991B1B'],
  'Advanced':    ['#F0FDF4', '#14532D'],
  'Must Have':   ['#FFF7ED', '#9A3412'],
};

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const discount = product && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  useSEO(product ? {
    title: product.seo?.metaTitle || product.title,
    description: product.seo?.metaDescription || product.description?.slice(0, 155),
    canonical: `${SITE_URL}/product/${product.slug}`,
    image: product.coverImage?.url,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.coverImage?.url || `${SITE_URL}/og-image.jpg`,
      sku: product._id,
      brand: { '@type': 'Brand', name: 'AceNursing' },
      offers: {
        '@type': 'Offer',
        price: product.price.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/product/${product.slug}`,
        seller: { '@type': 'Organization', name: 'AceNursing' },
      },
      ...(product.rating?.count > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating.average,
          reviewCount: product.rating.count,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      ...(product.reviews?.length > 0 && {
        review: product.reviews.slice(0, 5).map(r => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.name },
          reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
          reviewBody: r.comment,
        })),
      }),
    },
  } : {});

  useEffect(() => {
    setLoading(true);
    productAPI.getOne(slug)
      .then(res => {
        setProduct(res.data.product);
        // Load related products
        return productAPI.getAll({ category: res.data.product.category, limit: 4 });
      })
      .then(res => setRelated(res.data.products.filter(p => p.slug !== slug || p._id !== slug).slice(0, 3)))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    addItem(product);
    openCart();
    toast.success(`"${product.title.substring(0, 28)}…" added to cart`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please log in to leave a review'); return; }
    setSubmittingReview(true);
    try {
      await productAPI.addReview(product._id, reviewForm);
      toast.success('Review submitted successfully!');
      // Refresh product
      const res = await productAPI.getOne(slug);
      setProduct(res.data.product);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '60px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48 }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
        <div>
          <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 120, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 52 }} />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  return (
    <div style={{ background: 'var(--cream)', paddingBottom: 72 }}>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
          <Link to="/" style={{ color: 'var(--muted)' }}>Home</Link>
          <span>/</span>
          <Link to="/shop" style={{ color: 'var(--muted)' }}>Shop</Link>
          <span>/</span>
          <Link to={`/shop/${product.category.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: 'var(--muted)' }}>{product.category}</Link>
          <span>/</span>
          <span style={{ color: 'var(--navy)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 52, alignItems: 'start', marginBottom: 64 }} className="product-detail-grid">

          {/* ── Cover ─────────────────────────────────────────────────────── */}
          <div>
            <div style={{ background: 'linear-gradient(135deg, #0C1B33 0%, #1E3050 100%)', borderRadius: 20, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
              {product.coverImage?.url ? (
                <img src={product.coverImage.url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 100 }}>{product.emoji || '📘'}</span>
              )}
              {discount > 0 && (
                <div style={{ position: 'absolute', top: 16, left: 16, background: '#C49A3C', color: '#fff', fontSize: 14, fontWeight: 800, padding: '6px 14px', borderRadius: 50 }}>
                  -{discount}% OFF
                </div>
              )}
            </div>

            {/* Specs grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }} className="specs-grid">
              {[['📄', 'Format', 'PDF Download'], ['📖', 'Pages', `${product.pages || 0} pages`], ['📥', 'Access', 'Instant']].map(([e, l, v]) => (
                <div key={l} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{e}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, background: '#E0F4F1', padding: '4px 12px', borderRadius: 20 }}>{product.category}</span>
              {product.badge && (() => {
                const c = BADGE_COLORS[product.badge] || ['#eee', '#333'];
                return <span className="badge" style={{ background: c[0], color: c[1] }}>{product.badge}</span>;
              })()}
            </div>

            <h1 className="serif" style={{ fontSize: 'clamp(28px, 3vw, 38px)', color: 'var(--navy)', lineHeight: 1.15, marginBottom: 14 }}>{product.title}</h1>

            {/* Rating */}
            {product.rating?.count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span className="stars" style={{ fontSize: 18 }}>{'★'.repeat(Math.round(product.rating.average))}{'☆'.repeat(5 - Math.round(product.rating.average))}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{product.rating.average}</span>
                <span style={{ color: 'var(--muted)', fontSize: 14 }}>({product.rating.count} review{product.rating.count !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Description */}
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>{product.description}</p>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '18px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{product.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div style={{ fontSize: 15, color: 'var(--muted)', textDecoration: 'line-through', marginTop: 3 }}>
                    {product.originalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </div>
                )}
              </div>
              {discount > 0 && (
                <div style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 14px', borderRadius: 50, fontSize: 14, fontWeight: 800, marginLeft: 'auto' }}>
                  Save {(product.originalPrice - product.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>
                🛒 Add to Cart
              </button>
              <button className="btn btn-gold btn-lg" onClick={() => { addItem(product); navigate('/checkout'); }}>
                Buy Now →
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
              {['⚡ Instant PDF download', '🔒 Secure payment', '📧 Email delivery', '🔄 30-day access'].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Reviews ───────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 720 }}>
          <h2 className="serif" style={{ fontSize: 30, color: 'var(--navy)', marginBottom: 24 }}>
            Reviews {product.reviews?.length > 0 && `(${product.reviews.length})`}
          </h2>

          {/* Submit review */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
              {isAuthenticated ? 'Write a Review' : 'Log in to leave a review'}
            </h3>
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Rating</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(r => (
                      <button type="button" key={r} onClick={() => setReviewForm(f => ({ ...f, rating: r }))}
                        style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: r <= reviewForm.rating ? '#C49A3C' : '#ddd', transition: 'color 0.15s' }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Your Review</label>
                  <textarea className="input" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} rows={3} placeholder="Share your experience with this material…" style={{ resize: 'vertical' }} />
                </div>
                <button className="btn btn-primary" type="submit" disabled={submittingReview}>
                  {submittingReview ? <><span className="spinner" /> Submitting…</> : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>You need an account to leave a review.</p>
                <Link to="/login" className="btn btn-outline btn-sm">Log In →</Link>
              </div>
            )}
          </div>

          {/* Reviews list */}
          {product.reviews?.length > 0 ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {product.reviews.slice().reverse().map((r, i) => (
                <div key={i} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                        {r.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{r.name}</p>
                        <span className="stars" style={{ fontSize: 12 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
              <p style={{ color: 'var(--muted)', fontSize: 15 }}>No reviews yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* ── Related Products ──────────────────────────────────────────── */}
        {related.length > 0 && (
          <div style={{ marginTop: 72 }}>
            <h2 className="serif" style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 28 }}>Related Materials</h2>
            <div className="product-grid">
              {related.map(p => (
                <Link key={p._id} to={`/product/${p.slug || p._id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ background: 'linear-gradient(135deg, #0C1B33, #1E3050)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      {p.emoji || '📘'}
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>{p.category}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 8, lineHeight: 1.35 }}>{p.title}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{p.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
