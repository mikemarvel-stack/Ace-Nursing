import { Link } from 'react-router-dom';
import { useCartStore } from '../store';
import toast from 'react-hot-toast';

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

export default function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem);
  const openCart = useCartStore(s => s.openCart);

  const { _id, title, category, price, originalPrice, rating, badge, emoji, slug, pages } = product;
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`Added "${title.substring(0, 30)}${title.length > 30 ? '…' : ''}" to cart`);
    openCart();
  };

  return (
    <Link to={`/product/${slug || _id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      aria-label={`View ${title} - $${price} - ${Math.round(rating?.average || 0)} stars`}>
      <article className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

        {/* Cover */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0C1B33 0%, #1E3050 100%)', height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={product.coverImage?.url} 
            alt={`${title} study material cover`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: product.coverImage?.url ? 'block' : 'none' }}
            loading="lazy"
          />
          <span 
            style={{ fontSize: 58, display: !product.coverImage?.url ? 'block' : 'none' }}
            aria-hidden="true">
            {emoji || '📘'}
          </span>

          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {badge && (() => {
              const colors = BADGE_COLORS[badge] || ['#E0EAF4', '#1A3A5C'];
              return (
                <span className="badge" style={{ background: colors[0], color: colors[1] }} title={badge}>
                  {badge}
                </span>
              );
            })()}
            {discount > 0 && (
              <span className="badge" style={{ background: '#C49A3C', color: '#fff' }} title={`${discount}% discount`}>
                -{discount}%
              </span>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(255,255,255,0.13)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
            PDF · {pages || 0}pp
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>
            {category}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.35, marginBottom: 8, minHeight: 38 }}>
            {title}
          </h3>

          {rating?.count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span className="stars" aria-label={`${Math.round(rating.average)} out of 5 stars`}>
                {'★'.repeat(Math.round(rating.average))}{'☆'.repeat(5 - Math.round(rating.average))}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>({rating.count})</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)' }}>
                {price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
              {originalPrice && originalPrice > price && (
                <span style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'line-through', marginLeft: 7 }}>
                  {originalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              )}
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleAdd}
              aria-label={`Add ${title} to cart`}
              style={{ borderRadius: 9 }}>
              Add
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
