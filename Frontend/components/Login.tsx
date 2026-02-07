import React, { useState } from 'react';
import { login, verifyOTP, User } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email);
      // For MVP, show the debug code
      if (response.debug_code) {
        setDebugCode(response.debug_code);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP(email, code);
      onLogin(response.user);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
        {/* Left Side - Brand / Image */}
        <div className="hidden lg:flex w-1/2 bg-[#00243d] relative items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/maersk_ship/1600/1200')] bg-cover opacity-30 mix-blend-overlay"></div>
            <div className="relative z-10 text-center p-12">
                <div className="text-white text-6xl mb-6 opacity-90">★</div>
                <h1 className="text-white text-4xl font-light tracking-wide mb-4">Remote Work Portal</h1>
                <p className="text-blue-200 text-lg font-light max-w-md mx-auto">
                    Secure access to international remote work requests and compliance management.
                </p>
            </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-white p-12 rounded-sm shadow-sm border border-gray-100">
                <div className="flex items-center mb-10">
                    <span className="text-[#42b0d5] text-2xl mr-3">★</span>
                    <h2 className="text-gray-900 text-xl font-semibold tracking-tight">MAERSK <span className="text-gray-400 font-light">| Sign In</span></h2>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    {error}
                  </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 rounded-sm p-3 focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors"
                                placeholder="user@maersk.com"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#42b0d5] hover:bg-[#3aa3c7] text-white font-medium py-3 px-4 rounded-sm transition-colors flex justify-center items-center disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Next'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleCodeSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h2>
                            <p className="text-sm text-gray-500 mt-1">Enter the code sent to {email}</p>
                            {debugCode && (
                              <p className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                                Demo mode - Use code: <strong className="font-mono">{debugCode}</strong>
                              </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Security Code</label>
                            <input 
                                type="text" 
                                required
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 rounded-sm p-3 text-center text-xl tracking-[0.5em] font-mono focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors"
                                placeholder="------"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#42b0d5] hover:bg-[#3aa3c7] text-white font-medium py-3 px-4 rounded-sm transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify Identity'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setStep(1); setError(''); setDebugCode(''); }}
                            className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Back to Email
                        </button>
                    </form>
                )}
                
                <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>© 2025 A.P. Moller - Maersk</span>
                    <span>Privacy Policy</span>
                </div>
            </div>
        </div>
    </div>
  );
};
