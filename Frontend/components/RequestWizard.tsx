/**
 * Multi-step SIRW Request Wizard
 * Implements the policy-compliant workflow:
 * 1. Manager Approval Upload (with AI extraction)
 * 2. Employee Profile (one-time, with consent)
 * 3. Request Details (destination, dates, validations)
 * 4. Compliance Confirmation (right to work, role eligibility)
 * 5. Review & Submit
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  User, 
  submitSIRWRequest, 
  updateUserProfile, 
  getSIRWAnnualBalance,
  checkDateOverlap,
  SIRWSubmissionResponse,
  AnnualBalanceResponse,
  DateOverlapResponse,
} from '../services/api';
import { CountryAutocomplete } from './CountryAutocomplete';
import { LabelWithTooltip } from './Tooltip';
import { isCountryBlocked, getBlockReason, getBlockMessage } from '../data/blockedCountries';

// Ineligible role categories per SIRW Policy
const INELIGIBLE_ROLES = [
  {
    id: 'frontline_customer_facing',
    label: 'Frontline or customer-facing role',
    description: 'Roles that directly interact with customers on a regular basis',
  },
  {
    id: 'onsite_required',
    label: 'On-site role (seafarers, maintenance, warehouse)',
    description: 'Roles that must be performed at a specific physical location',
  },
  {
    id: 'legal_restrictions',
    label: 'Role with legal restrictions',
    description: 'Roles in legal profession or subject to data security regulations',
  },
  {
    id: 'commercial_sales',
    label: 'Commercial or Sales role with contract signing authority',
    description: 'Roles that negotiate and sign contracts on behalf of Maersk',
  },
  {
    id: 'procurement',
    label: 'Procurement role with contract signing authority',
    description: 'Roles that sign procurement contracts on behalf of Maersk',
  },
  {
    id: 'senior_executive',
    label: 'Senior Executive leadership role',
    description: 'Senior leadership positions with strategic decision-making authority',
  },
];

interface ManagerDetails {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
}

interface EmployeeProfile {
  phone: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  homeCountry: string;
  consentGiven: boolean;
}

interface RequestDetails {
  destinationCountry: string;
  startDate: string;
  endDate: string;
  isExceptionRequest: boolean;
  exceptionReason: string;
}

interface ComplianceConfirmation {
  hasRightToWork: boolean | null;
  confirmNoIneligibleRole: boolean;
  selectedIneligibleRoles: string[];
}

type WizardStep = 'manager' | 'profile' | 'request' | 'compliance' | 'review';

interface RequestWizardProps {
  user?: User | null;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

export const RequestWizard: React.FC<RequestWizardProps> = ({
  user,
  onComplete,
  onCancel,
}) => {
  // Current step
  const [currentStep, setCurrentStep] = useState<WizardStep>('manager');
  
  // Step 1: Manager approval
  const [managerApprovalFile, setManagerApprovalFile] = useState<File | null>(null);
  const [managerDetails, setManagerDetails] = useState<ManagerDetails>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
  });
  const [isExtractingManager, setIsExtractingManager] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Step 2: Employee profile
  const [profile, setProfile] = useState<EmployeeProfile>({
    phone: '',
    firstName: user?.first_name || '',
    middleName: '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    homeCountry: user?.home_country || '',
    consentGiven: false,
  });
  const [profileExists, setProfileExists] = useState(false); // TODO: Check from backend

  // Step 3: Request details
  const [requestDetails, setRequestDetails] = useState<RequestDetails>({
    destinationCountry: '',
    startDate: '',
    endDate: '',
    isExceptionRequest: false,
    exceptionReason: '',
  });

  // Step 4: Compliance confirmation
  const [compliance, setCompliance] = useState<ComplianceConfirmation>({
    hasRightToWork: null,
    confirmNoIneligibleRole: false,
    selectedIneligibleRoles: [],
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'approved' | 'rejected' | 'pending' | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');

  // Annual balance state
  const [annualBalance, setAnnualBalance] = useState<AnnualBalanceResponse | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Back-to-back detection state
  const [overlapCheck, setOverlapCheck] = useState<DateOverlapResponse | null>(null);
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);

  // Calculated values
  const workdays = useMemo(() => {
    if (!requestDetails.startDate || !requestDetails.endDate) return 0;
    const start = new Date(requestDetails.startDate);
    const end = new Date(requestDetails.endDate);
    if (end < start) return 0;
    
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [requestDetails.startDate, requestDetails.endDate]);

  const isDestinationBlocked = useMemo(() => {
    return requestDetails.destinationCountry 
      ? isCountryBlocked(requestDetails.destinationCountry) 
      : false;
  }, [requestDetails.destinationCountry]);

  const blockReason = useMemo(() => {
    return requestDetails.destinationCountry 
      ? getBlockReason(requestDetails.destinationCountry) 
      : null;
  }, [requestDetails.destinationCountry]);

  // Fetch annual balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await getSIRWAnnualBalance();
        setAnnualBalance(balance);
      } catch (error) {
        console.error('Failed to fetch annual balance:', error);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    fetchBalance();
  }, []);

  // Check for back-to-back requests when dates change
  useEffect(() => {
    const checkOverlap = async () => {
      if (!requestDetails.startDate || !requestDetails.endDate) {
        setOverlapCheck(null);
        return;
      }

      setIsCheckingOverlap(true);
      try {
        const result = await checkDateOverlap(requestDetails.startDate, requestDetails.endDate);
        setOverlapCheck(result);
      } catch (error) {
        console.error('Failed to check date overlap:', error);
        setOverlapCheck(null);
      } finally {
        setIsCheckingOverlap(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(checkOverlap, 500);
    return () => clearTimeout(timer);
  }, [requestDetails.startDate, requestDetails.endDate]);

  // Calculate if this request would exceed annual limit
  const wouldExceedAnnualLimit = useMemo(() => {
    if (!annualBalance || !workdays) return false;
    return (annualBalance.days_used + workdays) > annualBalance.days_allowed;
  }, [annualBalance, workdays]);

  // Step navigation
  const steps: { id: WizardStep; label: string; number: number }[] = [
    { id: 'manager', label: 'Manager Approval', number: 1 },
    { id: 'profile', label: 'Your Profile', number: 2 },
    { id: 'request', label: 'Request Details', number: 3 },
    { id: 'compliance', label: 'Compliance', number: 4 },
    { id: 'review', label: 'Review & Submit', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceedFromManager = managerApprovalFile && 
    managerDetails.firstName && 
    managerDetails.lastName && 
    managerDetails.email;

  const canProceedFromProfile = profile.firstName && 
    profile.lastName && 
    profile.email && 
    profile.homeCountry && 
    profile.consentGiven;

  // Determine if exception is needed
  const needsException = workdays > 14 || wouldExceedAnnualLimit || 
    (overlapCheck?.has_overlap && (overlapCheck?.combined_days || 0) > 14);

  const canProceedFromRequest = requestDetails.destinationCountry && 
    requestDetails.startDate && 
    requestDetails.endDate && 
    !isDestinationBlocked &&
    workdays > 0 &&
    (!needsException || (requestDetails.isExceptionRequest && requestDetails.exceptionReason));

  const canProceedFromCompliance = compliance.hasRightToWork === true && 
    compliance.confirmNoIneligibleRole;

  // File upload handler
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'message/rfc822', '.eml', 'text/plain'];
    if (!allowedTypes.some(t => file.type.includes(t) || file.name.endsWith('.eml'))) {
      setExtractionError('Please upload a PDF, image, or email file (.eml, .txt)');
      return;
    }

    setManagerApprovalFile(file);
    setExtractionError(null);
    setIsExtractingManager(true);

    try {
      // Read file content for AI extraction
      const content = await readFileAsText(file);
      
      // Call Gemini to extract manager details
      const extracted = await extractManagerDetailsWithAI(content);
      
      if (extracted) {
        setManagerDetails(extracted);
      } else {
        setExtractionError('Could not extract manager details. Please enter them manually.');
      }
    } catch (error) {
      console.error('Error extracting manager details:', error);
      setExtractionError('Error processing file. Please enter manager details manually.');
    } finally {
      setIsExtractingManager(false);
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
  const extractManagerDetailsWithAI = async (content: string): Promise<ManagerDetails | null> => {
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
- middleName: The manager's middle name (empty string if not found)
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
          middleName: parsed.middleName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
        };
      }
    } catch (error) {
      console.error('AI extraction error:', error);
    }
    return null;
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // First, update user profile if needed
      if (profile.consentGiven) {
        try {
          await updateUserProfile({
            phone: profile.phone,
            middle_name: profile.middleName,
            home_country: profile.homeCountry,
            profile_consent_given: true,
          });
        } catch (profileError) {
          console.warn('Failed to update profile:', profileError);
          // Continue with submission even if profile update fails
        }
      }

      // Submit the SIRW request to backend
      const response: SIRWSubmissionResponse = await submitSIRWRequest({
        destination_country: requestDetails.destinationCountry,
        start_date: requestDetails.startDate,
        end_date: requestDetails.endDate,
        has_right_to_work: compliance.hasRightToWork === true,
        confirmed_role_eligible: compliance.confirmNoIneligibleRole,
        manager_first_name: managerDetails.firstName,
        manager_middle_name: managerDetails.middleName || undefined,
        manager_last_name: managerDetails.lastName,
        manager_email: managerDetails.email,
        is_exception_request: requestDetails.isExceptionRequest,
        exception_reason: requestDetails.exceptionReason || undefined,
      });

      setSubmitResult(response.outcome);
      setSubmitMessage(response.message);
      setCurrentStep('review');

      if (onComplete) {
        onComplete(response);
      }
    } catch (error: any) {
      setSubmitResult('rejected');
      setSubmitMessage(error.message || 'An error occurred while submitting your request.');
      setCurrentStep('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                index < currentStepIndex 
                  ? 'bg-[#42b0d5] text-white' 
                  : index === currentStepIndex
                    ? 'bg-[#141414] text-white'
                    : 'bg-[#d3d3d3] text-[#6a6a6a]'
              }`}>
                {index < currentStepIndex ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                index <= currentStepIndex ? 'text-[#141414]' : 'text-[#8a8a8a]'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${
                index < currentStepIndex ? 'bg-[#42b0d5]' : 'bg-[#d3d3d3]'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Render Step 1: Manager Approval
  const renderManagerStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#141414] mb-2 headline">Manager Approval</h3>
        <p className="text-sm text-[#6a6a6a]">
          Upload an email from your line manager confirming their approval for this SIRW request.
          We'll automatically extract their details.
        </p>
      </div>

      {/* Policy Reminder */}
      <div className="p-4 bg-[#e2f3fb] border-l-4 border-[#42b0d5] rounded-r-sm">
        <div className="flex">
          <svg className="w-5 h-5 text-[#42b0d5] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-[#141414]">
            <span className="font-semibold">Policy Requirement:</span> All SIRW requests must have line manager approval before submission. 
            Your manager will be notified of the outcome.
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-[#d3d3d3] rounded-lg p-6 text-center hover:border-[#42b0d5] transition-colors bg-white">
        <input
          type="file"
          id="managerApproval"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.eml,.txt"
          onChange={handleFileUpload}
        />
        <label htmlFor="managerApproval" className="cursor-pointer">
          {managerApprovalFile ? (
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-8 h-8 text-[#42b0d5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-[#141414]">{managerApprovalFile.name}</span>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-[#8a8a8a]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-[#6a6a6a]">
                <span className="font-semibold text-[#42b0d5]">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-[#8a8a8a]">PDF, PNG, JPG, or email file (.eml)</p>
            </>
          )}
        </label>
      </div>

      {isExtractingManager && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <svg className="animate-spin h-5 w-5 text-[#42b0d5]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Extracting manager details...</span>
        </div>
      )}

      {extractionError && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
          <p className="text-sm text-yellow-700">{extractionError}</p>
        </div>
      )}

      {/* Manager Details Form */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Manager Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={managerDetails.firstName}
              onChange={(e) => setManagerDetails({ ...managerDetails, firstName: e.target.value })}
              className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
              placeholder="e.g. John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input
              type="text"
              value={managerDetails.middleName}
              onChange={(e) => setManagerDetails({ ...managerDetails, middleName: e.target.value })}
              className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={managerDetails.lastName}
              onChange={(e) => setManagerDetails({ ...managerDetails, lastName: e.target.value })}
              className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
              placeholder="e.g. Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            value={managerDetails.email}
            onChange={(e) => setManagerDetails({ ...managerDetails, email: e.target.value })}
            className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
            placeholder="e.g. john.smith@maersk.com"
          />
        </div>
      </div>
    </div>
  );

  // Render Step 2: Employee Profile
  const renderProfileStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#141414] mb-2 headline">Your Profile</h3>
        <p className="text-sm text-[#6a6a6a]">
          Please confirm your details. This information will be stored for future SIRW requests.
        </p>
      </div>

      {/* Policy Reminder */}
      <div className="p-4 bg-[#e2f3fb] border-l-4 border-[#42b0d5] rounded-r-sm">
        <div className="flex">
          <svg className="w-5 h-5 text-[#42b0d5] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-[#141414]">
            <span className="font-semibold">Policy Reminder:</span> Your profile information is used to verify eligibility for SIRW. 
            Ensure your home country matches your employment contract location.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input
            type="text"
            value={profile.middleName}
            onChange={(e) => setProfile({ ...profile, middleName: e.target.value })}
            className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full border border-gray-200 bg-gray-50 rounded-sm p-2 text-sm text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">From your authentication</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
            placeholder="+45 12 34 56 78"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Home Country *</label>
        <CountryAutocomplete
          value={profile.homeCountry}
          onChange={(value) => setProfile({ ...profile, homeCountry: value })}
          placeholder="Select your country of employment"
          required
        />
        <p className="text-xs text-gray-400 mt-1">The country where you are legally employed</p>
      </div>

      {/* Consent */}
      <div className="p-4 bg-gray-50 rounded-sm border border-gray-200">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.consentGiven}
            onChange={(e) => setProfile({ ...profile, consentGiven: e.target.checked })}
            className="mt-1 accent-[#42b0d5]"
          />
          <span className="text-sm text-gray-600">
            I consent to Maersk storing my profile information for the purpose of processing SIRW requests. 
            This data will be handled in accordance with the Maersk Privacy Policy.
          </span>
        </label>
      </div>
    </div>
  );

  // Render Step 3: Request Details
  const renderRequestStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#141414] mb-2 headline">Request Details</h3>
        <p className="text-sm text-[#6a6a6a]">
          Enter the details of your planned remote work period.
        </p>
      </div>

      {/* Policy Reminder */}
      <div className="p-4 bg-[#e2f3fb] border-l-4 border-[#42b0d5] rounded-r-sm">
        <div className="flex">
          <svg className="w-5 h-5 text-[#42b0d5] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-[#141414]">
            <span className="font-semibold">Policy Limits:</span> Maximum <strong>20 workdays</strong> per calendar year. 
            Maximum <strong>14 consecutive workdays</strong> per trip. SIRW is only permitted in countries with a Maersk entity and no active sanctions.
          </div>
        </div>
      </div>

      {/* Annual Balance Card */}
      {annualBalance && (
        <div className="p-4 bg-white border border-[#d3d3d3] rounded-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#141414]">Your {annualBalance.year} SIRW Balance</h4>
              <p className="text-xs text-[#6a6a6a] mt-1">Annual allowance resets on 1 January</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-[#42b0d5]">{annualBalance.days_remaining}</span>
                <span className="text-sm text-[#6a6a6a]">/ {annualBalance.days_allowed} days</span>
              </div>
              <p className="text-xs text-[#6a6a6a]">{annualBalance.days_used} days used</p>
              {annualBalance.pending_days > 0 && (
                <p className="text-xs text-[#b39221]">+ {annualBalance.pending_days} days pending</p>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-[#e6e6e6] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#42b0d5] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (annualBalance.days_used / annualBalance.days_allowed) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <LabelWithTooltip 
          label="Destination Country" 
          tooltip="SIRW is only permitted in countries where Maersk has an entity and is not subject to UN/EU sanctions."
          required
        />
        <CountryAutocomplete
          value={requestDetails.destinationCountry}
          onChange={(value) => setRequestDetails({ ...requestDetails, destinationCountry: value })}
          placeholder="Where will you be working from?"
          required
          showBlockedWarning={true}
        />
        <p className="text-xs text-[#6a6a6a] mt-1">SIRW is not permitted in sanctioned countries or countries without a Maersk entity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <LabelWithTooltip 
            label="Start Date" 
            tooltip="The first day you will be working from the destination country."
            required
          />
          <input
            type="date"
            value={requestDetails.startDate}
            onChange={(e) => setRequestDetails({ ...requestDetails, startDate: e.target.value })}
            className="w-full border border-[#d3d3d3] rounded-sm p-2 text-sm focus:ring-2 focus:ring-[#42b0d5]/20 focus:border-[#42b0d5] outline-none"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <LabelWithTooltip 
            label="End Date" 
            tooltip="The last day you will be working from the destination country."
            required
          />
          <input
            type="date"
            value={requestDetails.endDate}
            onChange={(e) => setRequestDetails({ ...requestDetails, endDate: e.target.value })}
            className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
            min={requestDetails.startDate || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Workdays Calculation */}
      {workdays > 0 && (
        <div className={`p-4 rounded-sm border ${
          wouldExceedAnnualLimit || workdays > 20 
            ? 'bg-red-50 border-red-200' 
            : workdays > 14 
              ? 'bg-orange-50 border-orange-200'
              : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Workdays: </span>
              <span className={`text-lg font-bold ${
                wouldExceedAnnualLimit || workdays > 20 ? 'text-red-600' : workdays > 14 ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {workdays}
              </span>
              {annualBalance && (
                <span className="text-sm text-gray-500 ml-1">
                  ({annualBalance.days_used + workdays} / {annualBalance.days_allowed} total for year)
                </span>
              )}
            </div>
            <div className="flex flex-col items-end space-y-1">
              {workdays > 14 && workdays <= 20 && !wouldExceedAnnualLimit && (
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  Exceeds 14-day consecutive limit
                </span>
              )}
              {(workdays > 20 || wouldExceedAnnualLimit) && (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                  {wouldExceedAnnualLimit && workdays <= 20 
                    ? 'Would exceed annual balance' 
                    : 'Exceeds annual limit'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back-to-back Request Warning */}
      {overlapCheck && overlapCheck.has_overlap && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-700">Back-to-back Request Detected</h4>
              <p className="text-xs text-amber-600 mt-1">
                You have {overlapCheck.nearby_requests.length} request(s) within 7 days of these dates.
                {overlapCheck.warning && (
                  <span className="block mt-1 font-medium">{overlapCheck.warning}</span>
                )}
              </p>
              <div className="mt-2 space-y-1">
                {overlapCheck.nearby_requests.map((req, idx) => (
                  <div key={idx} className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded inline-block mr-2">
                    {req.destination_country}: {req.start_date} to {req.end_date} ({req.duration_days} days)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCheckingOverlap && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-[#42b0d5]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Checking for conflicts...</span>
        </div>
      )}

      {/* Exception Request */}
      {needsException && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm space-y-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-yellow-800">Exception Required</h4>
            <p className="text-xs text-yellow-700 mt-1">This request requires an exception because:</p>
            <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside space-y-1">
              {workdays > 14 && <li>Trip exceeds 14 consecutive workdays</li>}
              {wouldExceedAnnualLimit && <li>Would exceed your annual {annualBalance?.days_allowed || 20}-day allowance</li>}
              {overlapCheck?.has_overlap && (overlapCheck?.combined_days || 0) > 14 && (
                <li>Combined with nearby requests, exceeds 14-day continuous work period</li>
              )}
            </ul>
          </div>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requestDetails.isExceptionRequest}
              onChange={(e) => setRequestDetails({ 
                ...requestDetails, 
                isExceptionRequest: e.target.checked 
              })}
              className="mt-1 accent-[#42b0d5]"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Request Exception</span>
              <p className="text-xs text-gray-600 mt-1">
                If you have exceptional circumstances (e.g., birth of child, family illness), 
                you may request an exception. This will be reviewed by Global Mobility.
              </p>
            </div>
          </label>

          {requestDetails.isExceptionRequest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Exception *
              </label>
              <textarea
                value={requestDetails.exceptionReason}
                onChange={(e) => setRequestDetails({ 
                  ...requestDetails, 
                  exceptionReason: e.target.value 
                })}
                className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none"
                rows={3}
                placeholder="Please explain your exceptional circumstances..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Step 4: Compliance Confirmation
  const renderComplianceStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#141414] mb-2 headline">Compliance Confirmation</h3>
        <p className="text-sm text-[#6a6a6a]">
          Please confirm the following to complete your SIRW request.
        </p>
      </div>

      {/* Policy Reminder */}
      <div className="p-4 bg-[#e2f3fb] border-l-4 border-[#42b0d5] rounded-r-sm">
        <div className="flex">
          <svg className="w-5 h-5 text-[#42b0d5] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-[#141414]">
            <span className="font-semibold">Compliance Requirements:</span> SIRW requires legal work authorisation in the destination country and an eligible role category. 
            These are mandatory policy requirements that cannot be waived.
          </div>
        </div>
      </div>

      {/* Right to Work */}
      <div className="p-4 bg-white border border-[#d3d3d3] rounded-sm space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[#141414] mb-2">
            Do you have the legal right to work in {requestDetails.destinationCountry || 'the destination country'}?
          </h4>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm mb-4">
            <p className="text-xs text-amber-700">
              <strong>Important:</strong> The right to work is NOT the same as the right to visit. 
              A tourist visa does NOT grant work rights. You must have citizenship, permanent residency, 
              or a valid work permit.
            </p>
          </div>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="rightToWork"
                checked={compliance.hasRightToWork === true}
                onChange={() => setCompliance({ ...compliance, hasRightToWork: true })}
                className="accent-[#42b0d5]"
              />
              <span className="text-sm text-gray-600">Yes, I have the legal right to work</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="rightToWork"
                checked={compliance.hasRightToWork === false}
                onChange={() => setCompliance({ ...compliance, hasRightToWork: false })}
                className="accent-[#42b0d5]"
              />
              <span className="text-sm text-gray-600">No</span>
            </label>
          </div>
          {compliance.hasRightToWork === false && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-sm">
              <p className="text-sm text-red-700">
                SIRW cannot be approved without the legal right to work in the destination country.
                Please contact Global Mobility if you need clarification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Role Eligibility */}
      <div className="p-4 bg-white border border-gray-200 rounded-sm space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Role Eligibility</h4>
          <p className="text-sm text-gray-600 mb-4">
            SIRW is not available for certain role categories. Please confirm that your role 
            is NOT in any of the following categories:
          </p>

          <div className="space-y-3 mb-4">
            {INELIGIBLE_ROLES.map((role) => (
              <div key={role.id} className="p-3 bg-gray-50 rounded-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-green-50 border border-green-200 rounded-sm">
            <input
              type="checkbox"
              checked={compliance.confirmNoIneligibleRole}
              onChange={(e) => setCompliance({ 
                ...compliance, 
                confirmNoIneligibleRole: e.target.checked 
              })}
              className="mt-1 accent-green-600"
            />
            <span className="text-sm text-green-800">
              I confirm that my role is <strong>NOT</strong> in any of the ineligible categories listed above
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  // Render Step 5: Review & Submit (or Result)
  const renderReviewStep = () => {
    if (submitResult) {
      return (
        <div className="space-y-6">
          <div className={`p-6 rounded-sm border ${
            submitResult === 'approved' 
              ? 'bg-green-50 border-green-200' 
              : submitResult === 'pending'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                submitResult === 'approved' 
                  ? 'bg-green-100' 
                  : submitResult === 'pending'
                    ? 'bg-blue-100'
                    : 'bg-red-100'
              }`}>
                {submitResult === 'approved' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : submitResult === 'pending' ? (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${
                  submitResult === 'approved' 
                    ? 'text-green-700' 
                    : submitResult === 'pending'
                      ? 'text-blue-700'
                      : 'text-red-700'
                }`}>
                  {submitResult === 'approved' 
                    ? 'Request Approved' 
                    : submitResult === 'pending'
                      ? 'Request Under Review'
                      : 'Request Cannot Be Approved'}
                </h3>
                <p className={`text-sm mt-2 ${
                  submitResult === 'approved' 
                    ? 'text-green-600' 
                    : submitResult === 'pending'
                      ? 'text-blue-600'
                      : 'text-red-600'
                }`}>
                  {submitMessage}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-full py-3 px-4 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    // Review summary before submission
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#141414] mb-2 headline">Review Your Request</h3>
          <p className="text-sm text-[#6a6a6a]">
            Please review the details below before submitting your SIRW request.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="space-y-4">
          {/* Manager */}
          <div className="p-4 bg-white border border-[#d3d3d3] rounded-sm">
            <h4 className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wide mb-2">Manager Approval</h4>
            <p className="text-sm text-[#141414]">
              {managerDetails.firstName} {managerDetails.middleName} {managerDetails.lastName}
            </p>
            <p className="text-sm text-[#6a6a6a]">{managerDetails.email}</p>
          </div>

          {/* Employee */}
          <div className="p-4 bg-white border border-[#d3d3d3] rounded-sm">
            <h4 className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wide mb-2">Employee</h4>
            <p className="text-sm text-[#141414]">
              {profile.firstName} {profile.middleName} {profile.lastName}
            </p>
            <p className="text-sm text-[#6a6a6a]">{profile.email}</p>
            <p className="text-sm text-[#6a6a6a]">Home Country: {profile.homeCountry}</p>
          </div>

          {/* Request Details */}
          <div className="p-4 bg-white border border-[#d3d3d3] rounded-sm">
            <h4 className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wide mb-2">Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#6a6a6a]">Destination:</span>
                <span className="ml-2 text-[#141414]">{requestDetails.destinationCountry}</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Workdays:</span>
                <span className="ml-2 text-[#141414]">{workdays}</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Start Date:</span>
                <span className="ml-2 text-[#141414]">{requestDetails.startDate}</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">End Date:</span>
                <span className="ml-2 text-[#141414]">{requestDetails.endDate}</span>
              </div>
            </div>
            {requestDetails.isExceptionRequest && (
              <div className="mt-3 p-2 bg-[#fff1c2] border border-[#e6bb25] rounded">
                <p className="text-xs font-medium text-[#806814]">Exception Requested</p>
                <p className="text-xs text-[#806814]">{requestDetails.exceptionReason}</p>
              </div>
            )}
          </div>

          {/* Compliance */}
          <div className="p-4 bg-white border border-[#d3d3d3] rounded-sm">
            <h4 className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wide mb-2">Compliance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-[#42b0d5] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[#141414]">Has right to work in {requestDetails.destinationCountry}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-[#42b0d5] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[#141414]">Confirmed eligible role category</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="bg-white rounded-sm shadow-sm border border-[#d3d3d3] h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#d3d3d3] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#42b0d5] text-white rounded-sm flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[#141414] leading-tight headline">New SIRW Request</h3>
              <p className="text-xs text-[#6a6a6a] font-medium">Short-Term International Remote Work</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-[#8a8a8a] hover:text-[#141414] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="px-8 pt-6 bg-white">
        {renderStepIndicator()}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#f7f7f7]">
        {currentStep === 'manager' && renderManagerStep()}
        {currentStep === 'profile' && renderProfileStep()}
        {currentStep === 'request' && renderRequestStep()}
        {currentStep === 'compliance' && renderComplianceStep()}
        {currentStep === 'review' && renderReviewStep()}
      </div>

      {/* Footer Navigation */}
      {!submitResult && (
        <div className="border-t border-[#d3d3d3] p-4 bg-white flex justify-between">
          <button
            onClick={() => {
              const prevIndex = currentStepIndex - 1;
              if (prevIndex >= 0) {
                setCurrentStep(steps[prevIndex].id);
              } else if (onCancel) {
                onCancel();
              }
            }}
            className="py-2 px-4 border border-[#d3d3d3] rounded-sm text-sm font-medium text-[#141414] hover:bg-[#f7f7f7] transition-colors"
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="py-2 px-6 bg-[#141414] text-white rounded-sm text-sm font-medium hover:bg-[#363636] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          ) : (
            <button
              onClick={() => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < steps.length) {
                  setCurrentStep(steps[nextIndex].id);
                }
              }}
              disabled={
                (currentStep === 'manager' && !canProceedFromManager) ||
                (currentStep === 'profile' && !canProceedFromProfile) ||
                (currentStep === 'request' && !canProceedFromRequest) ||
                (currentStep === 'compliance' && !canProceedFromCompliance)
              }
              className="py-2 px-6 bg-[#141414] text-white rounded-sm text-sm font-medium hover:bg-[#363636] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
};
