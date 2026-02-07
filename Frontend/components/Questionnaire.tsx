import React, { useState, useMemo } from 'react';
import { User, createRequest } from '../services/api';
import { CountryAutocomplete } from './CountryAutocomplete';
import { LabelWithTooltip } from './Tooltip';
import { isCountryBlocked, getBlockReason } from '../data/blockedCountries';

interface QuestionnaireProps {
  user?: User | null;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ user }) => {
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
        setResultMessage("Request Approved: Your trip matches our safe harbor criteria. An automated confirmation email has been sent.");
      } else if (request.status === 'escalated') {
        setResult('escalated');
        setResultMessage("Request Escalated: Your request requires manual review by the Global Mobility team. You will be contacted within 2 business days.");
      } else {
        setResult('rejected');
        setResultMessage((request as any).decision_reason || "Request rejected: One or more compliance criteria were not met.");
      }
    } catch (error: any) {
      setResult('rejected');
      setResultMessage(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResultStyles = () => {
    switch (result) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'escalated':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return '';
    }
  };

  const getResultIcon = () => {
    switch (result) {
      case 'approved':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
      case 'escalated':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
    }
  };

  return (
    <div className="bg-white rounded-sm shadow-md border border-gray-200 h-full flex flex-col">
       {/* Header */}
       <div className="bg-white border-b border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-800 text-white rounded-sm flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 leading-tight">Standard Request Form</h3>
                <p className="text-xs text-gray-500 font-medium">Manual Entry</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
        {result !== 'idle' ? (
          <div className={`p-6 rounded-sm border mb-6 ${getResultStyles()}`}>
            <div className="flex items-start">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                 result === 'approved' ? 'bg-green-100' : 
                 result === 'escalated' ? 'bg-orange-100' : 'bg-red-100'
               }`}>
                  {getResultIcon()}
               </div>
               <div>
                 <h4 className="font-bold text-sm uppercase tracking-wide mb-1">
                   {result === 'approved' ? 'Approved' : 
                    result === 'escalated' ? 'Escalated for Review' : 'Compliance Issue Found'}
                 </h4>
                 {referenceNumber && (
                   <p className="text-sm font-mono mb-2">Reference: {referenceNumber}</p>
                 )}
                 <p className="text-sm">{resultMessage}</p>
                 <button onClick={() => { setResult('idle'); setReferenceNumber(''); }} className="mt-4 text-xs font-bold underline hover:opacity-80">Start New Assessment</button>
               </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LabelWithTooltip 
                  label="Maersk Entity" 
                  tooltip="The legal Maersk entity you are employed by (e.g., Maersk A/S, Maersk Line UK Ltd)"
                  required
                />
                <input 
                  required 
                  name="entity" 
                  value={formData.entity}
                  onChange={handleChange} 
                  className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" 
                  placeholder="e.g. Maersk A/S" 
                />
              </div>
              <div>
                <LabelWithTooltip 
                  label="Home Country" 
                  tooltip="The country where you are legally employed and pay taxes. This is typically where your employment contract is based."
                  required
                />
                <CountryAutocomplete
                  value={formData.homeCountry}
                  onChange={handleCountryChange('homeCountry')}
                  placeholder="Select your home country"
                  required
                />
              </div>
           </div>

           <div>
              <LabelWithTooltip 
                label="Destination Country" 
                tooltip="The country where you plan to work remotely from. This is the location you will be physically present in during your remote work period."
                required
              />
              <CountryAutocomplete
                value={formData.destination}
                onChange={handleCountryChange('destination')}
                placeholder="Where will you be working from?"
                required
                showBlockedWarning={true}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LabelWithTooltip 
                  label="Start Date" 
                  tooltip="The first day you will be working from the destination country. This should be a future date."
                  required
                />
                <input 
                  required 
                  type="date" 
                  name="startDate" 
                  value={formData.startDate}
                  onChange={handleChange} 
                  className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" 
                />
              </div>
              <div>
                <LabelWithTooltip 
                  label="End Date" 
                  tooltip="The last day you will be working from the destination country. Maximum duration is 20 days for short-term remote work."
                  required
                />
                <input 
                  required 
                  type="date" 
                  name="endDate" 
                  value={formData.endDate}
                  onChange={handleChange} 
                  className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" 
                />
              </div>
           </div>

           {/* Workdays Calculation & Validation */}
           {formData.startDate && formData.endDate && workdays > 0 && (
             <div className={`p-4 rounded-sm border ${
               workdays > 20 
                 ? 'bg-red-50 border-red-200' 
                 : workdays > 14 
                   ? 'bg-orange-50 border-orange-200'
                   : 'bg-blue-50 border-blue-200'
             }`}>
               <div className="flex items-center justify-between">
                 <div>
                   <span className="text-sm font-medium text-gray-700">Workdays: </span>
                   <span className={`text-lg font-bold ${
                     workdays > 20 ? 'text-red-600' : workdays > 14 ? 'text-orange-600' : 'text-blue-600'
                   }`}>
                     {workdays}
                   </span>
                   <span className="text-sm text-gray-500 ml-1">/ 20 annual limit</span>
                 </div>
                 {workdays > 14 && workdays <= 20 && (
                   <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                     Exceeds 14-day consecutive limit
                   </span>
                 )}
                 {workdays > 20 && (
                   <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                     Exceeds annual limit
                   </span>
                 )}
               </div>
               {workdays > 14 && (
                 <p className="text-xs text-gray-600 mt-2">
                   {workdays > 20 
                     ? 'This request exceeds the maximum 20 workdays per year. Please reduce the duration or contact Global Mobility for an exception.'
                     : 'The SIRW policy states the 20-day allowance cannot be taken as a single continuous block. Consider splitting into multiple trips or requesting an exception.'}
                 </p>
               )}
             </div>
           )}

           <div className="pt-4 border-t border-gray-200">
             <div className="mb-6">
               <div className="flex items-center mb-2">
                 <label className="text-sm font-semibold text-gray-800">Do you have the legal right to work in the destination country?</label>
                 <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-[#42b0d5] cursor-help group relative">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                   </svg>
                   <span className="absolute left-6 top-0 w-64 p-2 bg-white text-xs text-gray-600 rounded shadow-lg ring-1 ring-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     This includes citizenship, permanent residency, or a valid work visa. Tourist visas do NOT grant the right to work.
                   </span>
                 </span>
               </div>
               <div className="flex space-x-6">
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="hasRightToWork" value="yes" onChange={handleChange} className="accent-[#42b0d5]" required />
                    <span className="text-sm text-gray-600">Yes</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="hasRightToWork" value="no" onChange={handleChange} className="accent-[#42b0d5]" />
                    <span className="text-sm text-gray-600">No</span>
                 </label>
               </div>
             </div>

             <div className="mb-6">
               <div className="flex items-center mb-2">
                 <label className="text-sm font-semibold text-gray-800">Are you in a Sales role or do you have authority to sign contracts?</label>
                 <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-[#42b0d5] cursor-help group relative">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                   </svg>
                   <span className="absolute left-6 top-0 w-64 p-2 bg-white text-xs text-gray-600 rounded shadow-lg ring-1 ring-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     Sales roles with contract signing authority can create Permanent Establishment (PE) tax risk in foreign countries, which may trigger corporate tax obligations.
                   </span>
                 </span>
               </div>
               <div className="flex space-x-6">
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="isSalesRole" 
                      value="yes" 
                      checked={formData.isSalesRole === 'yes'}
                      onChange={handleChange} 
                      className="accent-[#42b0d5]" 
                      required 
                    />
                    <span className="text-sm text-gray-600">Yes</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="isSalesRole" 
                      value="no" 
                      checked={formData.isSalesRole === 'no'}
                      onChange={handleChange} 
                      className="accent-[#42b0d5]" 
                    />
                    <span className="text-sm text-gray-600">No</span>
                 </label>
               </div>
             </div>
           </div>

           <button 
              type="submit"
              disabled={loading || isDestinationBlocked}
              className="bg-[#42b0d5] text-white font-medium py-3 px-8 rounded-sm hover:bg-[#3999ba] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {loading ? 'Submitting...' : isDestinationBlocked ? 'Cannot Submit - Blocked Country' : 'Submit Request'}
           </button>
           
           {isDestinationBlocked && (
             <p className="text-sm text-red-600 mt-2">
               SIRW requests to {formData.destination} cannot be submitted. 
               {destinationBlockReason === 'sanctions' 
                 ? ' This country is under UN/EU sanctions.'
                 : ' Maersk does not have a legal entity in this country.'}
             </p>
           )}

        </form>
        )}
      </div>
    </div>
  );
};
