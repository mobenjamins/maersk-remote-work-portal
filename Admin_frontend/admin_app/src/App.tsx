import { useState } from 'react';
import { LayoutDashboard, FileText, BrainCircuit, ShieldAlert, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OverviewDashboard from './components/OverviewDashboard';
import RequestManager from './components/RequestManager';
import IntelligenceHub from './components/IntelligenceHub';
import PolicyEditor from './components/PolicyEditor';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'Request Manager', icon: FileText },
    { id: 'intelligence', label: 'Intelligence Hub', icon: BrainCircuit },
    { id: 'policy', label: 'Policy Governance', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Maersk Sidebar - Dark Theme - Collapsible */}
      <motion.nav 
        animate={{ width: isSidebarCollapsed ? 80 : 288 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-maersk-dark text-white flex flex-col shadow-xl z-20 relative"
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-9 w-6 h-6 bg-maersk-blue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-maersk-light hover:text-maersk-blue transition-colors z-30"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-8 border-b border-white/10 ${isSidebarCollapsed ? 'px-4 flex flex-col items-center' : ''}`}>
          <div className={`flex items-center gap-3 mb-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <svg width="32" height="32" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M24.6371 23.0356C24.6371 24.673 23.3101 26 21.6736 26H2.96444C1.32701 26 0 24.673 0 23.0356V2.9653C0 1.32788 1.32701 0 2.96444 0H21.6736C23.3101 0 24.6371 1.32788 24.6371 2.9653V23.0356Z" fill="#42B0D5"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M16.1836 12.656L20.9683 6.5435L20.9536 6.5241L14.0392 9.91581L12.331 2.29395H12.3067L10.5993 9.91581L3.68494 6.5241L3.66936 6.5435L8.45492 12.656L1.54053 16.0486L1.54572 16.0724H9.21992L7.51252 23.6951L7.53415 23.7057L12.3188 17.5932L17.1035 23.7057L17.1252 23.6942L15.4186 16.0724H23.0928L23.098 16.0486L16.1836 12.656Z" fill="white"/>
            </svg>
            {!isSidebarCollapsed && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden"
              >
                MAERSK
              </motion.h1>
            )}
          </div>
          {!isSidebarCollapsed && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[10px] uppercase tracking-[0.2em] text-maersk-blue font-bold opacity-80 whitespace-nowrap"
            >
              Global Mobility Portal
            </motion.p>
          )}
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-maersk-blue text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? tab.label : ''}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-500'} />
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {tab.label}
                </motion.span>
              )}
            </button>
          ))}
        </div>

        <div className={`p-6 bg-black/20 border-t border-white/10 ${isSidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-maersk-blue flex items-center justify-center font-bold text-white shadow-inner shrink-0">
                BO
              </div>
              {!isSidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] overflow-hidden"
                >
                  <div className="font-bold text-white uppercase tracking-wider whitespace-nowrap">B. Oghene</div>
                  <div className="text-gray-400 truncate w-32">Global Mobility Lead</div>
                </motion.div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button className="text-gray-500 hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area - Light Theme */}
      <main className="flex-1 overflow-auto bg-gray-50 relative flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Admin</span>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-900 capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
             {/* Live Alert Notification */}
             <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded text-xs font-medium text-red-600 animate-pulse cursor-pointer hover:bg-red-100 transition-colors">
               <ShieldAlert size={14} />
               <span>1 High Risk Request</span>
             </div>
             
             <div className="h-4 w-[1px] bg-gray-200 mx-2"></div>

             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               System Live
             </div>
          </div>
        </header>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'overview' && <OverviewDashboard setActiveTab={setActiveTab} />}
              {activeTab === 'requests' && <RequestManager />}
              {activeTab === 'intelligence' && <IntelligenceHub />}
              {activeTab === 'policy' && <PolicyEditor />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;