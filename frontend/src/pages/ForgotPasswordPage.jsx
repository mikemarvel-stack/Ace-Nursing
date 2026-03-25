import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
          <h1 style={{ color: '#0C1B33', marginBottom: '16px' }}>Check Your Email</h1>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px' }}>
            The link will expire in 10 minutes. If you don't see it, check your spam folder.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-secondary">
              Back to Login
            </Link>
            <button
              onClick={() => setSubmitted(false)}
              className="btn btn-primary"
            >
              Send Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#0C1B33', marginBottom: '8px' }}>Forgot Password?</h1>
          <p style={{ color: '#6B7280' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#C49A3C'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ color: '#6B7280', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;