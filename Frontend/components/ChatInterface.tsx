import React, { useState, useEffect } from 'react';
import { extractApprovalFromFile } from '../services/api';

interface RequestWizardProps {
  userEmail?: string;
  onDataChange?: (data: any) => void;
}

export const ChatInterface: React.FC<RequestWizardProps> = ({ userEmail, onDataChange }) => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [formData, setFormData] = useState({
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
  });

  // Pre-populate Profile from Email
  useEffect(() => {
    if (userEmail) {
      const parts = userEmail.split('@')[0].split('.');
      const newData = {
        ...formData,
        firstName: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '',
        lastName: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '',
        homeCountry: 'Denmark' // Default/Mock for demo
      };
      setFormData(newData);
    }
  }, [userEmail]);

  // Propagate data changes to parent
  useEffect(() => {
    if (onDataChange) {
        onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // Calculate Max Date based on Policy (20 Days)
  const getMaxEndDate = () => {
    if (!formData.startDate) return undefined;
    const date = new Date(formData.startDate);
    date.setDate(date.getDate() + 20); // Policy limit
    return date.toISOString().split('T')[0];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsAnalyzing(true);
      
      try {
        // Call Gemini to simulate extraction
        const data = await extractApprovalFromFile(file);
        
        setFormData(prev => ({
          ...prev,
          managerName: data.managerName,
          managerEmail: data.managerEmail
        }));
      } catch (error) {
        console.error("Extraction failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateAndNext = () => {
    if (step === 1) {
        // Allow manual entry if no file upload
        if (!formData.managerEmail) return; 
        setStep(2);
    } else if (step === 2) {
        if (!formData.destinationCountry || !formData.startDate || !formData.endDate) return;
        setStep(3);
    }
  };

  const submitRequest = () => {
    // 1. Check Duration
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (duration > 20) {
        setResult('rejected');
        setRejectionReason(`Requested duration (${duration} days) exceeds the 20-day annual limit.`);
        return;
    }

    // 2. Check Right to Work
    if (!formData.rightToWork) {
        setResult('rejected');
        setRejectionReason('You must have the legal right to work (citizenship/visa) in the destination country.');
        return;
    }

    // 3. Check Restricted Roles
    if (!formData.noRestrictedRoles) {
        setResult('rejected');
        setRejectionReason('Your role category falls under restricted activities (e.g., Sales, Signatory, Data Security) preventing remote work.');
        return;
    }

    setResult('approved');
  };

  if (result !== 'idle') {
      return (
        <div className={`bg-white rounded-sm shadow-md border p-12 text-center h-[600px] flex flex-col items-center justify-center ${result === 'approved' ? 'border-green-200' : 'border-red-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${result === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                 {result === 'approved' ? (
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                 ) : (
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{result === 'approved' ? 'Request Approved' : 'Compliance Issue Detected'}</h2>
            <p className="text-gray-500 max-w-md mb-8">
                {result === 'approved' 
                    ? `Your request to work from ${formData.destinationCountry} has been auto-approved. A confirmation email has been sent to ${formData.managerEmail} and ${userEmail}.` 
                    : rejectionReason}
            </p>
            <button onClick={() => { setResult('idle'); setStep(1); }} className="text-[#42b0d5] font-semibold hover:underline">Start New Request</button>
        </div>
      );
  }

  const maxDate = getMaxEndDate();

  const formatDateForDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-sm shadow-md border border-gray-200 min-h-[600px] flex flex-col">
      {/* Wizard Header */}
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

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        
        {/* STEP 1: Profile & Manager */}
        {step === 1 && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-sm flex items-start space-x-3 mb-6">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900">One-Time Setup</h4>
                        <p className="text-xs text-blue-800">We've pre-filled your details. Please upload your manager's approval email to auto-complete the rest.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">First Name</label>
                        <input value={formData.firstName} readOnly className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-sm p-3" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Last Name</label>
                        <input value={formData.lastName} readOnly className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-sm p-3" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Home Country</label>
                        <input value={formData.homeCountry} onChange={(e) => handleChange('homeCountry', e.target.value)} className="w-full bg-white border border-gray-300 rounded-sm p-3 focus:border-[#42b0d5] outline-none" />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-4">Line Manager Approval</label>
                    <div className="flex items-center space-x-4">
                        <label className="cursor-pointer bg-white border border-gray-300 hover:border-[#42b0d5] text-gray-700 px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm">
                            Upload Email (.msg, .pdf)
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                        {isAnalyzing && <span className="text-sm text-[#42b0d5] animate-pulse">AI extracting details...</span>}
                    </div>
                </div>

                {(formData.managerName || isAnalyzing) && (
                    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-sm border border-gray-200">
                         <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Manager Name</label>
                            <input value={formData.managerName} readOnly placeholder="Waiting for upload..." className="w-full bg-transparent border-b border-gray-300 py-2 focus:outline-none text-gray-800 placeholder-gray-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Manager Email</label>
                            <input value={formData.managerEmail} readOnly placeholder="Waiting for upload..." className="w-full bg-transparent border-b border-gray-300 py-2 focus:outline-none text-gray-800 placeholder-gray-400" />
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* STEP 2: Trip Details */}
        {step === 2 && (
            <div className="space-y-8 animate-fade-in">
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Destination Country</label>
                     <select 
                        className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:border-[#42b0d5] outline-none"
                        value={formData.destinationCountry}
                        onChange={(e) => handleChange('destinationCountry', e.target.value)}
                     >
                         <option value="">Select a country...</option>
                         <option value="United Kingdom">United Kingdom</option>
                         <option value="Spain">Spain</option>
                         <option value="India">India</option>
                         <option value="United States">United States</option>
                         <option value="Singapore">Singapore</option>
                     </select>
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
                    </div>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">End Date</label>
                            {maxDate && <span className="text-xs text-[#42b0d5] font-medium">Policy limit: {formatDateForDisplay(maxDate)}</span>}
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
                    </div>
                </div>
            </div>
        )}

        {/* STEP 3: Compliance */}
        {step === 3 && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:border-[#42b0d5] transition-colors cursor-pointer" onClick={() => handleChange('rightToWork', !formData.rightToWork)}>
                    <div className="flex items-start">
                        <div className={`mt-1 w-5 h-5 border rounded flex items-center justify-center mr-4 ${formData.rightToWork ? 'bg-[#42b0d5] border-[#42b0d5]' : 'border-gray-300'}`}>
                            {formData.rightToWork && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">Right to Work Confirmation</h4>
                            <p className="text-gray-500 text-sm mt-1">I confirm I have the legal right to work (Citizenship or Valid Visa) in {formData.destinationCountry} for the duration of this trip.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:border-[#42b0d5] transition-colors cursor-pointer" onClick={() => handleChange('noRestrictedRoles', !formData.noRestrictedRoles)}>
                    <div className="flex items-start">
                         <div className={`mt-1 w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center mr-4 ${formData.noRestrictedRoles ? 'bg-[#42b0d5] border-[#42b0d5]' : 'border-gray-300'}`}>
                            {formData.noRestrictedRoles && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
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
                        </div>
                    </div>
                </div>
            </div>
        )}

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
            onClick={step === 3 ? submitRequest : validateAndNext}
            className="bg-[#42b0d5] hover:bg-[#3aa3c7] text-white font-semibold py-3 px-8 rounded-sm shadow-sm transition-all"
        >
            {step === 3 ? 'Submit Request' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};
