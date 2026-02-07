import React, { useState } from 'react';

interface HRDashboardProps {
  onBack: () => void;
}

// --- Mock Data & Types ---

interface Case {
  id: string;
  employee: string;
  entity: string;
  destination: string;
  dates: string;
  duration: number;
  riskFlags: string[];
  status: 'Approved' | 'Rejected' | 'Pending Review';
}

const MOCK_CASES: Case[] = [
  { id: 'REQ-2024-892', employee: 'Lars Sorensen', entity: 'Maersk A/S (DK)', destination: 'United Kingdom', dates: 'Oct 12 - Oct 22', duration: 10, riskFlags: [], status: 'Approved' },
  { id: 'REQ-2024-899', employee: 'Sarah Jenkins', entity: 'Maersk Inc (USA)', destination: 'France', dates: 'Nov 01 - Nov 25', duration: 25, riskFlags: ['Duration > 20'], status: 'Rejected' },
  { id: 'REQ-2024-901', employee: 'Amit Patel', entity: 'Maersk India Pvt', destination: 'Singapore', dates: 'Sep 10 - Sep 15', duration: 5, riskFlags: ['Sales Role Check'], status: 'Pending Review' },
  { id: 'REQ-2024-905', employee: 'Elena Rossi', entity: 'Maersk Italy', destination: 'Germany', dates: 'Dec 05 - Dec 20', duration: 15, riskFlags: [], status: 'Approved' },
  { id: 'REQ-2024-912', employee: 'John Smith', entity: 'Maersk UK', destination: 'USA', dates: 'Jan 10 - Jan 15', duration: 5, riskFlags: ['Visa Uncertainty'], status: 'Pending Review' },
];

const SENTIMENT_DATA = [
    { topic: 'Visa/Immigration', score: -65, volume: 85, color: 'bg-red-500' },
    { topic: 'Policy Limits (20 Days)', score: -20, volume: 120, color: 'bg-orange-400' },
    { topic: 'Manager Approval', score: 45, volume: 60, color: 'bg-green-400' },
    { topic: 'System Ease of Use', score: 80, volume: 200, color: 'bg-green-600' },
];

const MOCK_CONVERSATIONS = [
  { id: 101, date: 'Oct 24, 2024', policyVersion: 'v2.1', topic: 'Visa/Immigration', sentiment: -40, summary: 'User frustrated with unclear UK post-Brexit visa rules.' },
  { id: 102, date: 'Oct 23, 2024', policyVersion: 'v2.1', topic: 'Policy Limits', sentiment: 10, summary: 'Clarification asked about whether weekends count towards the 20 days.' },
  { id: 103, date: 'Oct 20, 2024', policyVersion: 'v2.0', topic: 'Sales Restrictions', sentiment: -85, summary: 'Senior Sales Director blocked from working in Dubai. High frustration.' },
  { id: 104, date: 'Oct 18, 2024', policyVersion: 'v2.0', topic: 'System Ease of Use', sentiment: 90, summary: 'User praised the auto-approval speed for Spain trip.' },
];

