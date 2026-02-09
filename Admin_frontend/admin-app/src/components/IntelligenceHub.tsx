import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MessageSquare, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

/* ── Mock data ──────────────────────────────────────────────────── */

const sentimentTopics = [
  { topic: 'Visa / Immigration', score: -65 },
  { topic: 'Policy Limits (20 Days)', score: -20 },
  { topic: 'Manager Approval', score: 45 },
  { topic: 'System Ease of Use', score: 80 },
];

const topicData = [
  { name: 'Visa Requirements', value: 45, color: '#00243D' },
  { name: 'Tax Implications', value: 30, color: '#42B0D5' },
  { name: 'Policy Limits', value: 15, color: '#60a5fa' },
  { name: 'Insurance', value: 10, color: '#bfdbfe' },
];

const flaggedConversations = [
  {
    id: 1,
    date: '7 Feb 2026',
    topic: 'Visa / Immigration',
    sentiment: -72,
    summary: 'Employee frustrated by lack of clarity on Schengen work-permit requirements for remote stays over 14 days.',
  },
  {
    id: 2,
    date: '6 Feb 2026',
    topic: 'Policy Limits',
    sentiment: -38,
    summary: 'Query about carrying unused SIRW days into next calendar year — disappointed by "no rollover" answer.',
  },
  {
    id: 3,
    date: '5 Feb 2026',
    topic: 'Manager Approval',
    sentiment: 52,
    summary: 'Positive feedback on new streamlined manager approval flow; requested email notification feature.',
  },
  {
    id: 4,
    date: '4 Feb 2026',
    topic: 'System Ease of Use',
    sentiment: 88,
    summary: 'Praised the Smart Wizard for making the compliance check "effortless" compared to previous manual forms.',
  },
  {
    id: 5,
    date: '3 Feb 2026',
    topic: 'Visa / Immigration',
    sentiment: -55,
    summary: 'Confusion around right-to-work documentation for non-EU nationals working remotely from Portugal.',
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

const sentimentColour = (score: number): string => {
  if (score <= -50) return '#ef4444';   // red-500
  if (score <= -10) return '#f59e0b';   // amber-500
  if (score <= 30) return '#6b7280';    // gray-500
  return '#10b981';                     // emerald-500
};

const sentimentBg = (score: number): string => {
  if (score <= -50) return 'bg-red-50 text-red-600 border-red-100';
  if (score <= -10) return 'bg-amber-50 text-amber-600 border-amber-100';
  if (score <= 30) return 'bg-gray-50 text-gray-600 border-gray-200';
  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
};

const borderLeft = (score: number): string => {
  if (score < 0) return 'border-l-4 border-l-red-400';
  if (score > 30) return 'border-l-4 border-l-emerald-400';
  return 'border-l-4 border-l-gray-200';
};

/* ── Component ───────────────────────────────────────────────────── */

const IntelligenceHub = () => {
  const avgSentiment = Math.round(
    sentimentTopics.reduce((sum, t) => sum + t.score, 0) / sentimentTopics.length
  );

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-1">Employee Sentiment Analysis</h2>
        <p className="text-sm text-gray-500 font-light">
          Sentiment scored from &minus;100 (Negative) to +100 (Positive).
        </p>
      </div>

      {/* ── Section 1: Sentiment by Topic ─────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp size={16} className="text-maersk-blue" /> Sentiment by Topic
        </h3>

        <div className="space-y-5">
          {sentimentTopics.map((item) => {
            const pct = Math.abs(item.score);
            const isNeg = item.score < 0;
            return (
              <div key={item.topic} className="flex items-center gap-4">
                {/* Label */}
                <div className="w-48 shrink-0 text-sm font-semibold text-gray-800 text-right">
                  {item.topic}
                </div>

                {/* Bar container — centre baseline */}
                <div className="flex-1 flex items-center h-8">
                  {/* Negative side */}
                  <div className="flex-1 flex justify-end">
                    {isNeg && (
                      <div
                        className="h-7 rounded-l-sm"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: sentimentColour(item.score),
                          opacity: 0.85,
                        }}
                      />
                    )}
                  </div>

                  {/* Centre line */}
                  <div className="w-px h-8 bg-gray-300 shrink-0" />

                  {/* Positive side */}
                  <div className="flex-1 flex justify-start">
                    {!isNeg && (
                      <div
                        className="h-7 rounded-r-sm"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: sentimentColour(item.score),
                          opacity: 0.85,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Score badge */}
                <div className={`w-14 shrink-0 text-center text-xs font-bold px-2 py-1 rounded-sm border ${sentimentBg(item.score)}`}>
                  {item.score > 0 ? '+' : ''}{item.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale labels */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="w-48 shrink-0" />
          <div className="flex-1 flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><TrendingDown size={10} /> Negative</span>
            <span>0</span>
            <span className="flex items-center gap-1">Positive <TrendingUp size={10} /></span>
          </div>
          <div className="w-14 shrink-0" />
        </div>
      </div>

      {/* ── Section 2: Donut + Summary Stats ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary stats */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MessageSquare size={16} className="text-maersk-blue" /> Summary
          </h3>
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Total Conversations</span>
              <span className="text-lg font-bold text-gray-900">247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Average Sentiment</span>
              <span className={`text-lg font-bold ${avgSentiment >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {avgSentiment > 0 ? '+' : ''}{avgSentiment}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Escalation Rate</span>
              <span className="text-lg font-bold text-amber-600">8.1%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Flagged This Week</span>
              <span className="text-lg font-bold text-red-500">5</span>
            </div>
          </div>
        </div>

        {/* Most discussed topics donut */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Query Analytics</h3>
          <p className="text-[11px] text-gray-500 mb-4 uppercase tracking-widest">Most Discussed Topics</p>

          <div className="flex items-center gap-8">
            <div className="w-[200px] h-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
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
            </div>

            <div className="flex-1 space-y-3">
              {topicData.map((topic) => (
                <div key={topic.name} className="flex justify-between items-center">
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

      {/* ── Section 3: Flagged Conversations Table ────────────────── */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Recent Flagged Conversations
          </h3>
          <span className="text-xs text-gray-500">{flaggedConversations.length} flagged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-6 py-3">Topic</th>
                <th className="text-left px-6 py-3">Sentiment</th>
                <th className="text-left px-6 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flaggedConversations.map((row) => (
                <tr key={row.id} className={`${borderLeft(row.sentiment)} hover:bg-gray-50 transition-colors`}>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-800 whitespace-nowrap">{row.topic}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-sm border ${sentimentBg(row.sentiment)}`}>
                      {row.sentiment > 0 ? '+' : ''}{row.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 leading-relaxed">{row.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceHub;
