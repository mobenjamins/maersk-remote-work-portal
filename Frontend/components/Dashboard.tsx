import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { User, getRequests, RemoteWorkRequest, getSIRWAnnualBalance, AnnualBalanceResponse } from '../services/api';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Globe, 
  ArrowRight, 
  Calendar,
  FileText,
  LifeBuoy,
  ChevronRight,
  Briefcase,
  Plane,
  Info
} from 'lucide-react';

interface DashboardProps {
  setViewState: (view: ViewState) => void;
  user?: User | null;
  onOpenPolicy?: () => void;
}

// --- MICRO-COMPONENTS ---

const AnimatedCounter = ({ value, duration = 1.5 }: { value: number, duration?: number }) => {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const KPICard = ({ label, value, subtext, icon: Icon, color, delay }: any) => {
  const colorMap: any = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    cyan: 'text-cyan-600',
    amber: 'text-amber-600',
  };
  const textColor = colorMap[color] || 'text-gray-600';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white border border-gray-100 p-5 rounded-sm shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity ${textColor}`}>
          <Icon size={48} strokeWidth={0.5} />
      </div>
      <div className="relative z-10">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-3xl font-light text-gray-900 tracking-tight flex items-baseline gap-1">
              {value}
          </div>
          <div className={`text-xs font-medium mt-1 ${textColor}`}>{subtext}</div>
      </div>
    </motion.div>
  );
};

const StatusPill = ({ status }: { status: string }) => {
    const config = {
      approved: { icon: CheckCircle, style: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'Approved' },
      pending: { icon: Clock, style: 'bg-amber-50 text-amber-700 border-amber-100', text: 'Reviewing' },
      rejected: { icon: XCircle, style: 'bg-red-50 text-red-700 border-red-100', text: 'Declined' },
      escalated: { icon: AlertCircle, style: 'bg-orange-50 text-orange-700 border-orange-100', text: 'Escalated' },
      draft: { icon: FileText, style: 'bg-gray-50 text-gray-600 border-gray-100', text: 'Draft' },
    }[status] || { icon: Clock, style: 'bg-gray-50 text-gray-600 border-gray-100', text: status };
  
    const Icon = config.icon;
  
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.style}`}>
        <Icon size={10} strokeWidth={2} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{config.text}</span>
      </span>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ setViewState, user, onOpenPolicy }) => {
  const [requests, setRequests] = useState<RemoteWorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [annualBalance, setAnnualBalance] = useState<AnnualBalanceResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsData, balanceData] = await Promise.all([
          getRequests(),
          getSIRWAnnualBalance().catch(() => null),
        ]);
        setRequests(requestsData);
        setAnnualBalance(balanceData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', 
      month: 'short', 
      year: '2-digit'
    });
  };

  const daysRemaining = annualBalance?.days_remaining ?? user?.days_remaining ?? 20;
  const daysAllowed = annualBalance?.days_allowed ?? user?.days_allowed ?? 20;
  const activeRequestsCount = requests.filter(r => r.status === 'approved' || r.status === 'pending').length;

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6"
      >
        <div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Global Mobility <span className="font-semibold text-[#42b0d5]">Portal</span>
            </h1>
            <p className="text-gray-500 mt-2 font-light text-sm max-w-md leading-relaxed">
              Manage your international remote work requests in compliance with Maersk global policies.
            </p>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Period</div>
            <div className="text-lg font-medium text-gray-900">{new Date().getFullYear()} Calendar Year</div>
        </div>
      </motion.div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <KPICard 
            label="Days Remaining" 
            value={<AnimatedCounter value={daysRemaining} />} 
            subtext={`of ${daysAllowed} days allowed`}
            icon={Calendar}
            color="blue"
            delay={0.1}
         />
         <KPICard 
            label="Active Cases" 
            value={<AnimatedCounter value={activeRequestsCount} />} 
            subtext="In progress"
            icon={Briefcase}
            color="emerald"
            delay={0.2}
         />
         <KPICard 
            label="Compliance Status" 
            value="100%" 
            subtext="Fully compliant"
            icon={CheckCircle}
            color="cyan"
            delay={0.3}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - MAIN ACTIONS & LIST */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* HERO ACTION CARD - Premium Informative Style */}
            <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setViewState(ViewState.FORM)}
                className="group cursor-pointer relative overflow-hidden rounded-sm bg-[#0b1e3b] text-white shadow-xl"
            >
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#42b0d5] rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="relative z-10 p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <h2 className="text-3xl font-light text-white leading-tight">Start <span className="font-bold">SIRW</span> Request</h2>
                            <p className="text-gray-400 text-sm font-light max-w-sm leading-relaxed">
                                Submit a new request for Short-Term International Remote Work. Initial approval from your Line Manager is mandatory.
                            </p>
                            <div className="flex items-center gap-3 bg-[#42b0d5] text-white px-6 py-3 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-[#3aa3c7] transition-all w-fit shadow-lg shadow-[#42b0d5]/20">
                                Initiate Request <ChevronRight size={14} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                        
                        <div className="hidden md:block bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-sm w-64">
                            <h4 className="text-[10px] font-bold text-[#42b0d5] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Info size={12} /> Key Requirements
                            </h4>
                            <ul className="space-y-3">
                                {[
                                    'Manager email confirmation',
                                    'Max 20 workdays per year',
                                    'Valid work rights in destination',
                                    'Non-restricted role category'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-[#42b0d5] mt-1.5 shrink-0" />
                                        <span className="text-[11px] text-gray-300 font-light leading-tight">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ACTIVITY LIST */}
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={12} strokeWidth={1.5} />
                       Recent Activity
                    </h3>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-gray-400 text-sm italic">Loading history...</div>
                ) : requests.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                        <Briefcase size={20} strokeWidth={1} />
                    </div>
                    <p className="text-gray-500 text-sm mb-1 font-light">No requests found</p>
                    <button onClick={() => setViewState(ViewState.FORM)} className="text-[#42b0d5] text-xs font-bold uppercase tracking-widest hover:underline mt-2">Start your first case</button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    <AnimatePresence>
                        {requests.slice(0, 5).map((request, i) => (
                            <motion.div 
                                key={request.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="px-6 py-5 hover:bg-gray-50/50 transition-colors group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#42b0d5] flex items-center justify-center">
                                        <Globe size={16} strokeWidth={1} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">{request.destination_country}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2 font-light uppercase tracking-wide">
                                            <span>{formatDate(request.start_date)} — {formatDate(request.end_date)}</span>
                                            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                                            <span>{request.duration_days} Days</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <StatusPill status={request.status} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN - SIDEBAR */}
        <div className="space-y-6">
            
            {/* POLICY RULES */}
            <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle size={12} strokeWidth={1.5} className="text-[#42b0d5]" /> Policy Highlights
                </h3>
                <ul className="space-y-5">
                    {[
                        { label: 'Annual Limit', val: '20 Days', desc: 'Per calendar year' },
                        { label: 'Consecutive', val: '14 Days', desc: 'Max single trip' },
                        { label: 'Eligibility', val: 'Work Rights', desc: 'Valid visa required' }
                    ].map((rule, i) => (
                        <li key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{rule.label}</span>
                                <span className="text-xs font-bold text-gray-900">{rule.val}</span>
                            </div>
                            <span className="text-[11px] text-gray-500 font-light">{rule.desc}</span>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => window.open(`${import.meta.env.BASE_URL}policy/Maersk-SIRW-Policy.pdf`, '_blank')}
                    className="w-full mt-8 py-3 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#42b0d5] hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                    <FileText size={12} /> Full Policy PDF
                </button>
            </div>

        </div>

      </div>
    </div>
  );
};