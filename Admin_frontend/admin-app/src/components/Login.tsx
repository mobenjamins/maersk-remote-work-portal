import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Key, AlertCircle, Loader2 } from 'lucide-react';
import { login, verifyOTP, type User } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      const response = await verifyOTP(email, otp, rememberMe);
      onLoginSuccess(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00243D] to-[#003E62] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-maersk-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-maersk-blue/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-sm shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#00243D] p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg width="36" height="36" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M24.6371 23.0356C24.6371 24.673 23.3101 26 21.6736 26H2.96444C1.32701 26 0 24.673 0 23.0356V2.9653C0 1.32788 1.32701 0 2.96444 0H21.6736C23.3101 0 24.6371 1.32788 24.6371 2.9653V23.0356Z" fill="#42B0D5"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M16.1836 12.656L20.9683 6.5435L20.9536 6.5241L14.0392 9.91581L12.331 2.29395H12.3067L10.5993 9.91581L3.68494 6.5241L3.66936 6.5435L8.45492 12.656L1.54053 16.0486L1.54572 16.0724H9.21992L7.51252 23.6951L7.53415 23.7057L12.3188 17.5932L17.1035 23.7057L17.1252 23.6942L15.4186 16.0724H23.0928L23.098 16.0486L16.1836 12.656Z" fill="white"/>
              </svg>
              <h1 className="text-2xl font-bold text-white tracking-tight">MAERSK</h1>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-maersk-blue font-bold">Global Mobility Portal — Admin</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="your.email@maersk.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-maersk-blue focus:border-maersk-blue transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm text-xs text-red-600">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-maersk-blue hover:bg-maersk-blue/90 text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-maersk-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? 'Sending...' : 'Continue'}
                </button>

                <p className="text-[11px] text-gray-400 text-center">
                  A one-time passcode will be sent to your email address.
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <p className="text-xs text-gray-500 text-center">
                  Enter the passcode sent to <span className="font-bold text-gray-900">{email}</span>
                </p>

                <div>
                  <label htmlFor="otp" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    One-Time Passcode
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={loading}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm pl-10 pr-4 py-3 text-sm text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-maersk-blue focus:border-maersk-blue transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm text-xs text-red-600">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-200 text-maersk-blue focus:ring-maersk-blue"
                  />
                  <span className="text-xs text-gray-500">Remember me on this device</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-maersk-blue hover:bg-maersk-blue/90 text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-maersk-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to email
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
