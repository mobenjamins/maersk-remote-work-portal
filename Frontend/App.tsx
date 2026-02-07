import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ChatInterface } from './components/ChatInterface';
import { Questionnaire } from './components/Questionnaire';
import { SmartQuestionnaire } from './components/SmartQuestionnaire';
import { ViewState } from './types';
import { initAuth, logout, User } from './services/api';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = initAuth();
    if (savedUser) {
      setUser(savedUser);
      setViewState(ViewState.DASHBOARD);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setViewState(ViewState.DASHBOARD);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setViewState(ViewState.LOGIN);
  };

  const renderContent = () => {
    switch (viewState) {
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} />;
      
      case ViewState.DASHBOARD:
        return (
          <>
            <Header user={user} onLogout={handleLogout} />
            <Dashboard setViewState={setViewState} user={user} />
          </>
        );

      case ViewState.SELECTION:
        return (
          <>
            <Header user={user} onLogout={handleLogout} />
            <div className="max-w-[1200px] mx-auto px-8 py-12">
                <button 
                    onClick={() => setViewState(ViewState.DASHBOARD)}
                    className="mb-8 text-xs font-bold text-gray-400 hover:text-[#42b0d5] flex items-center uppercase tracking-widest transition-colors"
                >
                    ← Back to Dashboard
                </button>
                <div className="bg-white p-10 rounded-sm shadow-sm border border-gray-200 max-w-3xl mx-auto">
                    <h1 className="text-2xl font-light text-gray-900 mb-2">Start New Request</h1>
                    <p className="text-gray-500 mb-10 font-light border-b border-gray-100 pb-6">Please select the category that best matches your travel plans.</p>
                    
                    <div className="space-y-6">
                        {/* New Wizard Flow - Recommended */}
                        <button 
                             onClick={() => setViewState(ViewState.FORM)}
                            className="w-full text-left p-8 border-2 border-[#42b0d5] rounded-sm hover:bg-[#42b0d5]/5 transition-all group bg-white"
                        >
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-lg text-[#42b0d5]">Short-term Remote Work (SIRW)</span>
                                <span className="text-[#42b0d5] transition-colors">→</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-bold bg-[#42b0d5] text-white px-2 py-1 rounded-sm uppercase tracking-wide">Recommended</span>
                                <p className="text-sm text-gray-500">Up to 20 days per calendar year. Guided multi-step process.</p>
                            </div>
                        </button>

                        {/* Legacy AI Chat */}
                        <button 
                             onClick={() => setViewState(ViewState.CHAT)}
                            className="w-full text-left p-8 border border-gray-200 rounded-sm hover:border-[#42b0d5] hover:ring-1 hover:ring-[#42b0d5] transition-all group bg-white"
                        >
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-lg text-gray-800 group-hover:text-[#42b0d5]">AI-Assisted Request</span>
                                <span className="text-gray-300 group-hover:text-[#42b0d5] transition-colors">→</span>
                            </div>
                            <p className="text-sm text-gray-500">Get help from our AI assistant to complete your request conversationally.</p>
                        </button>

                        <button 
                            className="w-full text-left p-8 border border-gray-200 rounded-sm hover:border-[#42b0d5] hover:ring-1 hover:ring-[#42b0d5] transition-all group bg-white opacity-60 cursor-not-allowed"
                            disabled
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-lg text-gray-800">Permanent International Transfer</span>
                                <span className="text-gray-300">→</span>
                            </div>
                            <p className="text-sm text-gray-500">Requesting a permanent change of work location. <span className="text-xs italic">(Coming soon)</span></p>
                        </button>
                    </div>
                </div>
            </div>
          </>
        );

      case ViewState.FORM:
        // New multi-step wizard flow with sidebar
        return (
          <>
            <Header user={user} onLogout={handleLogout} />
            <div className="max-w-[1200px] mx-auto px-8 py-10">
                <button 
                    onClick={() => setViewState(ViewState.SELECTION)}
                    className="mb-6 text-xs font-bold text-gray-400 hover:text-[#42b0d5] flex items-center uppercase tracking-widest transition-colors"
                >
                    ← Back to Selection
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8">
                        <SmartQuestionnaire 
                          user={user} 
                          onCancel={() => setViewState(ViewState.DASHBOARD)}
                          onComplete={(result) => {
                            console.log('Request completed:', result);
                            setViewState(ViewState.DASHBOARD);
                          }}
                        />
                    </div>
                    
                    <div className="lg:col-span-4 space-y-6 sticky top-24">
                        {/* Policy Snapshot - Dark premium card */}
                        <div className="bg-[#1a1f35] rounded-sm p-6 text-white border-l-4 border-[#42b0d5]">
                            <h3 className="font-semibold text-lg mb-4">Policy Snapshot</h3>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#42b0d5] mt-0.5">•</span>
                                    <span>Max <strong className="text-white">20 days</strong> per calendar year</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#42b0d5] mt-0.5">•</span>
                                    <span>Requires <strong className="text-white">Right to Work</strong> in destination</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#42b0d5] mt-0.5">•</span>
                                    <span>Manager approval is <strong className="text-white">mandatory</strong></span>
                                </li>
                            </ul>
                            <button className="mt-5 w-full bg-transparent border border-white/30 hover:border-white/60 text-white py-2.5 px-4 rounded-sm text-sm font-medium transition-all flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Download Full Policy PDF
                            </button>
                        </div>

                        {/* Your Profile - White card */}
                        <div className="bg-white rounded-sm p-6 border-l-4 border-[#42b0d5] shadow-sm">
                            <h3 className="font-semibold text-[#141414] mb-4">Your Profile</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#6a6a6a]">Entity</span>
                                    <span className="text-[#141414] font-medium">Maersk A/S</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#6a6a6a]">Home Country</span>
                                    <span className="text-[#141414] font-medium">{user?.home_country || 'Denmark'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#6a6a6a]">Sales Role</span>
                                    <span className="text-[#141414] font-medium">No</span>
                                </div>
                            </div>
                        </div>

                        {/* Need Support - White card */}
                        <div className="bg-white rounded-sm p-6 border-l-4 border-[#42b0d5] shadow-sm">
                            <h3 className="font-semibold text-[#141414] mb-2">Need Support?</h3>
                            <p className="text-sm text-[#6a6a6a] mb-4">Contact the Global Mobility Tax Team for complex cases.</p>
                            <button 
                                onClick={() => setViewState(ViewState.CHAT)}
                                className="text-[#42b0d5] text-sm font-medium hover:underline flex items-center gap-1.5 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                Switch to AI Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </>
        );

      case ViewState.CHAT:
        // Legacy AI chat interface
        return (
          <>
            <Header user={user} onLogout={handleLogout} />
            <div className="max-w-[1200px] mx-auto px-8 py-10">
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => setViewState(ViewState.SELECTION)}
                         className="text-xs font-bold text-gray-400 hover:text-[#42b0d5] flex items-center uppercase tracking-widest transition-colors"
                    >
                        ← Back to Selection
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8">
                        <ChatInterface />
                    </div>
                    
                    <div className="lg:col-span-4">
                        <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Policy Guidelines</h3>
                            <ul className="text-sm text-gray-600 space-y-4">
                                <li className="flex gap-3">
                                    <span className="text-[#42b0d5] font-bold">1.</span>
                                    <span><strong>Manager Approval</strong> is required before initiating request.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#42b0d5] font-bold">2.</span>
                                    <span>Maximum duration: <strong>20 days</strong> per calendar year.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#42b0d5] font-bold">3.</span>
                                    <span>You must hold valid <strong>citizenship</strong> or <strong>work rights</strong> for the destination.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#42b0d5] font-bold">4.</span>
                                    <span>Sales/Contract roles are often restricted due to <strong>Permanent Establishment</strong> risk.</span>
                                </li>
                            </ul>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Request Mode</div>
                                <button 
                                    onClick={() => setViewState(ViewState.FORM)}
                                    className="w-full py-3 px-4 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:border-[#42b0d5] hover:text-[#42b0d5] transition-all flex items-center justify-center space-x-2 bg-gray-50 hover:bg-white"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    <span>Switch to Guided Form</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </>
        );

      default:
        return <div>Unknown View</div>;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
