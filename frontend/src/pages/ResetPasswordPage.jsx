import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    // Basic token validation (frontend only)
    if (!token || token.length < 32) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 12) {
      toast.error('Password must be at least 12 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Basic password strength check
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
      toast.error('Password must contain uppercase, lowercase, numbers, and special characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successfully! You are now logged in.');
      navigate('/account');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password';
      toast.error(errorMsg);
      if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ color: '#0C1B33', marginBottom: '16px' }}>Invalid Reset Link</h1>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>
            This password reset link is invalid or has expired. Password reset links are valid for 10 minutes.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/forgot-password" className="btn btn-primary">
              Request New Reset Link
            </a>
            <a href="/login" className="btn btn-secondary">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#0C1B33', marginBottom: '8px' }}>Reset Your Password</h1>
          <p style={{ color: '#6B7280' }}>
            Enter your new password below. Make sure it's strong and secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength="12"
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
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
              Must be 12+ characters with uppercase, lowercase, numbers, and special characters
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength="12"
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
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/login" style={{ color: '#6B7280', textDecoration: 'none' }}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;