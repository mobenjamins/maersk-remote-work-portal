import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { User, getRequests, RemoteWorkRequest, getSIRWAnnualBalance, AnnualBalanceResponse } from '../services/api';

interface DashboardProps {
  setViewState: (view: ViewState) => void;
  user?: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ setViewState, user }) => {
  const [requests, setRequests] = useState<RemoteWorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [annualBalance, setAnnualBalance] = useState<AnnualBalanceResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch requests and annual balance in parallel
        const [requestsData, balanceData] = await Promise.all([
          getRequests(),
          getSIRWAnnualBalance().catch(() => null), // Don't fail if balance endpoint fails
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-12 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-6">
        <div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Remote Work Portal</h1>
            <p className="text-gray-500 mt-2 font-light text-lg">
              Welcome back, {user?.first_name || 'User'}. Manage your international work requests.
            </p>
        </div>
        <div className="text-right">
             <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-1">
               {annualBalance?.year || new Date().getFullYear()} SIRW Balance
             </div>
             <div className="text-3xl font-light text-gray-900">
               {annualBalance?.days_remaining ?? user?.days_remaining ?? 20} 
               <span className="text-lg text-gray-400"> / {annualBalance?.days_allowed ?? user?.days_allowed ?? 20}</span>
             </div>
             {annualBalance && annualBalance.days_used > 0 && (
               <div className="text-xs text-gray-500 mt-1">
                 {annualBalance.days_used} days used
                 {annualBalance.pending_days > 0 && (
                   <span className="text-orange-500"> • {annualBalance.pending_days} pending</span>
                 )}
               </div>
             )}
        </div>
      </div>

      {/* Main Action Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Actions */}
        <div className="lg:col-span-2 space-y-8">
            {/* Primary Action Card */}
            <div 
                onClick={() => setViewState(ViewState.SELECTION)}
                className="bg-white group cursor-pointer border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#42b0d5] group-hover:w-2 transition-all"></div>
                <div className="p-8 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-[#42b0d5] transition-colors">New Remote Work Request</h2>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                            Initiate a new request for working internationally. This includes Short-term (up to 20 days) and Permanent transfers.
                        </p>
                        <div className="mt-6 inline-flex items-center text-sm font-semibold text-[#42b0d5]">
                            Start Request 
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-[#42b0d5] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
            </div>

            {/* Recent Requests Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                    <button className="text-xs text-[#42b0d5] font-medium hover:underline">View All History</button>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 mb-2">No requests yet</p>
                    <p className="text-sm text-gray-400">Create your first remote work request to get started.</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-8 py-4 w-1/4">Request ID</th>
                                <th className="px-8 py-4">Destination</th>
                                <th className="px-8 py-4">Duration</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.slice(0, 5).map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-8 py-4 text-gray-900 font-medium">{request.reference_number}</td>
                                  <td className="px-8 py-4 text-gray-600">{request.destination_country}</td>
                                  <td className="px-8 py-4 text-gray-600">{request.duration_days} days</td>
                                  <td className="px-8 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(request.status)}`}>
                                      {request.status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-4 text-gray-500 text-right">{formatDate(request.created_at)}</td>
                              </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                      Showing {Math.min(requests.length, 5)} of {requests.length} requests
                    </div>
                  </>
                )}
            </div>
        </div>

        {/* Right Column: Info & Guidelines */}
        <div className="space-y-8">
            <div className="bg-slate-800 text-white rounded-sm shadow-sm p-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-semibold text-lg mb-4">Policy Snapshot</h3>
                    <ul className="space-y-4 text-sm text-gray-300">
                        <li className="flex items-start">
                            <span className="text-[#42b0d5] mr-2">•</span>
                            Max {user?.days_allowed ?? 20} days per calendar year
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#42b0d5] mr-2">•</span>
                            Requires Right to Work in destination
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#42b0d5] mr-2">•</span>
                            Manager approval is mandatory
                        </li>
                    </ul>
                    <button className="mt-6 w-full py-2 border border-white/20 hover:bg-white/10 rounded-sm text-sm transition-colors">
                        Download Full Policy PDF
                    </button>
                </div>
                 {/* Decorative Circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#42b0d5] rounded-full mix-blend-overlay opacity-20 blur-xl"></div>
            </div>

            {/* User Info Card */}
            {user && (
              <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">Your Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Entity</span>
                    <span className="text-gray-900">{user.maersk_entity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Home Country</span>
                    <span className="text-gray-900">{user.home_country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sales Role</span>
                    <span className="text-gray-900">{user.is_sales_role ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2">Need Support?</h3>
                <p className="text-gray-500 text-sm mb-4">Contact the Global Mobility Tax Team for complex cases.</p>
                <a href="#" className="text-[#42b0d5] text-sm font-medium hover:underline flex items-center">
                    Open Support Ticket
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
            </div>
        </div>

      </div>
    </div>
  );
};
