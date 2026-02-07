import { useState } from 'react';
import { login, verifyOTP } from '../services/api';
import type { User } from '../types';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP(email, otp);
      onLoginSuccess(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Admin Portal</h1>
        <p className="login-subtitle">Global Mobility Management</p>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your.email@maersk.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>

            <p className="info-text">
              We will send a one-time passcode to your email address.
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="login-form">
            <p className="otp-info">Check your email at <strong>{email}</strong> for the passcode.</p>

            <div className="form-group">
              <label htmlFor="otp">One-Time Passcode</label>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
                className="otp-input"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError('');
              }}
              className="back-button"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
