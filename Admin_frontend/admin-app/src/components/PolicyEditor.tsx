import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, History, Plus, Edit3, Check, X, ShieldCheck, AlertCircle, Info, Zap } from 'lucide-react';

interface PolicyClause {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  version: string;
  variables: { text: string, type: 'days' | 'role' | 'country' | 'threshold' }[];
}

const initialClauses: PolicyClause[] = [
  {
    id: '1',
    title: 'Eligibility Scope',
    content: 'Employees must have completed their probation period. Contractors and temporary staff are not eligible for the Short-Term International Remote Work (SIRW) program.',
    lastUpdated: '2025-12-01',
    version: '3.2.0',
    variables: []
  },
  {
    id: '2',
    title: 'Duration Limits',
    content: 'Maximum duration is 20 working days per calendar year. This cannot be carried over to the next year. A single trip cannot exceed 14 consecutive working days.',
    lastUpdated: '2026-01-15',
    version: '3.2.0',
    variables: [
        { text: '20 working days', type: 'days' },
        { text: '14 consecutive', type: 'days' }
    ]
  },
  {
    id: '3',
    title: 'Right to Work',
    content: 'Employees are solely responsible for ensuring they have the legal right to work in the destination country. Maersk does not sponsor visas for SIRW.',
    lastUpdated: '2025-11-20',
    version: '3.1.5',
    variables: []
  },
  {
    id: '4',
    title: 'Role Restrictions',
    content: 'Roles with sales contract signing authority or those involving physical handling of goods are excluded from this policy due to Permanent Establishment and safety risks.',
    lastUpdated: '2026-02-01',
    version: '3.2.0',
    variables: [
        { text: 'sales contract signing authority', type: 'role' },
        { text: 'physical handling of goods', type: 'role' }
    ]
  }
];

const PolicyEditor = () => {
  const [clauses, setClauses] = useState<PolicyClause[]>(initialClauses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState('');
  const [activeVar, setActiveVar] = useState<string | null>(null);

  const handleEdit = (clause: PolicyClause) => {
    setEditingId(clause.id);
    setTempContent(clause.content);
  };

  const handleSave = (id: string) => {
    setClauses(clauses.map(c => c.id === id ? {
      ...c,
      content: tempContent,
      lastUpdated: new Date().toISOString().split('T')[0],
      version: '3.2.1-DRAFT'
    } : c));
    setEditingId(null);
  };

  const renderContentWithHighlights = (clause: PolicyClause) => {
    let content = clause.content;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    clause.variables.forEach((variable, i) => {
        const index = content.indexOf(variable.text);
        if (index !== -1) {
            parts.push(content.substring(lastIndex, index));
            parts.push(
                <button
                    key={i}
                    onClick={() => setActiveVar(variable.text)}
                    className="px-1.5 py-0.5 bg-maersk-light text-maersk-blue font-bold rounded-sm border border-maersk-blue/20 hover:bg-maersk-blue hover:text-white transition-all mx-0.5 text-xs inline-block"
                >
                    {variable.text}
                </button>
            );
            lastIndex = index + variable.text.length;
        }
    });
    parts.push(content.substring(lastIndex));

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Policy Governance</h2>
          <p className="text-sm text-gray-500 font-light italic">Smart Clause System: Click on underlined variables to analyse policy impact.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm transition-all text-xs font-bold uppercase tracking-widest shadow-sm">
            <History size={14} />
            Version History
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-maersk-blue hover:bg-maersk-blue/90 text-white rounded-sm transition-all text-xs font-bold uppercase tracking-widest shadow-lg shadow-maersk-blue/20">
            <Save size={14} />
            Publish Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-amber-500" /> Smart Clauses
            </h3>
            <button className="flex items-center gap-1 text-[10px] font-bold text-maersk-blue hover:underline uppercase tracking-widest">
              <Plus size={14} /> Add New Entry
            </button>
          </div>

          <div className="space-y-4 pb-20">
            {clauses.map((clause) => (
              <motion.div
                key={clause.id}
                layout
                className={`bg-white border ${editingId === clause.id ? 'border-maersk-blue ring-1 ring-maersk-blue/10 shadow-lg' : 'border-gray-200'} rounded-sm p-6 transition-all group relative`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h4 className="text-base font-semibold text-gray-900">{clause.title}</h4>
                       <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-sm uppercase">v{clause.version}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Updated: {clause.lastUpdated}</span>
                  </div>

                  {editingId === clause.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(clause.id)}
                        className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-sm hover:bg-emerald-100 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-gray-50 text-gray-400 border border-gray-100 rounded-sm hover:bg-gray-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(clause)}
                      className="p-2 text-gray-300 hover:text-maersk-blue hover:bg-gray-50 rounded-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>

                {editingId === clause.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={tempContent}
                      onChange={(e) => setTempContent(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-maersk-blue min-h-[120px] leading-relaxed font-sans"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 leading-relaxed font-light">
                    {renderContentWithHighlights(clause)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Governance Sidebar */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {activeVar ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-maersk-blue text-white rounded-sm p-6 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Zap size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Variable Analysis</h3>
                    <button onClick={() => setActiveVar(null)} className="p-1 hover:bg-white/10 rounded">
                        <X size={14} />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-white/70 uppercase mb-1">Target Value:</div>
                  <div className="text-xl font-medium mb-6 italic">&ldquo;{activeVar}&rdquo;</div>

                  <div className="space-y-4">
                     <div className="p-3 bg-black/10 rounded-sm border border-white/10">
                        <div className="text-[9px] font-bold uppercase mb-1 opacity-70">Impacted Requests</div>
                        <div className="text-lg font-bold">14 Active Cases</div>
                        <div className="text-[10px] text-white/50">Calculated from last 30 days</div>
                     </div>
                     <div className="p-3 bg-black/10 rounded-sm border border-white/10">
                        <div className="text-[9px] font-bold uppercase mb-1 opacity-70">Regulatory Risk</div>
                        <div className="text-lg font-bold text-amber-300">MEDIUM</div>
                        <div className="text-[10px] text-white/50">Permanent Establishment Check</div>
                     </div>
                  </div>

                  <button className="w-full mt-6 bg-white text-maersk-blue py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-maersk-light transition-all">
                     View Affected Employees
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm"
              >
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ShieldCheck size={16} className="text-maersk-blue" />
                   Governance Status
                </h3>
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Main Version</span>
                    <span className="text-sm font-bold text-maersk-dark font-mono">3.2.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Audit Status</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-sm border border-emerald-100 uppercase tracking-wider">Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last Published</span>
                    <span className="text-xs text-gray-900 font-medium">Feb 1, 2026</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-gray-50 border border-gray-200 rounded-sm p-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Info size={14} className="text-maersk-blue" />
               Governance Tip
            </h3>
            <p className="text-xs text-gray-600 font-light leading-relaxed">
              When updating variables like <span className="font-bold">&ldquo;20 working days&rdquo;</span>, ensure that local country labour laws are synced. AI will flag discrepancies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEditor;
