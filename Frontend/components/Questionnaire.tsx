import React, { useState, useEffect } from 'react';
import { User, submitSIRWRequest, checkDateOverlap } from '../services/api';
import { RequestFormData } from '../types';
import { extractApprovalData } from '../services/geminiService';
import { CountryAutocomplete } from './CountryAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface QuestionnaireProps {
  user?: User | null;
  onDataChange?: (data: RequestFormData) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ user, onDataChange }) => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<'idle' | 'approved' | 'rejected' | 'escalated'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    managerEmail?: string;
    destinationCountry?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const [formData, setFormData] = useState<RequestFormData>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    homeCountry: user?.home_country || 'Denmark',
    managerName: '',
    managerEmail: '',
    destinationCountry: '',
    startDate: '',
    endDate: '',
    rightToWork: false,
    noRestrictedRoles: false,
  });

  // Pre-populate from user if email is available but name fields are empty
  useEffect(() => {
    if (user?.email && !formData.firstName) {
      const parts = user.email.split('@')[0].split('.');
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || (parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : ''),
        lastName: user.last_name || (parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''),
        homeCountry: user.home_country || prev.homeCountry,
      }));
    }
  }, [user]);

  // Propagate data changes to parent (for PolicyChatbot context)
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

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
    return `${day}/${month}/${year}`;
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
        const data = await extractApprovalData(file);
        setFormData(prev => ({
          ...prev,
          managerName: data.managerName,
          managerEmail: data.managerEmail,
        }));
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
      setResult('rejected');
      setResultMessage(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maxDate = getMaxEndDate();
  const workdaysSelected = countWorkdays(formData.startDate, formData.endDate);
  const showDurationWarning = workdaysSelected > 14 && workdaysSelected <= 20;
  const dateOrderError = formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)
    ? 'End date must be after the start date.'
    : '';

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
    <div className="bg-white rounded-sm shadow-md border border-gray-200 min-h-[600px] flex flex-col">
      {/* Stepper Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-6">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step >= s ? 'border-[#42b0d5] bg-[#42b0d5] text-white' : 'border-gray-300 text-gray-400 bg-white'
              }`}>
                {s}
              </div>
              <span className={`ml-3 text-sm font-medium ${step >= s ? 'text-[#42b0d5]' : 'text-gray-400'}`}>
                {s === 1 && 'Profile & Approval'}
                {s === 2 && 'Trip Details'}
                {s === 3 && 'Compliance Check'}
              </span>
              {s !== 3 && <div className="w-16 h-[1px] bg-gray-300 mx-4 hidden sm:block"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* STEP 1: Profile & Approval */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-sm flex items-start space-x-3 mb-6">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">One-Time Setup</h4>
                    <p className="text-xs text-blue-800">We've pre-filled your details. Please upload your manager's approval email to auto-complete the rest.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">First Name</label>
                    <input value={formData.firstName} readOnly className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-sm p-3" />
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your Maersk profile. Contact HR if incorrect.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Last Name</label>
                    <input value={formData.lastName} readOnly className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-sm p-3" />
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your Maersk profile. Contact HR if incorrect.</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Home Country</label>
                    <input
                      value={formData.homeCountry}
                      onChange={(e) => handleChange('homeCountry', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-sm p-3 focus:border-[#42b0d5] outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">The country where your Maersk employment contract is based.</p>
                    <button onClick={resetProfile} className="text-xs text-gray-500 hover:text-red-500 mt-2 transition-colors">
                      Reset profile data
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-4">Line Manager Approval</label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-white border border-gray-300 hover:border-[#42b0d5] text-gray-700 px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm">
                      Upload Email (.msg, .pdf, .eml, .txt)
                      <input type="file" className="hidden" accept=".msg,.pdf,.eml,.txt" onChange={handleFileUpload} />
                    </label>
                    {isAnalyzing && <span className="text-sm text-[#42b0d5] animate-pulse">Reading file...</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Upload the email from your Line Manager confirming initial approval (Section 4.1.4).</p>
                  <p className="text-xs text-gray-500 mt-1">Best results: upload .eml or .txt if available.</p>
                  {uploadError && (
                    <p className="text-xs text-amber-600 mt-2">{uploadError}</p>
                  )}
                  {validationErrors.managerEmail && (
                    <p className="text-xs text-red-600 mt-2">{validationErrors.managerEmail}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-sm border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Manager Name</label>
                    <input
                      value={formData.managerName}
                      onChange={(e) => handleChange('managerName', e.target.value)}
                      placeholder="e.g. Lars Jensen"
                      className="w-full bg-white border border-gray-300 rounded-sm p-3 focus:border-[#42b0d5] outline-none text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Manager Email</label>
                    <input
                      value={formData.managerEmail}
                      onChange={(e) => handleChange('managerEmail', e.target.value)}
                      placeholder="manager@maersk.com"
                      className="w-full bg-white border border-gray-300 rounded-sm p-3 focus:border-[#42b0d5] outline-none text-gray-800 placeholder-gray-400"
                    />
                    {validationErrors.managerEmail && (
                      <p className="text-xs text-red-600 mt-2">{validationErrors.managerEmail}</p>
                    )}
                  </div>
                  <p className="col-span-2 text-xs text-gray-500">Auto-filled from upload, or enter manually.</p>
                </div>
              </div>
            )}

            {/* STEP 2: Trip Details */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Destination Country</label>
                  <CountryAutocomplete
                    value={formData.destinationCountry}
                    onChange={(val) => handleChange('destinationCountry', val)}
                    showBlockedWarning={true}
                    allowBlocked={false}
                    placeholder="Search for a country..."
                  />
                  <p className="text-xs text-gray-500 mt-1">SIRW cannot be performed in sanctioned countries or those with no Maersk entity (Appendix A).</p>
                  {validationErrors.destinationCountry && (
                    <p className="text-xs text-red-600 mt-2">{validationErrors.destinationCountry}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Start Date</label>
                    <input
                      type="date"
                      className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none"
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      value={formData.startDate}
                    />
                    <p className="text-xs text-gray-500 mt-1">The first working day you plan to work remotely from abroad.</p>
                    {validationErrors.startDate && (
                      <p className="text-xs text-red-600 mt-2">{validationErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">End Date</label>
                      {maxDate && (
                        <span className="text-xs text-[#42b0d5] font-medium">
                          Max end date (20 workdays): {formatDateForDisplay(maxDate)}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      disabled={!formData.startDate}
                      min={formData.startDate}
                      max={maxDate}
                      className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      value={formData.endDate}
                    />
                    <p className="text-xs text-gray-500 mt-1">Policy limit: maximum 20 workdays per calendar year (Section 4.1.2).</p>
                    {showDurationWarning && (
                      <p className="text-xs text-amber-600 mt-1">
                        Heads up: trips longer than 14 workdays may need extra review, even if they are under 20.
                      </p>
                    )}
                    {workdaysSelected > 20 && (
                      <p className="text-xs text-red-600 mt-1">This exceeds the 20-workday limit.</p>
                    )}
                    {isCheckingOverlap && (
                      <p className="text-xs text-gray-500 mt-1">Checking for overlapping requests...</p>
                    )}
                    {overlapWarning && !isCheckingOverlap && (
                      <p className="text-xs text-amber-600 mt-1">{overlapWarning}</p>
                    )}
                    {validationErrors.endDate && (
                      <p className="text-xs text-red-600 mt-2">{validationErrors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Compliance Check */}
            {step === 3 && (
              <div className="space-y-8">
                <div
                  className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:border-[#42b0d5] transition-colors cursor-pointer"
                  onClick={() => handleChange('rightToWork', !formData.rightToWork)}
                >
                  <div className="flex items-start">
                    <div className={`mt-1 w-5 h-5 border rounded flex items-center justify-center mr-4 shrink-0 ${
                      formData.rightToWork ? 'bg-[#42b0d5] border-[#42b0d5]' : 'border-gray-300'
                    }`}>
                      {formData.rightToWork && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Right to Work Confirmation</h4>
                      <p className="text-gray-500 text-sm mt-1">
                        I confirm I have the legal right to work (Citizenship or Valid Visa) in {formData.destinationCountry || 'the destination country'} for the duration of this trip.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">The right to work is not the same as the right to visit a country (Section 4.1.3).</p>
                    </div>
                  </div>
                </div>

                <div
                  className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:border-[#42b0d5] transition-colors cursor-pointer"
                  onClick={() => handleChange('noRestrictedRoles', !formData.noRestrictedRoles)}
                >
                  <div className="flex items-start">
                    <div className={`mt-1 w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center mr-4 ${
                      formData.noRestrictedRoles ? 'bg-[#42b0d5] border-[#42b0d5]' : 'border-gray-300'
                    }`}>
                      {formData.noRestrictedRoles && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">Role Eligibility Confirmation</h4>
                      <p className="text-gray-500 text-sm mb-3">I confirm I do <strong>NOT</strong> fall into any of the following categories:</p>
                      <ul className="list-disc ml-4 text-xs text-gray-500 space-y-1 leading-relaxed">
                        <li>Those in frontline, customer-facing roles</li>
                        <li>Roles that must be performed on site (e.g. seafarers, repair/maintenance, warehouse)</li>
                        <li>Roles restricted for legal reasons (e.g. data security regulations, sanctioned countries)</li>
                        <li>Roles that create a <strong>permanent establishment</strong> (e.g. negotiating/signing contracts of value, commercial/sales/procurement roles, Senior Execs)</li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">See Section 4.1.1 for the full list of ineligible categories.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-4">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={step === 3 ? handleSubmit : validateAndNext}
          disabled={loading || (step === 3 && (!formData.rightToWork || !formData.noRestrictedRoles))}
          className="bg-[#42b0d5] hover:bg-[#3aa3c7] text-white font-semibold py-3 px-8 rounded-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : step === 3 ? 'Submit Request' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};
