import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <h1 style={{
        fontSize: '64px',
        fontWeight: 800,
        color: 'var(--navy)',
        margin: '0 0 16px 0',
      }}>404</h1>

      <h2 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: 'var(--navy)',
        margin: '0 0 12px 0',
      }}>Page Not Found</h2>

      <p style={{
        fontSize: '16px',
        color: 'var(--muted)',
        maxWidth: '500px',
        lineHeight: 1.6,
        margin: '0 0 32px 0',
      }}>
        Sorry, the page you're looking for doesn't exist. It may have been moved or deleted.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '12px 32px',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Go to Home
        </Link>

        <Link
          to="/shop"
          style={{
            padding: '12px 32px',
            background: 'var(--light-bg)',
            color: 'var(--navy)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--cream)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--light-bg)';
          }}
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
