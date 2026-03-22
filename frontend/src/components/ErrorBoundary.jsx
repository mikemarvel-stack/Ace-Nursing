import React from 'react';
import toast from 'react-hot-toast';

/**
 * Error Boundary Component
 * Catches React component errors and prevents app crash
 * Logs errors for debugging and shows fallback UI
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Log to monitoring service (e.g., Sentry)
    try {
      const errorLog = {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
      console.error('Full error info:', errorLog);
      // In production, send to logging service
      // await fetch('/api/logs/errors', { method: 'POST', body: JSON.stringify(errorLog) })
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }

    toast.error('Something went wrong. Please refresh the page.');
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--cream)',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '500px',
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '12px',
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{
              color: 'var(--muted)',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}>
              We've encountered an unexpected error. Try refreshing the page or{' '}
              <button
                onClick={this.resetError}
                style={{
                  color: 'var(--primary)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                go back home
              </button>.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '12px',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  overflow: 'auto',
                  color: '#d32f2f',
                  marginTop: '12px',
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Go to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '1px solid var(--border)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
