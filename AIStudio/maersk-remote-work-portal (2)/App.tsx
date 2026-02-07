import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ChatInterface } from './components/ChatInterface'; // Now the Smart Wizard
import { Questionnaire } from './components/Questionnaire';
import { HRDashboard } from './components/HRDashboard';
import { ViewState } from './types';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [userEmail, setUserEmail] = useState('');

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setViewState(ViewState.DASHBOARD);
  };

  const renderContent = () => {
    switch (viewState) {
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} />;
      
      case ViewState.DASHBOARD:
        return (
          <>
            <Header />
            <Dashboard setViewState={setViewState} />
          </>
        );
      
      case ViewState.HR_DASHBOARD:
        return (
          <>
            <Header />
            <HRDashboard onBack={() => setViewState(ViewState.DASHBOARD)} />
          </>
        );

      case ViewState.SELECTION:
        return (
          <>
            <Header />
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
                        <button 
                             onClick={() => setViewState(ViewState.CHAT)}
                            className="w-full text-left p-8 border border-gray-200 rounded-sm hover:border-[#42b0d5] hover:ring-1 hover:ring-[#42b0d5] transition-all group bg-white"
                        >
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-lg text-gray-800 group-hover:text-[#42b0d5]">Short-term Remote Work</span>
                                <span className="text-gray-300 group-hover:text-[#42b0d5] transition-colors">→</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-sm uppercase tracking-wide">Most Common</span>
                                <p className="text-sm text-gray-500">Up to 20 days per calendar year. Ideal for working holidays.</p>
                            </div>
                        </button>

                        <button 
                            className="w-full text-left p-8 border border-gray-200 rounded-sm hover:border-[#42b0d5] hover:ring-1 hover:ring-[#42b0d5] transition-all group bg-white"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-lg text-gray-800 group-hover:text-[#42b0d5]">Permanent International Transfer</span>
                                <span className="text-gray-300 group-hover:text-[#42b0d5] transition-colors">→</span>
                            </div>
                            <p className="text-sm text-gray-500">Requesting a permanent change of work location and employment contract to another country.</p>
                        </button>
                    </div>
                </div>
            </div>
          </>
        );

      case ViewState.CHAT:
      case ViewState.FORM:
        return (
          <>
            <Header />
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
                        {/* We use the updated ChatInterface which is now the Smart Wizard */}
                        {viewState === ViewState.CHAT ? <ChatInterface userEmail={userEmail} /> : <Questionnaire />}
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
                                {viewState === ViewState.CHAT ? (
                                    <button 
                                        onClick={() => setViewState(ViewState.FORM)}
                                        className="w-full py-3 px-4 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:border-[#42b0d5] hover:text-[#42b0d5] transition-all flex items-center justify-center space-x-2 bg-gray-50 hover:bg-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span>Switch to Standard Form</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setViewState(ViewState.CHAT)}
                                        className="w-full py-3 px-4 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:border-[#42b0d5] hover:text-[#42b0d5] transition-all flex items-center justify-center space-x-2 bg-gray-50 hover:bg-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        <span>Switch to Smart Wizard</span>
                                    </button>
                                )}
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