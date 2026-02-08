import { useEffect, useState } from 'react';
import { listMiraQuestions, listPolicyDocuments, uploadPolicyDocument, publishPolicyDocument, getAdminRequests } from '../services/api';
import type { MiraQuestion, PolicyDocument, AdminRequest } from '../types';
import { FileText, AlertTriangle, MessageSquare } from 'lucide-react';

const QuestionsExceptions = () => {
  const [questions, setQuestions] = useState<MiraQuestion[]>([]);
  const [exceptions, setExceptions] = useState<AdminRequest[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [faqs, setFaqs] = useState<PolicyDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    listMiraQuestions().then(setQuestions).catch(() => setQuestions([]));
    listPolicyDocuments('policy').then(setPolicies).catch(() => setPolicies([]));
    listPolicyDocuments('faq').then(setFaqs).catch(() => setFaqs([]));
    getAdminRequests({ decision_status: 'needs_review' }).then(setExceptions).catch(() => setExceptions([]));
  }, []);

  const latest = (docs: PolicyDocument[]) => docs.find((d) => d.status === 'published') || docs[0];

  const handleUpload = async (docType: 'policy' | 'faq', files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploading(true);
    try {
      const uploaded = await uploadPolicyDocument(docType, files[0], note);
      if (docType === 'policy') setPolicies([uploaded, ...policies]);
      else setFaqs([uploaded, ...faqs]);
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (id: string, docType: 'policy' | 'faq') => {
    const published = await publishPolicyDocument(id);
    if (docType === 'policy') {
      setPolicies((prev) => prev.map((p) => (p.id === id ? published : { ...p, status: 'draft' })));
    } else {
      setFaqs((prev) => prev.map((p) => (p.id === id ? published : { ...p, status: 'draft' })));
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Questions & Exceptions</h2>
          <p className="text-sm text-gray-500 font-light">Monitor Mira queries, exception requests, and manage FAQs/Policy files.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <MessageSquare size={12} /> Mira Questions
            </h3>
            <span className="text-xs text-gray-500">{questions.length} total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {questions.slice(0, 8).map((q) => (
              <div key={q.id} className="px-6 py-4 flex justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{q.question_text}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {q.user_email} • {q.context_country || 'Not specified'}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm ${q.answered ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                  {q.answered ? 'Answered' : 'Open'}
                </span>
              </div>
            ))}
            {questions.length === 0 && <div className="p-6 text-sm text-gray-500">No questions logged yet.</div>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <FileText size={12} /> Knowledge Files
          </h3>
          {[
            { label: 'Policy', docs: policies, type: 'policy' as const },
            { label: 'FAQ', docs: faqs, type: 'faq' as const },
          ].map(({ label, docs, type }) => (
            <div key={type} className="border border-gray-100 rounded-sm p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">{label}</div>
                  <div className="text-sm font-semibold text-gray-900">{latest(docs)?.file?.split('/').pop() || 'No file'}</div>
                  <div className="text-[11px] text-gray-500">
                    v{latest(docs)?.version || '-'} • {latest(docs)?.status || '—'}
                  </div>
                </div>
                <input type="file" onChange={(e) => handleUpload(type, e.target.files)} className="text-[10px]" />
              </div>
              <div className="flex gap-2 items-center text-[10px]">
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-sm px-2 py-1 text-xs"
                />
                <button
                  onClick={() => latest(docs)?.id && handlePublish(latest(docs)!.id, type)}
                  className="px-3 py-1 bg-maersk-blue text-white rounded-sm text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                  disabled={!latest(docs)}
                >
                  Publish
                </button>
              </div>
              <div className="space-y-1">
                {docs.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex justify-between text-[11px] text-gray-600">
                    <span>
                      v{doc.version} • {doc.file.split('/').pop()}
                    </span>
                    <span className={`uppercase font-bold ${doc.status === 'published' ? 'text-emerald-600' : 'text-amber-600'}`}>{doc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {uploading && <div className="text-xs text-gray-500">Uploading...</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <AlertTriangle size={12} /> Exception Requests (Needs Review)
          </h3>
          <span className="text-xs text-gray-500">{exceptions.length} cases</span>
        </div>
        <div className="divide-y divide-gray-100">
          {exceptions.slice(0, 6).map((ex) => (
            <div key={ex.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-900">{ex.user_name}</div>
                <div className="text-[11px] text-gray-500">
                  {ex.home_country} → {ex.destination_country}
                </div>
                <div className="text-[11px] text-gray-500 italic">{ex.exception_reason || ex.decision_reason}</div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-amber-50 text-amber-700 border border-amber-100">
                Needs Review
              </span>
            </div>
          ))}
          {exceptions.length === 0 && <div className="p-6 text-sm text-gray-500">No pending exceptions.</div>}
        </div>
      </div>
    </div>
  );
};

export default QuestionsExceptions;
