import { useEffect, useState, useRef } from 'react';
import { listPolicyDocuments, uploadPolicyDocument, publishPolicyDocument } from '../services/api';
import type { PolicyDocument } from '../types';
import { Upload, FileText, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

/* ── Document Column Component ───────────────────────────────────── */

interface DocColumnProps {
  title: string;
  docType: 'policy' | 'faq';
  docs: PolicyDocument[];
  onUpload: (docType: 'policy' | 'faq', file: File, notes: string) => Promise<void>;
  onPublish: (id: string, docType: 'policy' | 'faq') => Promise<void>;
  uploading: boolean;
}

const DocColumn = ({ title, docType, docs, onUpload, onPublish, uploading }: DocColumnProps) => {
  const [notes, setNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const published = docs.find((d) => d.status === 'published');
  const latestDraft = docs.find((d) => d.status === 'draft');
  const current = published || docs[0];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(docType, file, notes);
    setNotes('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
      {/* Column header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <FileText size={16} className="text-maersk-blue" /> {title}
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Current version info */}
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current Version</div>
          {current ? (
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm border ${
                  current.status === 'published'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                v{current.version} &mdash; {current.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <span className="text-xs text-gray-500">{current.file.split('/').pop()}</span>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No documents uploaded yet.</div>
          )}
        </div>

        {/* Upload new version */}
        <div className="border border-dashed border-gray-300 rounded-sm p-5 space-y-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Upload size={12} /> Upload New Version
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileSelect}
            className="block w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-maersk-blue file:text-white hover:file:bg-maersk-blue/90 file:cursor-pointer file:transition-all"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Version notes (optional)..."
            className="w-full text-xs border border-gray-200 rounded-sm p-3 focus:outline-none focus:ring-1 focus:ring-maersk-blue min-h-[60px] resize-none"
          />

          {uploading && (
            <div className="text-[10px] text-maersk-blue font-bold uppercase tracking-widest animate-pulse">
              Uploading...
            </div>
          )}
        </div>

        {/* Publish button */}
        {latestDraft && (
          <button
            onClick={() => onPublish(latestDraft.id, docType)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-maersk-blue text-white rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-maersk-blue/90 transition-all shadow-lg shadow-maersk-blue/20"
          >
            <CheckCircle size={14} /> Publish Latest Draft (v{latestDraft.version})
          </button>
        )}

        {/* Version history */}
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={12} /> Version History
          </div>

          {docs.length > 0 ? (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-700">v{doc.version}</span>
                    <span className="text-[10px] text-gray-300">&middot;</span>
                    <span className="text-xs text-gray-500 truncate max-w-[140px]">
                      {doc.file.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${
                        doc.status === 'published'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}
                    >
                      {doc.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(doc.uploaded_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic py-2">No versions uploaded.</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main PolicyEditor Component ─────────────────────────────────── */

const PolicyEditor = () => {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [faqs, setFaqs] = useState<PolicyDocument[]>([]);
  const [uploadingPolicy, setUploadingPolicy] = useState(false);
  const [uploadingFaq, setUploadingFaq] = useState(false);

  useEffect(() => {
    listPolicyDocuments('policy')
      .then(setPolicies)
      .catch(() => {
        // Mock data for demo
        setPolicies([
          {
            id: 'p3',
            doc_type: 'policy',
            file: '/media/policies/sirw-policy-v3.pdf',
            version: 3,
            status: 'published',
            notes: 'Updated role restrictions and duration limits',
            uploaded_by_email: 'admin@maersk.com',
            uploaded_at: '2026-02-01T10:00:00Z',
          },
          {
            id: 'p2',
            doc_type: 'policy',
            file: '/media/policies/sirw-policy-v2.pdf',
            version: 2,
            status: 'published',
            notes: 'Added right to work clause',
            uploaded_by_email: 'admin@maersk.com',
            uploaded_at: '2025-11-15T09:00:00Z',
          },
          {
            id: 'p1',
            doc_type: 'policy',
            file: '/media/policies/sirw-policy-v1.pdf',
            version: 1,
            status: 'published',
            notes: 'Initial policy document',
            uploaded_by_email: 'admin@maersk.com',
            uploaded_at: '2025-08-01T08:00:00Z',
          },
        ]);
      });

    listPolicyDocuments('faq')
      .then(setFaqs)
      .catch(() => {
        // Mock data for demo
        setFaqs([
          {
            id: 'f2',
            doc_type: 'faq',
            file: '/media/faqs/sirw-faq-v2.pdf',
            version: 2,
            status: 'published',
            notes: 'Added visa and tax questions',
            uploaded_by_email: 'admin@maersk.com',
            uploaded_at: '2026-01-20T14:00:00Z',
          },
          {
            id: 'f1',
            doc_type: 'faq',
            file: '/media/faqs/sirw-faq-v1.pdf',
            version: 1,
            status: 'published',
            notes: 'Initial FAQ document',
            uploaded_by_email: 'admin@maersk.com',
            uploaded_at: '2025-09-10T11:00:00Z',
          },
        ]);
      });
  }, []);

  const handleUpload = async (docType: 'policy' | 'faq', file: File, notes: string) => {
    const setUploading = docType === 'policy' ? setUploadingPolicy : setUploadingFaq;
    const setDocs = docType === 'policy' ? setPolicies : setFaqs;
    setUploading(true);
    try {
      const uploaded = await uploadPolicyDocument(docType, file, notes);
      setDocs((prev) => [uploaded, ...prev]);
    } catch {
      // In demo mode, create a mock uploaded doc
      const docs = docType === 'policy' ? policies : faqs;
      const nextVersion = docs.length > 0 ? Math.max(...docs.map((d) => d.version)) + 1 : 1;
      const mockDoc: PolicyDocument = {
        id: `${docType}-${Date.now()}`,
        doc_type: docType,
        file: `/media/${docType}s/${file.name}`,
        version: nextVersion,
        status: 'draft',
        notes: notes || undefined,
        uploaded_by_email: 'admin@maersk.com',
        uploaded_at: new Date().toISOString(),
      };
      setDocs((prev) => [mockDoc, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (id: string, docType: 'policy' | 'faq') => {
    const setDocs = docType === 'policy' ? setPolicies : setFaqs;
    try {
      const published = await publishPolicyDocument(id);
      setDocs((prev) =>
        prev.map((p) => (p.id === id ? published : { ...p, status: 'draft' as const }))
      );
    } catch {
      // In demo mode, just flip the status locally
      setDocs((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'published' as const }
            : { ...p, status: 'draft' as const }
        )
      );
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-1">Policy Governance</h2>
        <p className="text-sm text-gray-500 font-light">
          Upload and manage policy documents and FAQ files for the Mira agent.
        </p>
      </div>

      {/* Governance status bar */}
      <div className="bg-white border border-gray-200 rounded-sm px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShieldCheck size={18} className="text-maersk-blue" />
          <div className="text-xs">
            <span className="font-bold text-gray-500 uppercase tracking-wider">Policy: </span>
            <span className="font-bold text-gray-900">v{policies.find((p) => p.status === 'published')?.version || '—'}</span>
            <span className="text-gray-300 mx-2">&middot;</span>
            <span className="font-bold text-gray-500 uppercase tracking-wider">FAQ: </span>
            <span className="font-bold text-gray-900">v{faqs.find((f) => f.status === 'published')?.version || '—'}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-sm border border-emerald-100 uppercase tracking-wider">
          Compliant
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <DocColumn
          title="Policy Document"
          docType="policy"
          docs={policies}
          onUpload={handleUpload}
          onPublish={handlePublish}
          uploading={uploadingPolicy}
        />
        <DocColumn
          title="FAQ Document"
          docType="faq"
          docs={faqs}
          onUpload={handleUpload}
          onPublish={handlePublish}
          uploading={uploadingFaq}
        />
      </div>
    </div>
  );
};

export default PolicyEditor;
