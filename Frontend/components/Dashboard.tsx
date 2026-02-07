import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { User, getRequests, RemoteWorkRequest, getSIRWAnnualBalance, AnnualBalanceResponse } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  setViewState: (view: ViewState) => void;
  user?: User | null;
  onOpenPolicy?: () => void;
}

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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any, color: string, label: string }> = {
      approved: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Pending Review' },
      rejected: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-100', label: 'Rejected' },
      escalated: { icon: AlertCircle, color: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Escalated' },
      completed: { icon: CheckCircle, color: 'bg-gray-50 text-gray-700 border-gray-100', label: 'Completed' },
      cancelled: { icon: XCircle, color: 'bg-gray-50 text-gray-600 border-gray-100', label: 'Cancelled' },
    };
    return configs[status] || { icon: Clock, color: 'bg-gray-50 text-gray-600 border-gray-100', label: status };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-10">
      
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
            <h1 className="text-4xl font-light text-gray-900 tracking-tight">SIRW <span className="font-semibold text-maersk-blue">Portal</span></h1>
            <p className="text-gray-500 mt-2 font-light text-lg">
              Welcome back, {user?.first_name || 'User'}. Manage your global mobility requests.
            </p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex items-center gap-6"
        >
             <div className="text-right border-r border-gray-100 pr-6">
                <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1">
                    {annualBalance?.year || new Date().getFullYear()} Allowance
                </div>
                <div className="text-3xl font-light text-gray-900 leading-none flex items-baseline gap-1">
                    {annualBalance?.days_remaining ?? user?.days_remaining ?? 20} 
                    <span className="text-sm text-gray-500 font-medium tracking-tight">/ {annualBalance?.days_allowed ?? user?.days_allowed ?? 20}d</span>
                </div>
             </div>
             <div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-maersk-blue">
                   <Calendar size={20} />
                </div>
             </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
            {/* New Request Action Card */}
            <motion.div 
                whileHover={{ y: -4 }}
                onClick={() => setViewState(ViewState.FORM)}
                className="bg-maersk-dark text-white group cursor-pointer rounded-sm shadow-xl relative overflow-hidden p-1"
            >
                <div className="bg-maersk-dark p-8 flex items-center justify-between relative z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-maersk-blue/20 text-maersk-blue rounded-full text-[10px] font-bold uppercase tracking-widest border border-maersk-blue/30">
                           <Plus size={12} /> New Application
                        </div>
                        <h2 className="text-2xl font-light text-white">Start <span className="font-bold">SIRW</span> Request</h2>
                        <p className="text-gray-300 text-sm leading-relaxed max-w-md font-light">
                            Ready to work from abroad? Submit your Short-Term International Remote Work request for compliance review.
                        </p>
                        <button className="flex items-center gap-2 bg-maersk-blue text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest group-hover:bg-maersk-blue/90 transition-all">
                            Initiate Request <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="hidden md:block opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe size={180} />
                    </div>
                </div>
                {/* Visual Accent */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-maersk-blue/10 rounded-full blur-3xl -mr-16 -mb-16"></div>
            </motion.div>

            {/* Activity Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={16} className="text-maersk-blue" />
                       Recent Activity
                    </h3>
                </div>
                
                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 gap-3 italic">
                    <div className="w-4 h-4 border-2 border-maersk-blue border-t-transparent rounded-full animate-spin"></div>
                    Loading your history...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                       <Plus size={32} />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">No requests yet</p>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">Create your first remote work request to see your application history and status here.</p>
                    </div>
                    <button 
                        onClick={() => setViewState(ViewState.FORM)}
                        className="text-maersk-blue font-bold text-xs uppercase tracking-widest hover:underline"
                    >
                        + Submit Your First Case
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                <th className="px-8 py-4">Reference</th>
                                <th className="px-8 py-4">Destination</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence mode='popLayout'>
                                {requests.slice(0, 5).map((request, i) => {
                                  const config = getStatusConfig(request.status);
                                  return (
                                    <motion.tr 
                                      key={request.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-bold text-maersk-blue font-mono group-hover:underline">
                                                {request.reference_number}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">
                                                {request.duration_days} Working Days
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-semibold text-gray-900">{request.destination_country}</div>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Globe size={10} /> Origin: {request.home_country}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
                                                <config.icon size={12} />
                                                {config.label}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="text-xs text-gray-600 font-medium">{formatDate(request.created_at)}</div>
                                            <button className="text-[10px] text-maersk-blue font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto mt-1">
                                                Detail <ArrowRight size={10} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                  );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    <div className="p-4 flex justify-between items-center bg-gray-50/30 border-t border-gray-100 px-8">
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Viewing {Math.min(requests.length, 5)} of {requests.length} total
                       </span>
                       <button className="text-[10px] font-bold text-maersk-blue hover:underline uppercase tracking-widest">View All history</button>
                    </div>
                  </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            {/* Policy Snapshot Card */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <CheckCircle size={16} className="text-maersk-blue" />
                        Policy Snapshot
                    </h3>
                </div>
                <div className="p-8 space-y-6">
                    <ul className="space-y-5">
                        {[
                            { text: `Max ${user?.days_allowed ?? 20} days per year`, icon: Calendar },
                            { text: 'Valid work rights required', icon: Globe },
                            { text: 'Manager approval mandatory', icon: CheckCircle }
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="p-1.5 bg-blue-50 text-maersk-blue rounded-sm">
                                    <item.icon size={14} />
                                </div>
                                <span className="text-sm text-gray-600 font-light leading-tight">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                      onClick={() => window.open(`${import.meta.env.BASE_URL}policy/Maersk-SIRW-Policy.pdf`, '_blank')}
                      className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-600 hover:text-maersk-blue hover:border-maersk-blue transition-all rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm"
                    >
                        Full Policy PDF
                    </button>
                    {onOpenPolicy && (
                      <button
                        onClick={onOpenPolicy}
                        className="w-full py-2.5 text-maersk-blue hover:underline text-[10px] font-bold uppercase tracking-widest"
                      >
                          View Full Policy
                      </button>
                    )}
                </div>
            </div>

            {/* Profile Context */}
            {user && (
              <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Internal Profile</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Maersk Entity', value: user.maersk_entity },
                    { label: 'Employment Country', value: user.home_country },
                    { label: 'Role Category', value: user.is_sales_role ? 'Sales / Commercial' : 'Operational' }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col border-b border-gray-50 pb-2 last:border-0">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Call-to-Action */}
            <div className="bg-maersk-dark rounded-sm p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <LifeBuoy size={100} />
                </div>
                <div className="relative z-10 space-y-4">
                    <h3 className="text-xs font-bold text-maersk-blue uppercase tracking-widest">Complex Request?</h3>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                        For cases involving taxation or long-term transfers, contact our Global Mobility Lead.
                    </p>
                    <a href="#" className="inline-flex items-center gap-2 text-maersk-blue text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors group">
                        Open Support Ticket <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
