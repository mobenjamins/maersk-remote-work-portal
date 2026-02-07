import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Globe, CheckCircle, TrendingUp, ArrowRight, X, Map as MapIcon, Home, Plane, Loader2 } from 'lucide-react';
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { getAdminDashboard, getAdminRequests, type AdminAnalytics, type AdminRequest } from '../services/api';
import { mockRequests, type Request } from '../data/mockData';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const chartData = [
  { name: 'Jan', requests: 4 },
  { name: 'Feb', requests: 7 },
  { name: 'Mar', requests: 5 },
  { name: 'Apr', requests: 12 },
  { name: 'May', requests: 18 },
  { name: 'Jun', requests: 14 },
  { name: 'Jul', requests: 24 },
];

const AnimatedCounter = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

// Map AdminRequest to local Request shape for display
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

const OverviewDashboard = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
  const [mapMode, setMapMode] = useState<'home' | 'destination'>('destination');
  const [filterType, setFilterType] = useState<'all' | 'country' | 'kpi' | 'trend'>('all');
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [apiRequests, setApiRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsData, requestsData] = await Promise.all([
        getAdminDashboard(),
        getAdminRequests(),
      ]);
      setAnalytics(analyticsData);
      setApiRequests(requestsData.map(mapApiRequest));
    } catch {
      // Fall back to mock data on error
      setApiRequests(mockRequests);
    } finally {
      setLoading(false);
    }
  };

  const requests = apiRequests.length > 0 ? apiRequests : mockRequests;

  const heatMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(req => {
      const country = mapMode === 'home' ? req.homeCountry : req.destinationCountry;
      counts[country] = (counts[country] || 0) + 1;
    });
    return counts;
  }, [mapMode, requests]);

  const colorScale = scaleLinear<string>()
    .domain([0, 5])
    .range(["#E2E8F0", "#42B0D5"]);

  const drilledRequests = useMemo(() => {
    if (filterType === 'all') return [];
    if (filterType === 'country' && filterValue) {
      return requests.filter(r => (mapMode === 'home' ? r.homeCountry : r.destinationCountry) === filterValue);
    }
    if (filterType === 'kpi' && filterValue) {
      if (filterValue === 'approved') return requests.filter(r => r.status === 'approved');
      return requests;
    }
    return requests.slice(0, 3);
  }, [filterType, filterValue, mapMode, requests]);

  const totalRequests = analytics?.total_requests ?? requests.length;
  const approvedCount = analytics?.approved_requests ?? requests.filter(r => r.status === 'approved').length;
  const uniqueCountries = new Set(requests.map(r => r.destinationCountry)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-maersk-blue mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Global Mobility Overview</h2>
          <p className="text-sm text-gray-500 font-light italic">Click on any chart or metric to drill down into specific case data.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div onClick={() => { setFilterType('kpi'); setFilterValue('total'); }}>
          <KPICard
            title="Total Requests"
            value={<AnimatedCounter value={totalRequests} />}
            change="+12%"
            icon={Users}
            color="blue"
            active={filterValue === 'total'}
            delay={0}
          />
        </div>
        <div onClick={() => { setFilterType('kpi'); setFilterValue('active'); }}>
          <KPICard
            title="Active Corridors"
            value={<AnimatedCounter value={uniqueCountries} />}
            change="Live"
            icon={Globe}
            color="cyan"
            active={filterValue === 'active'}
            delay={0.1}
          />
        </div>
        <div onClick={() => { setFilterType('kpi'); setFilterValue('approved'); }}>
          <KPICard
            title="Approved"
            value={<AnimatedCounter value={approvedCount} />}
            change="High"
            icon={CheckCircle}
            color="emerald"
            active={filterValue === 'approved'}
            delay={0.2}
          />
        </div>
        <div onClick={() => setActiveTab('intelligence')} className="cursor-pointer">
          <KPICard
            title="Avg. Sentiment"
            value={<span>+<AnimatedCounter value={42} /></span>}
            change="View Analytics"
            icon={TrendingUp}
            color="amber"
            delay={0.3}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-6 shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <MapIcon size={14} className="text-maersk-blue" />
              Request Density Map
            </h3>
            <div className="flex p-0.5 bg-gray-100 rounded-sm">
              <button
                onClick={() => setMapMode('home')}
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase transition-all ${mapMode === 'home' ? 'bg-white text-maersk-dark shadow-sm' : 'text-gray-500'}`}
              >
                <Home size={12} /> Origin
              </button>
              <button
                onClick={() => setMapMode('destination')}
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase transition-all ${mapMode === 'destination' ? 'bg-white text-maersk-dark shadow-sm' : 'text-gray-500'}`}
              >
                <Plane size={12} /> Destination
              </button>
            </div>
          </div>

          <div className="h-[400px] w-full bg-gray-50 rounded-sm border border-gray-100 relative overflow-hidden group">
            <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    const countryName = geo.properties.name;
                    const count = heatMapData[countryName] || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={colorScale(count) as string}
                        stroke="#FFFFFF"
                        strokeWidth={0.5}
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={`${countryName}: ${count} Requests`}
                        onClick={() => {
                          if (count > 0) {
                            setFilterType('country');
                            setFilterValue(countryName);
                          }
                        }}
                        style={{
                          default: { outline: "none", transition: "fill 0.3s ease" },
                          hover: { fill: "#42B0D5", outline: "none", cursor: count > 0 ? 'pointer' : 'default' },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>

            <ReactTooltip id="my-tooltip" style={{ backgroundColor: "#00243D", color: "#fff", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />

            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 p-2 rounded border border-gray-200 shadow-sm">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Density:</span>
               <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} title={`${i} requests`} className="w-3 h-3 rounded-full border border-gray-100" style={{ backgroundColor: colorScale(i) as string }} />
                  ))}
               </div>
            </div>
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm flex flex-col cursor-pointer hover:border-maersk-blue/30 transition-colors"
          onClick={() => { setFilterType('trend'); setFilterValue('july'); }}
        >
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Volume Analysis</h3>
          <p className="text-[11px] text-gray-500 mb-8 uppercase tracking-widest">Monthly Submissions</p>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42B0D5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#42B0D5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#42B0D5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Drill-down Table Overlay */}
      <AnimatePresence>
        {filterType !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-t-4 border-maersk-blue rounded-sm shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-maersk-light rounded-full text-maersk-blue">
                   <Users size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 leading-tight">
                    Filtered Requests: <span className="text-maersk-blue font-bold uppercase">{filterValue}</span>
                  </h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{drilledRequests.length} cases identified</p>
                </div>
              </div>
              <button
                onClick={() => { setFilterType('all'); setFilterValue(null); }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reference</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Route</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {drilledRequests.map((req, i) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-xs font-bold text-maersk-blue font-mono">{req.reference}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{req.employeeName}</div>
                        <div className="text-[10px] text-gray-500">{req.role}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {req.homeCountry} → {req.destinationCountry}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase border ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-bold text-maersk-blue hover:underline uppercase tracking-tighter flex items-center gap-1 ml-auto">
                          Detail <ArrowRight size={12} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const KPICard = ({ title, value, change, icon: Icon, color, active, delay = 0 }: any) => {
  const colorMap: any = {
    blue: 'text-blue-600 bg-blue-50',
    cyan: 'text-maersk-blue bg-maersk-light',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`bg-white border p-6 rounded-sm shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        active ? 'border-maersk-blue ring-1 ring-maersk-blue/10 scale-[1.02]' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-sm group-hover:scale-110 transition-transform ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
          change.startsWith('+') || change === 'Live' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
        }`}>
          {change}
        </span>
      </div>
      <div className="space-y-1">
        <h4 className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</h4>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      </div>
    </motion.div>
  );
};

export default OverviewDashboard;
