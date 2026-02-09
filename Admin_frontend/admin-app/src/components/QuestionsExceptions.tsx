import { useEffect, useState } from 'react';
import { listMiraQuestions } from '../services/api';
import type { MiraQuestion } from '../types';
import { MessageSquare, ChevronDown, ChevronUp, Edit3, Check, X, Clock, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type FilterTab = 'all' | 'open' | 'answered';

const QuestionsExceptions = () => {
  const [questions, setQuestions] = useState<MiraQuestion[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    listMiraQuestions()
      .then(setQuestions)
      .catch(() => {
        // Use mock data for demo
        setQuestions([
          {
            id: '1',
            user_email: 'elena.v@maersk.com',
            question_text: 'Can I work remotely from Spain for 15 days while on a Schengen visa?',
            answer_text: 'Yes, under the SIRW policy you may work remotely for up to 20 working days per calendar year. A Schengen visa permits short stays, but please ensure you hold a valid right to work. Spain is an eligible destination.',
            context_country: 'Spain',
            linked_policy_section: 'Duration Limits',
            answered: true,
            created_at: '2026-02-06T09:15:00Z',
          },
          {
            id: '2',
            user_email: 'marcus.t@maersk.com',
            question_text: 'I have contract signing authority as a Sales Director — am I excluded from remote work in France?',
            answer_text: 'Yes, roles with sales contract signing authority are currently excluded from the SIRW programme due to Permanent Establishment (PE) risk. This applies regardless of the destination country.',
            context_country: 'France',
            linked_policy_section: 'Role Restrictions',
            answered: true,
            created_at: '2026-02-05T14:30:00Z',
          },
          {
            id: '3',
            user_email: 'sarah.l@maersk.com',
            question_text: 'Do weekends count towards the 20-day annual limit for remote work in Canada?',
            answer_text: '',
            context_country: 'Canada',
            linked_policy_section: 'Duration Limits',
            answered: false,
            created_at: '2026-02-07T11:00:00Z',
          },
          {
            id: '4',
            user_email: 'jacob.w@maersk.com',
            question_text: 'What documents do I need to prove right to work in Germany?',
            answer_text: 'You will need a valid passport and, if applicable, a work permit or EU residence card. As an EU/EEA national you have automatic right to work. Non-EU nationals should check with HR for visa sponsorship eligibility.',
            context_country: 'Germany',
            linked_policy_section: 'Right to Work',
            answered: true,
            created_at: '2026-02-04T08:45:00Z',
          },
          {
            id: '5',
            user_email: 'anna.k@maersk.com',
            question_text: 'Can I split my 20 days across multiple countries in one calendar year?',
            answer_text: 'Yes, the 20-day limit is per calendar year, not per destination. You may split your days across multiple countries provided each trip is individually assessed for compliance.',
            context_country: 'Multiple',
            linked_policy_section: 'Duration Limits',
            answered: true,
            created_at: '2026-02-03T16:20:00Z',
          },
          {
            id: '6',
            user_email: 'raj.p@maersk.com',
            question_text: 'Is there an exception process for exceeding the 20-day limit?',
            answer_text: '',
            context_country: 'India',
            linked_policy_section: 'Duration Limits',
            answered: false,
            created_at: '2026-02-07T13:10:00Z',
          },
          {
            id: '7',
            user_email: 'lisa.m@maersk.com',
            question_text: 'Does the policy cover contractors or only permanent employees?',
            answer_text: 'The SIRW policy applies only to permanent employees who have completed their probation period. Contractors and temporary staff are not eligible.',
            context_country: 'Netherlands',
            linked_policy_section: 'Eligibility Scope',
            answered: true,
            created_at: '2026-02-02T10:05:00Z',
          },
        ]);
      });
  }, []);

  const filtered = questions
    .filter((q) => {
      if (filter === 'open') return !q.answered;
      if (filter === 'answered') return q.answered;
      return true;
    })
    .filter((q) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.question_text.toLowerCase().includes(query) ||
        q.user_email.toLowerCase().includes(query) ||
        q.context_country.toLowerCase().includes(query)
      );
    });

  const totalCount = questions.length;
  const answeredCount = questions.filter((q) => q.answered).length;
  const openCount = questions.filter((q) => !q.answered).length;

  const topTopics = questions.reduce<Record<string, number>>((acc, q) => {
    const section = q.linked_policy_section || 'General';
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {});
  const sortedTopics = Object.entries(topTopics).sort((a, b) => b[1] - a[1]);

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEditingId(null);
  };

  const startEdit = (q: MiraQuestion) => {
    setEditingId(q.id);
    setEditText(q.answer_text);
  };

  const saveEdit = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, answer_text: editText, answered: true } : q
      )
    );
    setEditingId(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'open', label: 'Open', count: openCount },
    { key: 'answered', label: 'Answered', count: answeredCount },
  ];

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-1">Questions & Answers</h2>
        <p className="text-sm text-gray-500 font-light">
          Conversations between employees and Mira, the AI policy assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — Question list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter tabs + search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-sm border border-gray-200">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${
                    filter === tab.key
                      ? 'bg-white text-maersk-blue shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-maersk-blue w-56"
              />
            </div>
          </div>

          {/* Question cards */}
          <div className="space-y-3">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden"
              >
                {/* Question row */}
                <button
                  onClick={() => handleExpand(q.id)}
                  className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                      {q.question_text}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                      <span>{q.user_email}</span>
                      <span className="text-gray-300">&middot;</span>
                      <span>{q.context_country || 'Not specified'}</span>
                      <span className="text-gray-300">&middot;</span>
                      <span>{formatDate(q.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm ${
                        q.answered
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {q.answered ? 'Answered' : 'Open'}
                    </span>
                    {expandedId === q.id ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded thread */}
                <AnimatePresence>
                  {expandedId === q.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-2 border-t border-gray-100 space-y-4">
                        {/* Employee message */}
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0 mt-0.5">
                            {q.user_email[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                              {q.user_email}
                            </div>
                            <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-sm p-3 border border-gray-100">
                              {q.question_text}
                            </div>
                          </div>
                        </div>

                        {/* Mira response */}
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-maersk-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                            <MessageSquare size={14} className="text-maersk-blue" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-[10px] font-bold text-maersk-blue uppercase tracking-wider">
                                Mira (AI Assistant)
                              </div>
                              {q.answered && editingId !== q.id && (
                                <button
                                  onClick={() => startEdit(q)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-maersk-blue uppercase tracking-wider transition-colors"
                                >
                                  <Edit3 size={12} /> Edit Answer
                                </button>
                              )}
                            </div>

                            {editingId === q.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full bg-white border border-maersk-blue/30 rounded-sm p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-maersk-blue min-h-[100px]"
                                  placeholder="Type the corrected answer..."
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 uppercase tracking-widest"
                                  >
                                    <X size={12} /> Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEdit(q.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-white bg-maersk-blue rounded-sm hover:bg-maersk-blue/90 uppercase tracking-widest"
                                  >
                                    <Check size={12} /> Save
                                  </button>
                                </div>
                              </div>
                            ) : q.answered ? (
                              <div className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 rounded-sm p-3 border border-blue-100/50">
                                {q.answer_text}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic bg-gray-50 rounded-sm p-3 border border-gray-100 flex items-center gap-2">
                                <Clock size={14} /> Awaiting response...
                                <button
                                  onClick={() => startEdit(q)}
                                  className="ml-auto flex items-center gap-1 text-[10px] font-bold text-maersk-blue uppercase tracking-wider hover:underline"
                                >
                                  <Edit3 size={12} /> Write Answer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Policy section tag */}
                        {q.linked_policy_section && (
                          <div className="pl-10">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">
                              Policy: {q.linked_policy_section}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-500">
                No questions match the current filter.
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Stats */}
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <CheckCircle size={12} className="text-maersk-blue" /> Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Total Questions</span>
                <span className="text-lg font-bold text-gray-900">{totalCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Answered</span>
                <span className="text-lg font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Open</span>
                <span className="text-lg font-bold text-amber-600">{openCount}</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Avg Response Time</span>
                <span className="text-sm font-bold text-gray-900">2.4 hrs</span>
              </div>
            </div>
          </div>

          {/* Most common topics */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <MessageSquare size={12} className="text-maersk-blue" /> Most Common Topics
            </h3>
            <div className="space-y-3">
              {sortedTopics.map(([topic, count]) => (
                <div key={topic} className="flex justify-between items-center">
                  <span className="text-xs text-gray-700 font-medium">{topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-maersk-blue rounded-full"
                        style={{ width: `${(count / totalCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsExceptions;
