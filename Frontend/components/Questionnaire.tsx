import React, { useState, useEffect } from 'react';
import { User, submitSIRWRequest, checkDateOverlap, getSIRWAnnualBalance, AnnualBalanceResponse, extractApprovalFromFile } from '../services/api';
import { RequestFormData } from '../types';
import { CountryAutocomplete } from './CountryAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, UploadCloud, Calendar, ShieldCheck, ChevronRight, AlertTriangle, FileText } from 'lucide-react';

interface QuestionnaireProps {
  user?: User | null;
  onDataChange?: (data: RequestFormData) => void;
  onStepChange?: (step: number) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ user, onDataChange, onStepChange }) => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<'idle' | 'approved' | 'rejected' | 'escalated'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [annualBalance, setAnnualBalance] = useState<AnnualBalanceResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    managerEmail?: string;
    destinationCountry?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const [formData, setFormData] = useState<RequestFormData & { additionalNotes?: string }>({
    firstName: '',
    lastName: '',
    homeCountry: '',
    managerName: '',
    managerEmail: '',
    destinationCountry: '',
    startDate: '',
    endDate: '',
    rightToWork: false,
    noRestrictedRoles: false,
    additionalNotes: '',
  });

  // Safe pre-population
  useEffect(() => {
    if (user && user.email) {
      try {
        const parts = user.email.split('@')[0].split('.');
        setFormData(prev => {
            if (prev.firstName) return prev;
            return {
                ...prev,
                firstName: user.first_name || (parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : ''),
                lastName: user.last_name || (parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''),
                homeCountry: user.home_country || prev.homeCountry,
            };
        });
      } catch (e) {
        console.warn("Error parsing user email for name:", e);
      }
    }
  }, [user]);

  useEffect(() => { if (onDataChange) onDataChange(formData); }, [formData, onDataChange]);
  useEffect(() => { if (onStepChange) onStepChange(step); }, [step, onStepChange]);

  useEffect(() => {
    getSIRWAnnualBalance().then(setAnnualBalance).catch(() => setAnnualBalance(null));
  }, []);

  const isWorkday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;

  const countWorkdays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      if (isWorkday(current)) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Logic Fix: Respect remaining balance
  const getMaxEndDate = () => {
    if (!formData.startDate) return undefined;
    const date = new Date(formData.startDate);
    
    // Default to 20 if balance is null, otherwise use actual remaining balance
    const daysAllowed = annualBalance ? annualBalance.days_remaining : 20;
    // Hard cap at 20 even if balance somehow says more (policy limit per trip?)
    // Policy says "max 20 workdays in a calendar year".
    // If they have 0 remaining, they can't book anything (handled by validation),
    // but the picker should visually stop at 0 days from start? No, user might want to request exception.
    // Let's cap at 20 for the visual helper, but warn if exceeding balance.
    
    let workdays = 0;
    // We calculate the date for 20 workdays to show the absolute policy limit
    while (workdays < 20) {
      if (isWorkday(date)) workdays += 1;
      if (workdays === 20) break;
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (['managerEmail', 'destinationCountry', 'startDate', 'endDate'].includes(field)) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsAnalyzing(true);
      setUploadError('');

      try {
        const data = await extractApprovalFromFile(file);
        
        setFormData(prev => {
            const newData = { ...prev };
            if (data.managerName) newData.managerName = data.managerName;
            if (data.managerEmail) newData.managerEmail = data.managerEmail;
            if (data.employeeName) {
                const parts = data.employeeName.trim().split(/\s+/);
                if (parts.length >= 2) {
                    newData.firstName = parts[0];
                    newData.lastName = parts.slice(1).join(' ');
                }
            }
            if (data.homeCountry) newData.homeCountry = data.homeCountry;
            return newData;
        });

        if (!data.managerName && !data.managerEmail) {
          setUploadError('Could not auto-fill details. Please enter manually.');
        }
      } catch (error) {
        console.error("Extraction failed", error);
        setUploadError('Extraction failed. Please enter details manually.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const validateAndNext = () => {
    if (step === 1) {
      const errors: typeof validationErrors = {};
      if (!formData.managerEmail) errors.managerEmail = 'Manager email is required.';
      else if (!isValidEmail(formData.managerEmail)) errors.managerEmail = 'Invalid email format.';
      
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const errors: typeof validationErrors = {};
      if (!formData.destinationCountry) errors.destinationCountry = 'Destination is required.';
      if (!formData.startDate) errors.startDate = 'Start date is required.';
      if (!formData.endDate) errors.endDate = 'End date is required.';
      if (formData.startDate && formData.endDate) {
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
          errors.endDate = 'End date cannot be before start date.';
        }
      }
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');

    try {
      const nameParts = (formData.managerName || '').trim().split(/\s+/);
      const managerFirstName = nameParts[0] || '';
      const managerLastName = nameParts.length > 1 ? nameParts.slice(-1)[0] : '';
      const managerMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

      const response = await submitSIRWRequest({
        destination_country: formData.destinationCountry,
        start_date: formData.startDate,
        end_date: formData.endDate,
        has_right_to_work: formData.rightToWork,
        confirmed_role_eligible: formData.noRestrictedRoles,
        manager_first_name: managerFirstName,
        manager_last_name: managerLastName,
        manager_middle_name: managerMiddleName,
        manager_email: formData.managerEmail,
        exception_reason: formData.additionalNotes,
        is_exception_request: !!formData.additionalNotes
      });

      setReferenceNumber(response.reference_number);

      if (response.outcome === 'approved') {
        setResult('approved');
        setResultMessage(response.message);
      } else if (response.outcome === 'pending') {
        setResult('escalated');
        setResultMessage(response.message);
      } else {
        setResult('rejected');
        setResultMessage(response.message);
      }
    } catch (error: any) {
      const msg = error.message || 'Failed to submit request.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  const maxDate = getMaxEndDate();
  const workdaysSelected = countWorkdays(formData.startDate, formData.endDate);

  // Logic: Warn if 0 days remaining
  const daysRemaining = annualBalance?.days_remaining ?? 20;
  const isOverBalance = workdaysSelected > daysRemaining;

  useEffect(() => {
    let isActive = true;
    if (!formData.startDate || !formData.endDate) {
      setOverlapWarning('');
      return;
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return;

    setIsCheckingOverlap(true);
    checkDateOverlap(formData.startDate, formData.endDate)
      .then((response) => {
        if (!isActive) return;
        if (response.has_overlap) {
          setOverlapWarning(response.warning || 'Overlap detected.');
        } else {
          setOverlapWarning('');
        }
      })
      .catch(() => { if (isActive) setOverlapWarning(''); })
      .finally(() => { if (isActive) setIsCheckingOverlap(false); });

    return () => { isActive = false; };
  }, [formData.startDate, formData.endDate]);

  if (result !== 'idle') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-sm shadow-xl border p-16 text-center min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden ${
        result === 'approved' ? 'border-emerald-200' : result === 'escalated' ? 'border-orange-200' : 'border-red-200'
      }`}>
        {/* Success / Escalation UI */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 relative z-10 ${
          result === 'approved' ? 'bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
          result === 'escalated' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
        }`}>
          {result === 'approved' ? <CheckCircle size={48} strokeWidth={1.5} /> :
           result === 'escalated' ? <AlertCircle size={48} strokeWidth={1.5} /> : <XCircle size={48} strokeWidth={1.5} />}
        </div>
        <h2 className="text-3xl font-light text-gray-900 mb-3 relative z-10">
          {result === 'approved' ? 'Request Approved' :
           result === 'escalated' ? 'Further Review Required' : 'Compliance Issue Detected'}
        </h2>
        {referenceNumber && (
          <p className="text-[10px] font-bold text-[#42b0d5] uppercase tracking-[0.3em] mb-6 relative z-10">Reference: {referenceNumber}</p>
        )}
        
        {/* Specific Reason Display */}
        <p className="text-gray-900 font-medium max-w-md mb-2 relative z-10 text-sm">
            {result === 'escalated' ? 'Reason for review:' : 'Outcome detail:'}
        </p>
        <p className="text-gray-600 max-w-md mb-10 leading-relaxed font-light relative z-10 text-sm bg-gray-50 p-4 rounded-sm border border-gray-100">
            {resultMessage || "Your request requires manual review by Global Mobility due to policy exceptions."}
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="text-[#42b0d5] text-xs font-bold uppercase tracking-widest hover:underline relative z-10 transition-all hover:tracking-[0.2em]"
        >
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-sm shadow-md border border-gray-200 min-h-[600px] flex flex-col overflow-hidden">
      {/* Stepper */}
      <div className="border-b border-gray-100 bg-white p-6">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <button 
                onClick={() => { if (s < step) setStep(s); }}
                disabled={s >= step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  step >= s ? 'border-[#42b0d5] bg-[#42b0d5] text-white' : 'border-gray-200 text-gray-300 bg-white'
                } ${s < step ? 'cursor-pointer hover:bg-[#3aa3c7]' : 'cursor-default'}`}
              >
                {s}
              </button>
              <span className={`ml-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${step >= s ? 'text-[#42b0d5]' : 'text-gray-300'}`}>
                {s === 1 ? 'Approval' : s === 2 ? 'Trip Details' : 'Compliance'}
              </span>
              {s !== 3 && <div className={`w-12 h-[1px] mx-4 hidden sm:block ${step > s ? 'bg-[#42b0d5]' : 'bg-gray-100'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-10 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* STEP 1: Profile & Approval */}
            {step === 1 && (
              <div className="space-y-8">
                {/* Employee Details - TOP */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Employee Name</label>
                    <div className="flex gap-2">
                        <input value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} className="w-1/2 bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none" placeholder="First Name" />
                        <input value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} className="w-1/2 bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none" placeholder="Last Name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Home Country</label>
                    <input
                      value={formData.homeCountry}
                      onChange={(e) => handleChange('homeCountry', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none transition-colors"
                      placeholder="e.g. Denmark"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                    <h3 className="text-xl font-light text-gray-900 mb-2">Manager <span className="font-bold">Approval</span></h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg mb-6">
                        Please upload your Line Manager's approval email. Our AI will extract the details automatically.
                    </p>

                    <div className="border-2 border-dashed border-gray-100 rounded-sm p-8 text-center bg-gray-50/30 hover:border-[#42b0d5] transition-colors group cursor-pointer">
                        <input type="file" id="approval-upload" className="hidden" accept=".msg,.pdf,.eml,.txt" onChange={handleFileUpload} />
                        <label htmlFor="approval-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[#42b0d5] mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud size={20} strokeWidth={1.5} />
                            </div>
                            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Click to Upload Email</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-tight">PDF, MSG, EML or TXT</span>
                        </label>
                        {isAnalyzing && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-[#42b0d5] text-xs font-bold uppercase tracking-widest animate-pulse">
                                <Info size={14} /> AI Processing...
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Manager Name</label>
                    <input
                      value={formData.managerName}
                      onChange={(e) => handleChange('managerName', e.target.value)}
                      placeholder="e.g. Lars Jensen"
                      className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Manager Email</label>
                    <input
                      value={formData.managerEmail}
                      onChange={(e) => handleChange('managerEmail', e.target.value)}
                      placeholder="manager@maersk.com"
                      className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Trip Details */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-light text-gray-900 mb-2">Trip <span className="font-bold">Details</span></h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                        Select destination and dates. Limit: {annualBalance?.days_remaining ?? 20} days remaining.
                    </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} strokeWidth={1.5} /> Destination Country
                  </label>
                  <CountryAutocomplete
                    value={formData.destinationCountry}
                    onChange={(val) => handleChange('destinationCountry', val)}
                    showBlockedWarning={true}
                    allowBlocked={false}
                    placeholder="Search for a country..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} strokeWidth={1.5} /> Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none"
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      value={formData.startDate}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} strokeWidth={1.5} /> End Date
                    </label>
                    <input
                      type="date"
                      disabled={!formData.startDate}
                      min={formData.startDate}
                      // max={maxDate} // Removed strict blocking to allow exceptions, will warn instead
                      className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none disabled:bg-gray-50 disabled:text-gray-300 transition-colors"
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      value={formData.endDate}
                    />
                  </div>
                </div>

                {formData.startDate && (
                   <motion.div 
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-gray-50 border-l-4 border-[#0b1e3b] p-4 rounded-r-sm"
                   >
                       <p className="text-xs text-gray-900 flex items-center gap-2 font-medium">
                           <Info size={14} className="text-[#42b0d5]" /> 
                           Based on your start date, your trip should conclude by <strong className="text-[#0b1e3b]">{formatDateForDisplay(maxDate!)}</strong> to stay within the 20-day limit.
                       </p>
                   </motion.div>
                )}

                {/* Additional Notes */}
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={12} strokeWidth={1.5} /> Additional Notes / Exception Reason (Optional)
                    </label>
                    <textarea
                        value={formData.additionalNotes}
                        onChange={(e) => handleChange('additionalNotes', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none h-24 resize-none"
                        placeholder="Provide details if you are requesting an exception or have specific circumstances..."
                    />
                </div>

                {workdaysSelected > 0 && (
                  <div className="space-y-3 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">This trip:</span>
                      <span className={`text-lg font-bold ${isOverBalance ? 'text-red-600' : 'text-[#42b0d5]'}`}>
                          {workdaysSelected} workdays
                      </span>
                    </div>
                    {annualBalance && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Annual balance:</span>
                        <span className="text-sm font-semibold text-gray-700">
                            {annualBalance.days_remaining} of {annualBalance.days_allowed} days remaining
                        </span>
                      </div>
                    )}
                    {isOverBalance && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
                        <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        <span className="text-xs text-red-700 font-medium">This trip exceeds your remaining annual allowance by {workdaysSelected - daysRemaining} day(s).</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Compliance */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-light text-gray-900 mb-2">Role <span className="font-bold">Eligibility</span></h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                        Final certifications required to process your request in compliance with international tax and legal regulations.
                    </p>
                </div>

                {/* Right to Work - Navy Branding */}
                <div
                  className={`border p-6 rounded-sm transition-all cursor-pointer ${
                    formData.rightToWork 
                        ? 'bg-[#0b1e3b]/5 border-[#0b1e3b] shadow-sm' 
                        : 'bg-white border-gray-100 hover:border-[#42b0d5]'
                  }`}
                  onClick={() => handleChange('rightToWork', !formData.rightToWork)}
                >
                  <div className="flex items-start">
                    <div className={`mt-1 w-5 h-5 border rounded flex items-center justify-center mr-4 shrink-0 transition-colors ${
                      formData.rightToWork ? 'bg-[#0b1e3b] border-[#0b1e3b]' : 'border-gray-200 bg-white'
                    }`}>
                      {formData.rightToWork && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Right to Work</h4>
                      <p className="text-gray-900 font-medium text-sm mt-1 leading-relaxed">
                        I certify that I hold the legal right to work (via Citizenship or Valid Visa) in <strong>{formData.destinationCountry}</strong> for the requested duration.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Certification - Navy Branding */}
                <div
                  className={`border p-6 rounded-sm transition-all cursor-pointer ${
                    formData.noRestrictedRoles 
                        ? 'bg-[#0b1e3b]/5 border-[#0b1e3b] shadow-sm' 
                        : 'bg-white border-gray-100 hover:border-[#42b0d5]'
                  }`}
                  onClick={() => handleChange('noRestrictedRoles', !formData.noRestrictedRoles)}
                >
                  <div className="flex items-start">
                    <div className={`mt-1 w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center mr-4 transition-colors ${
                      formData.noRestrictedRoles ? 'bg-[#0b1e3b] border-[#0b1e3b]' : 'border-gray-200 bg-white'
                    }`}>
                      {formData.noRestrictedRoles && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Role Certification</h4>
                      <p className="text-gray-900 font-medium text-sm mt-1 leading-relaxed mb-4">
                        I certify that my current role allows for remote work and does <strong>not</strong> fall under any of the following restricted categories:
                      </p>
                      <ul className="grid grid-cols-2 gap-3">
                        {[
                            'Frontline / Customer facing',
                            'Required on-site',
                            'Subject to legal restrictions',
                            'Permanent Establishment risk'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <ShieldCheck size={12} className="text-[#0b1e3b]" /> {item}
                            </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div className="mx-8 mb-4 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3">
          <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Submission failed</p>
            <p className="text-sm text-red-600 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            ← Previous Step
          </button>
        ) : <div />}
        
        <button
          onClick={step === 3 ? handleSubmit : validateAndNext}
          disabled={loading || (step === 3 && (!formData.rightToWork || !formData.noRestrictedRoles))}
          className="bg-[#0b1e3b] text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-slate-200"
        >
          {loading ? 'Submitting...' : step === 3 ? 'Certify & Submit' : 'Continue'} 
          {step < 3 && <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
};