// Realistic World Map Component
const WorldMapHeatmap = () => (
  <svg viewBox="0 0 1000 500" className="w-full h-full bg-[#001b2e]">
    <g fill="#1e3a52" stroke="#001b2e" strokeWidth="0.5">
       <path d="M100,60 Q150,20 280,50 L320,80 L280,150 L200,180 L140,160 L100,100 Z" />
       <path d="M290,200 L360,200 L380,260 L350,350 L320,380 L300,320 L280,250 Z" />
       <path d="M420,70 L520,60 L540,100 L500,120 L480,140 L440,130 L420,100 Z" />
       <path d="M460,150 L560,150 L580,200 L580,280 L520,320 L480,250 L460,200 Z" />
       <path d="M540,60 L700,50 L850,70 L900,120 L850,180 L750,200 L650,180 L600,130 Z" />
       <path d="M780,300 L880,300 L900,350 L850,380 L800,360 L780,320 Z" />
       <path d="M440,90 L455,90 L455,110 L440,110 Z" />
       <path d="M860,120 L880,120 L870,140 L860,130 Z" />
    </g>
    <g stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1">
        <line x1="0" y1="100" x2="1000" y2="100" />
        <line x1="0" y1="200" x2="1000" y2="200" />
        <line x1="0" y1="300" x2="1000" y2="300" />
        <line x1="0" y1="400" x2="1000" y2="400" />
        <line x1="200" y1="0" x2="200" y2="500" />
        <line x1="400" y1="0" x2="400" y2="500" />
        <line x1="600" y1="0" x2="600" y2="500" />
        <line x1="800" y1="0" x2="800" y2="500" />
    </g>
    <g className="group cursor-pointer">
        <circle cx="220" cy="120" r="15" className="text-[#42b0d5] opacity-60 animate-pulse" fill="currentColor" />
        <circle cx="220" cy="120" r="6" className="text-[#93c5fd]" fill="currentColor" />
        <title>USA: 145 Requests</title>
    </g>
    <g className="group cursor-pointer">
        <circle cx="448" cy="100" r="20" className="text-[#42b0d5] opacity-80 animate-pulse" fill="currentColor" />
        <circle cx="448" cy="100" r="6" className="text-[#93c5fd]" fill="currentColor" />
        <title>UK: 230 Requests</title>
    </g>
    <g className="group cursor-pointer">
        <circle cx="455" cy="130" r="15" className="text-[#42b0d5] opacity-70" fill="currentColor" />
        <circle cx="455" cy="130" r="5" className="text-[#93c5fd]" fill="currentColor" />
        <title>Spain: 180 Requests</title>
    </g>
    <g className="group cursor-pointer">
        <circle cx="680" cy="170" r="18" className="text-[#42b0d5] opacity-75" fill="currentColor" />
        <circle cx="680" cy="170" r="6" className="text-[#93c5fd]" fill="currentColor" />
        <title>India: 210 Requests</title>
    </g>
    <g className="group cursor-pointer">
        <circle cx="760" cy="230" r="8" className="text-[#42b0d5] opacity-50" fill="currentColor" />
        <circle cx="760" cy="230" r="3" className="text-[#93c5fd]" fill="currentColor" />
        <title>Singapore: 60 Requests</title>
    </g>
  </svg>
);

