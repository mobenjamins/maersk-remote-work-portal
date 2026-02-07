import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Questionnaire } from './components/Questionnaire';
import { PolicyChatbot } from './components/PolicyChatbot';
import { PolicyModal } from './components/PolicyModal';
import { ViewState, RequestFormData } from './types';
import { initAuth, logout, User } from './services/api';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<RequestFormData | undefined>(undefined);

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
            <Dashboard
              setViewState={setViewState}
              user={user}
              onOpenPolicy={() => setIsPolicyModalOpen(true)}
            />
          </>
        );

      case ViewState.FORM:
        return (
          <>
            <Header user={user} onLogout={handleLogout} />
            <div className="max-w-[1200px] mx-auto px-8 py-10">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => { setViewState(ViewState.DASHBOARD); setIsChatbotOpen(false); }}
                  className="text-xs font-bold text-gray-600 hover:text-[#42b0d5] flex items-center uppercase tracking-widest transition-colors"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Panel: Questionnaire */}
                <div className="lg:col-span-8">
                  <Questionnaire user={user} onDataChange={setCurrentFormData} />
                </div>

                {/* Right Panel: 3D Flip Card */}
                <div className="lg:col-span-4">
                  <div className="sticky top-24" style={{ perspective: '1000px' }}>
                    <div
                      className="relative w-full transition-transform duration-700"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isChatbotOpen ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* Front Face: Policy Guidelines */}
                      <div
                        className="w-full bg-white rounded-sm shadow-sm border border-gray-200"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="p-8">
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

                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => setIsPolicyModalOpen(true)}
                              className="w-full py-2.5 text-[#42b0d5] hover:underline text-[10px] font-bold uppercase tracking-widest mb-3"
                            >
                              View Full Policy
                            </button>
                            <button
                              onClick={() => setIsChatbotOpen(true)}
                              className="w-full py-3 px-4 bg-[#42b0d5] text-white rounded-sm text-sm font-semibold hover:bg-[#3aa3c7] transition-all flex items-center justify-center space-x-2 shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              <span>Ask Policy Assistant</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Back Face: PolicyChatbot */}
                      <div
                        className="w-full absolute top-0 left-0 h-[600px] rounded-sm shadow-sm border border-gray-200 overflow-hidden"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <PolicyChatbot
                          isOpen={isChatbotOpen}
                          onClose={() => setIsChatbotOpen(false)}
                          formData={currentFormData}
                        />
                      </div>
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

  return (
    <>
      {renderContent()}
      <PolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />
    </>
  );
};

export default App;
