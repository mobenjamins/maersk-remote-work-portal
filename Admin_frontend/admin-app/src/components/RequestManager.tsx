import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, AlertCircle, CheckCircle, Clock, XCircle, MoreVertical } from 'lucide-react';
import { getAdminRequests, decideAdminRequest, type AdminRequest } from '../services/api';
import { mockRequests, type Request } from '../data/mockData';

function mapApiRequest(r: AdminRequest, index: number): Request {
  const mappedStatus = r.status === 'pending' ? 'escalated' : r.status;
  return {
    id: r.id,
    reference: `SIRW-2026-${String(index + 1).padStart(4, '0')}`,
    employeeName: r.user_name || r.user_email.split('@')[0],
    role: 'Employee',
    homeCountry: r.home_country,
    destinationCountry: r.destination_country,
    startDate: r.start_date,
    endDate: r.end_date,
    status: mappedStatus as Request['status'],
    riskLevel: mappedStatus === 'rejected' ? 'high' : mappedStatus === 'escalated' ? 'medium' : 'low',
    createdAt: r.created_at,
    decisionSource: r.decision_source as Request['decisionSource'],
    decisionStatus: r.decision_status as Request['decisionStatus'],
    flags: r.flags,
    decisionReason: r.decision_reason,
    exceptionReason: r.exception_reason,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'review' | 'approved' | 'rejected'>('all');
  const [sortMode, setSortMode] = useState<'oldest' | 'newest' | 'risk'>('oldest');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | number | null>(null);
  const [requests, setRequests] = useState<Request[]>(mockRequests);
  const [decisionNote, setDecisionNote] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadRequests = async () => {
      try {
        const data = await getAdminRequests();
        if (!cancelled && data.length > 0) {
          setRequests(data.map((r, i) => mapApiRequest(r, i)));
        }
      } catch {
        // keep mock data as fallback
      }
    };
    loadRequests();
    return () => { cancelled = true; };
  }, []);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    setIsSubmittingDecision(true);
    try {
      await decideAdminRequest(selectedRequest.id, decision, decisionNote);
      const data = await getAdminRequests();
      setRequests(data.map((r, i) => mapApiRequest(r, i)));
      setDecisionNote('');
      setSelectedRequest(null);
    } catch {
      // keep drawer open if decision fails
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.homeCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase());

    const isReviewRequired = req.status === 'escalated';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'review' && isReviewRequired) ||
      (statusFilter === 'approved' && req.status === 'approved') ||
      (statusFilter === 'rejected' && req.status === 'rejected');

    return matchesSearch && matchesStatus;
  });

  const getWaitingDays = (req: Request) => {
    const baseDate = req.createdAt ? new Date(req.createdAt) : new Date(req.startDate);
    const diff = Math.max(0, Date.now() - baseDate.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getRiskScore = (req: Request) => {
    const flags = req.flags || [];
    if (flags.includes('sanctioned_country') || flags.includes('no_right_to_work')) return 3;
    if (flags.includes('role_ineligible') || flags.includes('exceeds_annual_limit') || flags.includes('exceeds_consecutive_limit')) return 2;
    return req.riskLevel === 'high' ? 3 : req.riskLevel === 'medium' ? 2 : 1;
  };

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortMode === 'newest') {
      return getWaitingDays(a) - getWaitingDays(b);
    }
    if (sortMode === 'risk') {
      return getRiskScore(b) - getRiskScore(a);
    }
    // oldest first by default
    return getWaitingDays(b) - getWaitingDays(a);
  });

  const policyEvidence = {
    rightToWork: {
      section: 'Section 4.1.3 Immigration',
      snippet: 'For permission to be granted for SIRW, a colleague must have the right to work in the relevant country.',
    },
    sanctions: {
      section: 'Section 4.1.3 Relevant countries',
      snippet: 'SIRW cannot be performed in countries with no Maersk entity',
    },
    eligibility: {
      section: 'Section 4.1.1 Eligibility',
      snippet: 'Those in frontline, customer-facing roles',
    },
    durationAnnual: {
      section: 'Section 4.1.2 Duration allowed',
      snippet: 'SIRW can be approved up to a strict maximum of 20 workdays in a calendar year.',
    },
    durationConsecutive: {
      section: 'Section 4.1.2 Duration allowed',
      snippet: 'The 20 workdays cannot be taken as a single block of 20 continuous days,',
    },
    extended: {
      section: 'Section 5 Extended SIRW (Exceptional)',
      snippet: 'Exceptional circumstances might be the birth of a child in a foreign country or serious illness / death of immediate family in another country.',
    },
  };

  const buildEvidence = (req: Request) => {
    const flags = req.flags || [];
    const evidence: Array<{ section: string; snippet: string; reason: string }> = [];

    if (flags.includes('no_right_to_work')) {
      evidence.push({ ...policyEvidence.rightToWork, reason: 'Right to work not confirmed.' });
    }
    if (flags.includes('sanctioned_country')) {
      evidence.push({ ...policyEvidence.sanctions, reason: 'Destination is sanctioned or blocked.' });
    }
    if (flags.includes('role_ineligible')) {
      evidence.push({ ...policyEvidence.eligibility, reason: 'Role category not eligible.' });
    }
    if (flags.includes('exceeds_annual_limit')) {
      evidence.push({ ...policyEvidence.durationAnnual, reason: 'Exceeds annual limit.' });
    }
    if (flags.includes('exceeds_consecutive_limit')) {
      evidence.push({ ...policyEvidence.durationConsecutive, reason: 'Exceeds consecutive limit.' });
    }
    if (flags.some((f) => f.startsWith('exception:')) || req.status === 'escalated') {
      evidence.push({ ...policyEvidence.extended, reason: 'Exception requested.' });
    }

    return evidence;
  };

  const getAiRecommendation = (req: Request) => {
    const flags = req.flags || [];
    const hardBlock = flags.includes('no_right_to_work') || flags.includes('sanctioned_country') || flags.includes('role_ineligible');
    if (hardBlock) {
      return { decision: 'Reject', rationale: 'Hard policy blockers detected.' };
    }
    if (flags.includes('exceeds_annual_limit') || flags.includes('exceeds_consecutive_limit')) {
      return { decision: 'Approve', rationale: 'Eligible with exception; no hard blockers detected.' };
    }
    return { decision: 'Approve', rationale: 'No hard blockers detected.' };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      case 'escalated':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={12} />;
      case 'rejected': return <XCircle size={12} />;
      case 'escalated':
        return <AlertCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'escalated') return 'Review required';
    return status;
  };

  const getDecisionLabel = (req: Request) => {
    if (req.status === 'approved') {
      return req.decisionSource === 'auto' ? 'Auto approved' : req.decisionSource === 'human' ? 'Human approved' : 'Approved';
    }
    if (req.status === 'rejected') {
      return req.decisionSource === 'auto' ? 'Auto rejected' : req.decisionSource === 'human' ? 'Human rejected' : 'Rejected';
    }
    return '—';
  };

  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Dashboard</h2>
          <p className="text-sm text-gray-500 font-light">Review required cases first, then approve or reject quickly.</p>
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
            {[
              { key: 'all', label: 'All' },
              { key: 'review', label: 'Review required' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key as typeof statusFilter)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status.key
                    ? 'bg-white text-maersk-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={status.key === 'review' ? 'Requires human review' : ''}
              >
                {status.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-sm p-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-2">Sort</label>
            <select
              className="bg-white border border-gray-200 rounded-sm text-[10px] font-bold uppercase tracking-widest px-2 py-1"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="risk">Highest risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Route</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Waiting days</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Decision source</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode='popLayout'>
                {sortedRequests.map((req, index) => (
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
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-gray-50 text-gray-600">
                        {getWaitingDays(req)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(req.status)}`}>
                        {getStatusIcon(req.status)}
                        {getStatusLabel(req.status).toLowerCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                        {getDecisionLabel(req)}
                      </span>
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
              onClick={() => { setSelectedRequest(null); setDecisionNote(''); }}
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
                  onClick={() => { setSelectedRequest(null); setDecisionNote(''); }}
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
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Status</div>
                      <div className="text-sm font-bold text-gray-900 uppercase">{getStatusLabel(selectedRequest.status)}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Employee Details</h4>
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
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Trip Logistics</h4>
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
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Review Summary</h4>
                  {selectedRequest.status === 'escalated' ? (
                    <div className="space-y-4">
                      {(selectedRequest.decisionReason || selectedRequest.exceptionReason) && (
                        <div className="p-4 bg-white border border-gray-100 rounded-sm shadow-sm">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">System note</div>
                          {selectedRequest.decisionReason && (
                            <div className="text-xs text-gray-700 mb-2">{selectedRequest.decisionReason}</div>
                          )}
                          {selectedRequest.exceptionReason && (
                            <div className="text-xs text-gray-700 italic">Exception reason: {selectedRequest.exceptionReason}</div>
                          )}
                        </div>
                      )}
                      <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">Why review is required</div>
                        <ul className="space-y-3 text-xs text-gray-700">
                          {buildEvidence(selectedRequest).map((e, idx) => (
                            <li key={idx} className="leading-relaxed flex gap-2">
                              <CheckCircle size={14} className="text-gray-400 mt-0.5" />
                              <div>
                                <div className="font-semibold">{e.section}</div>
                                <div className="text-gray-700">“{e.snippet}”</div>
                                <div className="text-[11px] text-gray-500">Reason: {e.reason}</div>
                              </div>
                            </li>
                          ))}
                          {buildEvidence(selectedRequest).length === 0 && (
                            <li className="text-gray-500">No explicit policy flags were recorded.</li>
                          )}
                        </ul>
                      </div>

                      <div className="p-4 bg-white border border-gray-100 rounded-sm shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Recommendation</div>
                          <div className="text-xs font-bold uppercase text-maersk-blue">
                            {getAiRecommendation(selectedRequest).decision}
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 mb-3">
                          {getAiRecommendation(selectedRequest).rationale}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Citations:
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            {buildEvidence(selectedRequest).map((e, idx) => (
                              <li key={idx}>{e.section} — “{e.snippet}”</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Notes to employee</div>
                        <textarea
                          value={decisionNote}
                          onChange={(e) => setDecisionNote(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-maersk-blue min-h-[90px]"
                          placeholder="Add a short explanation or next steps..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">This case does not require manual review.</div>
                  )}
                </section>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                {(selectedRequest.status === 'escalated') && (
                  <>
                    <button
                      onClick={() => handleDecision('rejected')}
                      disabled={isSubmittingDecision}
                      className="flex-1 py-3 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-sm text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision('approved')}
                      disabled={isSubmittingDecision}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestManager;