export const HRDashboard: React.FC<HRDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'chats'>('table');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  
  // Selection
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Policy Editor
  const [policyText, setPolicyText] = useState(`## Global Remote Work Policy v2.1 (Current)
  
1. **Duration**: Employees may work remotely from an international location for up to **20 working days** per calendar year.
2. **Right to Work**: Employees must hold valid citizenship or a work visa for the destination.
3. **Restricted Roles**: Sales, Signatory, and Executive roles require manual review due to Permanent Establishment (PE) risks.
4. **Approval**: Line Manager approval is mandatory via email or system workflow.`);

  // Filter Logic
  const filteredCases = MOCK_CASES.filter(c => {
    const matchesSearch = c.employee.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToExcel = () => {
    alert("Downloading 'Global_Mobility_Report_Q3_2025.csv'...");
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* --- SITE HEADER (People Function) --- */}
      <div className="bg-white pt-6 pb-2 px-8 border-b border-gray-100">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
                {/* Site Logo Block */}
                <div className="w-14 h-14 bg-[#42b0d5] text-white flex items-center justify-center text-xl font-light shadow-sm">
                    PF
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">People Function</h1>
                    {/* Breadcrumbs/Nav */}
                    <nav className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <a href="#" className="font-semibold text-gray-900 border-b-2 border-[#42b0d5] pb-0.5">Home</a>
                        <a href="#" className="hover:text-[#42b0d5]">Culture & Inclusion</a>
                        <a href="#" className="hover:text-[#42b0d5]">Employee Relations</a>
                        <a href="#" className="hover:text-[#42b0d5]">Engagement</a>
                        <span className="text-gray-300">...</span>
                        <a href="#" className="text-[#42b0d5]">Edit</a>
                        
                        <div className="flex items-center space-x-2 ml-4">
                            <span className="text-gray-400">★ Following</span>
                            <span className="text-gray-400">Site access</span>
                        </div>
                    </nav>
                </div>
            </div>
         </div>
         
         {/* Action Toolbar */}
         <div className="flex items-center text-sm font-medium text-gray-600 space-x-6 py-2">
             <button className="flex items-center space-x-1 hover:text-[#42b0d5] transition-colors">
                <span className="text-lg leading-none font-light text-[#42b0d5]">+</span> <span>New</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </button>
             
             <div className="h-4 border-l border-gray-300"></div>
             
             <button onClick={onBack} className="flex items-center space-x-1 hover:text-[#42b0d5] transition-colors group">
                 <svg className="w-4 h-4 text-gray-400 group-hover:text-[#42b0d5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 <span>Exit Admin</span>
             </button>
             <button className="hover:text-[#42b0d5] transition-colors">Page details</button>
             <button className="hover:text-[#42b0d5] transition-colors">Analytics</button>
             
             <span className="flex-1"></span>
             
             <span className="text-gray-400 font-normal text-xs">Published 9/8/2025</span>
             
             <button className="flex items-center hover:text-[#42b0d5] transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                Share
             </button>
             <button className="flex items-center hover:text-[#42b0d5] transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                Edit
             </button>
         </div>
      </div>

      {/* --- MAIN PAGE CONTENT --- */}
      <div className="px-8 py-8 animate-fade-in bg-white max-w-[1600px] mx-auto">
         
         <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-gray-800">Global Mobility Analytics</h2>
             <button 
                onClick={exportToExcel}
                className="bg-[#107c10] hover:bg-[#0b5a0b] text-white text-sm font-semibold px-4 py-2 rounded-sm flex items-center transition-colors shadow-sm"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export CSV
            </button>
         </div>

         {/* Tab Navigation */}
         <div className="border-b border-gray-200 mb-8 flex space-x-8">
            <button 
                onClick={() => setActiveTab('table')}
                className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'table' ? 'border-[#42b0d5] text-[#42b0d5]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
                Data Grid View
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'analytics' ? 'border-[#42b0d5] text-[#42b0d5]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
                Analytics & Trends
            </button>
            <button 
                onClick={() => setActiveTab('chats')}
                className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'chats' ? 'border-[#42b0d5] text-[#42b0d5]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
                Conversation Analysis
            </button>
         </div>

         {/* TAB CONTENTS */}
         <div className="min-h-[600px]">
            
            {/* --- TAB 1: DATA GRID --- */}
            {activeTab === 'table' && (
                <div className="space-y-6">
                    {/* SharePoint Style Filter Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                        <div className="relative w-full md:w-96">
                             <input 
                                type="text" 
                                placeholder="Search by employee or destination..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 hover:border-gray-400 rounded-sm text-sm focus:border-[#42b0d5] focus:ring-1 focus:ring-[#42b0d5] outline-none transition-colors"
                            />
                            <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                             <div className="relative">
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 hover:border-gray-400 rounded-sm pl-4 pr-10 py-2 text-sm focus:border-[#42b0d5] outline-none cursor-pointer"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Pending Review">Pending Review</option>
                                </select>
                                <svg className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                             </div>
                             <span className="text-sm text-gray-500">Showing {filteredCases.length} results</span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Home Entity</th>
                                    <th className="px-6 py-4">Destination</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Risk Flags</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCases.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedCase(c)}>
                                        <td className="px-6 py-4 font-semibold text-gray-900 group-hover:text-[#42b0d5]">{c.employee}</td>
                                        <td className="px-6 py-4 text-gray-600">{c.entity}</td>
                                        <td className="px-6 py-4 text-gray-800">{c.destination}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{c.dates}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.duration} Days</td>
                                        <td className="px-6 py-4">
                                            {c.riskFlags.length > 0 ? (
                                                c.riskFlags.map(r => (
                                                    <span key={r} className="inline-block bg-red-50 text-red-700 border border-red-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm mr-1">{r}</span>
                                                ))
                                            ) : (
                                                <span className="text-green-700 bg-green-50 border border-green-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span 
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    c.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    c.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400/50'
                                                }`}
                                            >
                                                {c.status} {c.status === 'Pending Review' && '→'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB 2: ANALYTICS --- */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Stats Row */}
                     <div className="lg:col-span-3 grid grid-cols-4 gap-6">
                        {/* KPI Cards styled for SharePoint */}
                        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Requests</p>
                            <span className="text-3xl font-light text-gray-900">1,248</span>
                        </div>
                        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Approval Rate</p>
                            <span className="text-3xl font-light text-gray-900">88.5%</span>
                        </div>
                        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Remote Days Utilized</p>
                            <span className="text-3xl font-light text-gray-900">14.2k</span>
                        </div>
                        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 border-l-4 border-l-red-400">
                            <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Compliance Blocks</p>
                            <span className="text-3xl font-light text-red-900">42</span>
                        </div>
                     </div>

                    {/* Heatmap Section */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="font-semibold text-gray-800 flex items-center">
                                Destination Request Density
                            </h3>
                            <select 
                                className="bg-gray-50 border border-gray-300 text-xs rounded-sm px-2 py-1 focus:border-[#42b0d5] outline-none" 
                                value={filterRegion} 
                                onChange={(e) => setFilterRegion(e.target.value)}
                            >
                                <option>All Regions</option>
                                <option>EMEA</option>
                                <option>APAC</option>
                                <option>Americas</option>
                            </select>
                        </div>
                        <div className="aspect-[2/1] bg-[#001b2e] rounded-sm relative overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner">
                           <WorldMapHeatmap />
                        </div>
                    </div>

                    {/* Side Charts */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Top Rejection Reasons</h3>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">PE Risk (Sales/Exec)</span>
                                        <span className="font-bold text-gray-900">45%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-red-400 h-2 rounded-full" style={{width: '45%'}}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">Immigration / Right to Work</span>
                                        <span className="font-bold text-gray-900">30%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-orange-400 h-2 rounded-full" style={{width: '30%'}}></div></div>
                                </div>
                            </div>
                        </div>
                         <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Top Destinations</h3>
                            <ul className="text-sm space-y-3">
                                <li className="flex justify-between items-center pb-2 border-b border-gray-50"><span className="text-gray-600">1. United Kingdom</span><span className="font-bold text-[#42b0d5]">245</span></li>
                                <li className="flex justify-between items-center pb-2 border-b border-gray-50"><span className="text-gray-600">2. India</span><span className="font-bold text-[#42b0d5]">210</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

             {/* --- TAB 3: CONVERSATION ANALYSIS & POLICY --- */}
             {activeTab === 'chats' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    
                    {/* Left Col: Sentiment & Logs */}
                    <div className="space-y-8">
                         {/* Sentiment Chart */}
                         <div className="bg-white p-8 rounded-sm border border-gray-200 shadow-sm">
                             <h3 className="font-bold text-gray-900 mb-2">Employee Sentiment Analysis</h3>
                             <p className="text-xs text-gray-500 mb-8">Sentiment scored from -100 (Negative) to +100 (Positive).</p>
                             
                             <div className="space-y-8">
                                {SENTIMENT_DATA.map((item) => (
                                    <div key={item.topic}>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-semibold text-gray-800">{item.topic}</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${item.score > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.score > 0 ? '+' : ''}{item.score} Sentiment
                                            </span>
                                        </div>
                                        <div className="relative h-3 bg-gray-100 rounded-full w-full flex items-center overflow-hidden">
                                            <div className="absolute left-1/2 h-full w-[2px] bg-gray-300 z-10"></div> {/* Zero Line */}
                                            <div 
                                                className={`h-full absolute ${item.color}`}
                                                style={{
                                                    left: item.score < 0 ? `calc(50% + ${item.score/2}%)` : '50%',
                                                    width: `${Math.abs(item.score)/2}%`
                                                }}
                                            ></div>
                                        </div>
                                        <div className="text-right text-[10px] text-gray-400 mt-1">{item.volume} queries</div>
                                    </div>
                                ))}
                             </div>
                         </div>

                         {/* Context Log Table */}
                         <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                 <h3 className="font-bold text-gray-900 text-sm">Recent Flagged Conversations</h3>
                                 <p className="text-xs text-gray-500">Anonymized logs linked to specific policy versions.</p>
                             </div>
                             <table className="w-full text-xs text-left">
                                 <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200">
                                     <tr>
                                         <th className="px-6 py-3">Date</th>
                                         <th className="px-6 py-3">Policy Ver.</th>
                                         <th className="px-6 py-3">Topic</th>
                                         <th className="px-6 py-3">Sentiment</th>
                                         <th className="px-6 py-3">Summary</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                     {MOCK_CONVERSATIONS.map((c) => (
                                         <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                             <td className="px-6 py-3 text-gray-600">{c.date}</td>
                                             <td className="px-6 py-3 font-mono text-gray-500">{c.policyVersion}</td>
                                             <td className="px-6 py-3 font-medium text-gray-800">{c.topic}</td>
                                             <td className="px-6 py-3">
                                                 <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${c.sentiment < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                     {c.sentiment}
                                                 </span>
                                             </td>
                                             <td className="px-6 py-3 text-gray-500 truncate max-w-[200px]" title={c.summary}>{c.summary}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>

                    {/* Right Col: Policy Editor */}
                    <div className="flex flex-col h-full">
                        <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="font-bold text-gray-900">Policy Management</h3>
                                    <p className="text-xs text-gray-500">Edit the source of truth for the Chatbot.</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-bold text-gray-500 uppercase">Current Version</span>
                                    <span className="text-sm font-mono text-[#42b0d5]">v2.1 (Active)</span>
                                </div>
                            </div>
                            
                            <textarea 
                                className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm font-mono text-gray-700 focus:border-[#42b0d5] focus:ring-1 focus:ring-[#42b0d5] outline-none resize-none leading-relaxed hover:border-gray-300 transition-colors"
                                value={policyText}
                                onChange={(e) => setPolicyText(e.target.value)}
                            />

                            <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="text-xs text-gray-400">Last updated: Oct 10, 2024 by HR_Admin_01</span>
                                <button className="bg-[#42b0d5] hover:bg-[#3aa3c7] text-white px-6 py-2 rounded-sm text-sm font-medium shadow-sm transition-colors">
                                    Publish New Version
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
             )}
         </div>
      </div>

      {/* --- SLIDE-OVER MODAL FOR CASE DETAILS --- */}
      {selectedCase && (
          <div className="fixed inset-0 z-[100] flex justify-end">
              {/* Backdrop */}
              <div 
                  className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity"
                  onClick={() => setSelectedCase(null)}
              ></div>
              
              {/* Drawer */}
              <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-8 overflow-y-auto animate-slide-in-right border-l border-gray-200">
                  <button 
                      onClick={() => setSelectedCase(null)}
                      className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"
                  >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>

                  <div className="mb-8">
                      <span className={`inline-block px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider mb-4 ${
                          selectedCase.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          selectedCase.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                          {selectedCase.status}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedCase.id}</h2>
                      <p className="text-gray-500">Request by {selectedCase.employee}</p>
                  </div>

                  <div className="space-y-6 border-t border-gray-100 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase">Destination</label>
                              <p className="text-gray-900 font-medium">{selectedCase.destination}</p>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase">Duration</label>
                              <p className="text-gray-900 font-medium">{selectedCase.duration} Days</p>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase">Dates</label>
                              <p className="text-gray-900 font-medium">{selectedCase.dates}</p>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase">Home Entity</label>
                              <p className="text-gray-900 font-medium">{selectedCase.entity}</p>
                          </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                          <h4 className="font-bold text-gray-800 text-sm mb-2">Compliance Analysis</h4>
                          {selectedCase.riskFlags.length > 0 ? (
                              <ul className="space-y-2">
                                  {selectedCase.riskFlags.map(r => (
                                      <li key={r} className="flex items-center text-red-600 text-sm">
                                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                          {r}
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-green-600 text-sm flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                  No compliance risks detected.
                              </p>
                          )}
                      </div>
                  </div>

                  {selectedCase.status === 'Pending Review' && (
                      <div className="mt-10 pt-6 border-t border-gray-100 flex space-x-4">
                          <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-3 rounded-sm font-medium transition-colors border border-red-200">
                              Reject Request
                          </button>
                          <button className="flex-1 bg-[#42b0d5] hover:bg-[#3aa3c7] text-white py-3 rounded-sm font-medium transition-colors shadow-sm">
                              Approve Request
                          </button>
                      </div>
                  )}
                  
                  {selectedCase.status !== 'Pending Review' && (
                       <div className="mt-10 pt-6 border-t border-gray-100">
                           <p className="text-xs text-center text-gray-400">This case has been closed. To reopen, contact IT.</p>
                       </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};