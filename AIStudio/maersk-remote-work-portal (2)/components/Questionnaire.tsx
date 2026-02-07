import React, { useState } from 'react';

export const Questionnaire: React.FC = () => {
  const [formData, setFormData] = useState({
    entity: '',
    homeCountry: '',
    destination: '',
    startDate: '',
    endDate: '',
    hasRightToWork: '',
    isSalesRole: ''
  });
  const [result, setResult] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [resultMessage, setResultMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setResult('idle'); // Reset result on change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate Duration
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Logic Implementation matching Gemini Service
    if (formData.hasRightToWork === 'no') {
      setResult('rejected');
      setResultMessage("Request rejected: You must have a valid legal right to work in the destination country.");
      return;
    }

    if (formData.isSalesRole === 'yes') {
      setResult('rejected');
      setResultMessage("Request rejected: Sales or signatory roles create Permanent Establishment risk and cannot be auto-approved.");
      return;
    }

    if (duration > 20) {
      setResult('rejected');
      setResultMessage(`Request rejected: Duration of ${duration} days exceeds the 20-day annual limit.`);
      return;
    }

    // If passed all checks
    setResult('approved');
    setResultMessage("Request Approved: Your trip matches our safe harbor criteria. An automated confirmation email has been sent to you and your manager.");
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
          <div className={`p-6 rounded-sm border mb-6 ${result === 'approved' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-start">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${result === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {result === 'approved' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  )}
               </div>
               <div>
                 <h4 className="font-bold text-sm uppercase tracking-wide mb-1">{result === 'approved' ? 'Approved' : 'Compliance Issue Found'}</h4>
                 <p className="text-sm">{resultMessage}</p>
                 <button onClick={() => setResult('idle')} className="mt-4 text-xs font-bold underline hover:opacity-80">Start New Assessment</button>
               </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Maersk Entity</label>
                <input required name="entity" onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" placeholder="e.g. Maersk A/S" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Home Country</label>
                <input required name="homeCountry" onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" placeholder="e.g. Denmark" />
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Destination Country</label>
              <input required name="destination" onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" placeholder="Where will you be working from?" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Start Date</label>
                <input required type="date" name="startDate" onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">End Date</label>
                <input required type="date" name="endDate" onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-[#42b0d5] focus:border-[#42b0d5] outline-none transition-colors" />
              </div>
           </div>

           <div className="pt-4 border-t border-gray-200">
             <div className="mb-6">
               <label className="block text-sm font-semibold text-gray-800 mb-2">Do you have the legal right to work in the destination country (Citizenship/Visa)?</label>
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
               <label className="block text-sm font-semibold text-gray-800 mb-2">Are you in a Sales role or do you have authority to sign contracts?</label>
               <div className="flex space-x-6">
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="isSalesRole" value="yes" onChange={handleChange} className="accent-[#42b0d5]" required />
                    <span className="text-sm text-gray-600">Yes</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="isSalesRole" value="no" onChange={handleChange} className="accent-[#42b0d5]" />
                    <span className="text-sm text-gray-600">No</span>
                 </label>
               </div>
             </div>
           </div>

           <button 
              type="submit"
              className="bg-[#42b0d5] text-white font-medium py-3 px-8 rounded-sm hover:bg-[#3999ba] transition-colors shadow-sm"
           >
              Submit Request
           </button>

        </form>
        )}
      </div>
    </div>
  );
};