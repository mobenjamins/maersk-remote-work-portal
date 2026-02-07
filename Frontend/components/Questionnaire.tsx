import React, { useState, useMemo } from 'react';
import { User, createRequest } from '../services/api';
import { CountryAutocomplete } from './CountryAutocomplete';
import { isCountryBlocked, getBlockReason } from '../data/blockedCountries';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  User as UserIcon, 
  CheckCircle, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  Calendar,
  Briefcase,
  X,
  FileText
} from 'lucide-react';

interface QuestionnaireProps {
  user?: User | null;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    entity: user?.maersk_entity || '',
    homeCountry: user?.home_country || '',
    destination: '',
    startDate: '',
    endDate: '',
    hasRightToWork: '',
    isSalesRole: user?.is_sales_role ? 'yes' : ''
  });
  const [result, setResult] = useState<'idle' | 'approved' | 'rejected' | 'escalated'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if destination is blocked
  const isDestinationBlocked = useMemo(() => {
    return formData.destination ? isCountryBlocked(formData.destination) : false;
  }, [formData.destination]);

  const destinationBlockReason = useMemo(() => {
    return formData.destination ? getBlockReason(formData.destination) : null;
  }, [formData.destination]);

  // Calculate workdays between dates
  const workdays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return 0;
    
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [formData.startDate, formData.endDate]);

  const remainingAfter = useMemo(() => {
    const current = user?.days_remaining ?? 20;
    return Math.max(0, current - workdays);
  }, [user?.days_remaining, workdays]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setResult('idle');
  };

  const handleCountryChange = (field: 'homeCountry' | 'destination') => (value: string) => {
    setFormData({ ...formData, [field]: value });
    setResult('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const request = await createRequest({
        maersk_entity: formData.entity,
        home_country: formData.homeCountry,
        destination_country: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        has_right_to_work: formData.hasRightToWork === 'yes',
        is_sales_role: formData.isSalesRole === 'yes',
      });

      setReferenceNumber(request.reference_number);
      
      if (request.status === 'approved') {
        setResult('approved');
        setResultMessage("Your trip matches our safe harbor criteria. An automated confirmation email has been sent.");
      } else if (request.status === 'escalated') {
        setResult('escalated');
        setResultMessage("Your request requires manual review by the Global Mobility team. You will be contacted within 2 business days.");
      } else {
        setResult('rejected');
        setResultMessage((request as any).decision_reason || "One or more compliance criteria were not met.");
      }
    } catch (error: any) {
      setResult('rejected');
      setResultMessage(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isStep1Valid = formData.destination && formData.startDate && formData.endDate && workdays > 0 && !isDestinationBlocked;
  const isStep2Valid = formData.entity && formData.homeCountry && formData.isSalesRole;
  const isStep3Valid = formData.hasRightToWork;

  return (
    <div className="bg-white rounded-sm shadow-xl border border-gray-200 h-full flex flex-col overflow-hidden max-w-4xl mx-auto">
       {/* Wizard Progress Header */}
       <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { num: 1, label: 'Trip Basics', icon: Plane },
              { num: 2, label: 'Employment', icon: Briefcase },
              { num: 3, label: 'Review', icon: ShieldCheck }
            ].map((s) => (
              <div key={s.num} className={`flex items-center gap-2 transition-all ${step === s.num ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                  step > s.num ? 'bg-emerald-500 border-emerald-500 text-white' : 
                  step === s.num ? 'bg-maersk-blue border-maersk-blue text-white' : 'border-gray-200 text-gray-400'
                }`}>
                  {step > s.num ? <CheckCircle size={14} /> : s.num}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest hidden sm:inline ${step === s.num ? 'text-maersk-dark' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {s.num < 3 && <ChevronRight size={14} className="text-gray-200 ml-2" />}
              </div>
            ))}
          </div>
          <button onClick={() => window.location.reload()} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={20} />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30">
        <AnimatePresence mode="wait">
          {result !== 'idle' ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className={`p-8 rounded-sm border-t-4 shadow-lg bg-white ${
                result === 'approved' ? 'border-emerald-500' : 
                result === 'escalated' ? 'border-orange-500' : 'border-red-500'
              }`}>
                <div className="flex items-start gap-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    result === 'approved' ? 'bg-emerald-50 text-emerald-500' : 
                    result === 'escalated' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'
                  }`}>
                    {result === 'approved' ? <CheckCircle size={32} /> : 
                     result === 'escalated' ? <AlertCircle size={32} /> : <XCircle size={32} />}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-2xl font-light text-gray-900 leading-tight">
                        {result === 'approved' ? 'Application Approved' : 
                         result === 'escalated' ? 'Further Review Required' : 'Compliance Warning'}
                      </h4>
                      {referenceNumber && (
                        <p className="text-[10px] font-bold text-maersk-blue uppercase tracking-[0.2em] mt-1">Ref: {referenceNumber}</p>
                      )}
                    </div>
                    <p className="text-gray-600 leading-relaxed">{resultMessage}</p>
                    <div className="pt-6 flex gap-3 border-t border-gray-100">
                      <button 
                        onClick={() => window.location.reload()}
                        className="flex-1 py-3 px-6 bg-maersk-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-maersk-deep transition-all rounded-sm"
                      >
                        Return to Dashboard
                      </button>
                      {result === 'approved' && (
                        <button className="flex-1 py-3 px-6 border border-maersk-blue text-maersk-blue text-xs font-bold uppercase tracking-widest hover:bg-blue-50 transition-all rounded-sm">
                          Email Confirmation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-light text-gray-900">Trip Basics</h2>
                    <p className="text-sm text-gray-500">Select where and when you plan to work remotely.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination Country</label>
                        <CountryAutocomplete
                          value={formData.destination}
                          onChange={handleCountryChange('destination')}
                          placeholder="Where are you going?"
                          required
                        />
                        {isDestinationBlocked && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm text-red-600 text-xs font-medium animate-shake">
                            <AlertCircle size={14} />
                            <span>Cannot submit: {destinationBlockReason === 'sanctions' ? 'Sanctioned Country' : 'No legal Maersk entity'}</span>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:ring-1 focus:ring-maersk-blue outline-none transition-all shadow-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:ring-1 focus:ring-maersk-blue outline-none transition-all shadow-sm" />
                      </div>
                    </div>

                    {/* Live Balance Impact */}
                    {workdays > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm space-y-4"
                      >
                         <div className="flex justify-between items-end">
                            <div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impact Analysis</div>
                                <div className="text-xl font-light text-gray-900">
                                    {workdays} <span className="text-sm text-gray-400">working days requested</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">New Balance</div>
                                <div className={`text-xl font-bold ${remainingAfter < 5 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {remainingAfter}d <span className="text-[10px] text-gray-400 font-normal">left</span>
                                </div>
                            </div>
                         </div>
                         <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-maersk-blue" style={{ width: `${(workdays / 20) * 100}%` }}></div>
                         </div>
                         {workdays > 20 && (
                           <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                             <AlertCircle size={12} /> Limit Exceeded: Max 20 days per year
                           </p>
                         )}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                   <div className="space-y-1">
                    <h2 className="text-2xl font-light text-gray-900">Employment Details</h2>
                    <p className="text-sm text-gray-500">Confirm your current corporate profile.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maersk Entity</label>
                        <input name="entity" value={formData.entity} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:ring-1 focus:ring-maersk-blue outline-none" placeholder="e.g. Maersk A/S" />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Home Country</label>
                        <CountryAutocomplete value={formData.homeCountry} onChange={handleCountryChange('homeCountry')} placeholder="Employment Country" />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-sm font-semibold text-gray-800">Are you in a Sales role with contract signing authority?</label>
                        <div className="flex gap-4">
                           {['yes', 'no'].map(opt => (
                             <button
                                key={opt}
                                onClick={() => setFormData({...formData, isSalesRole: opt})}
                                className={`flex-1 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all border ${
                                  formData.isSalesRole === opt ? 'bg-maersk-dark border-maersk-dark text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-maersk-blue'
                                }`}
                             >
                               {opt === 'yes' ? 'Yes, I am' : 'No, I am not'}
                             </button>
                           ))}
                        </div>
                        {formData.isSalesRole === 'yes' && (
                          <p className="text-[10px] text-orange-600 font-medium italic">
                            * Sales roles often require manual tax review (Escalation).
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                   <div className="space-y-1">
                    <h2 className="text-2xl font-light text-gray-900">Final Verification</h2>
                    <p className="text-sm text-gray-500">Confirm your work rights and submit.</p>
                  </div>

                  <div className="space-y-6 bg-white border border-gray-200 p-8 rounded-sm shadow-sm">
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-800 leading-relaxed block">
                           I confirm that I have the legal right to work in <span className="text-maersk-blue underline underline-offset-4">{formData.destination}</span> (e.g. Citizenship, Residency, or Work Visa).
                        </label>
                        <div className="flex gap-4">
                           {['yes', 'no'].map(opt => (
                             <button
                                key={opt}
                                onClick={() => setFormData({...formData, hasRightToWork: opt})}
                                className={`flex-1 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all border ${
                                  formData.hasRightToWork === opt ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-500'
                                }`}
                             >
                               {opt === 'yes' ? 'I Confirm' : 'I Do Not'}
                             </button>
                           ))}
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Summary</h4>
                        <div className="grid grid-cols-2 gap-y-3">
                           <div className="text-xs text-gray-500">Destination</div>
                           <div className="text-xs font-bold text-gray-900 text-right">{formData.destination}</div>
                           <div className="text-xs text-gray-500">Dates</div>
                           <div className="text-xs font-bold text-gray-900 text-right">{formData.startDate} to {formData.endDate}</div>
                           <div className="text-xs text-gray-500">Duration</div>
                           <div className="text-xs font-bold text-maersk-blue text-right">{workdays} Working Days</div>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                <button 
                  onClick={prevStep} 
                  disabled={step === 1}
                  className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    step === 1 ? 'opacity-0' : 'text-gray-400 hover:text-maersk-dark'
                  }`}
                >
                  <ChevronLeft size={16} /> Back
                </button>
                
                {step < 3 ? (
                  <button 
                    onClick={nextStep}
                    disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                    className="flex items-center gap-2 bg-maersk-dark text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-maersk-deep disabled:opacity-30 transition-all shadow-lg"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={loading || !isStep3Valid || formData.hasRightToWork === 'no'}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-30 transition-all shadow-xl shadow-emerald-500/20"
                  >
                    {loading ? 'Submitting...' : 'Submit Final Request'} <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
