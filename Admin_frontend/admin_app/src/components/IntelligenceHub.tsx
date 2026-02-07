import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { MessageSquare, AlertTriangle, TrendingUp, TrendingDown, Info, X, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sentimentData = [
  { range: '-100 to -80', count: 2, color: '#ef4444' },
  { range: '-80 to -60', count: 5, color: '#f87171' },
  { range: '-60 to -40', count: 8, color: '#fca5a5' },
  { range: '-40 to -20', count: 12, color: '#fee2e2' },
  { range: '-20 to 0', count: 15, color: '#f3f4f6' },
  { range: '0 to 20', count: 20, color: '#dbeafe' },
  { range: '20 to 40', count: 25, color: '#bfdbfe' },
  { range: '40 to 60', count: 18, color: '#93c5fd' },
  { range: '60 to 80', count: 10, color: '#60a5fa' },
  { range: '80 to 100', count: 5, color: '#3b82f6' },
];

const topicData = [
  { name: 'Visa Requirements', value: 45, color: '#00243D' },
  { name: 'Tax Implications', value: 30, color: '#42B0D5' },
  { name: 'Policy Limits', value: 15, color: '#60a5fa' },
  { name: 'Insurance', value: 10, color: '#bfdbfe' },
];

const recentChats = [
  { 
    id: 1, 
    user: 'Elena V.', 
    topic: 'Spain Visa', 
    summary: 'Clarifying if Schengen visa allows 20 days remote work from Madrid.',
    sentiment: 85, 
    status: 'Resolved' 
  },
  { 
    id: 2, 
    user: 'Marcus T.', 
    topic: 'Sales Contract', 
    summary: 'Frustrated by restriction on Sales roles with signing authority in France.',
    sentiment: -40, 
    status: 'Escalated' 
  },
  { 
    id: 3, 
    user: 'Sarah L.', 
    topic: 'Canada Duration', 
    summary: 'Asking if weekends count towards the 20-day annual limit.',
    sentiment: 92, 
    status: 'Resolved' 
  },
  { 
    id: 4, 
    user: 'Unknown', 
    topic: 'Policy V3', 
    summary: 'General query about when the new SIRW policy version 3.2 took effect.',
    sentiment: 12, 
    status: 'Abandoned' 
  },
];

const IntelligenceHub = () => {
  const [showDraftModal, setShowDraftModal] = useState(false);

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Intelligence Hub</h2>
          <p className="text-sm text-gray-500 font-light">Sentiment analysis and interaction patterns from the Smart Wizard.</p>
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-sm border border-gray-200">
           <span className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Policy:</span>
           <button className="px-3 py-1.5 text-[10px] font-bold bg-white text-maersk-blue rounded-sm shadow-sm border border-gray-200">
             V3.2.0 (Feb 2026)
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Spectrum */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Sentiment Distribution</h3>
              <p className="text-xs text-gray-400 font-light italic">Quantifying employee emotional response during compliance checks</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2 text-red-500">
                <TrendingDown size={14} /> Critical
              </div>
              <div className="flex items-center gap-2 text-maersk-blue">
                <TrendingUp size={14} /> Optimal
              </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Frequency */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Query Analytics</h3>
          <p className="text-[11px] text-gray-400 mb-8 uppercase tracking-widest">Most Discussed Topics</p>
          
          <div className="flex-1 min-h-[250px] relative flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={topicData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-full mt-6 space-y-3">
              {topicData.map((topic) => (
                <div key={topic.name} className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: topic.color }} />
                    <span className="text-xs text-gray-600 font-medium">{topic.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{topic.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={16} className="text-maersk-blue" />
              Real-time Interaction Stream
            </h3>
            <button className="text-[10px] font-bold text-maersk-blue hover:underline uppercase tracking-wider">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentChats.map((chat) => (
              <div key={chat.id} className="px-6 py-4 flex flex-col gap-1 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            chat.sentiment > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {chat.sentiment > 0 ? '+' : ''}{chat.sentiment}
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">{chat.user}</div>
                            <div className="text-[10px] text-maersk-blue font-bold uppercase tracking-tighter">{chat.topic}</div>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold border uppercase tracking-widest ${
                        chat.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        chat.status === 'Escalated' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                        {chat.status}
                    </span>
                </div>
                <div className="pl-11 pr-4">
                    <p className="text-xs text-gray-500 leading-relaxed italic truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                        "{chat.summary}"
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-maersk-dark text-white rounded-sm p-6 flex flex-col shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-maersk-blue mb-4">
              <Info size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Policy Insight</span>
            </div>
            <h3 className="text-lg font-medium mb-4 leading-tight">France Sales Restriction Conflict</h3>
            <p className="text-sm text-gray-400 font-light leading-relaxed mb-8">
              System detected recurring negative sentiment regarding the "Permanent Establishment" clause for sales roles in France. 
              Users are requesting clarification on "Contract Signing Authority" definitions.
            </p>
            <button 
              onClick={() => setShowDraftModal(true)}
              className="w-full bg-maersk-blue hover:bg-maersk-blue/90 text-white py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-maersk-blue/20"
            >
              Draft Policy Update
            </button>
          </div>
        </div>
      </div>

      {/* AI Draft Policy Modal */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-maersk-dark/80 backdrop-blur-sm"
              onClick={() => setShowDraftModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 bg-maersk-dark text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <FileText size={24} className="text-maersk-blue" />
                    <div>
                        <h3 className="text-lg font-medium">AI-Generated Policy Draft</h3>
                        <p className="text-[10px] text-maersk-blue font-bold uppercase tracking-widest">Target: Clause 4 (Role Restrictions)</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDraftModal(false)} className="hover:text-maersk-blue transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-auto p-8 space-y-6">
                 <div className="bg-blue-50 border-l-4 border-maersk-blue p-4 text-xs text-maersk-dark leading-relaxed">
                    <span className="font-bold">AI Intent:</span> This draft addresses the negative sentiment in France by providing a granular definition of "Contract Signing Authority", reducing ambiguity for Sales Directors.
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proposed Revision</label>
                    <div className="relative">
                        <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[8px] font-bold rounded-sm uppercase tracking-tighter shadow-sm">Suggested</div>
                        <textarea 
                            className="w-full h-48 bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-800 leading-relaxed font-sans"
                            defaultValue={`Roles with sales contract signing authority are excluded. 

DEFINITION: "Contract Signing Authority" refers to any individual explicitly named in a Maersk Entity's Power of Attorney or having legal capacity to bind the company to commercial terms exceeding $10,000 USD. 

LOCAL EXEMPTION (FRANCE): Senior Sales roles without explicit commercial capacity may qualify for 10-day SIRW, subject to local HR approval.`}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-100 rounded-sm bg-gray-50">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Expected Impact</div>
                        <div className="text-lg font-bold text-emerald-600">+14.2%</div>
                        <div className="text-[9px] text-gray-500">Predicted Approval Increase</div>
                    </div>
                    <div className="p-4 border border-gray-100 rounded-sm bg-gray-50">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sentiment Shift</div>
                        <div className="text-lg font-bold text-emerald-600">+32 pts</div>
                        <div className="text-[9px] text-gray-500">Predicted Sentiment Gain</div>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                 <button 
                    onClick={() => setShowDraftModal(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-widest hover:bg-white transition-all rounded-sm"
                >
                    Discard Draft
                 </button>
                 <button 
                    onClick={() => { setShowDraftModal(false); /* Logic to send to Policy Page */ }}
                    className="flex-1 py-3 bg-maersk-blue text-white text-xs font-bold uppercase tracking-widest hover:bg-maersk-blue/90 transition-all rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-maersk-blue/20"
                >
                    <CheckCircle size={14} /> Send to Policy Governance
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntelligenceHub;
