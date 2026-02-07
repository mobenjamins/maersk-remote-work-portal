import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, AlertCircle, CheckCircle, Clock, XCircle, MoreVertical, BrainCircuit, Loader2 } from 'lucide-react';
import { getAdminRequests, type AdminRequest } from '../services/api';
import { mockRequests, type Request } from '../data/mockData';

function mapApiRequest(r: AdminRequest, index: number): Request {
  return {
    id: r.id,
    reference: `SIRW-2026-${String(index + 1).padStart(4, '0')}`,
    employeeName: r.user_name || r.user_email.split('@')[0],
    role: 'Employee',
    homeCountry: r.home_country,
    destinationCountry: r.destination_country,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status as Request['status'],
    riskLevel: r.status === 'rejected' ? 'high' : r.status === 'escalated' ? 'medium' : 'low',
    sentiment: r.status === 'approved' ? 85 : r.status === 'rejected' ? -30 : 50,
    queryCount: 3,
  };
}

const EmployeeHoverCard = ({ employeeName, role, homeCountry }: { employeeName: string, role: string, homeCountry: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    className="absolute z-50 left-0 top-full mt-2 w-64 bg-white rounded-sm shadow-xl border border-gray-200 p-4 pointer-events-none"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-maersk-blue text-white flex items-center justify-center font-bold text-sm">
        {employeeName.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-900">{employeeName}</h4>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Home Base</span>
        <span className="font-medium text-gray-700">{homeCountry}</span>
      </div>
    </div>
  </motion.div>
);

const RequestManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'escalated'>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>(mockRequests);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getAdminRequests();
      if (data.length > 0) {
        setRequests(data.map(mapApiRequest));
      }
    } catch {
      // keep mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.homeCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      case 'escalated': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={12} />;
      case 'rejected': return <XCircle size={12} />;
      case 'escalated': return <AlertCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-maersk-blue" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Request Manager</h2>
          <p className="text-sm text-gray-500 font-light">Detailed review and processing of all SIRW applications.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 hover:text-maersk-blue hover:border-maersk-blue rounded-sm transition-all text-xs font-bold uppercase tracking-widest shadow-sm">
          <Download size={14} />
          Export to Excel
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, reference, or country..."
            className="w-full bg-gray-50 border border-gray-200 rounded-sm pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-maersk-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-sm">
            {(['all', 'pending', 'approved', 'rejected', 'escalated'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? 'bg-white text-maersk-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Sentiment</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode='popLayout'>
                {filteredRequests.map((req, index) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer relative"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <td className="px-6 py-4 text-xs font-bold text-maersk-blue font-mono">{req.reference}</td>
                    <td className="px-6 py-4 relative">
                      <div
                        className="flex flex-col w-fit"
                        onMouseEnter={() => setHoveredEmployeeId(req.id)}
                        onMouseLeave={() => setHoveredEmployeeId(null)}
                      >
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-maersk-blue transition-colors flex items-center gap-1">
                           {req.employeeName}
                        </span>
                        <span className="text-[11px] text-gray-500">{req.role}</span>

                        <AnimatePresence>
                          {hoveredEmployeeId === req.id && (
                            <EmployeeHoverCard
                              employeeName={req.employeeName}
                              role={req.role}
                              homeCountry={req.homeCountry}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-gray-900">{req.homeCountry}</span>
                        <span className="text-gray-300">&rarr;</span>
                        <span className="text-gray-900">{req.destinationCountry}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] text-gray-600">
                        <div>{req.startDate}</div>
                        <div className="text-gray-400">to {req.endDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                        req.sentiment > 50 ? 'text-emerald-600 bg-emerald-50' :
                        req.sentiment < 0 ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                      }`}>
                        {req.sentiment > 0 ? '+' : ''}{req.sentiment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(req.status)}`}>
                        {getStatusIcon(req.status)}
                        {req.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-gray-200 rounded-sm transition-colors text-gray-400 group-hover:text-gray-700">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Side Panel */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-light text-gray-900">Case Review</h3>
                  <p className="text-xs font-bold text-maersk-blue uppercase tracking-widest mt-1">{selectedRequest.reference}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 space-y-8">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusStyle(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status</div>
                      <div className="text-sm font-bold text-gray-900 uppercase">{selectedRequest.status}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Employee Details</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500">Full Name</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedRequest.employeeName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Corporate Role</div>
                        <div className="text-sm text-gray-900">{selectedRequest.role}</div>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Trip Logistics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500">Route</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedRequest.homeCountry} → {selectedRequest.destinationCountry}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Period</div>
                        <div className="text-sm text-gray-900">{selectedRequest.startDate} to {selectedRequest.endDate}</div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="pt-6 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Risk & Compliance Analysis</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-sm shadow-sm">
                      <span className="text-sm text-gray-600">Permanent Establishment Risk</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-sm uppercase ${
                        selectedRequest.riskLevel === 'high' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {selectedRequest.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-sm shadow-sm">
                      <span className="text-sm text-gray-600">Right to Work Verification</span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 uppercase">
                        <CheckCircle size={12} /> Verified
                      </span>
                    </div>
                    <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-sm">
                      <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                         <BrainCircuit size={14} className="inline" /> AI Sentiment Flag
                      </h5>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        The employee expressed {selectedRequest.sentiment > 50 ? 'high satisfaction' : selectedRequest.sentiment < 0 ? 'frustration' : 'neutral sentiment'} ({selectedRequest.sentiment > 0 ? '+' : ''}{selectedRequest.sentiment}) during the assessment.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button className="flex-1 py-3 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-sm text-xs font-bold uppercase tracking-widest transition-all">
                      Decline
                    </button>
                    <button className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20">
                      Approve Request
                    </button>
                  </>
                )}
                <button className="flex-1 py-3 px-4 bg-maersk-dark hover:bg-maersk-deep text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-all">
                  Escalate Case
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestManager;
