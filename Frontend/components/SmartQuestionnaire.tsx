/**
 * SmartQuestionnaire - Clean 3-step SIRW Request Wizard
 * 
 * Step 1: Profile & Approval (pre-filled user details + manager upload)
 * Step 2: Trip Details (destination country + dates)
 * Step 3: Compliance Check (right to work + role eligibility confirmations)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  submitSIRWRequest, 
  updateUserProfile,
  getSIRWAnnualBalance,
  SIRWSubmissionResponse,
  AnnualBalanceResponse,
} from '../services/api';
import { CountryAutocomplete } from './CountryAutocomplete';
import { Tooltip } from './Tooltip';
import { isCountryBlocked, getBlockMessage } from '../data/blockedCountries';

// Help text content for tooltips
const HELP_TEXT = {
  homeCountry: 'This is your primary country of employment where you are contracted to work. It determines your tax residency and social security obligations.',
  managerApproval: 'Your line manager must pre-approve all SIRW requests before submission. Upload their approval email or enter their details for verification.',
  destinationCountry: 'Select the country where you plan to work remotely. Some countries have restrictions due to tax treaties, sanctions, or data security regulations.',
  startDate: 'The first day you will begin working remotely from the destination country. Requests must be submitted at least 5 working days in advance.',
  endDate: 'The last day you will be working remotely. The maximum continuous period is 14 days; longer periods require Global Mobility review.',
  rightToWork: 'You must have legal authorisation to work in the destination country. This can be citizenship, permanent residency, or a valid work visa.',
  roleEligibility: 'Certain roles are excluded from SIRW due to regulatory requirements, data security concerns, or permanent establishment tax risks.',
};

interface SmartQuestionnaireProps {
  user?: User | null;
  onComplete?: (result: SIRWSubmissionResponse) => void;
  onCancel?: () => void;
  onSwitchToStandardForm?: () => void;
}

// Ineligible role categories
const INELIGIBLE_ROLES = [
  'Those in frontline, customer-facing roles',
  'Roles that must be performed on site (e.g. seafarers, repair/maintenance, warehouse)',
  'Roles restricted for legal reasons (e.g. data security regulations, sanctioned countries)',
  'Roles that create a permanent establishment (e.g. negotiating/signing contracts of value, commercial/sales/procurement roles, Senior Execs)',
];

export const SmartQuestionnaire: React.FC<SmartQuestionnaireProps> = ({
  user,
  onComplete,
  onCancel,
  onSwitchToStandardForm,
}) => {
  // Step management
  const [step, setStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    homeCountry: user?.home_country || '',
    managerName: '',
    managerEmail: '',
    destinationCountry: '',
    startDate: '',
    endDate: '',
    rightToWork: false,
    noRestrictedRoles: false,
  });

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [result, setResult] = useState<'idle' | 'approved' | 'rejected' | 'pending'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // Annual balance
  const [annualBalance, setAnnualBalance] = useState<AnnualBalanceResponse | null>(null);

  // Pre-populate from user
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        homeCountry: user.home_country || 'Denmark',
      }));
    }
  }, [user]);

  // Fetch annual balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await getSIRWAnnualBalance();
        setAnnualBalance(balance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchBalance();
  }, []);

  // Calculate workdays
  const workdays = React.useMemo(() => {
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

  // Check if destination is blocked
  const isDestinationBlocked = formData.destinationCountry 
    ? isCountryBlocked(formData.destinationCountry) 
    : false;

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // File upload handler with AI extraction
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      // Read file content
      const content = await readFileAsText(file);
      
      // Extract manager details using Gemini
      const extracted = await extractManagerDetailsWithAI(content);
      
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          managerName: `${extracted.firstName} ${extracted.lastName}`.trim(),
          managerEmail: extracted.email,
        }));
      }
    } catch (error) {
      console.error('Error extracting manager details:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // AI extraction using Gemini
  const extractManagerDetailsWithAI = async (content: string): Promise<{ firstName: string; lastName: string; email: string } | null> => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                     (import.meta as any).env?.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.warn('Gemini API key not found');
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Extract the manager's details from this email or document. 
The manager is the person who sent the approval or is mentioned as the approving manager.

Return ONLY a JSON object with these fields:
- firstName: The manager's first name
- lastName: The manager's last name
- email: The manager's email address

Document content:
${content.substring(0, 3000)}

Respond with ONLY the JSON object, no other text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
        };
      }
    } catch (error) {
      console.error('AI extraction error:', error);
    }
    return null;
  };

  // Validate and go to next step
  const validateAndNext = () => {
    if (step === 1) {
      // Need manager email to proceed
      if (!formData.managerEmail) return;
      setStep(2);
    } else if (step === 2) {
      // Need destination and dates
      if (!formData.destinationCountry || !formData.startDate || !formData.endDate) return;
      if (isDestinationBlocked) return;
      setStep(3);
    }
  };

  // Check if can proceed from current step
  const canProceed = () => {
    if (step === 1) {
      return !!formData.managerEmail && !!formData.firstName && !!formData.lastName;
    }
    if (step === 2) {
      return !!formData.destinationCountry && !!formData.startDate && !!formData.endDate && !isDestinationBlocked && workdays > 0;
    }
    if (step === 3) {
      return formData.rightToWork && formData.noRestrictedRoles;
    }
    return false;
  };

  // Submit request
  const submitRequest = async () => {
    setIsSubmitting(true);

    try {
      // Update user profile if needed
      if (user) {
        try {
          await updateUserProfile({
            home_country: formData.homeCountry,
            profile_consent_given: true,
          });
        } catch (e) {
          console.warn('Failed to update profile:', e);
        }
      }

      // Parse manager name into first/last
      const nameParts = formData.managerName.split(' ');
      const managerFirstName = nameParts[0] || '';
      const managerLastName = nameParts.slice(1).join(' ') || '';

      // Submit to backend
      const response = await submitSIRWRequest({
        destination_country: formData.destinationCountry,
        start_date: formData.startDate,
        end_date: formData.endDate,
        has_right_to_work: formData.rightToWork,
        confirmed_role_eligible: formData.noRestrictedRoles,
        manager_first_name: managerFirstName,
        manager_last_name: managerLastName,
        manager_email: formData.managerEmail,
        is_exception_request: workdays > 14 || (annualBalance && (annualBalance.days_used + workdays) > annualBalance.days_allowed),
        exception_reason: workdays > 14 ? `Trip duration of ${workdays} workdays exceeds 14-day limit` : undefined,
      });

      setResult(response.outcome);
      setResultMessage(response.message);
      setReferenceNumber(response.reference_number);

      if (onComplete) {
        onComplete(response);
      }
    } catch (error: any) {
      setResult('rejected');
      setResultMessage(error.message || 'An error occurred while submitting your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render result screen
  if (result !== 'idle') {
    return (
      <div className={`bg-white rounded-sm shadow-sm border p-12 text-center min-h-[500px] flex flex-col items-center justify-center ${
        result === 'approved' ? 'border-[#42b0d5]' : result === 'pending' ? 'border-[#b39221]' : 'border-[#b80012]'
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          result === 'approved' ? 'bg-[#d1f3fa] text-[#42b0d5]' : result === 'pending' ? 'bg-[#fff5d6] text-[#b39221]' : 'bg-[#fce4e4] text-[#b80012]'
        }`}>
          {result === 'approved' ? (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : result === 'pending' ? (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-light text-[#141414] mb-2 headline">
          {result === 'approved' ? 'Request Approved' : result === 'pending' ? 'Pending Review' : 'Request Cannot Be Approved'}
        </h2>
        {referenceNumber && (
          <p className="text-sm text-[#6a6a6a] mb-4">Reference: <span className="font-mono font-semibold">{referenceNumber}</span></p>
        )}
        <p className="text-[#6a6a6a] max-w-md mb-8">
          {resultMessage}
        </p>
        <button 
          onClick={onCancel}
          className="text-[#42b0d5] font-semibold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm shadow-sm border border-[#d3d3d3] min-h-[500px] flex flex-col">
      {/* Wizard Header - Step Indicator */}
      <div className="border-b border-[#d3d3d3] bg-white p-6">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step >= s ? 'border-[#42b0d5] bg-[#42b0d5] text-white' : 'border-[#d3d3d3] text-[#8a8a8a] bg-white'
              }`}>
                {step > s ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              <span className={`ml-3 text-sm font-medium hidden sm:inline ${step >= s ? 'text-[#42b0d5]' : 'text-[#8a8a8a]'}`}>
                {s === 1 && 'Profile & Approval'}
                {s === 2 && 'Trip Details'}
                {s === 3 && 'Compliance Check'}
              </span>
              {s !== 3 && <div className={`w-12 lg:w-24 h-[2px] mx-4 hidden sm:block ${step > s ? 'bg-[#42b0d5]' : 'bg-[#d3d3d3]'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 max-w-3xl mx-auto w-full bg-[#f7f7f7]">
        
        {/* STEP 1: Profile & Manager Approval */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-[#e2f3fb] border border-[#42b0d5]/30 p-4 rounded-sm flex items-start space-x-3">
              <svg className="w-5 h-5 text-[#42b0d5] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-[#141414]">One-Time Setup</h4>
                <p className="text-xs text-[#4a4a4a]">We've pre-filled your details. Please upload your manager's approval email to auto-complete the rest.</p>
              </div>
            </div>

            {/* Name Fields (read-only) */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#6a6a6a] mb-2 uppercase tracking-widest">First Name</label>
                <input 
                  value={formData.firstName} 
                  readOnly 
                  className="w-full bg-[#f7f7f7] border border-[#d3d3d3] text-[#6a6a6a] rounded-sm p-3 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6a6a6a] mb-2 uppercase tracking-widest">Last Name</label>
                <input 
                  value={formData.lastName} 
                  readOnly 
                  className="w-full bg-[#f7f7f7] border border-[#d3d3d3] text-[#6a6a6a] rounded-sm p-3 text-sm" 
                />
              </div>
            </div>

            {/* Home Country */}
            <div>
              <label className="flex items-center text-xs font-bold text-[#6a6a6a] mb-2 uppercase tracking-widest">
                Home Country
                <Tooltip content={HELP_TEXT.homeCountry} />
              </label>
              <CountryAutocomplete
                value={formData.homeCountry}
                onChange={(value) => handleChange('homeCountry', value)}
                placeholder="Select your country of employment"
                showBlockedWarning={false}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-[#d3d3d3]" />

            {/* Manager Approval Upload */}
            <div>
              <label className="flex items-center text-sm font-semibold text-[#141414] mb-4">
                Line Manager Approval
                <Tooltip content={HELP_TEXT.managerApproval} />
              </label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-white border border-[#d3d3d3] hover:border-[#42b0d5] text-[#141414] px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm">
                  {uploadedFile ? uploadedFile.name : 'Upload Email (.msg, .pdf)'}
                  <input type="file" className="hidden" accept=".msg,.pdf,.eml,.txt" onChange={handleFileUpload} />
                </label>
                {isAnalyzing && <span className="text-sm text-[#42b0d5] animate-pulse">AI extracting details...</span>}
                {uploadedFile && !isAnalyzing && <span className="text-sm text-[#42b0d5]">File uploaded</span>}
              </div>
            </div>

            {/* Manager Details - always shown after file upload or when manually entering */}
            {(uploadedFile || showManualEntry) && (
              <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-sm border border-[#d3d3d3]">
                <div>
                  <label className="block text-xs font-bold text-[#8a8a8a] mb-2 uppercase tracking-widest">Manager Name</label>
                  <input 
                    value={formData.managerName} 
                    onChange={(e) => handleChange('managerName', e.target.value)}
                    placeholder="e.g. Lars Sorensen"
                    className="w-full bg-transparent border-b border-[#d3d3d3] py-2 focus:outline-none focus:border-[#42b0d5] text-[#141414] placeholder-[#8a8a8a]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8a8a8a] mb-2 uppercase tracking-widest">Manager Email <span className="text-[#b80012]">*</span></label>
                  <input 
                    value={formData.managerEmail} 
                    onChange={(e) => handleChange('managerEmail', e.target.value)}
                    placeholder="e.g. lars.sorensen@maersk.com"
                    className="w-full bg-transparent border-b border-[#d3d3d3] py-2 focus:outline-none focus:border-[#42b0d5] text-[#141414] placeholder-[#8a8a8a]" 
                  />
                </div>
                {!formData.managerEmail && (
                  <p className="col-span-2 text-xs text-[#6a6a6a]">Please enter your manager's email address to continue.</p>
                )}
              </div>
            )}

            {/* Manual entry option - shown when no file uploaded and not already showing manual entry */}
            {!uploadedFile && !showManualEntry && (
              <button
                onClick={() => setShowManualEntry(true)}
                className="text-sm text-[#42b0d5] hover:underline"
              >
                Or enter manager details manually
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Trip Details */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Destination Country */}
            <div>
              <label className="flex items-center text-xs font-bold text-[#6a6a6a] mb-2 uppercase tracking-widest">
                Destination Country
                <Tooltip content={HELP_TEXT.destinationCountry} />
              </label>
              <CountryAutocomplete
                value={formData.destinationCountry}
                onChange={(value) => handleChange('destinationCountry', value)}
                placeholder="Search or select a country..."
                showBlockedWarning={true}
              />
              {isDestinationBlocked && (
                <p className="text-xs text-[#b80012] mt-2">{getBlockMessage(formData.destinationCountry)}</p>
              )}
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-xs font-bold text-[#6a6a6a] mb-2 uppercase tracking-widest">
                  Start Date
                  <Tooltip content={HELP_TEXT.startDate} />
                </label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border border-[#d3d3d3] rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none" 
                />
              </div>
              <div>
                <label className="flex items-center text-xs font-bold text-[#6a6a6a] mb-2 uppercase tracking-widest">
                  End Date
                  <Tooltip content={HELP_TEXT.endDate} />
                </label>
                <input 
                  type="date" 
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={`w-full bg-white rounded-sm p-3 text-sm outline-none transition-colors border-2 ${
                    !formData.endDate || workdays === 0 
                      ? 'border-[#d3d3d3] focus:border-[#42b0d5]' 
                      : workdays > (annualBalance?.days_remaining ?? 20) 
                        ? 'border-[#b80012] focus:border-[#b80012]' 
                        : workdays > 14 
                          ? 'border-[#b39221] focus:border-[#b39221]' 
                          : 'border-[#42b0d5] focus:border-[#42b0d5]'
                  }`}
                />
              </div>
            </div>

            {/* Subtle inline balance and workdays info */}
            <div className="flex items-center justify-between text-sm text-[#6a6a6a]">
              <span>
                {annualBalance?.days_remaining ?? 20} of {annualBalance?.days_allowed ?? 20} days remaining in {annualBalance?.year || new Date().getFullYear()}
              </span>
              {workdays > 0 && (
                <span className={`font-medium ${
                  workdays > (annualBalance?.days_remaining ?? 20) 
                    ? 'text-[#b80012]' 
                    : workdays > 14 
                      ? 'text-[#b39221]' 
                      : 'text-[#42b0d5]'
                }`}>
                  {workdays} workday{workdays !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>

            {/* Warning messages */}
            {workdays > 14 && workdays <= (annualBalance?.days_remaining ?? 20) && (
              <div className="bg-[#fff5d6] border border-[#b39221]/30 p-4 rounded-sm">
                <p className="text-xs text-[#b39221]">
                  <strong>Note:</strong> This exceeds the 14-day consecutive limit. Your request will be reviewed by Global Mobility.
                </p>
              </div>
            )}
            {workdays > (annualBalance?.days_remaining ?? 20) && (
              <div className="bg-[#fce4e4] border border-[#b80012]/30 p-4 rounded-sm">
                <p className="text-xs text-[#b80012]">
                  <strong>Warning:</strong> This exceeds your remaining balance. Please adjust your dates.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Compliance Check */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Right to Work Confirmation */}
            <div 
              className={`bg-white border rounded-sm p-6 shadow-sm cursor-pointer transition-colors ${
                formData.rightToWork ? 'border-[#42b0d5]' : 'border-[#d3d3d3] hover:border-[#42b0d5]'
              }`}
              onClick={() => handleChange('rightToWork', !formData.rightToWork)}
            >
              <div className="flex items-start">
                <div className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${
                  formData.rightToWork ? 'bg-[#42b0d5] border-[#42b0d5]' : 'border-[#d3d3d3]'
                }`}>
                  {formData.rightToWork && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-bold text-[#141414] text-sm">Right to Work Confirmation</h4>
                    <Tooltip content={HELP_TEXT.rightToWork} />
                  </div>
                  <p className="text-[#6a6a6a] text-sm mt-1">
                    I confirm I have the legal right to work (Citizenship or Valid Visa) in <strong>{formData.destinationCountry || 'the destination country'}</strong> for the duration of this trip.
                  </p>
                </div>
              </div>
            </div>

            {/* Role Eligibility Confirmation */}
            <div 
              className={`bg-white border rounded-sm p-6 shadow-sm cursor-pointer transition-colors ${
                formData.noRestrictedRoles ? 'border-[#42b0d5]' : 'border-[#d3d3d3] hover:border-[#42b0d5]'
              }`}
              onClick={() => handleChange('noRestrictedRoles', !formData.noRestrictedRoles)}
            >
              <div className="flex items-start">
                <div className={`mt-1 w-5 h-5 border-2 rounded flex-shrink-0 flex items-center justify-center mr-4 transition-colors ${
                  formData.noRestrictedRoles ? 'bg-[#42b0d5] border-[#42b0d5]' : 'border-[#d3d3d3]'
                }`}>
                  {formData.noRestrictedRoles && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-bold text-[#141414] text-sm">Role Eligibility Confirmation</h4>
                    <Tooltip content={HELP_TEXT.roleEligibility} />
                  </div>
                  <p className="text-[#6a6a6a] text-sm mb-3">I confirm I do <strong>NOT</strong> fall into any of the following categories:</p>
                  <ul className="list-disc ml-4 text-xs text-[#6a6a6a] space-y-1 leading-relaxed">
                    {INELIGIBLE_ROLES.map((role, idx) => (
                      <li key={idx}>{role}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[#d3d3d3] bg-white flex justify-center space-x-4">
        {step > 1 && (
          <button 
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 text-[#6a6a6a] font-medium hover:text-[#141414] transition-colors"
          >
            Back
          </button>
        )}
        <button 
          onClick={step === 3 ? submitRequest : validateAndNext}
          disabled={!canProceed() || isSubmitting}
          className="bg-[#42b0d5] hover:bg-[#3aa3c7] disabled:bg-[#d3d3d3] disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-sm shadow-sm transition-all"
        >
          {isSubmitting ? 'Submitting...' : step === 3 ? 'Submit Request' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};
