import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@maersk.com') || email.length > 3) {
      setStep(2);
    } else {
        alert('Please enter a valid email');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email);
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
        {/* Left Side - Brand / Image */}
        <div className="hidden lg:flex w-1/2 bg-[#001b2e] relative items-center justify-center overflow-hidden">
            {/* Background Image with Deep Blue Overlay */}
            <div className="absolute inset-0 z-0">
                 <img 
                    src="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2500&auto=format&fit=crop" 
                    alt="Nature background" 
                    className="w-full h-full object-cover opacity-30 mix-blend-overlay grayscale contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#00243d]/90 to-[#001524]/95 mix-blend-multiply"></div>
            </div>

            <div className="relative z-10 text-center px-12">
                <div className="flex justify-center mb-8">
                    <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                </div>
                <h1 className="text-white text-4xl font-light tracking-wide mb-4">Remote Work Portal</h1>
                <p className="text-blue-100 text-sm font-light opacity-70 max-w-sm mx-auto leading-relaxed antialiased">
                    Secure access to international remote work requests and compliance management.
                </p>
            </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
            <div className="w-full max-w-[440px] px-12">
                {/* Logo Header */}
                <div className="flex items-center mb-12 select-none">
                    <span className="text-[#42b0d5] text-xl mr-2">★</span>
                    <div className="text-lg tracking-tight text-gray-900 font-bold">MAERSK</div>
                    <div className="mx-3 h-5 border-l border-gray-300"></div>
                    <div className="text-lg text-gray-500 font-light tracking-tight">Sign In</div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-gray-900 p-3 text-sm focus:ring-2 focus:ring-[#42b0d5]/20 focus:border-[#42b0d5] outline-none transition-all placeholder-gray-300 rounded-sm"
                                placeholder="user@maersk.com"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-[#42b0d5] hover:bg-[#3aa3c7] text-white font-semibold py-3.5 px-4 transition-all shadow-sm rounded-sm text-sm tracking-wide"
                        >
                            Next
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleCodeSubmit} className="space-y-8 animate-fade-in">
                        <div className="mb-2">
                            <h2 className="text-lg font-medium text-gray-900">Verify Identity</h2>
                            <p className="text-sm text-gray-500 mt-1">Enter code sent to {email}</p>
                        </div>
                         <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Security Code</label>
                            <input 
                                type="text" 
                                required
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-gray-900 p-3 text-center text-lg tracking-[0.5em] font-mono focus:ring-2 focus:ring-[#42b0d5]/20 focus:border-[#42b0d5] outline-none transition-all rounded-sm"
                                placeholder="------"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-[#42b0d5] hover:bg-[#3aa3c7] text-white font-semibold py-3.5 px-4 transition-all shadow-sm rounded-sm text-sm tracking-wide"
                        >
                            Verify & Sign In
                        </button>
                         <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            className="w-full text-xs text-gray-400 hover:text-[#42b0d5] mt-4 transition-colors font-medium"
                        >
                            ← Use different email
                        </button>
                    </form>
                )}
                
                <div className="mt-32 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    <span>© 2025 A.P. Moller - Maersk</span>
                    <a href="#" className="hover:text-[#42b0d5] transition-colors">Privacy Policy</a>
                </div>
            </div>
        </div>
    </div>
  );
};
