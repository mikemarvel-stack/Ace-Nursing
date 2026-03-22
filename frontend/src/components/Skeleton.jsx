/**
 * Loading skeleton components for better perceived performance
 * Prevents layout shift (CLS) and improves user experience while loading
 */

export function ProductSkeleton() {
  return (
    <div className="card" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      {/* Cover skeleton */}
      <div style={{
        width: '100%',
        height: 148,
        background: '#e5e7eb',
        borderRadius: '4px 4px 0 0',
      }} />

      {/* Body skeleton */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Category */}
        <div style={{
          height: 12,
          background: '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '12px',
          width: '60px',
        }} />

        {/* Title lines */}
        <div style={{
          height: 14,
          background: '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '8px',
          width: '100%',
        }} />
        <div style={{
          height: 14,
          background: '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '12px',
          width: '85%',
        }} />

        {/* Rating */}
        <div style={{
          height: 12,
          background: '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '12px',
          width: '40%',
        }} />

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{
            height: 24,
            background: '#e5e7eb',
            borderRadius: '4px',
            width: '50px',
          }} />
          <div style={{
            height: 32,
            background: '#e5e7eb',
            borderRadius: '6px',
            width: '60px',
          }} />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 6 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
    }}>
      {Array(count)
        .fill(null)
        .map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      {Array(lines)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            style={{
              height: '12px',
              background: '#e5e7eb',
              borderRadius: '4px',
              marginBottom: i === lines - 1 ? 0 : '8px',
              width: i === lines - 1 ? '80%' : '100%',
            }}
          />
        ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div>
      {Array(items)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              gap: '16px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                background: '#e5e7eb',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: '14px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  width: '60%',
                }}
              />
              <div
                style={{
                  height: '12px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  width: '40%',
                }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}

// CSS animation for pulse effect
const skeletonStyles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = skeletonStyles;
  document.head.appendChild(style);
}
