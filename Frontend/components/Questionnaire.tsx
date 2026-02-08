import React, { useState, useEffect } from 'react';
import { User, submitSIRWRequest, checkDateOverlap, getSIRWAnnualBalance, extractApprovalFromFile, AnnualBalanceResponse } from '../services/api';
import { RequestFormData } from '../types';
import { CountryAutocomplete } from './CountryAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, UploadCloud, Calendar, ShieldCheck, ChevronRight, AlertTriangle } from 'lucide-react';

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

  const [formData, setFormData] = useState<RequestFormData>({
    firstName: '',
    lastName: '',
    homeCountry: 'Denmark',
    managerName: '',
    managerEmail: '',
    destinationCountry: '',
    startDate: '',
    endDate: '',
    rightToWork: false,
    noRestrictedRoles: false,
  });

  // Safe pre-population
  useEffect(() => {
    if (user && user.email) {
      try {
        const parts = user.email.split('@')[0].split('.');
        setFormData(prev => {
            // Only update if fields are empty to avoid overwriting user input
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

  // Propagate data changes to parent (for PolicyChatbot context)
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // Propagate step changes to parent (for PolicyChatbot chips)
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  // Fetch annual balance on mount
  useEffect(() => {
    getSIRWAnnualBalance()
      .then(setAnnualBalance)
      .catch(() => setAnnualBalance(null));
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

  // Calculate max end date (20 workdays from start)
  const getMaxEndDate = () => {
    if (!formData.startDate) return undefined;
    const date = new Date(formData.startDate);
    let workdays = 0;
    while (workdays < 20) {
      if (isWorkday(date)) {
        workdays += 1;
      }
      if (workdays === 20) {
        break;
      }
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

  const resetProfile = () => {
    setFormData(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      homeCountry: '',
      managerName: '',
      managerEmail: '',
    }));
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
            
            // Premium: Mine employee name/country if pre-filled is empty OR if user confirms
            if (data.employeeName) {
                const parts = data.employeeName.trim().split(/\s+/);
                if (parts.length >= 2) {
                    newData.firstName = parts[0];
                    newData.lastName = parts.slice(1).join(' ');
                }
            }
            if (data.homeCountry) {
                newData.homeCountry = data.homeCountry;
            }
            
            return newData;
        });

        if (!data.managerName && !data.managerEmail) {
          setUploadError('We could not read the approval email. Please enter the manager details below.');
        }
      } catch (error) {
        console.error("Extraction failed", error);
        setUploadError('We could not read the approval email. Please enter the manager details below.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const validateAndNext = () => {
    if (step === 1) {
      const errors: typeof validationErrors = {};
      if (!formData.managerEmail) {
        errors.managerEmail = 'Please upload the approval email or enter your manager email to continue.';
      } else if (!isValidEmail(formData.managerEmail)) {
        errors.managerEmail = 'That email does not look valid. Please check it.';
      }
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) return;
      setStep(2);
    } else if (step === 2) {
      const errors: typeof validationErrors = {};
      if (!formData.destinationCountry) {
        errors.destinationCountry = 'Please select a destination country.';
      }
      if (!formData.startDate) {
        errors.startDate = 'Please select a start date.';
      }
      if (!formData.endDate) {
        errors.endDate = 'Please select an end date.';
      }
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end < start) {
          errors.endDate = 'End date must be after the start date.';
        }
      }
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) return;
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');

    try {
      // Split manager name into first/last
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
      const msg = error.message || 'Failed to submit request. Please try again.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  const maxDate = getMaxEndDate();
  const workdaysSelected = countWorkdays(formData.startDate, formData.endDate);

  useEffect(() => {
    let isActive = true;
    if (!formData.startDate || !formData.endDate) {
      setOverlapWarning('');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setOverlapWarning('');
      return;
    }

    setIsCheckingOverlap(true);
    checkDateOverlap(formData.startDate, formData.endDate)
      .then((response) => {
        if (!isActive) return;
        if (response.has_overlap) {
          setOverlapWarning(response.warning || 'These dates overlap with an existing request.');
        } else {
          setOverlapWarning('');
        }
      })
      .catch(() => {
        if (isActive) setOverlapWarning('');
      })
      .finally(() => {
        if (isActive) setIsCheckingOverlap(false);
      });

    return () => {
      isActive = false;
    };
  }, [formData.startDate, formData.endDate]);

  // Result screen
  if (result !== 'idle') {
    return (
      <div className={`bg-white rounded-sm shadow-md border p-12 text-center min-h-[600px] flex flex-col items-center justify-center ${
        result === 'approved' ? 'border-green-200' : result === 'escalated' ? 'border-orange-200' : 'border-red-200'
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          result === 'approved' ? 'bg-green-100 text-green-600' :
          result === 'escalated' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
        }`}>
          {result === 'approved' ? <CheckCircle size={40} /> :
           result === 'escalated' ? <AlertCircle size={40} /> : <XCircle size={40} />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {result === 'approved' ? 'Request Approved' :
           result === 'escalated' ? 'Further Review Required' : 'Compliance Issue Detected'}
        </h2>
        {referenceNumber && (
          <p className="text-xs font-bold text-[#42b0d5] uppercase tracking-widest mb-4">Ref: {referenceNumber}</p>
        )}
        <p className="text-gray-500 max-w-md mb-8">{resultMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[#42b0d5] font-semibold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm shadow-md border border-gray-200 min-h-[600px] flex flex-col overflow-hidden">
      {/* Stepper Header */}
      <div className="border-b border-gray-100 bg-white p-6">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                step >= s ? 'border-[#42b0d5] bg-[#42b0d5] text-white' : 'border-gray-200 text-gray-300 bg-white'
              }`}>
                {s}
              </div>
              <span className={`ml-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${step >= s ? 'text-[#42b0d5]' : 'text-gray-300'}`}>
                {s === 1 && 'Approval'}
                {s === 2 && 'Trip Details'}
                {s === 3 && 'Compliance'}
              </span>
              {s !== 3 && <div className={`w-12 h-[1px] mx-4 hidden sm:block ${step > s ? 'bg-[#42b0d5]' : 'bg-gray-100'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
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
                <div>
                    <h3 className="text-xl font-light text-gray-900 mb-2">Manager <span className="font-bold">Approval</span></h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                        Under policy section 4.1.4, initial approval from your Line Manager is mandatory. 
                        Please upload their confirmation email below to automatically pre-fill your request.
                    </p>
                </div>

                <div className="border-2 border-dashed border-gray-100 rounded-sm p-8 text-center bg-gray-50/30 hover:border-[#42b0d5] transition-colors group">
                    <input type="file" id="approval-upload" className="hidden" accept=".msg,.pdf,.eml,.txt" onChange={handleFileUpload} />
                    <label htmlFor="approval-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[#42b0d5] mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Upload Approval Email</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-tight">PDF, MSG, EML or TXT</span>
                    </label>
                    {isAnalyzing && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-[#42b0d5] text-xs font-bold uppercase tracking-widest animate-pulse">
                            <Info size={14} /> AI Extracting Details...
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Employee Name</label>
                    <div className="flex gap-2">
                        <input value={formData.firstName} readOnly className="w-1/2 bg-gray-50 border border-gray-100 text-gray-500 rounded-sm p-3 text-sm font-medium" placeholder="First" />
                        <input value={formData.lastName} readOnly className="w-1/2 bg-gray-50 border border-gray-100 text-gray-500 rounded-sm p-3 text-sm font-medium" placeholder="Last" />
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

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100">
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
                    {validationErrors.managerEmail && (
                      <p className="text-xs text-red-600 mt-2">{validationErrors.managerEmail}</p>
                    )}
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
                        Select your destination and dates. Your request must stay within the 20-workday annual limit.
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
                  {validationErrors.destinationCountry && (
                    <p className="text-xs text-red-600 mt-2">{validationErrors.destinationCountry}</p>
                  )}
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
                    {validationErrors.startDate && (
                      <p className="text-xs text-red-600 mt-2">{validationErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} strokeWidth={1.5} /> End Date
                    </label>
                    <input
                      type="date"
                      disabled={!formData.startDate}
                      min={formData.startDate}
                      max={maxDate}
                      className="w-full bg-white border border-gray-200 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none disabled:bg-gray-50 disabled:text-gray-300 transition-colors"
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      value={formData.endDate}
                    />
                    {validationErrors.endDate && (
                      <p className="text-xs text-red-600 mt-2">{validationErrors.endDate}</p>
                    )}
                  </div>
                </div>

                {formData.startDate && (
                   <motion.div 
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-blue-50 border-l-4 border-[#42b0d5] p-4 rounded-r-sm"
                   >
                       <p className="text-xs text-blue-800 flex items-center gap-2">
                           <Info size={14} /> 
                           Based on your start date, your trip must conclude by <strong>{formatDateForDisplay(maxDate!)}</strong> to remain within policy.
                       </p>
                   </motion.div>
                )}

                {workdaysSelected > 0 && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">Total Workdays:</span>
                    <span className={`text-lg font-bold ${workdaysSelected > 20 ? 'text-red-600' : 'text-[#42b0d5]'}`}>
                        {workdaysSelected} / 20
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Compliance Check */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-light text-gray-900 mb-2">Role <span className="font-bold">Eligibility</span></h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                        Final certifications required to process your request in compliance with international tax and legal regulations.
                    </p>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-sm flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-red-900">Submission Error</h4>
                      <p className="text-xs text-red-800 mt-1">{submitError}</p>
                    </div>
                  </div>
                )}

                <div
                  className={`border p-6 rounded-sm transition-all cursor-pointer ${
                    formData.rightToWork ? 'bg-emerald-50/30 border-emerald-200 shadow-sm' : 'bg-white border-gray-100 hover:border-[#42b0d5]'
                  }`}
                  onClick={() => handleChange('rightToWork', !formData.rightToWork)}
                >
                  <div className="flex items-start">
                    <div className={`mt-1 w-5 h-5 border rounded flex items-center justify-center mr-4 shrink-0 transition-colors ${
                      formData.rightToWork ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-white'
                    }`}>
                      {formData.rightToWork && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Right to Work</h4>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                        I certify that I hold the legal right to work (via Citizenship or Valid Visa) in <strong>{formData.destinationCountry}</strong> for the requested duration.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border p-6 rounded-sm transition-all cursor-pointer ${
                    formData.noRestrictedRoles ? 'bg-emerald-50/30 border-emerald-200 shadow-sm' : 'bg-white border-gray-100 hover:border-[#42b0d5]'
                  }`}
                  onClick={() => handleChange('noRestrictedRoles', !formData.noRestrictedRoles)}
                >
                  <div className="flex items-start">
                    <div className={`mt-1 w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center mr-4 transition-colors ${
                      formData.noRestrictedRoles ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-white'
                    }`}>
                      {formData.noRestrictedRoles && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Role Certification</h4>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed mb-4">
                        I certify that my current role allows for remote work and does <strong>not</strong> fall under any of the following restricted categories:
                      </p>
                      <ul className="grid grid-cols-2 gap-3">
                        {[
                            'Frontline / Customer facing',
                            'Required on-site',
                            'Subject to legal restrictions',
                            'Permanent Establishment risk'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <ShieldCheck size={12} className="text-emerald-500" /> {item}
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

      {/* Footer Actions */}
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
